import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Package, Truck, CheckCircle2, Building2, AlertTriangle, Phone, Zap } from 'lucide-react';
import {
  ROUTE_STATUS_LABEL,
  type RouteExecutionSnapshot,
  type RouteExecutionStatus,
} from '../constants/zaptroRouteExecution';
import {
  readRouteLive,
  ZAPTRO_ROUTE_LIVE_STORAGE_KEY,
  type RouteLiveBucket,
  type RouteLiveTrailPoint,
} from '../constants/zaptroRouteLiveStore';

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LIME = '#D9FF00';

const vehicleIconHtml = (type: 'truck' | 'car' = 'truck') => {
  const isTruck = type === 'truck';
  return `
    <div style="width: 54px; height: 54px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));">
      <div style="position: relative; width: ${isTruck ? '22px' : '20px'}; height: ${isTruck ? '42px' : '34px'}; background: #000; border-radius: ${isTruck ? '4px' : '6px'}; border: 2px solid #fff; display: flex; flex-direction: column; align-items: center;">
        <!-- Cabine / Frente -->
        <div style="width: 100%; height: ${isTruck ? '14px' : '12px'}; background: ${LIME}; border-radius: ${isTruck ? '2px' : '4px'} ${isTruck ? '2px' : '4px'} 0 0; border-bottom: 2px solid #fff;"></div>
        <!-- Vidro frontal -->
        <div style="position: absolute; top: 4px; left: 3px; right: 3px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 1px;"></div>
        ${isTruck ? `
          <!-- Carga / Baú -->
          <div style="width: 100%; flex: 1; background: #000; display: flex; align-items: center; justify-content: center;">
            <div style="width: 70%; height: 2px; background: rgba(255,255,255,0.1); margin-bottom: 4px;"></div>
            <div style="width: 70%; height: 2px; background: rgba(255,255,255,0.1);"></div>
          </div>
        ` : `
          <!-- Teto do carro -->
          <div style="width: 70%; height: 12px; background: #111; margin-top: 4px; border-radius: 2px; border: 1px solid rgba(255,255,255,0.1);"></div>
        `}
        <!-- Lanternas traseiras -->
        <div style="position: absolute; bottom: 1px; left: 2px; width: 4px; height: 1.5px; background: #ef4444; border-radius: 1px;"></div>
        <div style="position: absolute; bottom: 1px; right: 2px; width: 4px; height: 1.5px; background: #ef4444; border-radius: 1px;"></div>
      </div>
    </div>
  `;
};

const truckIcon = L.divIcon({
  html: vehicleIconHtml('truck'),
  className: '',
  iconSize: [54, 54],
  iconAnchor: [27, 27]
});

const carIcon = L.divIcon({
  html: vehicleIconHtml('car'),
  className: '',
  iconSize: [54, 54],
  iconAnchor: [27, 27]
});

function LiveMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

/** Superfície neutra (chips / mapa) — cinza quente, um pouco mais escuro que o slate `#e2e8f0`. */
const PUBLIC_TRACK_NEUTRAL_SURFACE = '#f4f4f4';


function resolveCarrierDisplayName(snap: RouteExecutionSnapshot): string {
  const short = snap.carrierShortName?.trim();
  if (short) return short;
  const stripped = snap.companyName.replace(/^\s*Zaptro\s*·\s*/i, '').trim();
  return stripped || snap.companyName;
}

function demoPublicSnapshot(token: string): RouteExecutionSnapshot {
  return {
    token,
    companyName: 'Zaptro · Transportadora demo',
    carrierShortName: 'Transportadora demo',
    publicTrackPremiumBranding: false,
    publicHeaderLogoUrl: null,
    deliveryLabel: `Acompanhar ${token.length > 6 ? token.slice(0, 8) : token}`,
    customerName: 'A sua encomenda',
    deliveryAddress: 'Av. Paulista, 1578 — Bela Vista, São Paulo · SP',
    driverDisplayName: 'Motorista atribuído',
    status: 'assigned',
    updatedAt: new Date().toISOString(),
  };
}

function mergeLive(snap: RouteExecutionSnapshot, live: RouteLiveBucket | null): RouteExecutionSnapshot {
  if (!live) return snap;
  const pubName = live.publicCompanyName?.trim();
  return {
    ...snap,
    status: live.status,
    updatedAt: live.updatedAt || snap.updatedAt,
    ...(pubName
      ? {
          companyName: `Zaptro · ${pubName}`,
          carrierShortName: pubName,
        }
      : {}),
    ...(typeof live.publicTrackPremiumBranding === 'boolean'
      ? { publicTrackPremiumBranding: live.publicTrackPremiumBranding }
      : {}),
    ...(live.publicHeaderLogoUrl !== undefined ? { publicHeaderLogoUrl: live.publicHeaderLogoUrl } : {}),
  };
}

/**
 * Link público do **cliente** — só leitura: estado, empresa, motorista (quando existir backend).
 * Não expõe ações de operação nem chat com motorista.
 */
const ZaptroPublicTrack: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const decoded = useMemo(() => decodeURIComponent(token) || 'demo', [token]);
  const baseSnap = useMemo(() => demoPublicSnapshot(decoded), [decoded]);

  const [live, setLive] = useState<RouteLiveBucket | null>(() => readRouteLive(decoded));
  const [isExpired, setIsExpired] = useState(false);

  const refreshLive = useCallback(() => {
    const data = readRouteLive(decoded);
    setLive(data);

    // Se não há dados processados mas o token existe no storage, é porque expirou (filtrado pelo readRouteLive)
    if (!data && decoded !== 'demo') {
      try {
        const raw = localStorage.getItem(ZAPTRO_ROUTE_LIVE_STORAGE_KEY);
        if (raw) {
          const all = JSON.parse(raw);
          if (all[decoded]) setIsExpired(true);
        }
      } catch { /* ignore */ }
    } else {
      setIsExpired(false);
    }
  }, [decoded]);

  useEffect(() => {
    refreshLive();
  }, [refreshLive]);

  useEffect(() => {
    const onLive = () => {
      refreshLive();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ZAPTRO_ROUTE_LIVE_STORAGE_KEY) refreshLive();
    };
    window.addEventListener('zaptro-route-live', onLive);
    window.addEventListener('storage', onStorage);
    const t = window.setInterval(refreshLive, 2000);
    return () => {
      window.removeEventListener('zaptro-route-live', onLive);
      window.removeEventListener('storage', onStorage);
      window.clearInterval(t);
    };
  }, [decoded, refreshLive]);

  /** Evita `#root` / `body` brancos à volta da coluna centrada. */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const prevHtmlBg = html.style.background;
    const prevBodyBg = body.style.background;
    const prevBodyBgColor = body.style.backgroundColor;
    const prevRootBg = root?.style.background ?? '';
    const prevRootMinH = root?.style.minHeight ?? '';
    const prevRootColor = root?.style.color ?? '';
    html.style.background = PUBLIC_TRACK_NEUTRAL_SURFACE;
    body.style.background = PUBLIC_TRACK_NEUTRAL_SURFACE;
    body.style.backgroundColor = PUBLIC_TRACK_NEUTRAL_SURFACE;
    if (root) {
      root.style.background = PUBLIC_TRACK_NEUTRAL_SURFACE;
      root.style.minHeight = '100dvh';
      root.style.color = '';
    }
    return () => {
      html.style.background = prevHtmlBg;
      body.style.background = prevBodyBg;
      body.style.backgroundColor = prevBodyBgColor;
      if (root) {
        root.style.background = prevRootBg;
        root.style.minHeight = prevRootMinH;
        root.style.color = prevRootColor;
      }
    };
  }, []);

  const snap = mergeLive(baseSnap, live);
  const status: RouteExecutionStatus = snap.status;
  const carrierTitle = resolveCarrierDisplayName(snap);
  const premiumBranding = snap.publicTrackPremiumBranding === true;
  const headerLogoUrl = snap.publicHeaderLogoUrl?.trim();

  const steps: { key: RouteExecutionStatus; label: string }[] = [
    { key: 'assigned', label: 'Preparado' },
    { key: 'started', label: 'Em rota' },
    { key: 'arrived', label: 'Chegou' },
    { key: 'delivered', label: 'Entregue' },
  ];

  const idx = steps.findIndex((s) => s.key === status);
  const activeIdx = idx === -1 ? (status === 'delivered' ? 3 : status === 'issue' ? 1 : 0) : idx;

  const mapsUrl =
    live?.lastLat != null && live?.lastLng != null
      ? `https://www.google.com/maps?q=${live.lastLat},${live.lastLng}`
      : null;

  const displayTrail = useMemo((): RouteLiveTrailPoint[] => {
    if (!live) return [];
    const t = live.locationTrail;
    if (t && t.length > 0) return t;
    if (live.lastLat != null && live.lastLng != null) {
      return [{ lat: live.lastLat, lng: live.lastLng, at: live.lastLocAt || live.updatedAt }];
    }
    return [];
  }, [live]);

  const fmtTime = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="public-track-layout">
      <style>{`
        .public-track-layout {
          display: flex;
          height: 100dvh;
          width: 100%;
          overflow: hidden;
          background-color: #ebebeb;
          font-family: 'Inter', sans-serif;
        }
        .public-track-sidebar {
          width: 520px;
          height: 100%;
          background-color: #fff;
          box-shadow: 4px 0 24px rgba(0,0,0,0.1);
          z-index: 10;
          overflow-y: auto;
          padding: 32px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .public-track-map {
          flex: 1;
          height: 100%;
          position: relative;
          z-index: 1;
        }
        .public-track-map .leaflet-container {
          background: #0f172a;
        }
        @media (max-width: 768px) {
          .public-track-layout {
            flex-direction: column;
          }
          .public-track-sidebar {
            width: 100%;
            height: 50vh;
            box-shadow: 0 -4px 24px rgba(0,0,0,0.1);
            order: 2;
            padding: 20px;
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
          }
          .public-track-map {
            height: 50vh;
            order: 1;
          }
        }
      `}</style>
      
      {isExpired ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: PUBLIC_TRACK_NEUTRAL_SURFACE, padding: 30 }}>
          <div style={{ maxWidth: 400, textAlign: 'center', backgroundColor: '#fff', padding: 40, borderRadius: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Clock size={32} color="#94a3b8" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Link Expirado</h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Este link de rastreamento já não está disponível por questões de segurança. 
              Links de entrega expiram 24h após a conclusão do serviço.
            </p>
            <div style={{ marginTop: 32, borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>ZAPTRO LOGÍSTICA</p>
              <Zap size={24} color={LIME} style={{ margin: '0 auto' }} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="public-track-sidebar">
      <div style={pageInner}>
      <header style={{ textAlign: 'center', marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: '#a1a1aa' }}>RASTREIO</p>
        <h1
          style={{
            margin: '10px 0 0',
            fontSize: 32,
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.04em',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            lineHeight: 1.15,
            minHeight: 40,
          }}
        >
          {premiumBranding && headerLogoUrl ? (
            <img
              src={headerLogoUrl}
              alt={carrierTitle}
              style={{ maxHeight: 44, maxWidth: 'min(100%, 280px)', width: 'auto', objectFit: 'contain' }}
            />
          ) : (
            carrierTitle
          )}
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#a1a1aa', fontWeight: 600 }}>{snap.deliveryLabel}</p>
      </header>

      {status === 'issue' || live?.issueReportedAt ? (
        <section
          style={{
            ...card,
            marginBottom: 16,
            borderColor: 'rgba(248,113,113,0.45)',
            backgroundColor: '#fff1f2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertTriangle size={22} color="#b91c1c" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#991b1b' }}>Problema na entrega</p>
              <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600, color: '#7f1d1d', lineHeight: 1.45 }}>
                O motorista reportou um problema. A operação foi alertada — em produção isto dispara também WhatsApp interno.
              </p>
              {live?.issueReportedAt ? (
                <p style={{ margin: '8px 0 0', fontSize: 11, fontWeight: 700, color: '#b91c1c' }}>Registado: {fmtTime(live.issueReportedAt)}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {live?.contactRequestedAt ? (
        <section
          style={{
            ...card,
            marginBottom: 16,
            borderColor: 'rgba(217, 255, 0, 0.35)',
            backgroundColor: 'rgba(217, 255, 0, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Phone size={22} color="#D9FF00" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e40af' }}>Pedido de contacto com o cliente</p>
              <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600, color: '#000000', lineHeight: 1.45 }}>
                O motorista pediu apoio para falar com o cliente. A operação deve verificar e ligar se necessário.
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 11, fontWeight: 700, color: '#D9FF00' }}>Pedido: {fmtTime(live.contactRequestedAt)}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Building2 size={20} color="#0f172a" />
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.02em' }}>MOTORISTA</p>
            <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{snap.driverDisplayName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <MapPin size={20} color={LIME} style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#334155', lineHeight: 1.45 }}>{snap.deliveryAddress}</p>
        </div>
      </section>

      {mapsUrl ? (
        <section style={card}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>ÚLTIMA POSIÇÃO</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 15,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            <MapPin size={18} color={LIME} />
            Abrir no Google Maps
          </a>
          {live?.lastLocAt ? (
            <p style={{ margin: '10px 0 0', fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Actualizado: {fmtTime(live.lastLocAt)}</p>
          ) : null}
        </section>
      ) : null}

      <section style={card}>
        <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>ESTADO ATUAL</p>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{ROUTE_STATUS_LABEL[status]}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {steps.map((s, i) => {
            const done = i <= activeIdx;
            return (
              <div key={s.key} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    margin: '0 auto 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: done ? LIME : PUBLIC_TRACK_NEUTRAL_SURFACE,
                  }}
                >
                  {i === steps.length - 1 ? (
                    <CheckCircle2 size={20} color={done ? '#000' : '#94a3b8'} />
                  ) : (
                    <Truck size={20} color={done ? '#000' : '#94a3b8'} />
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: done ? '#0f172a' : '#94a3b8' }}>{s.label}</span>
              </div>
            );
          })}
        </div>
        <p style={{ margin: '18px 0 0', fontSize: 12, fontWeight: 600, color: '#94a3b8', lineHeight: 1.5 }}>
          Neste ambiente de demonstração, o estado e a posição vêm do mesmo browser em que o motorista usa o link da rota (mesmo token). Em produção, isto viria do servidor.
        </p>
      </section>

      <section style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Package size={22} color="#0f172a" />
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#475569', lineHeight: 1.45 }}>
          Atualizações por WhatsApp são enviadas automaticamente quando o motorista muda o estado (saiu, chegou, entregue).
        </p>
      </section>

      {!premiumBranding ? (
        <section
          style={{
            ...card,
            padding: 0,
            overflow: 'hidden',
            borderColor: 'rgba(217,255,0,0.35)',
            marginTop: 'auto',
            marginBottom: 0,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              padding: '18px 16px 16px',
              borderBottom: '1px solid rgba(226,232,240,0.9)',
              backgroundColor: PUBLIC_TRACK_NEUTRAL_SURFACE,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <div
                title="Zaptro"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: '#000000',
                  border: `2px solid ${LIME}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Zap size={24} color={LIME} strokeWidth={2.4} aria-hidden />
              </div>
            </div>
            <Link
              to="/"
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#000000',
                letterSpacing: '-0.03em',
                textDecoration: 'none',
              }}
            >
              Zaptro
            </Link>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '26px 20px 28px',
              backgroundColor: PUBLIC_TRACK_NEUTRAL_SURFACE,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.2,
                letterSpacing: '-0.03em',
              }}
            >
              Do Zap ao fechamento
            </p>
            <p style={{ margin: '12px 0 0', fontSize: 14, fontWeight: 600, color: '#64748b', lineHeight: 1.5 }}>
              Uma transportadora, um comando.
            </p>
          </div>
        </section>
      ) : null}
      
      </div>
      </div>

      <div className="public-track-map">
        {displayTrail.length > 0 ? (
          <div style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
            <MapContainer 
              center={[displayTrail[displayTrail.length - 1].lat, displayTrail[displayTrail.length - 1].lng]} 
              zoom={14} 
              style={{ height: '100%', width: '100%', background: '#ebebeb' }}
              zoomControl={false}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <Polyline 
                positions={displayTrail.map(p => [p.lat, p.lng])} 
                color={LIME} 
                weight={8} 
                opacity={0.3}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline 
                positions={displayTrail.map(p => [p.lat, p.lng])} 
                color={LIME} 
                weight={4} 
                opacity={1}
                lineCap="round"
                lineJoin="round"
              />
              <Marker 
                position={[displayTrail[displayTrail.length - 1].lat, displayTrail[displayTrail.length - 1].lng]} 
                icon={live?.vehicleType === 'car' ? carIcon : truckIcon}
              />
              <LiveMapCenter center={[displayTrail[displayTrail.length - 1].lat, displayTrail[displayTrail.length - 1].lng]} />
            </MapContainer>
          </div>
        ) : (
          <div style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ebebeb' }}>
            <p style={{ fontWeight: 700, color: '#a1a1aa' }}>Aguardando primeira localização...</p>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};



const card: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 22,
  padding: 20,
  marginBottom: 16,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 30px rgba(15,23,42,0.06)',
};

const pageInner: React.CSSProperties = {
  maxWidth: 460,
  margin: '0 auto',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

export default ZaptroPublicTrack;

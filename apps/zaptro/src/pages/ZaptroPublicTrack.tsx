import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Package, Truck, CheckCircle2, AlertTriangle, Phone, Zap, Clock, User } from 'lucide-react';
import {
  ROUTE_CLIENT_STATUS_LABEL,
  type RouteExecutionSnapshot,
  type RouteExecutionStatus,
} from '../constants/zaptroRouteExecution';
import {
  patchRouteLive,
  readRouteLive,
  ZAPTRO_ROUTE_LIVE_STORAGE_KEY,
  type RouteLiveBucket,
  type RouteLiveTrailPoint,
} from '../constants/zaptroRouteLiveStore';
import { buildRouteLiveNavigationPatch } from '../lib/zaptroRouteNavigation';
import {
  ZAPTRO_MAP_DEST_ICON,
  ZAPTRO_MAP_ROUTE_COLORS,
  ZAPTRO_MAP_VEHICLE_ICON,
} from '../constants/zaptroMapStyles';
import { ZAPTRO_COMPANY_PROFILE_EVENT } from '../hooks/useZaptroCompanyBusinessProfile';
import { resolveRouteCompanyBranding } from '../lib/zaptroRouteCompanyBranding';
import { employmentTypeLabel, resolveFleetDriverForRoute } from '../lib/zaptroFleetDriverResolve';
import { zaptroProfileInitials } from '../utils/zaptroDriverSelfProfile';

import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LIME = ZAPTRO_MAP_ROUTE_COLORS.accent;
/** Mesmo centro da Central Logística (`ZaptroRoutes`). */
const SP_MAP_CENTER: [number, number] = [-23.5505, -46.6333];
const SP_MAP_DEST: [number, number] = [-23.5612, -46.6555];

/** Posição estável por token — igual à simulação em `/app/rotas`. */
function tokenMapPosition(token: string, idx = 0): [number, number] {
  const seed = token.length;
  const lat = -23.5505 + idx * 0.01 - 0.02;
  const lng = -46.6333 + (seed % 10) * 0.005;
  return [lat, lng];
}

function LiveMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

function LiveMapFitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length < 2) return;
    map.fitBounds(L.latLngBounds(positions), { padding: [48, 48], maxZoom: 15, animate: true });
  }, [map, positions]);
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
  const [brandTick, setBrandTick] = useState(0);
  const [driverPhotoFail, setDriverPhotoFail] = useState(false);

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
    const onCompanyBrand = () => setBrandTick((n) => n + 1);
    window.addEventListener('zaptro-route-live', onLive);
    window.addEventListener('storage', onStorage);
    window.addEventListener(ZAPTRO_COMPANY_PROFILE_EVENT, onCompanyBrand);
    const t = window.setInterval(refreshLive, 2000);
    return () => {
      window.removeEventListener('zaptro-route-live', onLive);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(ZAPTRO_COMPANY_PROFILE_EVENT, onCompanyBrand);
      window.clearInterval(t);
    };
  }, [decoded, refreshLive]);

  useEffect(() => {
    if (!live || isExpired || live.status === 'delivered') return;
    const ac = new AbortController();
    let cancelled = false;

    void (async () => {
      const patch = await buildRouteLiveNavigationPatch(live, {
        destinationFallback: baseSnap.deliveryAddress,
        signal: ac.signal,
        preferDriverPosition: live.lastLat != null && live.lastLng != null,
      });
      if (patch && Object.keys(patch).length > 0) {
        patchRouteLive(decoded, patch);
        if (!cancelled) refreshLive();
      }
    })().catch(() => {
      /* ignore */
    });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [
    decoded,
    isExpired,
    baseSnap.deliveryAddress,
    refreshLive,
    live?.status,
    live?.originLabel,
    live?.destLabel,
    live?.lastLat,
    live?.lastLng,
    live?.navigationRouteFromLat,
    live?.navigationRouteFromLng,
    live?.navigationPolyline?.length,
  ]);

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
  const companyBrand = useMemo(() => resolveRouteCompanyBranding(live), [live, brandTick]);
  const carrierTitle = companyBrand.name || resolveCarrierDisplayName(snap);
  const headerLogoUrl = companyBrand.logoUrl;

  const fleetDriver = useMemo(
    () =>
      resolveFleetDriverForRoute({
        fleetDriverId: live?.fleetDriverId,
        driverPhone: live?.driverPhone,
        driverDisplayName: live?.driverDisplayName,
        driverVehicle: live?.driverVehicle,
        driverAvatarUrl: live?.driverAvatarUrl,
      }),
    [
      live?.fleetDriverId,
      live?.driverPhone,
      live?.driverDisplayName,
      live?.driverVehicle,
      live?.driverAvatarUrl,
    ],
  );

  const driverName = (
    fleetDriver?.name ||
    live?.driverDisplayName?.trim() ||
    snap.driverDisplayName
  ).trim();
  const driverAvatar = fleetDriver?.photoUrl || live?.driverAvatarUrl || null;
  const driverTypeLabel =
    fleetDriver?.employmentType != null
      ? employmentTypeLabel(fleetDriver.employmentType)
      : live?.driverEmploymentType != null
        ? employmentTypeLabel(live.driverEmploymentType)
        : null;
  const driverInitials = zaptroProfileInitials(driverName);
  const deliveryAddress = live?.destLabel?.trim() || snap.deliveryAddress;

  useEffect(() => {
    setDriverPhotoFail(false);
  }, [driverAvatar]);

  const steps: { key: RouteExecutionStatus; label: string }[] = [
    { key: 'assigned', label: 'Confirmado' },
    { key: 'en_route', label: 'A caminho' },
    { key: 'started', label: 'Saiu' },
    { key: 'arrived', label: 'Chegando' },
    { key: 'delivered', label: 'Entregue' },
  ];

  const statusStepKey =
    status === 'draft' ? 'assigned' : status === 'issue' ? 'started' : status;
  const idx = steps.findIndex((s) => s.key === statusStepKey);
  const activeIdx = idx === -1 ? 0 : idx;
  const clientStatusLabel = ROUTE_CLIENT_STATUS_LABEL[status] ?? ROUTE_CLIENT_STATUS_LABEL.assigned;

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

  const routeInProgress = Boolean(
    live && !['assigned', 'draft', 'delivered'].includes(live.status),
  );

  const vehiclePosition = useMemo((): [number, number] | null => {
    if (displayTrail.length > 0) {
      const last = displayTrail[displayTrail.length - 1];
      return [last.lat, last.lng];
    }
    if (routeInProgress) return tokenMapPosition(decoded);
    return null;
  }, [displayTrail, routeInProgress, decoded]);

  const mapCenter = vehiclePosition ?? (live?.destLat != null && live?.destLng != null ? [live.destLat, live.destLng] as [number, number] : SP_MAP_CENTER);
  const mapZoom = vehiclePosition ? 14 : 12;

  const plannedRoute = useMemo((): [number, number][] => {
    const pts = live?.navigationPolyline;
    if (!pts?.length) return [];
    return pts.map((p) => [p.lat, p.lng] as [number, number]);
  }, [live?.navigationPolyline]);

  const destPosition = useMemo((): [number, number] | null => {
    if (live?.destLat != null && live?.destLng != null) return [live.destLat, live.destLng];
    if (routeInProgress && status !== 'delivered') return SP_MAP_DEST;
    return null;
  }, [live?.destLat, live?.destLng, routeInProgress, status]);

  const mapFitPositions = useMemo((): [number, number][] => {
    const pts: [number, number][] = [];
    if (plannedRoute.length >= 2) pts.push(...plannedRoute);
    if (vehiclePosition) pts.push(vehiclePosition);
    if (destPosition) pts.push(destPosition);
    return pts;
  }, [plannedRoute, vehiclePosition, destPosition]);

  const vehicleIconType =
    live && 'vehicleType' in live && (live as { vehicleType?: string }).vehicleType === 'car'
      ? 'car'
      : 'truck';
  const vehicleMoving = Boolean(
    live && ['en_route', 'started', 'arrived'].includes(live.status),
  );
  const waitingGps = routeInProgress && displayTrail.length === 0;

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
          background: #ebebeb;
        }
        .public-track-map .zaptro-grayscale-map .leaflet-tile-container {
          filter: none !important;
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
              <Clock size={32} color="#949494" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Link Expirado</h2>
            <p style={{ fontSize: 15, color: '#949494', lineHeight: 1.6, margin: 0 }}>
              Este link de rastreamento já não está disponível por questões de segurança. 
              Links de entrega expiram 24h após a conclusão do serviço.
            </p>
            <div style={{ marginTop: 32, borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#949494', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>ZAPTRO LOGÍSTICA</p>
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
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          {headerLogoUrl ? (
            <img
              src={headerLogoUrl}
              alt={carrierTitle}
              style={{
                height: 52,
                width: 52,
                borderRadius: 14,
                objectFit: 'cover',
                border: '1px solid #e2e8f0',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: '#0f172a',
                color: LIME,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {carrierTitle[0]?.toUpperCase() || 'E'}
            </div>
          )}
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              textAlign: 'left',
            }}
          >
            {carrierTitle}
          </h1>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: '#a1a1aa', fontWeight: 600 }}>{snap.deliveryLabel}</p>
      </header>

      {status === 'issue' || (live?.issueReportedAt && !live?.opsIncidentAt) ? (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: PUBLIC_TRACK_NEUTRAL_SURFACE,
            }}
          >
            {driverAvatar && !driverPhotoFail ? (
              <img
                src={driverAvatar}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setDriverPhotoFail(true)}
              />
            ) : driverInitials && driverInitials !== '·' ? (
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{driverInitials}</span>
            ) : (
              <User size={24} color="#949494" strokeWidth={2} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#949494', letterSpacing: '0.08em' }}>MOTORISTA</p>
            {driverTypeLabel ? (
              <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: '#949494' }}>{driverTypeLabel}</p>
            ) : null}
            <p style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>{driverName}</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#949494', letterSpacing: '0.08em' }}>
            ENDEREÇO DE ENTREGA
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <MapPin size={20} color={LIME} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#6B6B6B', lineHeight: 1.45 }}>{deliveryAddress}</p>
          </div>
        </div>
      </section>

      {mapsUrl ? (
        <section style={card}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#949494', letterSpacing: '0.1em' }}>ÚLTIMA POSIÇÃO</p>
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
            <p style={{ margin: '10px 0 0', fontSize: 12, fontWeight: 600, color: '#949494' }}>Actualizado: {fmtTime(live.lastLocAt)}</p>
          ) : null}
        </section>
      ) : null}

      <section style={card}>
        <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#949494', letterSpacing: '0.1em' }}>ESTADO ATUAL</p>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{clientStatusLabel}</div>
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
                    <CheckCircle2 size={20} color={done ? '#000' : '#949494'} />
                  ) : (
                    <Truck size={20} color={done ? '#000' : '#949494'} />
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: done ? '#0f172a' : '#949494' }}>{s.label}</span>
              </div>
            );
          })}
        </div>
        <p style={{ margin: '18px 0 0', fontSize: 12, fontWeight: 600, color: '#949494', lineHeight: 1.5 }}>
          Neste ambiente de demonstração, o estado e a posição vêm do mesmo browser em que o motorista usa o link da rota (mesmo token). Em produção, isto viria do servidor.
        </p>
      </section>

      <section style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Package size={22} color="#0f172a" />
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#475569', lineHeight: 1.45 }}>
          Atualizações por WhatsApp são enviadas automaticamente quando o motorista muda o estado (saiu, chegou, entregue).
        </p>
      </section>

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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '18px 16px',
              borderBottom: '1px solid rgba(226,232,240,0.9)',
              backgroundColor: PUBLIC_TRACK_NEUTRAL_SURFACE,
              boxSizing: 'border-box',
            }}
          >
            <div
              title="Zaptro"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#000000',
                border: `2px solid ${LIME}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={22} color={LIME} strokeWidth={2.4} aria-hidden />
            </div>
            <Link
              to="/"
              style={{
                fontSize: 20,
                fontWeight: 800,
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
            <p style={{ margin: '12px 0 0', fontSize: 14, fontWeight: 600, color: '#949494', lineHeight: 1.5 }}>
              Uma transportadora, um comando.
            </p>
          </div>
        </section>
      
      </div>
      </div>

      <div className="public-track-map">
        <div style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%', background: '#ebebeb' }}
            className="zaptro-grayscale-map"
            zoomControl={false}
          >
            <TileLayer
              attribution="&copy; Google Maps"
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            />

            {plannedRoute.length > 1 ? (
              <>
                <Polyline
                  positions={plannedRoute}
                  color={LIME}
                  weight={9}
                  opacity={0.2}
                  lineCap="round"
                  lineJoin="round"
                />
                <Polyline
                  positions={plannedRoute}
                  color={LIME}
                  weight={5}
                  opacity={1}
                  lineCap="round"
                  lineJoin="round"
                />
                <LiveMapFitRoute positions={mapFitPositions.length >= 2 ? mapFitPositions : plannedRoute} />
              </>
            ) : null}

            {vehiclePosition ? <LiveMapCenter center={vehiclePosition} /> : null}

            {destPosition && routeInProgress && status !== 'delivered' ? (
              <Marker position={destPosition} icon={ZAPTRO_MAP_DEST_ICON}>
                <Popup>{deliveryAddress}</Popup>
              </Marker>
            ) : null}

            {vehiclePosition ? (
              <Marker
                position={vehiclePosition}
                icon={ZAPTRO_MAP_VEHICLE_ICON(vehicleIconType, vehicleMoving ? 'moving' : 'stopped')}
              >
                <Popup>
                  {driverName}
                  {waitingGps ? ' · aguardando GPS' : ''}
                </Popup>
              </Marker>
            ) : null}

          </MapContainer>

          {waitingGps ? (
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                padding: '12px 20px',
                borderRadius: 20,
                background: '#fff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: LIME,
                  boxShadow: `0 0 12px ${LIME}`,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                Aguardando GPS do motorista — mapa já activo
              </span>
            </div>
          ) : null}

          {!live ? (
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                padding: '12px 20px',
                borderRadius: 20,
                background: '#fff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                fontSize: 12,
                fontWeight: 700,
                color: '#949494',
              }}
            >
              Rota ainda não iniciada — mesmo mapa da operação
            </div>
          ) : null}
        </div>
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

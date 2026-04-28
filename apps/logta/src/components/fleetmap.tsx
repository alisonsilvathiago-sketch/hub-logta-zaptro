import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Truck,
  MapPin,
  Navigation,
  User,
  Package,
  Clock,
  AlertTriangle,
  Activity,
  Filter,
  Search,
  Loader2,
  Timer,
  Gauge,
  Flag,
} from 'lucide-react';
import { toastError, toastSuccess } from '../lib/toast';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type NominatimHit = { lat: string; lon: string; display_name: string; place_id: number };

async function nominatimSearch(query: string): Promise<NominatimHit[]> {
  const q = query.trim();
  if (!q) return [];
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '8');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', 'br');
  const res = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as NominatimHit[];
}

const getMarkerIcon = (index: number) => {
  const color = index % 2 === 0 ? '#7c3aed' : '#0f172a';
  const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
            <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M15 0C6.716 0 0 6.716 0 15c0 11.233 13.12 25.32 13.68 25.923.33.355.797.557 1.32.557s.99-.202 1.32-.557c.56-.603 13.68-14.69 13.68-25.923 0-8.284-6.716-15-15-15z"/>
            <circle cx="15" cy="15" r="6" fill="#ffffff" opacity="0.92"/>
        </svg>
    `;
  return L.divIcon({
    className: 'custom-div-icon',
    html: svgIcon,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40],
  });
};

const geoSearchPinIcon = L.divIcon({
  className: 'logta-geo-search-pin',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
    <path fill="#a855f7" stroke="#fff" stroke-width="2" d="M17 2C9.82 2 4 7.48 4 14.2c0 8.8 13 21.6 13 21.6S30 23 30 14.2C30 7.48 24.18 2 17 2z"/>
    <circle cx="17" cy="15" r="5" fill="#fff"/>
  </svg>`,
  iconSize: [34, 46],
  iconAnchor: [17, 46],
  popupAnchor: [0, -40],
});

const MapFocusHandler: React.FC<{ target: { lat: number; lng: number; zoom?: number } | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target && Number.isFinite(target.lat) && Number.isFinite(target.lng)) {
      map.flyTo([target.lat, target.lng], target.zoom ?? 15, { duration: 1.35 });
    }
  }, [target, map]);
  return null;
};

interface FleetMapProps {
  vehicles?: any[];
  center?: [number, number];
  focusedVehicleId?: string | null;
  variant?: 'default' | 'commandCenter';
}

const STATUS_PT: Record<string, string> = {
  OPERACIONAL: 'em operação operando ativo',
  PARADO: 'parado estacionado',
  OFICINA: 'oficina manutenção problema crítico',
};

/** Distância em km entre dois pontos WGS84 (para somar a polilinha visível). */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const FleetMap: React.FC<FleetMapProps> = ({
  vehicles = [],
  center = [-23.5505, -46.6333],
  focusedVehicleId,
  variant = 'default',
}) => {
  const [internalVehicles, setInternalVehicles] = useState<any[]>([]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterNominatimHits, setFilterNominatimHits] = useState<NominatimHit[]>([]);
  const [filterNominatimLoading, setFilterNominatimLoading] = useState(false);
  /** Pesquisa Nominatim concluída sem resultados — mantém o painel para mostrar mensagem. */
  const [filterNominatimEmpty, setFilterNominatimEmpty] = useState(false);
  const filterSearchWrapRef = useRef<HTMLDivElement>(null);

  const [geoQuery, setGeoQuery] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoResults, setGeoResults] = useState<NominatimHit[]>([]);
  const [geoPin, setGeoPin] = useState<{ lat: number; lng: number; label: string } | null>(null);

  useEffect(() => {
    if (vehicles.length > 0) {
      setInternalVehicles(vehicles);
    } else {
      setInternalVehicles([
        {
          id: '1',
          name: 'Scania R540',
          plate: 'BRA-2E19',
          lat: -23.5505,
          lng: -46.6333,
          status: 'OPERACIONAL',
          driver: 'Claudio Ferreira',
          speed: '65 km/h',
          last_update: '2 min ago',
          stops: 6,
          address: 'Av. Paulista, 1000 — Bela Vista, São Paulo/SP',
          cep: '01310-100',
          trip_departure_label: 'Hoje, 05:50 — CD Morumbi · check-list OK',
          trip_arrival_label: 'Hoje, 16:35 — última parada (região Paulista)',
          trip_leg_km: 94,
          trip_duration_label: '4h 25min (em rota)',
        },
        {
          id: '2',
          name: 'Volvo FH 540',
          plate: 'LOG-4F20',
          lat: -23.56,
          lng: -46.65,
          status: 'OFICINA',
          driver: '-',
          speed: '0 km/h',
          last_update: '15 min ago',
          stops: 0,
          address: 'Rua da Consolação, 2300 — Consolação, SP',
          cep: '01416-000',
          trip_departure_label: 'Hoje, 06:05 — oficina / sem saída',
          trip_arrival_label: '— (veículo indisponível)',
          trip_leg_km: 0,
          trip_duration_label: '—',
        },
        {
          id: '3',
          name: 'MB Actros',
          plate: 'ABC-1234',
          lat: -23.54,
          lng: -46.62,
          status: 'OPERACIONAL',
          driver: 'Marcos Souza',
          speed: '82 km/h',
          last_update: 'Just now',
          stops: 4,
          address: 'Av. Brasil, 4200 — Pari, São Paulo/SP',
          cep: '03012-000',
          trip_departure_label: 'Hoje, 06:15 — CD Pari · carga refrigerada',
          trip_arrival_label: 'Hoje, 14:20 — rota leste · último cliente',
          trip_leg_km: 118,
          trip_duration_label: '3h 50min (em rota)',
        },
        {
          id: '5',
          name: 'Iveco Stralis',
          plate: 'ZAP-0081',
          lat: -23.575,
          lng: -46.645,
          status: 'PARADO',
          driver: '-',
          speed: '0 km/h',
          last_update: '1h ago',
          stops: 2,
          address: 'Rua do Brás, 180 — Brás, São Paulo/SP',
          cep: '03008-000',
          trip_departure_label: 'Hoje, 07:00 — Brás · aguardando doca',
          trip_arrival_label: 'Hoje, 11:40 — micro-entregas centro',
          trip_leg_km: 36,
          trip_duration_label: '1h 55min (estim. ao retomar)',
        },
      ]);
    }
  }, [vehicles]);

  const selectVehicle = useCallback((id: string) => {
    setGeoPin(null);
    setGeoResults([]);
    setFilterNominatimHits([]);
    setFilterNominatimEmpty(false);
    setHighlightId(id);
  }, []);

  const runGeoSearch = useCallback(async () => {
    const q = geoQuery.trim();
    if (!q) {
      toastError('Digite um endereço, CEP ou rua.');
      return;
    }
    setGeoLoading(true);
    setGeoResults([]);
    try {
      const hits = await nominatimSearch(q);
      setGeoResults(hits);
      if (hits.length === 0) toastError('Nenhum local encontrado. Tente outro CEP ou endereço.');
      else toastSuccess(`${hits.length} resultado(s) — escolha um para validar no mapa.`);
    } catch {
      toastError('Não foi possível pesquisar agora. Verifique a rede ou tente de novo.');
      setGeoResults([]);
    } finally {
      setGeoLoading(false);
    }
  }, [geoQuery]);

  const pickGeoHit = useCallback((h: NominatimHit) => {
    const lat = parseFloat(h.lat);
    const lng = parseFloat(h.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setHighlightId(null);
    setGeoPin({ lat, lng, label: h.display_name });
    setGeoResults([]);
    toastSuccess('Local mostrado no mapa.');
  }, []);

  /** Sugestão escolhida no filtro lateral: aplica texto na lista e foca o mapa. */
  const pickFilterAddressSuggestion = useCallback((h: NominatimHit) => {
    const lat = parseFloat(h.lat);
    const lng = parseFloat(h.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const short =
      h.display_name.split(',').slice(0, 2).join(',').trim() || h.display_name;
    setFilterQuery(short);
    setHighlightId(null);
    setGeoPin({ lat, lng, label: h.display_name });
    setFilterNominatimHits([]);
    setFilterNominatimEmpty(false);
    toastSuccess('Sugestão aplicada — mapa e filtro atualizados.');
  }, []);

  useEffect(() => {
    const q = filterQuery.trim();
    if (q.length < 3) {
      setFilterNominatimHits([]);
      setFilterNominatimLoading(false);
      setFilterNominatimEmpty(false);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        setFilterNominatimLoading(true);
        setFilterNominatimEmpty(false);
        try {
          const hits = await nominatimSearch(q);
          if (!cancelled) {
            setFilterNominatimHits(hits.slice(0, 6));
            setFilterNominatimEmpty(hits.length === 0);
          }
        } catch {
          if (!cancelled) {
            setFilterNominatimHits([]);
            setFilterNominatimEmpty(true);
          }
        } finally {
          if (!cancelled) setFilterNominatimLoading(false);
        }
      })();
    }, 750);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [filterQuery]);

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      const el = filterSearchWrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setFilterNominatimHits([]);
        setFilterNominatimEmpty(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  const focalTarget = useMemo(() => {
    const id = focusedVehicleId ?? highlightId;
    if (id) {
      const v = internalVehicles.find((item) => String(item.id) === String(id));
      if (v && Number.isFinite(Number(v.lat)) && Number.isFinite(Number(v.lng))) {
        return { lat: Number(v.lat), lng: Number(v.lng), zoom: 15 };
      }
    }
    if (geoPin) return { lat: geoPin.lat, lng: geoPin.lng, zoom: 17 };
    return null;
  }, [focusedVehicleId, highlightId, internalVehicles, geoPin]);

  const filteredList = useMemo(() => {
    return internalVehicles.filter((v) => {
      if (filterStatus !== 'all' && v.status !== filterStatus) return false;
      const q = filterQuery.trim().toLowerCase();
      if (!q) return true;
      const st = (STATUS_PT[v.status] || '') + ' ' + (v.status || '');
      const blob = `${v.plate} ${v.name} ${v.driver} ${v.address || ''} ${v.cep || ''} ${st}`.toLowerCase();
      return blob.includes(q);
    });
  }, [internalVehicles, filterStatus, filterQuery]);

  const routePositions = useMemo(
    () =>
      internalVehicles
        .map((v) => [Number(v.lat), Number(v.lng)] as [number, number])
        .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b)),
    [internalVehicles],
  );

  const routeChainKm = useMemo(() => {
    if (routePositions.length < 2) return 0;
    let t = 0;
    for (let i = 1; i < routePositions.length; i++) {
      const [la, lo] = routePositions[i - 1];
      const [lb, lc] = routePositions[i];
      t += haversineKm(la, lo, lb, lc);
    }
    return Math.round(t * 10) / 10;
  }, [routePositions]);

  const commandTripSummary = useMemo(() => {
    const id = focusedVehicleId ?? highlightId;
    const v = id ? internalVehicles.find((x) => String(x.id) === String(id)) : null;
    if (v) {
      const leg = Number(v.trip_leg_km);
      const kmText =
        Number.isFinite(leg) && leg > 0
          ? `${leg} km (perna planeada)`
          : routeChainKm > 0
            ? `${routeChainKm} km (trecho no mapa)`
            : '—';
      return {
        scope: 'vehicle' as const,
        subtitle: `Veículo ${v.plate} · ${v.driver || '—'}`,
        departure: String(v.trip_departure_label ?? '—'),
        arrival: String(v.trip_arrival_label ?? '—'),
        km: kmText,
        duration: String(v.trip_duration_label ?? '—'),
      };
    }
    return {
      scope: 'fleet' as const,
      subtitle: 'Visão consolidada da frota no mapa',
      departure: 'Hoje, 05:30 — primeira saída (CD São Paulo)',
      arrival: 'Hoje, 21:45 — janela última chegada (meta operacional)',
      km: routeChainKm > 0 ? `${routeChainKm} km (somatório da sequência no mapa)` : '—',
      duration: '≈ 8h 15min (ciclo médio estimado · demo)',
    };
  }, [focusedVehicleId, highlightId, internalVehicles, routeChainKm]);

  const mapInner = (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFocusHandler target={focalTarget} />
      {routePositions.length > 1 && (
        <Polyline positions={routePositions} pathOptions={{ color: '#7c3aed', weight: 3, opacity: 0.82, dashArray: '8 10' }} />
      )}
      {geoPin && (
        <Marker position={[geoPin.lat, geoPin.lng] as L.LatLngExpression} icon={geoSearchPinIcon}>
          <Popup>
            <div style={{ minWidth: 200, fontSize: 12, fontWeight: 600, color: '#334155' }}>
              <strong style={{ color: '#5b21b6' }}>Local pesquisado</strong>
              <p style={{ margin: '8px 0 0', lineHeight: 1.4 }}>{geoPin.label}</p>
              <p style={{ margin: '8px 0 0', fontSize: 11, color: '#64748b' }}>
                Confira no terreno se corresponde ao endereço / CEP esperado.
              </p>
            </div>
          </Popup>
        </Marker>
      )}
      {internalVehicles.map((vehicle, idx) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.lat || -23.55, vehicle.lng || -46.63] as L.LatLngExpression}
          icon={getMarkerIcon(idx)}
          eventHandlers={{
            click: () => selectVehicle(String(vehicle.id)),
          }}
        >
          <Popup className="premium-popup">
            <div style={styles.popup}>
              <div style={styles.popupHeader}>
                <Truck size={18} color="#7c3aed" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h4 style={styles.pTitle}>{vehicle.plate}</h4>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{vehicle.name}</span>
                </div>
              </div>
              <div style={styles.pBody}>
                {vehicle.address && (
                  <div style={styles.pRow}>
                    <MapPin size={12} color="#64748b" />{' '}
                    <span>{vehicle.address}</span>
                  </div>
                )}
                {vehicle.cep && (
                  <div style={styles.pRow}>
                    <span style={{ fontWeight: 800 }}>CEP:</span> {vehicle.cep}
                  </div>
                )}
                <div style={styles.pRow}>
                  <User size={12} color="#64748b" />{' '}
                  <span>
                    Motorista: <strong>{vehicle.driver || 'Não atribuído'}</strong>
                  </span>
                </div>
                <div style={styles.pRow}>
                  <Navigation size={12} color="#64748b" /> Velocidade: <strong>{vehicle.speed}</strong>
                </div>
                <div style={styles.pRow}>
                  <Clock size={12} color="#64748b" /> <strong>{vehicle.last_update}</strong>
                </div>
                <div style={styles.pRow}>
                  <Package size={12} color="#64748b" /> Paradas: <strong>{vehicle.stops ?? '—'}</strong>
                </div>
                <div
                  style={{
                    ...styles.pStatusTag,
                    backgroundColor:
                      vehicle.status === 'OPERACIONAL' ? '#ede9fe' : vehicle.status === 'PARADO' ? '#fef9c3' : '#fee2e2',
                    color: vehicle.status === 'OPERACIONAL' ? '#5b21b6' : vehicle.status === 'PARADO' ? '#854d0e' : '#991b1b',
                  }}
                >
                  {vehicle.status === 'OPERACIONAL' ? 'Em operação' : vehicle.status === 'PARADO' ? 'Parado' : 'Crítico / MNT'}
                </div>
                <button type="button" style={styles.pBtn} onClick={() => window.open(`/frota/rastreio/${vehicle.id}`, '_blank')}>
                  Acompanhar rota
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );

  const mapShell = (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, minWidth: 0, width: '100%', height: '100%' }}>
      <MapContainer
        className="logta-fleet-map"
        center={center as L.LatLngExpression}
        zoom={13}
        style={{ height: '100%', width: '100%', minHeight: variant === 'commandCenter' ? 400 : 320 }}
        scrollWheelZoom
      >
        {mapInner}
      </MapContainer>
      {variant === 'default' && (
        <div style={styles.floatingPanel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={18} color="var(--primary)" />
            </div>
            <h4 style={styles.panelTitle}>Torre de Controle Ativa</h4>
          </div>
          <div style={styles.panelGrid}>
            <div style={styles.panelItem}>
              <span style={{ color: '#7c3aed' }}>●</span> <strong>12</strong> Operando
            </div>
            <div style={styles.panelItem}>
              <span style={{ color: '#ca8a04' }}>●</span> <strong>04</strong> Parados
            </div>
            <div style={styles.panelItem}>
              <span style={{ color: '#0f172a' }}>●</span> <strong>02</strong> Críticos
            </div>
          </div>
          <div style={styles.alertBar}>
            <AlertTriangle size={14} color="#f59e0b" />
            <span>BRA-2E19: desvio de rota detetado</span>
          </div>
        </div>
      )}
    </div>
  );

  if (variant === 'commandCenter') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          height: '100%',
          minHeight: 480,
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
            borderRight: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              flexShrink: 0,
              padding: '12px 14px',
              background: '#fff',
              borderBottom: '1px solid #ede9fe',
              position: 'relative',
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', width: '100%' }}>
              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.06em' }}>
                  VALIDAR LOCAL (OSM NOMINATIM)
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
                  <input
                    value={geoQuery}
                    onChange={(e) => setGeoQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void runGeoSearch();
                    }}
                    placeholder="Rua, número, bairro, cidade ou CEP…"
                    style={{
                      flex: 1,
                      minWidth: 200,
                      height: 42,
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      padding: '0 14px',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void runGeoSearch()}
                    disabled={geoLoading}
                    style={{
                      height: 42,
                      padding: '0 18px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#5b21b6',
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: 13,
                      cursor: geoLoading ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(91, 33, 182, 0.2)'
                    }}
                  >
                    {geoLoading ? <Loader2 size={18} style={{ animation: 'logta-spin 0.8s linear infinite' }} /> : <Search size={18} />}
                    Pesquisar
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 600, lineHeight: 1.35 }}>
                  Pesquisa real em OpenStreetMap: use CEP (ex.: 01310-100) ou endereço completo para confirmar se o local bate com a operação.
                </p>
              </div>
            </div>
            {geoResults.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  maxHeight: 200,
                  overflowY: 'auto',
                  borderRadius: 12,
                  border: '1px solid #e9e4f7',
                  background: '#fafafa',
                  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                }}
              >
                {geoResults.map((h) => (
                  <button
                    key={h.place_id}
                    type="button"
                    onClick={() => pickGeoHit(h)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#334155',
                      lineHeight: 1.35,
                    }}
                  >
                    {h.display_name}
                  </button>
                ))}
              </div>
            )}

            <div style={{ height: 1, background: '#f1f5f9', margin: '20px 0 12px' }} />

            <div style={{ marginBottom: 12 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  fontWeight: 900,
                  color: '#94a3b8',
                  letterSpacing: '0.08em',
                }}
              >
                SAÍDA · CHEGADA PREVISTA · DISTÂNCIA · DURAÇÃO
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 700, color: '#64748b' }}>{commandTripSummary.subtitle}</p>
              <div
                style={{
                  marginTop: 10,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    background: '#fafafa',
                    border: '1px solid #e9e4f7',
                    borderRadius: 12,
                    padding: '10px 12px',
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Navigation size={14} color="#5b21b6" style={{ flexShrink: 0 }} aria-hidden />
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.06em' }}>SAÍDA</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#0f172a', lineHeight: 1.45 }}>
                    {commandTripSummary.departure}
                  </p>
                </div>
                <div
                  style={{
                    background: '#fafafa',
                    border: '1px solid #e9e4f7',
                    borderRadius: 12,
                    padding: '10px 12px',
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Flag size={14} color="#5b21b6" style={{ flexShrink: 0 }} aria-hidden />
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.06em' }}>CHEGADA</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#0f172a', lineHeight: 1.45 }}>
                    {commandTripSummary.arrival}
                  </p>
                </div>
                <div
                  style={{
                    background: '#fafafa',
                    border: '1px solid #e9e4f7',
                    borderRadius: 12,
                    padding: '10px 12px',
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Gauge size={14} color="#5b21b6" style={{ flexShrink: 0 }} aria-hidden />
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.06em' }}>DISTÂNCIA</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#0f172a', lineHeight: 1.45 }}>{commandTripSummary.km}</p>
                </div>
                <div
                  style={{
                    background: '#fafafa',
                    border: '1px solid #e9e4f7',
                    borderRadius: 12,
                    padding: '10px 12px',
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Timer size={14} color="#5b21b6" style={{ flexShrink: 0 }} aria-hidden />
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.06em' }}>DURAÇÃO</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#0f172a', lineHeight: 1.45 }}>
                    {commandTripSummary.duration}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {mapShell}
        </div>

        <aside
          style={{
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 950, color: '#0f172a' }}>Ao vivo</h3>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#64748b', fontWeight: 600, lineHeight: 1.35 }}>
              Filtro em tempo real na frota (dados da lista).
            </p>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 900, color: '#94a3b8' }}>
              <Filter size={12} /> Filtros
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                height: 38,
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                fontWeight: 700,
                fontSize: 12,
                padding: '0 10px',
              }}
            >
              <option value="all">Todos os estados</option>
              <option value="OPERACIONAL">Em operação</option>
              <option value="PARADO">Parado</option>
              <option value="OFICINA">Oficina / problema</option>
            </select>
            <div ref={filterSearchWrapRef} style={{ position: 'relative', zIndex: 30 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '0 10px',
                  height: 38,
                }}
              >
                <Search size={14} color="#94a3b8" />
                <input
                  placeholder="Placa, motorista, endereço ou CEP…"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={filterNominatimHits.length > 0 || filterNominatimLoading || filterNominatimEmpty}
                  aria-label="Filtrar frota ou pesquisar cidade"
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: 12, fontWeight: 600 }}
                />
                {filterNominatimLoading ? (
                  <Loader2 size={14} color="#94a3b8" style={{ animation: 'logta-spin 0.8s linear infinite', flexShrink: 0 }} />
                ) : null}
              </div>
              {filterQuery.trim().length >= 3 &&
                (filterNominatimLoading || filterNominatimHits.length > 0 || filterNominatimEmpty) && (
                <div
                  role="listbox"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 'calc(100% + 6px)',
                    maxHeight: 220,
                    overflowY: 'auto',
                    borderRadius: 12,
                    border: '1px solid #e9e4f7',
                    background: '#fff',
                    boxShadow: '0 12px 32px rgba(15,23,42,0.12)',
                  }}
                >
                  {filterNominatimLoading && filterNominatimHits.length === 0 && !filterNominatimEmpty ? (
                    <div style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>A procurar lugares…</div>
                  ) : null}
                  {filterNominatimHits.map((h) => (
                    <button
                      key={h.place_id}
                      type="button"
                      role="option"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickFilterAddressSuggestion(h)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        border: 'none',
                        borderBottom: '1px solid #f1f5f9',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#334155',
                        lineHeight: 1.4,
                      }}
                    >
                      {h.display_name}
                    </button>
                  ))}
                  {!filterNominatimLoading && filterNominatimEmpty ? (
                    <div style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                      Sem sugestões de lugar para este texto. O filtro da lista continua ativo.
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
              {filteredList.length} de {internalVehicles.length} veículo(s)
            </p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}>
            {filteredList.map((v) => {
              const active = highlightId === String(v.id) || focusedVehicleId === String(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectVehicle(String(v.id))}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 12px',
                    marginBottom: 8,
                    borderRadius: 14,
                    border: active ? '2px solid #7c3aed' : '1px solid #e9e4f7',
                    background: active ? '#f5f3ff' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 950, color: '#0f172a' }}>{v.plate}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{v.driver || '—'}</div>
                  {v.address && (
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, lineHeight: 1.35 }}>{v.address}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, fontWeight: 800 }}>
                    <span style={{ color: '#7c3aed' }}>{v.stops ?? 0} entregas</span>
                    <span>{v.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid #f1f5f9', fontSize: 10, fontWeight: 700, color: '#64748b' }}>
            <MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Atualização automática (demo) · sem reload
          </div>
        </aside>
      </div>
    );
  }

  return <div style={styles.mapWrap}>{mapShell}</div>;
};

const styles: Record<string, any> = {
  mapWrap: { height: '100%', width: '100%', position: 'relative' as const },
  popup: { minWidth: '220px', padding: '4px' },
  popupHeader: { display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' },
  pTitle: { fontSize: '15px', fontWeight: '950', color: '#0f172a', margin: 0 },
  pBody: { display: 'flex', flexDirection: 'column', gap: '8px' },
  pRow: { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#475569' },
  pStatusTag: { fontSize: '10px', fontWeight: '900', padding: '6px 12px', borderRadius: '10px', textAlign: 'center' as const, marginTop: '4px', textTransform: 'uppercase' },
  pBtn: { marginTop: '12px', width: '100%', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', padding: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' },

  floatingPanel: {
    position: 'absolute' as const,
    top: '24px',
    right: '24px',
    backgroundColor: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    padding: '20px',
    borderRadius: '24px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    zIndex: 500,
    border: '1px solid white',
    width: '280px',
  },
  panelTitle: { fontSize: '13px', fontWeight: '950', color: '#0f172a', margin: 0 },
  panelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' },
  panelItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#64748b' },
  alertBar: {
    padding: '10px 14px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '11px',
    color: '#92400e',
    fontWeight: 800,
  },
};

export default FleetMap;

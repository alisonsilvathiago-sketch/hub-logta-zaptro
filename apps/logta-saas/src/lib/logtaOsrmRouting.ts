import type { LogtaLatLng } from './logtaOpenStreetMap';

export type OsrmRouteResult = {
  /** [latitude, longitude] para Leaflet */
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
};

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

const routeCache = new Map<string, OsrmRouteResult>();

function cacheKey(waypoints: LogtaLatLng[]) {
  return waypoints.map((w) => `${w.lat.toFixed(5)},${w.lng.toFixed(5)}`).join('|');
}

/** Rota rodoviária real (ruas/rodovias) via OSRM + OpenStreetMap. */
export async function fetchOsrmDrivingRoute(waypoints: LogtaLatLng[]): Promise<OsrmRouteResult | null> {
  if (waypoints.length < 2) return null;

  const key = cacheKey(waypoints);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const coordStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  const url = `${OSRM_BASE}/${coordStr}?overview=full&geometries=geojson&steps=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: [number, number][] };
      }>;
    };
    const route = data.routes?.[0];
    const raw = route?.geometry?.coordinates;
    if (!raw?.length) return null;

    const coordinates: [number, number][] = raw.map(([lng, lat]) => [lat, lng]);
    const result: OsrmRouteResult = {
      coordinates,
      distanceKm: (route?.distance ?? 0) / 1000,
      durationMin: Math.round((route?.duration ?? 0) / 60),
    };
    routeCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

export type RouteTruckPlacement = { lat: number; lng: number; bearing: number };

function segmentLengthMeters(a: [number, number], b: [number, number]) {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Posição ~42% da rota + direção do trecho (caminhão alinhado à via). */
export function routeTruckPlacement(coords: [number, number][]): RouteTruckPlacement | null {
  if (coords.length < 2) return null;

  const segLens: number[] = [];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const d = segmentLengthMeters(coords[i - 1], coords[i]);
    segLens.push(d);
    total += d;
  }
  if (total <= 0) return routeMidpointAndBearing(coords);

  const target = total * 0.42;
  let acc = 0;
  for (let i = 0; i < segLens.length; i++) {
    const seg = segLens[i];
    if (acc + seg >= target || i === segLens.length - 1) {
      const t = seg > 0 ? Math.min(1, (target - acc) / seg) : 0;
      const a = coords[i];
      const b = coords[i + 1];
      const lat = a[0] + t * (b[0] - a[0]);
      const lng = a[1] + t * (b[1] - a[1]);
      const bearing = computeBearing(a[0], a[1], b[0], b[1]);
      return { lat, lng, bearing };
    }
    acc += seg;
  }
  return null;
}

/** Ponto médio da polyline + ângulo (graus) para orientar o ícone do veículo. */
export function routeMidpointAndBearing(coords: [number, number][]): RouteTruckPlacement | null {
  if (coords.length < 2) return null;
  const midIdx = Math.floor(coords.length / 2);
  const prev = coords[Math.max(0, midIdx - 3)];
  const next = coords[Math.min(coords.length - 1, midIdx + 3)];
  const [lat, lng] = coords[midIdx];
  const bearing = computeBearing(prev[0], prev[1], next[0], next[1]);
  return { lat, lng, bearing };
}

/** Snap do clique no mapa ao trecho mais próximo da rota OSRM. */
export function nearestPointOnRoute(
  coords: [number, number][],
  lat: number,
  lng: number,
): RouteTruckPlacement | null {
  if (coords.length < 2) return null;

  let bestDist = Infinity;
  let best: RouteTruckPlacement | null = null;

  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[i + 1];
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    const len2 = dx * dx + dy * dy;
    let t = 0;
    if (len2 > 0) {
      t = ((lng - lng1) * dx + (lat - lat1) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
    }
    const pLat = lat1 + t * dy;
    const pLng = lng1 + t * dx;
    const d = (pLat - lat) ** 2 + (pLng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = {
        lat: pLat,
        lng: pLng,
        bearing: computeBearing(lat1, lng1, lat2, lng2),
      };
    }
  }
  return best;
}

function computeBearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

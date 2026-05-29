export type LatLng = { lat: number; lng: number };

export type OsrmRouteResult = {
  positions: [number, number][];
  distanceM: number;
  durationS: number;
};

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

/** Geocodifica morada (Brasil) — Nominatim/OSM. */
export async function geocodeAddress(query: string, signal?: AbortSignal): Promise<LatLng | null> {
  const q = query.trim();
  if (!q) return null;
  const url = new URL(NOMINATIM);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'br');
  const res = await fetch(url.toString(), {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ lat: string; lon: string }>;
  const hit = rows[0];
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Rota rodoviária OSRM (gratuito). */
export async function fetchOsrmDrivingRoute(
  from: LatLng,
  to: LatLng,
  signal?: AbortSignal,
): Promise<OsrmRouteResult | null> {
  const path = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    routes?: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }>;
  };
  const route = data.routes?.[0];
  const coords = route?.geometry?.coordinates;
  if (!route || !coords?.length) return null;
  return {
    positions: coords.map((c) => [c[1], c[0]]),
    distanceM: route.distance,
    durationS: route.duration,
  };
}

export function formatRouteDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
  return `${Math.round(meters)} m`;
}

export function formatRouteDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}


function latLngParam(p: LatLng): string {
  return `${p.lat},${p.lng}`;
}

/** Abre Google Maps com rota (origem → destino). */
export function buildGoogleMapsNavigationUrl(opts: {
  origin?: LatLng | null;
  originAddress?: string | null;
  destination: LatLng | string;
}): string {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('travelmode', 'driving');
  if (opts.origin) url.searchParams.set('origin', latLngParam(opts.origin));
  else if (opts.originAddress?.trim()) url.searchParams.set('origin', opts.originAddress.trim());
  if (typeof opts.destination === 'string') {
    url.searchParams.set('destination', opts.destination.trim());
  } else {
    url.searchParams.set('destination', latLngParam(opts.destination));
  }
  return url.toString();
}

/** Abre Waze com navegação até ao destino (parte da posição actual do telemóvel). */
export function buildWazeNavigationUrl(opts: { destination: LatLng | string }): string {
  if (typeof opts.destination === 'string') {
    const url = new URL('https://waze.com/ul');
    url.searchParams.set('q', opts.destination.trim());
    url.searchParams.set('navigate', 'yes');
    return url.toString();
  }
  const url = new URL('https://waze.com/ul');
  url.searchParams.set('ll', `${opts.destination.lat},${opts.destination.lng}`);
  url.searchParams.set('navigate', 'yes');
  return url.toString();
}

export function openExternalNavigation(href: string): void {
  window.location.href = href;
}

/** Distância aproximada entre dois pontos (metros). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export type RouteLiveNavigationInput = {
  originLabel?: string | null;
  destLabel?: string | null;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  lastLat?: number;
  lastLng?: number;
  navigationPolyline?: Array<{ lat: number; lng: number }>;
  navigationRouteFromLat?: number;
  navigationRouteFromLng?: number;
};

export type RouteLiveNavigationPatch = {
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  navigationPolyline?: Array<{ lat: number; lng: number }>;
  routeDistanceM?: number;
  routeDurationS?: number;
  navigationRouteFromLat?: number;
  navigationRouteFromLng?: number;
};

const ROUTE_REFRESH_METERS = 120;

/**
 * Calcula percurso rodoviário (OSRM) que segue as ruas — igual Google Maps / Waze.
 * Actualiza quando o motorista se desloca (>120 m) para mostrar o trecho restante.
 */
export async function buildRouteLiveNavigationPatch(
  live: RouteLiveNavigationInput,
  options: {
    destinationFallback: string;
    signal?: AbortSignal;
    /** Usar posição GPS actual como origem do percurso (recomendado durante a entrega). */
    preferDriverPosition?: boolean;
  },
): Promise<RouteLiveNavigationPatch | null> {
  const destQ = live.destLabel?.trim() || options.destinationFallback.trim();
  const originQ = live.originLabel?.trim() || '';

  let destLat = live.destLat;
  let destLng = live.destLng;
  let originLat = live.originLat;
  let originLng = live.originLng;

  if ((destLat == null || destLng == null) && destQ) {
    const g = await geocodeAddress(destQ, options.signal);
    if (g) {
      destLat = g.lat;
      destLng = g.lng;
    }
  }
  if (originQ && (originLat == null || originLng == null)) {
    const g = await geocodeAddress(originQ, options.signal);
    if (g) {
      originLat = g.lat;
      originLng = g.lng;
    }
  }

  const to = destLat != null && destLng != null ? { lat: destLat, lng: destLng } : null;
  if (!to) return null;

  const driverPos =
    live.lastLat != null && live.lastLng != null ? { lat: live.lastLat, lng: live.lastLng } : null;
  const originPos =
    originLat != null && originLng != null ? { lat: originLat, lng: originLng } : null;

  const preferDriver = options.preferDriverPosition !== false;
  const from = (preferDriver && driverPos) || originPos || driverPos;
  if (!from) {
    const partial: RouteLiveNavigationPatch = {};
    if (destLat != null && destLng != null && (live.destLat == null || live.destLng == null)) {
      partial.destLat = destLat;
      partial.destLng = destLng;
    }
    if (originLat != null && originLng != null && (live.originLat == null || live.originLng == null)) {
      partial.originLat = originLat;
      partial.originLng = originLng;
    }
    return Object.keys(partial).length ? partial : null;
  }

  const anchor =
    live.navigationRouteFromLat != null && live.navigationRouteFromLng != null
      ? { lat: live.navigationRouteFromLat, lng: live.navigationRouteFromLng }
      : null;
  if (
    live.navigationPolyline?.length &&
    anchor &&
    distanceMeters(anchor, from) < ROUTE_REFRESH_METERS
  ) {
    return null;
  }

  const osrm = await fetchOsrmDrivingRoute(from, to, options.signal);
  if (!osrm) {
    const partial: RouteLiveNavigationPatch = {};
    if (destLat != null && destLng != null && (live.destLat == null || live.destLng == null)) {
      partial.destLat = destLat;
      partial.destLng = destLng;
    }
    if (originLat != null && originLng != null && (live.originLat == null || live.originLng == null)) {
      partial.originLat = originLat;
      partial.originLng = originLng;
    }
    return Object.keys(partial).length ? partial : null;
  }

  return {
    ...(destLat != null && destLng != null ? { destLat, destLng } : {}),
    ...(originLat != null && originLng != null ? { originLat, originLng } : {}),
    navigationPolyline: osrm.positions.map(([lat, lng]) => ({ lat, lng })),
    routeDistanceM: osrm.distanceM,
    routeDurationS: osrm.durationS,
    navigationRouteFromLat: from.lat,
    navigationRouteFromLng: from.lng,
  };
}

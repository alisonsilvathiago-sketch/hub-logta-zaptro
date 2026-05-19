import type { LogtaLatLng } from './logtaOpenStreetMap';

const cache = new Map<string, LogtaLatLng | null>();

export async function geocodePlace(query: string): Promise<LogtaLatLng | null> {
  const q = query.trim();
  if (!q) return null;

  const key = q.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', q);
  url.searchParams.set('countrycodes', 'br');

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept-Language': 'pt-BR',
        'User-Agent': 'LogtaSaaS/1.0 (roteirizacao-manual)',
      },
    });
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = (await res.json()) as { lat: string; lon: string }[];
    const hit = data[0];
    if (!hit) {
      cache.set(key, null);
      return null;
    }
    const coords: LogtaLatLng = { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) };
    cache.set(key, coords);
    return coords;
  } catch {
    cache.set(key, null);
    return null;
  }
}

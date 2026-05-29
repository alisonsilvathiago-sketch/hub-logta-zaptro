import type { AppConfig } from '../config.js';

export type GeocodeResult = {
  formattedAddress: string;
  lat: number;
  lng: number;
};

/** Normaliza endereço via Geocoding API (chave de servidor — não expor no browser). */
export class GoogleMapsGeocodeService {
  constructor(private cfg: AppConfig) {}

  isConfigured(): boolean {
    return Boolean(this.cfg.googleMapsApiKey);
  }

  async geocodeAddress(raw: string): Promise<GeocodeResult | null> {
    const address = raw.trim();
    if (!address || !this.cfg.googleMapsApiKey) return null;

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', this.cfg.googleMapsApiKey);
    url.searchParams.set('language', 'pt-BR');
    url.searchParams.set('region', 'br');

    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
      }>;
    };

    if (json.status !== 'OK' || !json.results?.length) return null;
    const first = json.results[0];
    const lat = first.geometry?.location?.lat;
    const lng = first.geometry?.location?.lng;
    if (lat == null || lng == null || !first.formatted_address) return null;

    return { formattedAddress: first.formatted_address, lat, lng };
  }
}

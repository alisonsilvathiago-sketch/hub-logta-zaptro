/**
 * Mapa padrão Logta — OpenStreetMap (https://www.openstreetmap.org).
 * Tiles: política de uso em https://operations.osmfoundation.org/policies/tiles/
 */
export const LOGTA_OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const LOGTA_OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

export const LOGTA_OSM_WEB_URL = 'https://www.openstreetmap.org';

/** Região Alphaville / Barueri — referência operacional Logta. */
export const LOGTA_DEFAULT_MAP_CENTER = {
  lng: -46.848,
  lat: -23.496,
  zoom: 13 as const,
};

export function logtaOsmWebUrl(lng: number, lat: number, zoom: number) {
  return `${LOGTA_OSM_WEB_URL}/#map=${zoom}/${lat}/${lng}`;
}

export type LogtaLatLng = { lat: number; lng: number };

/** Traço azul forte da rota no mapa. */
export const LOGTA_ROUTE_LINE_COLOR = '#2563EB';
/** Faixa azul clara sob a rota (efeito de contorno). */
export const LOGTA_ROUTE_LINE_GLOW = '#BFDBFE';

/** Rota demo — Itapevi → Barueri → Alphaville → região leste (corredor SP). */
export const LOGTA_DEFAULT_ROUTE_WAYPOINTS: LogtaLatLng[] = [
  { lat: -23.5489, lng: -46.9342 },
  { lat: -23.528, lng: -46.89 },
  { lat: -23.496, lng: -46.848 },
  { lat: -23.462, lng: -46.802 },
  { lat: -23.438, lng: -46.768 },
];

/** Variante “otimizada” (mesmo corredor, pontos intermediários ajustados). */
export const LOGTA_OPTIMIZED_ROUTE_WAYPOINTS: LogtaLatLng[] = [
  { lat: -23.547, lng: -46.928 },
  { lat: -23.518, lng: -46.872 },
  { lat: -23.492, lng: -46.842 },
  { lat: -23.455, lng: -46.795 },
  { lat: -23.432, lng: -46.762 },
];

/**
 * @deprecated Mapbox foi substituído por OpenStreetMap. Imports mantidos por compatibilidade.
 */
export {
  LOGTA_DEFAULT_MAP_CENTER,
  LOGTA_OSM_TILE_URL,
  LOGTA_OSM_ATTRIBUTION,
  LOGTA_OSM_WEB_URL,
} from './logtaOpenStreetMap';

/** @deprecated Use LogtaStandardMap (Leaflet + OSM). */
export const LOGTA_MAPBOX_PUBLIC_TOKEN = '';

/** @deprecated */
export const LOGTA_MAPBOX_STYLE_PATH = '';

/** @deprecated */
export function buildLogtaMapboxStaticUrl(_lng: number, _lat: number, _zoom: number): string {
  return '';
}

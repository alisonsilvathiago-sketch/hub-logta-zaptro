import React from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  LOGTA_DEFAULT_MAP_CENTER,
  LOGTA_DEFAULT_ROUTE_WAYPOINTS,
  LOGTA_OSM_ATTRIBUTION,
  LOGTA_OSM_TILE_URL,
  LOGTA_ROUTE_LINE_COLOR,
  LOGTA_ROUTE_LINE_GLOW,
  type LogtaLatLng,
} from '../lib/logtaOpenStreetMap';
import {
  fetchOsrmDrivingRoute,
  nearestPointOnRoute,
  routeTruckPlacement,
  type RouteTruckPlacement,
} from '../lib/logtaOsrmRouting';
import { LOGTA_TRUCK_MARKER_SIZE, truckMarkerHtml } from './LogtaMapTopDownTruck';

export type LogtaStandardMapMetrics = {
  km: string;
  minutes: string;
};

export type LogtaStandardMapProps = {
  className?: string;
  lng?: number;
  lat?: number;
  zoom?: number;
  /** @deprecated Use routeWaypoints — fallback SVG se rota OSRM falhar */
  routePathD?: string;
  /** Pontos para rota real nas ruas/rodovias (OSRM). */
  routeWaypoints?: LogtaLatLng[];
  metrics?: LogtaStandardMapMetrics;
  showMetricsBubble?: boolean;
  showHeroCar?: boolean;
  showDestinationPin?: boolean;
  showZoomControls?: boolean;
  interactive?: boolean;
  onMapReady?: (map: L.Map) => void;
  onRouteResolved?: (data: { distanceKm: number; durationMin: number }) => void;
  children?: React.ReactNode;
};

export const LOGTA_DEFAULT_ROUTE_PATH_D =
  'M 8 74 L 18 70 L 28 62 L 40 58 L 52 48 L 64 44 L 74 36 L 86 28 L 92 24';

type RouteLayerGroup = {
  polylineOutline: L.Polyline | null;
  polyline: L.Polyline | null;
  truck: L.Marker | null;
  origin: L.Marker | null;
  destination: L.Marker | null;
};

function emptyLayers(): RouteLayerGroup {
  return { polylineOutline: null, polyline: null, truck: null, origin: null, destination: null };
}

function clearRouteLayers(map: L.Map, layers: RouteLayerGroup) {
  Object.values(layers).forEach((layer) => {
    if (layer) map.removeLayer(layer);
  });
}

function destinationIcon() {
  return L.divIcon({
    className: 'logta-map-dest-pin',
    html: `<div style="width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;border:3px solid #fff;background:linear-gradient(180deg,#6ee7b7,#10b981,#047857);box-shadow:0 4px 12px rgba(0,0,0,.25);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function originIcon() {
  return L.divIcon({
    className: 'logta-map-origin-pin',
    html: `<div style="width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid #fff;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createTruckMarker(placement: RouteTruckPlacement) {
  const half = LOGTA_TRUCK_MARKER_SIZE / 2;
  return L.marker([placement.lat, placement.lng], {
    icon: L.divIcon({
      className: 'logta-map-truck-marker',
      html: truckMarkerHtml(placement.bearing),
      iconSize: [LOGTA_TRUCK_MARKER_SIZE, LOGTA_TRUCK_MARKER_SIZE],
      iconAnchor: [half, half],
    }),
    interactive: false,
    zIndexOffset: 800,
  });
}

function upsertTruckMarker(map: L.Map, layers: RouteLayerGroup, placement: RouteTruckPlacement) {
  if (layers.truck) map.removeLayer(layers.truck);
  const truck = createTruckMarker(placement);
  truck.addTo(map);
  layers.truck = truck;
}

/**
 * Mapa padrão Logta — OpenStreetMap + rota real (OSRM) nas vias.
 */
export function LogtaStandardMap({
  className = '',
  lng = LOGTA_DEFAULT_MAP_CENTER.lng,
  lat = LOGTA_DEFAULT_MAP_CENTER.lat,
  zoom = LOGTA_DEFAULT_MAP_CENTER.zoom,
  routePathD: _routePathD,
  routeWaypoints = LOGTA_DEFAULT_ROUTE_WAYPOINTS,
  metrics = { km: '4,3', minutes: '14' },
  showMetricsBubble = true,
  showHeroCar = true,
  showDestinationPin = true,
  showZoomControls = false,
  interactive = true,
  onMapReady,
  onRouteResolved,
  children,
}: LogtaStandardMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const routeLayersRef = React.useRef<RouteLayerGroup>(emptyLayers());
  const routeCoordsRef = React.useRef<[number, number][]>([]);
  const mapClickHandlerRef = React.useRef<((e: L.LeafletMouseEvent) => void) | null>(null);
  const [useSvgFallback, setUseSvgFallback] = React.useState(false);
  const onMapReadyRef = React.useRef(onMapReady);
  const onRouteResolvedRef = React.useRef(onRouteResolved);
  onMapReadyRef.current = onMapReady;
  onRouteResolvedRef.current = onRouteResolved;

  const waypointsKey = React.useMemo(
    () => routeWaypoints.map((w) => `${w.lat},${w.lng}`).join('|'),
    [routeWaypoints],
  );

  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const mountMap = () => {
      if (cancelled || mapRef.current) return;
      if (el.offsetWidth < 2 || el.offsetHeight < 2) {
        requestAnimationFrame(mountMap);
        return;
      }

      const map = L.map(el, {
        center: [lat, lng],
        zoom,
        zoomControl: showZoomControls,
        attributionControl: true,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
      });

      L.tileLayer(LOGTA_OSM_TILE_URL, {
        maxZoom: 19,
        attribution: LOGTA_OSM_ATTRIBUTION,
      }).addTo(map);

      mapRef.current = map;
      onMapReadyRef.current?.(map);

      const fixSize = () => mapRef.current?.invalidateSize();
      requestAnimationFrame(fixSize);
      window.setTimeout(fixSize, 120);
      window.setTimeout(fixSize, 400);
      resizeObserver = new ResizeObserver(fixSize);
      resizeObserver.observe(el);
    };

    mountMap();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (mapRef.current) {
        if (mapClickHandlerRef.current) {
          mapRef.current.off('click', mapClickHandlerRef.current);
          mapClickHandlerRef.current = null;
        }
        clearRouteLayers(mapRef.current, routeLayersRef.current);
        mapRef.current.remove();
        mapRef.current = null;
        routeLayersRef.current = emptyLayers();
        routeCoordsRef.current = [];
      }
    };
  }, [interactive, showZoomControls]);

  React.useEffect(() => {
    mapRef.current?.setView([lat, lng], zoom);
  }, [lat, lng, zoom]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || routeWaypoints.length < 2) return;

    let cancelled = false;

    const drawRoute = async () => {
      clearRouteLayers(map, routeLayersRef.current);
      routeLayersRef.current = emptyLayers();
      setUseSvgFallback(false);

      const result = await fetchOsrmDrivingRoute(routeWaypoints);
      if (cancelled) return;

      if (!result?.coordinates.length) {
        setUseSvgFallback(true);
        return;
      }

      const { coordinates } = result;
      onRouteResolvedRef.current?.({
        distanceKm: result.distanceKm,
        durationMin: result.durationMin,
      });

      const polylineOutline = L.polyline(coordinates, {
        color: LOGTA_ROUTE_LINE_GLOW,
        weight: 10,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });
      polylineOutline.addTo(map);
      routeLayersRef.current.polylineOutline = polylineOutline;

      const polyline = L.polyline(coordinates, {
        color: LOGTA_ROUTE_LINE_COLOR,
        weight: 5.5,
        opacity: 0.98,
        lineCap: 'round',
        lineJoin: 'round',
      });
      polyline.addTo(map);
      routeLayersRef.current.polyline = polyline;

      const [startLat, startLng] = coordinates[0];
      const [endLat, endLng] = coordinates[coordinates.length - 1];

      const origin = L.marker([startLat, startLng], { icon: originIcon(), interactive: false });
      origin.addTo(map);
      routeLayersRef.current.origin = origin;

      if (showDestinationPin) {
        const dest = L.marker([endLat, endLng], { icon: destinationIcon(), interactive: false });
        dest.addTo(map);
        routeLayersRef.current.destination = dest;
      }

      routeCoordsRef.current = coordinates;

      if (showHeroCar) {
        const placement = routeTruckPlacement(coordinates);
        if (placement) upsertTruckMarker(map, routeLayersRef.current, placement);

        if (interactive && !mapClickHandlerRef.current) {
          const onMapClick = (e: L.LeafletMouseEvent) => {
            const snap = nearestPointOnRoute(routeCoordsRef.current, e.latlng.lat, e.latlng.lng);
            if (snap) upsertTruckMarker(map, routeLayersRef.current, snap);
          };
          map.on('click', onMapClick);
          mapClickHandlerRef.current = onMapClick;
        }
      }

      map.fitBounds(polylineOutline.getBounds(), { padding: [48, 48], maxZoom: 14 });
    };

    void drawRoute();

    return () => {
      cancelled = true;
    };
  }, [waypointsKey, showHeroCar, showDestinationPin, interactive]);

  return (
    <div
      className={`relative min-h-0 w-full overflow-hidden bg-gray-100 ${className}`}
      data-logta-map="openstreetmap"
    >
      <div
        ref={containerRef}
        className="logta-osm-map absolute inset-0 z-0 h-full w-full"
        data-testid="logta-osm-map-container"
      />

      {useSvgFallback ? (
        <svg
          className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-40"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={LOGTA_DEFAULT_ROUTE_PATH_D}
            fill="none"
            stroke={LOGTA_ROUTE_LINE_GLOW}
            strokeWidth="3"
            strokeOpacity="0.9"
            vectorEffect="nonScalingStroke"
          />
        </svg>
      ) : null}

      {showMetricsBubble && (
        <div
          className="pointer-events-none absolute z-30 hidden rounded-2xl border border-gray-100/80 bg-white px-4 py-3 shadow-xl sm:block"
          style={{ left: '50%', top: '32%', transform: 'translate(-50%, -50%)' }}
        >
          <p className="text-sm font-semibold text-gray-700">
            A <span className="font-black text-blue-600">{metrics.km}</span> km
          </p>
          <p className="mt-0.5 text-sm font-semibold text-gray-700">
            e <span className="font-black text-blue-600">{metrics.minutes}</span> minutos
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-[15]">{children}</div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ZAPTRO_MAP_DEST_ICON,
  ZAPTRO_MAP_ORIGIN_ICON,
  ZAPTRO_MAP_ROUTE_COLORS,
  ZAPTRO_MAP_VEHICLE_ICON,
} from '../../constants/zaptroMapStyles';

const LIME = ZAPTRO_MAP_ROUTE_COLORS.accent;

function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length < 1) return;
    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [28, 28], maxZoom: 15 });
  }, [map, positions]);
  return null;
}

type Props = {
  driverPos: [number, number] | null;
  originPos: [number, number] | null;
  destPos: [number, number] | null;
  routeLine: [number, number][];
  height?: number;
};

const ZaptroDriverRouteMap: React.FC<Props> = ({
  driverPos,
  originPos,
  destPos,
  routeLine,
  height = 220,
}) => {
  const center: [number, number] =
    driverPos ?? destPos ?? originPos ?? [-23.5505, -46.6333];

  const fitPoints = React.useMemo((): [number, number][] => {
    const pts: [number, number][] = [];
    if (routeLine.length >= 2) pts.push(...routeLine);
    else {
      if (originPos) pts.push(originPos);
      if (destPos) pts.push(destPos);
      if (driverPos) pts.push(driverPos);
    }
    return pts.length ? pts : [center];
  }, [routeLine, originPos, destPos, driverPos, center]);

  return (
    <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height, width: '100%', background: '#1a1a1a' }}
        className="zaptro-grayscale-map"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
        {routeLine.length >= 2 ? (
          <>
            <Polyline positions={routeLine} color={LIME} weight={7} opacity={0.25} lineCap="round" />
            <Polyline positions={routeLine} color={LIME} weight={3} opacity={1} lineCap="round" />
          </>
        ) : null}
        {originPos ? <Marker position={originPos} icon={ZAPTRO_MAP_ORIGIN_ICON} /> : null}
        {destPos ? <Marker position={destPos} icon={ZAPTRO_MAP_DEST_ICON} /> : null}
        {driverPos ? (
          <Marker position={driverPos} icon={ZAPTRO_MAP_VEHICLE_ICON('truck', 'moving')} />
        ) : null}
        <FitRoute positions={fitPoints} />
      </MapContainer>
    </div>
  );
};

export default ZaptroDriverRouteMap;

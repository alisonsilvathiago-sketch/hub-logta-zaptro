import React, { useMemo } from 'react';
import { Marker, Popup, ZoomControl } from 'react-leaflet';
import HubMap, { carIcon, problemIcon, truckIcon } from '@hub/components/HubMap';

export type HubMasterLiveMapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  subtitle?: string;
  variant?: 'truck' | 'car' | 'alert';
};

const DEFAULT_CENTER: [number, number] = [-23.55052, -46.633308];

const DEFAULT_MARKERS: HubMasterLiveMapMarker[] = [
  { id: 'm1', lat: -23.532, lng: -46.655, label: 'MAP-1001', subtitle: 'Transportadora Falcão', variant: 'truck' },
  { id: 'm2', lat: -23.568, lng: -46.612, label: 'MAP-1002', subtitle: 'Expresso Federal', variant: 'truck' },
  { id: 'm3', lat: -23.545, lng: -46.59, label: 'MAP-1003', subtitle: 'Rápido Trans', variant: 'car' },
  { id: 'm4', lat: -23.59, lng: -46.64, label: 'MAP-1004', subtitle: 'TransNorte Cargo', variant: 'truck' },
  { id: 'm5', lat: -23.52, lng: -46.62, label: 'MAP-1005', subtitle: 'Alfa Transportes', variant: 'truck' },
  { id: 'm6', lat: -23.56, lng: -46.68, label: 'MAP-1006', subtitle: 'Transportadora Falcão', variant: 'car' },
  { id: 'm7', lat: -23.54, lng: -46.7, label: 'MAP-1007', subtitle: 'Expresso Federal', variant: 'truck' },
  { id: 'm8', lat: -23.575, lng: -46.58, label: 'MAP-1008', subtitle: 'Rápido Trans', variant: 'alert' },
];

type HubMasterLiveMapProps = {
  height?: number;
  center?: [number, number];
  zoom?: number;
  markers?: HubMasterLiveMapMarker[];
  /** Texto no canto (ex.: Live · /mapa) */
  liveBadge?: string;
};

const HubMasterLiveMap: React.FC<HubMasterLiveMapProps> = ({
  height = 420,
  center = DEFAULT_CENTER,
  zoom = 12,
  markers,
  liveBadge = 'Leaflet · Google Maps',
}) => {
  const mapMarkers = useMemo(() => markers ?? DEFAULT_MARKERS, [markers]);

  const pickIcon = (variant: HubMasterLiveMapMarker['variant']) => {
    if (variant === 'car') return carIcon;
    if (variant === 'alert') return problemIcon;
    return truckIcon;
  };

  return (
    <div
      style={{
        position: 'relative',
        height,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        background: '#EEF2FF',
      }}
    >
      <HubMap
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', borderRadius: 12, border: 'none', boxShadow: 'none' }}
      >
        <ZoomControl position="topleft" />
        {mapMarkers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={pickIcon(m.variant)}>
            <Popup>
              <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                <strong>{m.label}</strong>
                {m.subtitle ? (
                  <>
                    <br />
                    <span style={{ color: '#64748B' }}>{m.subtitle}</span>
                  </>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </HubMap>
      {liveBadge ? (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            fontSize: 11,
            fontWeight: 700,
            background: '#FFF',
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            color: '#475569',
            zIndex: 500,
            pointerEvents: 'none',
          }}
        >
          {liveBadge}
        </div>
      ) : null}
    </div>
  );
};

export default HubMasterLiveMap;

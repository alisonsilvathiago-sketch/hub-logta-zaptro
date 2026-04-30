import React from 'react';
import { MapContainer, TileLayer, MapContainerProps, Marker, Polyline } from 'react-leaflet';
export { Marker, Polyline };
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
const CAR_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 116" width="100%" height="100%" fill="none">
  <rect x="10" y="4" width="52" height="108" rx="16" fill="#0F172A" stroke="#000000" stroke-width="2.2"/>
  <rect x="18" y="12" width="36" height="24" rx="9" fill="#FFFFFF" fill-opacity="0.9"/>
  <rect x="18" y="80" width="36" height="22" rx="9" fill="#FFFFFF" fill-opacity="0.9"/>
  <rect x="16" y="40" width="8" height="30" rx="4" fill="#FFFFFF"/>
  <rect x="48" y="40" width="8" height="30" rx="4" fill="#FFFFFF"/>
  <rect x="27" y="38" width="18" height="40" rx="8" fill="#1E293B"/>
  <rect x="23" y="10" width="26" height="4" rx="2" fill="#F1F5F9"/>
  <rect x="14" y="101" width="12" height="5" rx="2.5" fill="#EF4444"/>
  <rect x="46" y="101" width="12" height="5" rx="2.5" fill="#EF4444"/>
  <path d="M22 48H28" stroke="#111315" stroke-width="2" stroke-linecap="round"/>
  <path d="M44 48H50" stroke="#111315" stroke-width="2" stroke-linecap="round"/>
</svg>
`;

const TRUCK_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 82 130" width="100%" height="100%" fill="none">
  <rect x="12" y="3" width="58" height="124" rx="14" fill="#0F172A" stroke="#000000" stroke-width="2.2"/>
  <rect x="20" y="12" width="42" height="22" rx="8" fill="#FFFFFF" fill-opacity="0.9"/>
  <rect x="20" y="36" width="42" height="16" rx="6" fill="#1E293B"/>
  <rect x="20" y="54" width="42" height="44" rx="6" fill="#1E293B" stroke="#0F172A" stroke-width="1.8"/>
  <rect x="20" y="101" width="42" height="20" rx="5" fill="#1E293B"/>
  <rect x="17" y="34" width="6" height="16" rx="3" fill="#FFFFFF"/>
  <rect x="59" y="34" width="6" height="16" rx="3" fill="#FFFFFF"/>
  <rect x="22" y="8" width="10" height="3.6" rx="1.8" fill="#F1F5F9"/>
  <rect x="50" y="8" width="10" height="3.6" rx="1.8" fill="#F1F5F9"/>
  <rect x="18" y="120" width="10" height="4.5" rx="2.2" fill="#EF4444"/>
  <rect x="54" y="120" width="10" height="4.5" rx="2.2" fill="#EF4444"/>
</svg>
`;

const normalizeHeading = (heading = 0) => {
  if (!Number.isFinite(heading)) return 0;
  return ((heading % 360) + 360) % 360;
};

const createVehicleIcon = (svg: string, width: number, height: number, heading = 0) =>
  L.divIcon({
    className: 'hub-map-vehicle-icon',
    iconSize: [width, height],
    iconAnchor: [Math.round(width / 2), Math.round(height / 2)],
    popupAnchor: [0, -Math.round(height / 2)],
    html: `
      <div style="
        width:${width}px;
        height:${height}px;
        display:flex;
        align-items:center;
        justify-content:center;
        transform: rotate(${normalizeHeading(heading)}deg);
        transform-origin: center center;
        will-change: transform;
      ">
        ${svg}
      </div>
    `,
  });

export const createTruckIcon = (heading = 0) => createVehicleIcon(TRUCK_ICON_SVG, 32, 50, heading);
export const createCarIcon = (heading = 0) => createVehicleIcon(CAR_ICON_SVG, 24, 40, heading);

// Backward-compatible defaults (without rotation)
export const truckIcon = createTruckIcon(0);
export const carIcon = createCarIcon(0);

export const problemIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/595/595067.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const MapStyle = ({ variant }: { variant: 'light' | 'dark' }) => (
  <style>{`
    .leaflet-container {
      background: ${variant === 'dark' ? '#0f172a' : '#f8fafc'} !important;
    }
    .leaflet-tile-pane {
      filter: ${variant === 'dark' ? 'grayscale(100%) brightness(0.6) contrast(1.2) invert(100%)' : 'grayscale(100%) contrast(1.1) brightness(0.95)'};
    }
    .leaflet-marker-icon {
      transition: transform 0.3s ease-out;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
    }
    .hub-map-vehicle-icon::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      margin: -20px 0 0 -20px;
      border-radius: 50%;
      border: 2px solid #6366F1;
      animation: vehiclePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      z-index: -1;
      pointer-events: none;
    }
    @keyframes vehiclePulse {
      0% { transform: scale(0.6); opacity: 0.8; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    .hub-map-vehicle-icon {
      background: transparent !important;
      border: none !important;
    }
    .leaflet-bar {
      border: none !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
    }
    .leaflet-bar a {
      background-color: ${variant === 'dark' ? '#1e293b' : '#fff'} !important;
      color: ${variant === 'dark' ? '#f8fafc' : '#0f172a'} !important;
      border: 1px solid ${variant === 'dark' ? '#334155' : '#f1f5f9'} !important;
    }
  `}</style>
);

interface HubMapProps extends MapContainerProps {
  children?: React.ReactNode;
  variant?: 'light' | 'dark';
}

const HubMap: React.FC<HubMapProps> = ({ children, variant = 'light', ...props }) => {
  const tileUrl = variant === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapStyle variant={variant} />
      <MapContainer 
        {...props} 
        style={{ height: '100%', width: '100%', ...props.style }}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {children}
      </MapContainer>
    </div>
  );
};

export default HubMap;

import React from 'react';
import { MapContainer, TileLayer, MapContainerProps, Marker, Polyline, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export { Marker, Polyline, Popup, Tooltip };

// Premium Grayscale SVGs following the requested standard exactly
const TRUCK_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 130" width="100%" height="100%" fill="none">
  <!-- Vehicle Body -->
  <rect x="14" y="6" width="52" height="118" rx="14" fill="#0F172A" stroke="#1E293B" stroke-width="2.5"/>
  <!-- Trailer top (White/silver as reference) -->
  <rect x="18" y="32" width="44" height="84" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
  <!-- Windshield/Cabin glass -->
  <path d="M22 18C22 14 26 12 40 12C54 12 58 14 58 18H22Z" fill="#334155"/>
  <!-- Headlights -->
  <rect x="20" y="4" width="8" height="3" rx="1" fill="#FEF08A"/>
  <rect x="52" y="4" width="8" height="3" rx="1" fill="#FEF08A"/>
  <!-- Rear Lights -->
  <rect x="18" y="122" width="8" height="3" rx="1" fill="#EF4444"/>
  <rect x="54" y="122" width="8" height="3" rx="1" fill="#EF4444"/>
</svg>
`;

const CAR_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 110" width="100%" height="100%" fill="none">
  <!-- Car Body -->
  <rect x="12" y="6" width="46" height="98" rx="15" fill="#0F172A" stroke="#1E293B" stroke-width="2.5"/>
  <!-- Windshield -->
  <rect x="18" y="18" width="34" height="20" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
  <!-- Rear Window -->
  <rect x="18" y="72" width="34" height="16" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
  <!-- Side Mirrors -->
  <rect x="8" y="24" width="4" height="10" rx="2" fill="#0F172A"/>
  <rect x="58" y="24" width="4" height="10" rx="2" fill="#0F172A"/>
</svg>
`;

const ALERT_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%" fill="none">
  <path d="M24 4L4 40H44L24 4Z" fill="#FBBF24" stroke="#D97706" stroke-width="3" stroke-linejoin="round"/>
  <rect x="22" y="16" width="4" height="12" rx="2" fill="#0F172A"/>
  <circle cx="24" cy="33" r="2.5" fill="#0F172A"/>
</svg>
`;

const normalizeHeading = (heading = 0) => {
  if (!Number.isFinite(heading)) return 0;
  return ((heading % 360) + 360) % 360;
};

const createVehicleIcon = (svg: string, width: number, height: number, heading = 0, isAlert = false) => {
  if (typeof window === 'undefined' || typeof L === 'undefined') return null;
  return L.divIcon({
    className: 'map-global-vehicle-icon',
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
        transform: rotate(${isAlert ? 0 : normalizeHeading(heading)}deg);
        transform-origin: center center;
        will-change: transform;
      ">
        ${svg}
      </div>
    `,
  });
};

const isBrowser = typeof window !== 'undefined' && typeof L !== 'undefined';

export const createTruckIcon = (heading = 0) => isBrowser ? createVehicleIcon(TRUCK_ICON_SVG, 32, 52, heading) : null;
export const createCarIcon = (heading = 0) => isBrowser ? createVehicleIcon(CAR_ICON_SVG, 26, 42, heading) : null;
export const createAlertIcon = () => isBrowser ? createVehicleIcon(ALERT_ICON_SVG, 36, 36, 0, true) : null;

// Backward-compatible defaults
export const truckIcon = isBrowser ? createTruckIcon(0) : null;
export const carIcon = isBrowser ? createCarIcon(0) : null;
export const problemIcon = isBrowser ? createAlertIcon() : null;

const MapGlobalStyle = () => (
  <style>{`
    .leaflet-container {
      background: #F8FAFC !important;
    }
    .leaflet-tile-pane {
      /* Full colors and rich details exactly like the screenshot */
      filter: none !important;
    }
    .leaflet-marker-icon {
      transition: transform 0.25s ease-out;
      filter: drop-shadow(0 4px 8px rgba(15, 23, 42, 0.22));
    }
    .map-global-vehicle-icon::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 44px;
      height: 44px;
      margin: -22px 0 0 -22px;
      border-radius: 50%;
      border: 2px solid #0061FF;
      animation: vehiclePulseGlobal 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      z-index: -1;
      pointer-events: none;
    }
    @keyframes vehiclePulseGlobal {
      0% { transform: scale(0.6); opacity: 0.8; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    .map-global-vehicle-icon {
      background: transparent !important;
      border: none !important;
    }
    .leaflet-bar {
      border: none !important;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08) !important;
      border-radius: 12px !important;
      overflow: hidden;
    }
    .leaflet-bar a {
      background-color: #FFFFFF !important;
      color: #0F172A !important;
      border: 1px solid #E2E8F0 !important;
      transition: background-color 0.2s;
    }
    .leaflet-bar a:hover {
      background-color: #F1F5F9 !important;
    }
    .leaflet-popup-content-wrapper {
      background: #FFFFFF !important;
      color: #0F172A !important;
      border-radius: 16px !important;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.1) !important;
      border: 1px solid #E2E8F0 !important;
      font-family: system-ui, sans-serif !important;
    }
    .leaflet-popup-tip {
      background: #FFFFFF !important;
      border: 1px solid #E2E8F0 !important;
    }
  `}</style>
);

interface MapGlobalProps extends MapContainerProps {
  children?: React.ReactNode;
}

const MapGlobal: React.FC<MapGlobalProps> = ({ children, ...props }) => {
  const tileUrl = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      position: 'relative',
      borderRadius: '24px',
      overflow: 'hidden',
      border: '1px solid #E2E8F0',
      boxShadow: '0 8px 30px rgba(15, 23, 42, 0.03)'
    }}>
      <MapGlobalStyle />
      <MapContainer 
        {...props} 
        style={{ height: '100%', width: '100%', ...props.style }}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; Google Maps'
        />
        {children}
      </MapContainer>
    </div>
  );
};

export default MapGlobal;

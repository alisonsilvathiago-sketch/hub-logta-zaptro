import React from 'react';
import { MapContainer, TileLayer, MapContainerProps } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Standard Icons
export const truckIcon = new L.Icon({
  iconUrl: '/assets/map/truck.png',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -20]
});

export const carIcon = new L.Icon({
  iconUrl: '/assets/map/car.png',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -18]
});

export const problemIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/595/595067.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const MapStyle = () => (
  <style>{`
    .leaflet-container {
      background: #f8fafc !important;
    }
    .leaflet-tile-pane {
      filter: grayscale(100%) brightness(1.05) contrast(1.1);
    }
    .leaflet-marker-icon {
      transition: transform 0.5s ease-out;
    }
    .leaflet-bar {
      border: none !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
    }
    .leaflet-bar a {
      background-color: #fff !important;
      color: #0f172a !important;
      border: 1px solid #f1f5f9 !important;
    }
  `}</style>
);

interface HubMapProps extends MapContainerProps {
  children?: React.ReactNode;
}

const HubMap: React.FC<HubMapProps> = ({ children, ...props }) => {
  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapStyle />
      <MapContainer 
        {...props} 
        style={{ height: '100%', width: '100%', ...props.style }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {children}
      </MapContainer>
    </div>
  );
};

export default HubMap;

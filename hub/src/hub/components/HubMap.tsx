import React from 'react';
import MapGlobal, { 
  Marker, Polyline, Popup, Tooltip, 
  truckIcon, carIcon, problemIcon, 
  createTruckIcon, createCarIcon, createAlertIcon 
} from '@shared/components/MapGlobal';
import { MapContainerProps } from 'react-leaflet';

export { 
  Marker, Polyline, Popup, Tooltip, 
  truckIcon, carIcon, problemIcon, 
  createTruckIcon, createCarIcon, createAlertIcon 
};

interface HubMapProps extends MapContainerProps {
  children?: React.ReactNode;
  variant?: 'light' | 'dark';
}

const HubMap: React.FC<HubMapProps> = ({ children, variant = 'light', ...props }) => {
  return (
    <MapGlobal {...props}>
      {children}
    </MapGlobal>
  );
};

export default HubMap;

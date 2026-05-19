import React, { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { Truck, Navigation } from 'lucide-react';
import {
  LogtaStandardMap,
  type LogtaStandardMapMetrics,
} from './LogtaStandardMap';
import {
  LOGTA_DEFAULT_ROUTE_WAYPOINTS,
  type LogtaLatLng,
} from '../lib/logtaOpenStreetMap';

export type OperationalMapVehicle = {
  id: number;
  driver: string;
  plate: string;
  x: number;
  y: number;
  speed: string;
  status: string;
};

const DEFAULT_VEHICLES: OperationalMapVehicle[] = [
  { id: 1, driver: 'Roberto Silva', plate: 'BRA-2L22', x: 25, y: 35, speed: '62 km/h', status: 'Em Rota' },
  { id: 2, driver: 'Ana Paula', plate: 'KJU-9011', x: 45, y: 65, speed: '0 km/h', status: 'Parado' },
  { id: 3, driver: 'Carlos Lima', plate: 'MNH-4455', x: 75, y: 25, speed: '54 km/h', status: 'Em Rota' },
  { id: 4, driver: 'Marcos Reis', plate: 'PKO-0012', x: 60, y: 50, speed: '42 km/h', status: 'Em Rota' },
];

type OperationalMapCanvasProps = {
  className?: string;
  showZoomControls?: boolean;
  vehicles?: OperationalMapVehicle[];
  /** Quando definido com `onSelectedVehicleChange`, a seleção é controlada pelo pai (ex.: painel lateral). */
  selectedVehicle?: OperationalMapVehicle | null;
  onSelectedVehicleChange?: (vehicle: OperationalMapVehicle | null) => void;
  children?: React.ReactNode;
  /** Bolha “A X km / e Y minutos” no padrão Logta (mapa claro + rota preta). */
  metrics?: LogtaStandardMapMetrics;
  showMetricsBubble?: boolean;
  /** Path SVG da rota (viewBox 0–100). @deprecated */
  routePathD?: string;
  /** Rota real nas vias (OSRM). */
  routeWaypoints?: LogtaLatLng[];
  showHeroCar?: boolean;
  showDestinationPin?: boolean;
  onRouteResolved?: (data: { distanceKm: number; durationMin: number }) => void;
};

/**
 * Mesmo padrão visual do mapa operacional usado em Mapa ao vivo (grade, rotas, caminhões).
 */
export function OperationalMapCanvas({
  className = '',
  showZoomControls = false,
  vehicles: vehiclesProp,
  selectedVehicle: selectedVehicleProp,
  onSelectedVehicleChange,
  children,
  metrics,
  showMetricsBubble = true,
  routePathD,
  routeWaypoints = LOGTA_DEFAULT_ROUTE_WAYPOINTS,
  showHeroCar = true,
  showDestinationPin = true,
  onRouteResolved,
}: OperationalMapCanvasProps) {
  const controlled = onSelectedVehicleChange != null;
  const mapRef = useRef<LeafletMap | null>(null);
  const [vehicles, setVehicles] = useState<OperationalMapVehicle[]>(vehiclesProp ?? DEFAULT_VEHICLES);
  const [internalSelected, setInternalSelected] = useState<OperationalMapVehicle | null>(null);

  const selectedVehicle = controlled ? (selectedVehicleProp ?? null) : internalSelected;

  const setSelected = (v: OperationalMapVehicle | null) => {
    if (controlled) onSelectedVehicleChange(v);
    else setInternalSelected(v);
  };

  useEffect(() => {
    if (vehiclesProp !== undefined) setVehicles(vehiclesProp);
  }, [vehiclesProp]);

  useEffect(() => {
    if (vehiclesProp !== undefined) return;
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status === 'Em Rota') {
            return {
              ...v,
              x: Math.max(5, Math.min(95, v.x + (Math.random() - 0.5) * 1.5)),
              y: Math.max(5, Math.min(95, v.y + (Math.random() - 0.5) * 1.5)),
              speed: `${Math.floor(Math.random() * 20 + 50)} km/h`,
            };
          }
          return v;
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [vehiclesProp]);

  return (
    <div className={`relative h-full w-full overflow-hidden group cursor-crosshair ${className}`}>
      <LogtaStandardMap
        className="absolute inset-0 min-h-0 h-full w-full"
        metrics={metrics ?? { km: '12,4', minutes: '38' }}
        routePathD={routePathD}
        routeWaypoints={routeWaypoints}
        showMetricsBubble={showMetricsBubble}
        showHeroCar={showHeroCar}
        showDestinationPin={showDestinationPin}
        showZoomControls={showZoomControls}
        onMapReady={(map) => {
          mapRef.current = map;
        }}
        onRouteResolved={onRouteResolved}
      />

      {vehicles.map((v) => (
        <div
          key={v.id}
          className="absolute z-20 cursor-pointer transition-all duration-[4000ms] ease-linear"
          style={{ left: `${v.x}%`, top: `${v.y}%`, transform: 'translate(-50%, -50%)' }}
          onClick={() => setSelected(v)}
        >
          <div
            className={`relative transition-all duration-500 ${
              selectedVehicle?.id === v.id ? 'scale-125' : 'hover:scale-110'
            }`}
          >
            {selectedVehicle?.id === v.id && (
              <div className="absolute inset-0 scale-150 animate-ping rounded-2xl bg-primary/20" />
            )}

            <div
              className={`flex items-center justify-center rounded-2xl border-2 p-3 shadow-2xl transition-all ${
                selectedVehicle?.id === v.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-white bg-white text-gray-900 group-hover:border-primary/20'
              }`}
            >
              <Truck size={24} />
              {v.status === 'Em Rota' && (
                <div className="absolute -bottom-2 -right-2 rounded-lg border border-gray-100 bg-white p-1 text-primary shadow-md">
                  <Navigation size={12} className="rotate-45" />
                </div>
              )}
            </div>

            {(selectedVehicle?.id === v.id || v.status === 'Parado') && (
              <div className="absolute -top-12 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-xl bg-gray-900 px-3 py-1.5 text-[10px] font-black text-white shadow-2xl animate-in zoom-in duration-300">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${v.status === 'Parado' ? 'bg-yellow-500' : 'bg-green-500'}`}
                  />
                  {v.plate} • {v.speed}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {selectedVehicle && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30">
          <path
            d={`M ${selectedVehicle.x}% ${selectedVehicle.y}% L ${selectedVehicle.x + 15}% ${selectedVehicle.y + 10}% L ${selectedVehicle.x + 5}% ${selectedVehicle.y + 25}%`}
            stroke="var(--color-primary, #2563eb)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="1,12"
            fill="none"
            className="animate-pulse"
          />
        </svg>
      )}

      {children}

      {showZoomControls && (
        <div className="absolute bottom-10 left-10 z-30 flex flex-col gap-3">
          <div className="flex flex-col gap-1 rounded-[24px] border border-white bg-white/80 p-1.5 shadow-2xl shadow-gray-900/5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white font-black text-gray-900 shadow-sm transition-all hover:bg-primary hover:text-white"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white font-black text-gray-900 shadow-sm transition-all hover:bg-primary hover:text-white"
            >
              −
            </button>
          </div>
          <button
            type="button"
            className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-2xl shadow-primary/30 transition-all hover:scale-105"
          >
            <Navigation size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

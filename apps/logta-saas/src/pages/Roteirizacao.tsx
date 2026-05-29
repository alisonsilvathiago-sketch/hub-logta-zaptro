import React, { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { useOperationalData } from '../contexts/OperationalDataContext';
import {
  RoteirizacaoIntelligenceProvider,
  RoteirizacaoAlertsInlinePanel,
  deliveryToMapConfig,
  useRoteirizacaoIntelligence,
  type RouteDeliveryNormalized,
} from '../modules/roteirizacao';
import { 
  Map as MapIcon, 
  Navigation, 
  Truck, 
  Users, 
  Zap, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  ChevronRight,
  Clock,
  MapPin,
  Package,
  Activity,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Send,
  Download,
  Share2,
  CheckCircle2,
  Layers,
  Maximize2,
  Hash,
} from 'lucide-react';
import { ExportFormatModal } from '../components/ExportFormatModal';
import { AddRotaManualModal } from '../components/AddRotaManualModal';
import { geocodePlace } from '../lib/logtaGeocode';
import type { LogtaStandardMapMetrics } from '../components/LogtaStandardMap';
import {
  LOGTA_DEFAULT_ROUTE_WAYPOINTS,
  LOGTA_OPTIMIZED_ROUTE_WAYPOINTS,
  type LogtaLatLng,
} from '../lib/logtaOpenStreetMap';
import { OperationalMapCanvas } from '../components/OperationalMapCanvas';
import { showToast } from '../components/Toast';
import {
  appendManualRoute,
  loadManualRoutes,
  type ManualRouteRecord,
} from '../lib/roteirizacaoManualRoutes';

type MapPinConfig = {
  left: string;
  top: string;
  bgClass: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
};

type PlanejamentoDelivery = {
  id: string;
  dest: string;
  weight: string;
  priority: 'Alta' | 'Normal' | 'Baixa';
  map: {
    km: string;
    minutes: string;
    routeWaypoints: LogtaLatLng[];
    pins: MapPinConfig[];
  };
};

const PINS_OVERVIEW: MapPinConfig[] = [
  { left: '33%', top: '25%', bgClass: 'bg-primary', Icon: Package },
  { left: '72%', top: '33%', bgClass: 'bg-red-500', Icon: AlertTriangle },
];

const DELIVERIES: PlanejamentoDelivery[] = [
  {
    id: '#9011',
    dest: 'Av. Paulista, 1000 - SP',
    weight: '120kg',
    priority: 'Alta',
    map: {
      km: '8,2',
      minutes: '24',
      routeWaypoints: LOGTA_DEFAULT_ROUTE_WAYPOINTS,
      pins: [
        { left: '30%', top: '24%', bgClass: 'bg-primary', Icon: Package },
        { left: '68%', top: '30%', bgClass: 'bg-red-500', Icon: AlertTriangle },
      ],
    },
  },
  {
    id: '#9012',
    dest: 'Rua Augusta, 450 - SP',
    weight: '45kg',
    priority: 'Normal',
    map: {
      km: '5,4',
      minutes: '16',
      routeWaypoints: LOGTA_DEFAULT_ROUTE_WAYPOINTS,
      pins: [
        { left: '26%', top: '28%', bgClass: 'bg-primary', Icon: Package },
        { left: '74%', top: '26%', bgClass: 'bg-red-500', Icon: AlertTriangle },
      ],
    },
  },
  {
    id: '#9013',
    dest: 'Al. Campinas, 22 - SP',
    weight: '18kg',
    priority: 'Baixa',
    map: {
      km: '3,1',
      minutes: '11',
      routeWaypoints: LOGTA_DEFAULT_ROUTE_WAYPOINTS,
      pins: [
        { left: '32%', top: '30%', bgClass: 'bg-primary', Icon: Package },
        { left: '70%', top: '34%', bgClass: 'bg-red-500', Icon: AlertTriangle },
      ],
    },
  },
];

const ROUTE_CUSTO_POR_KM = 2.65;

function formatHmFromMinutes(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

function parseBrMinutes(s: string): number {
  const n = Number(String(s).trim().replace(',', '.'));
  if (Number.isFinite(n) && n > 0) return Math.round(n);
  return Number(String(s).replace(/\D/g, '') || '0');
}

function parseBrKm(s: string): number {
  const n = Number(String(s).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Custo e lucro derivados da mesma rota exibida no mapa (OSRM). */
function routeFinancialsFromMap(km: number, min: number, routeOptimized: boolean) {
  const custo = km * ROUTE_CUSTO_POR_KM + 12;
  const receitaEst = km * 8.2 + min * 0.4;
  const lucro = routeOptimized
    ? receitaEst * 0.3 - custo * 0.12
    : receitaEst * 0.26 - custo * 0.1;
  return {
    custo,
    lucro: Math.max(lucro, receitaEst * 0.12),
  };
}

function bottomSummaryFromMapMetrics(
  metrics: LogtaStandardMapMetrics,
  routeOptimized: boolean,
) {
  if (metrics.km === '—' || metrics.minutes === '—') {
    return {
      distLabel: 'Calculando…',
      timeLabel: '—',
      cost: '—',
      profit: '—',
    };
  }
  const km = parseBrKm(metrics.km);
  const min = parseBrMinutes(metrics.minutes);
  const { custo, lucro } = routeFinancialsFromMap(km, min, routeOptimized);
  return {
    distLabel: `${km.toFixed(1).replace('.', ',')} km`,
    timeLabel: formatHmFromMinutes(min),
    cost: `R$ ${custo.toFixed(2)}`,
    profit: `R$ ${lucro.toFixed(2)}`,
  };
}

function toPlanejamentoDelivery(d: RouteDeliveryNormalized, index: number): PlanejamentoDelivery {
  const mapCfg = deliveryToMapConfig(d, index);
  const fallback = DELIVERIES[index % DELIVERIES.length];
  return {
    id: d.id,
    dest: d.dest,
    weight: d.weight,
    priority: d.priority === 'Urgente' ? 'Alta' : (d.priority as 'Alta' | 'Normal' | 'Baixa'),
    map: {
      km: mapCfg.km,
      minutes: mapCfg.minutes,
      routeWaypoints: LOGTA_DEFAULT_ROUTE_WAYPOINTS,
      pins: fallback?.map.pins ?? PINS_OVERVIEW,
    },
  };
}

const Roteirizacao = () => {
  const { deliveries: deliveriesNorm, motoristas, vehicles, loading: dataLoading } = useOperationalData();

  return (
    <RoteirizacaoIntelligenceProvider
      deliveries={deliveriesNorm}
      motoristas={motoristas}
      vehicles={vehicles}
      loading={dataLoading}
      autoPopup={false}
    >
      <RoteirizacaoContent />
    </RoteirizacaoIntelligenceProvider>
  );
};

const RoteirizacaoContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analytics, routeOptimized, setRouteOptimized, refreshIntelligence } = useRoteirizacaoIntelligence();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const { deliveries: deliveriesNorm } = useRoteirizacaoIntelligence();

  const { hasBackend } = useOperationalData();

  const displayDeliveries = useMemo(() => {
    if (deliveriesNorm.length > 0) {
      return deliveriesNorm.map((d, i) => toPlanejamentoDelivery(d, i));
    }
    if (hasBackend) return [];
    return DELIVERIES;
  }, [deliveriesNorm, hasBackend]);

  const [mapMetrics, setMapMetrics] = useState<LogtaStandardMapMetrics>({ km: '—', minutes: '—' });
  const [mapRouteWaypoints, setMapRouteWaypoints] = useState<LogtaLatLng[]>(LOGTA_DEFAULT_ROUTE_WAYPOINTS);
  const [mapPins, setMapPins] = useState<MapPinConfig[]>(PINS_OVERVIEW);
  const [isAddRotaOpen, setIsAddRotaOpen] = useState(false);
  const [manualRoutes, setManualRoutes] = useState<ManualRouteRecord[]>(() => loadManualRoutes());
  
  const tabs = [
    { id: 'planejamento', label: 'Planejamento', icon: Layers, path: '/roteirizacao/planejamento' },
    { id: 'otimizacao', label: 'Motor de IA', icon: Zap, path: '/roteirizacao/otimizacao' },
    { id: 'rotas-ativas', label: 'Rotas ativas', icon: Navigation, path: '/roteirizacao/rotas' },
    { id: 'eficiencia', label: 'Performance', icon: Activity, path: '/roteirizacao/eficiencia' },
  ];

  const bottomSummary = useMemo(
    () => bottomSummaryFromMapMetrics(mapMetrics, routeOptimized),
    [mapMetrics, routeOptimized],
  );

  const applyOverviewMap = (optimized: boolean) => {
    setMapRouteWaypoints(optimized ? LOGTA_OPTIMIZED_ROUTE_WAYPOINTS : LOGTA_DEFAULT_ROUTE_WAYPOINTS);
    setMapPins(PINS_OVERVIEW);
  };

  const handleSelectDelivery = (id: string) => {
    if (selectedDeliveryId === id) {
      setSelectedDeliveryId(null);
      applyOverviewMap(routeOptimized);
      return;
    }
    setSelectedDeliveryId(id);
    const d = displayDeliveries.find((x) => x.id === id);
    if (d) {
      setMapRouteWaypoints(d.map.routeWaypoints);
      setMapPins(d.map.pins);
    }
  };

  const handleOptimize = () => {
    setIsOptimizing(true);
    setSelectedDeliveryId(null);
    setTimeout(() => {
      setIsOptimizing(false);
      setRouteOptimized(true);
      setMapRouteWaypoints(LOGTA_OPTIMIZED_ROUTE_WAYPOINTS);
      setMapPins(PINS_OVERVIEW);
      refreshIntelligence();
      showToast(
        'success',
        `Rota otimizada — economia estimada de ${analytics.economiaPercent || 17}% em KM e tempo.`,
        'Rota inteligente pronta',
      );
    }, 2000);
  };

  const handleSaveManualRoute = async (form: {
    nome: string;
    motorista: string;
    veiculo: string;
    origem: string;
    destino: string;
  }) => {
    const entry = appendManualRoute(form);
    setManualRoutes(loadManualRoutes());
    setIsAddRotaOpen(false);

    try {
      const [from, to] = await Promise.all([
        geocodePlace(form.origem),
        geocodePlace(form.destino),
      ]);
      if (from && to) {
        setMapRouteWaypoints([from, to]);
        setSelectedDeliveryId(null);
      }
    } catch {
      /* mapa mantém rota atual */
    }

    showToast('success', `Rota "${entry.nome}" cadastrada manualmente.`, 'Nova rota');
    navigate('/roteirizacao/rotas');
  };

  const handleSendToDrivers = () => {
    showToast(
      'success',
      'Motoristas recebem um link da rota. Com a localização ativa, o rastreamento segue em segundo plano; status “a caminho” e “chegou” são repassados ao cliente automaticamente.',
      'Enviado aos motoristas'
    );
  };

  return (
    <div className="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-x-hidden lg:min-h-0 lg:h-full lg:flex-row lg:overflow-hidden">
      {/* Sidebar Control Panel */}
      <div className="flex w-full max-w-full shrink-0 flex-col border-b border-gray-100 bg-white shadow-xl lg:h-full lg:w-[min(100%,480px)] lg:border-b-0 lg:border-r">
        <div className="p-5 pb-3 sm:p-8 sm:pb-4">
          <h1 className="logta-page-title mb-2">Roteirização</h1>
          <p className="max-w-xl text-sm font-medium leading-snug text-gray-500">
            Central inteligente de rotas — otimização, distribuição e monitoramento em tempo real.
          </p>
          <RoteirizacaoAlertsInlinePanel className="mt-4" />
        </div>

        <div className="mb-4 w-full sm:mb-6">
          <div className="flex w-full min-w-0 items-center gap-2 px-3 py-2 sm:px-4">
            <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex w-max min-w-full items-stretch gap-1 py-1 sm:gap-1.5">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive =
                    location.pathname.startsWith(tab.path) ||
                    (location.pathname === '/roteirizacao' && tab.id === 'planejamento');
                  return (
                    <Link
                      key={tab.id}
                      to={tab.path}
                      title={tab.label}
                      aria-label={tab.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={`grid min-h-[46px] min-w-[52px] flex-1 place-items-center rounded-2xl border px-3 py-2.5 transition-all sm:min-h-[48px] sm:min-w-[56px] sm:px-3.5 sm:py-3
                    ${isActive
                      ? 'border-gray-200 bg-white text-gray-900 shadow-sm'
                      : 'border-transparent text-gray-500 hover:border-gray-100 hover:bg-gray-50 hover:text-gray-800'}`}
                    >
                      <Icon
                        size={20}
                        className={`shrink-0 sm:h-[22px] sm:w-[22px] ${isActive ? 'text-primary' : 'text-gray-400'}`}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddRotaOpen(true)}
              title="Adicionar rota manualmente"
              aria-label="Adicionar rota manualmente"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:opacity-95 sm:h-12 sm:w-12"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-3 pb-8 scrollbar-hide sm:px-6 lg:px-8">
          <Routes>
            <Route index element={<Navigate to="/roteirizacao/planejamento" replace />} />
            <Route
              path="planejamento"
              element={
                <PlanejamentoView
                  deliveries={displayDeliveries}
                  pendingCount={analytics.entregasPendentes}
                  selectedId={selectedDeliveryId}
                  onSelectDelivery={handleSelectDelivery}
                  onOptimize={handleOptimize}
                  isOptimizing={isOptimizing}
                />
              }
            />
            <Route path="otimizacao" element={<OtimizacaoView />} />
            <Route path="rotas" element={<RotasAtivasView manualRoutes={manualRoutes} />} />
            <Route path="eficiencia" element={<PerformanceView />} />
          </Routes>
        </div>
      </div>

      {/* Mapa operacional — mesmo padrão Mapa ao vivo / Fretes (OpenStreetMap + rota + métricas + pins) */}
      <div className="relative min-h-[280px] w-full min-w-0 flex-1 overflow-hidden bg-gray-50 sm:min-h-[360px] lg:min-h-0 lg:h-full">
        <OperationalMapCanvas
          className="absolute inset-0 h-full w-full"
          vehicles={[]}
          metrics={mapMetrics}
          routeWaypoints={mapRouteWaypoints}
          showMetricsBubble
          showHeroCar
          showDestinationPin
          onRouteResolved={(r) => {
            setMapMetrics({
              km: r.distanceKm.toFixed(1).replace('.', ','),
              minutes: String(r.durationMin),
            });
          }}
          showZoomControls
        >
          {mapPins.map((pin, idx) => {
            const PinIcon = pin.Icon;
            return (
              <div
                key={`${pin.left}-${pin.top}-${idx}`}
                className={`pointer-events-auto absolute z-40 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-4 border-white text-white shadow-xl transition-all hover:scale-110 ${pin.bgClass}`}
                style={{ left: pin.left, top: pin.top }}
              >
                <PinIcon size={14} />
              </div>
            );
          })}
        </OperationalMapCanvas>

        {/* Map UI Overlays */}
        <div className="absolute right-3 top-3 z-20 flex gap-2 lg:right-8 lg:top-8 lg:gap-3">
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-500 shadow-xl transition-all hover:text-gray-900 lg:h-12 lg:w-12">
            <Layers size={20} />
          </button>
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-500 shadow-xl transition-all hover:text-gray-900 lg:h-12 lg:w-12">
            <Maximize2 size={20} />
          </button>
        </div>

        {/* Bottom Route Summary Card */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex max-w-full flex-col gap-4 rounded-[24px] border border-blue-100/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-8 duration-700 sm:bottom-4 sm:left-4 sm:right-4 sm:rounded-[28px] sm:p-5 lg:bottom-6 lg:left-8 lg:right-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:flex-1 sm:flex-wrap sm:items-start sm:gap-x-6 sm:gap-y-2 lg:flex-nowrap lg:gap-8">
            <div className="min-w-0">
              <p className="mb-0.5 text-[9px] font-black uppercase tracking-normal text-gray-400 sm:mb-1 sm:text-[10px]">Distância Total</p>
              <h4 className="truncate text-base font-bold text-gray-900 sm:text-lg">{bottomSummary.distLabel}</h4>
            </div>
            <div className="hidden h-10 w-px shrink-0 bg-gray-200 sm:mt-1 lg:block" aria-hidden />
            <div className="min-w-0">
              <p className="mb-0.5 text-[9px] font-black uppercase tracking-normal text-gray-400 sm:mb-1 sm:text-[10px]">Tempo Est.</p>
              <h4 className="truncate text-base font-bold text-gray-900 sm:text-lg">{bottomSummary.timeLabel}</h4>
            </div>
            <div className="hidden h-10 w-px shrink-0 bg-gray-200 sm:mt-1 lg:block" aria-hidden />
            <div className="min-w-0">
              <p className="mb-0.5 text-[9px] font-black uppercase tracking-normal text-gray-400 sm:mb-1 sm:text-[10px]">Custo Est.</p>
              <h4 className="truncate text-base font-bold text-red-500 sm:text-lg">{bottomSummary.cost}</h4>
            </div>
            <div className="hidden h-10 w-px shrink-0 bg-gray-200 sm:mt-1 lg:block" aria-hidden />
            <div className="min-w-0">
              <p className="mb-0.5 text-[9px] font-black uppercase tracking-normal text-gray-400 sm:mb-1 sm:text-[10px]">Lucro Projetado</p>
              <h4 className="truncate text-base font-bold text-blue-600 sm:text-lg">{bottomSummary.profit}</h4>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end lg:flex-nowrap">
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-xs font-bold text-white shadow-md shadow-black/10 transition-all hover:bg-black sm:px-6 sm:py-3.5 sm:text-sm"
            >
              <Download size={16} /> Exportar
            </button>
            <button
              type="button"
              onClick={handleSendToDrivers}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:opacity-90 sm:px-6 sm:py-3.5 sm:text-sm"
            >
              <Send size={16} /> <span className="whitespace-normal text-center sm:whitespace-nowrap">Enviar p/ Motoristas</span>
            </button>
          </div>
        </div>
      </div>

      <AddRotaManualModal
        open={isAddRotaOpen}
        onClose={() => setIsAddRotaOpen(false)}
        onSave={handleSaveManualRoute}
      />

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar roteirização"
        getTabularData={() => ({
          title: 'Roteirização — resumo da rota ativa',
          filenameBase: 'roteirizacao-resumo',
          columns: ['Indicador', 'Valor'],
          rows: [
            ['Distância total', bottomSummary.distLabel],
            ['Tempo est. viagem', bottomSummary.timeLabel],
            ['Custo est. rota', bottomSummary.cost],
            ['Lucro projetado', bottomSummary.profit],
          ],
        })}
      />

    </div>
  );
};

// --- View Components ---

const PlanejamentoView = ({
  deliveries,
  pendingCount,
  selectedId,
  onSelectDelivery,
  onOptimize,
  isOptimizing,
}: {
  deliveries: PlanejamentoDelivery[];
  pendingCount: number;
  selectedId: string | null;
  onSelectDelivery: (id: string) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
}) => {
  const { motoristas, vehicles } = useRoteirizacaoIntelligence();
  const driver = motoristas[0];
  const vehicle = vehicles[0];

  return (
  <div className="space-y-8">
    <section>
      <div className="flex justify-between items-center mb-4">
        <h3 className="logta-panel-section-title">Entregas Pendentes</h3>
        <span className="text-[10px] font-bold text-gray-400">{pendingCount} na fila</span>
      </div>
      <div className="space-y-3">
        {deliveries.map((item, i) => {
          const selected = selectedId === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onSelectDelivery(item.id)}
              className={`w-full text-left bg-gray-50 border p-4 rounded-2xl transition-all cursor-pointer group flex items-center gap-4
                ${selected ? 'border-primary ring-1 ring-primary/25 bg-white shadow-sm' : 'border-gray-100 hover:border-primary/30'}`}
            >
            <div className="w-5 h-5 border-2 border-gray-300 rounded-lg group-hover:border-primary transition-all flex items-center justify-center shrink-0">
               {i === 0 && <div className="w-2 h-2 bg-primary rounded-sm" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{item.dest}</p>
              <div className="flex items-center gap-3 my-2">
                <span
                  className="group/id relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm"
                  title={item.id}
                >
                  <Hash size={14} strokeWidth={2.5} />
                  <span className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover/id:opacity-100">
                    {item.id}
                  </span>
                </span>
                <span
                  className="group/w relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm"
                  title={item.weight}
                >
                  <Package size={14} strokeWidth={2.5} />
                  <span className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover/w:opacity-100">
                    {item.weight}
                  </span>
                </span>
              </div>
            </div>
            <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-normal shrink-0 ${
              item.priority === 'Alta' ? 'bg-red-100 text-red-600' : item.priority === 'Normal' ? 'bg-amber-50 text-amber-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {item.priority}
            </span>
          </button>
          );
        })}
      </div>
    </section>

    <section>
      <h3 className="logta-panel-section-title">Alocação de Recurso</h3>
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Truck size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-900">Veículo Disponível</p>
              <p className="text-[10px] text-gray-500 font-medium">
                {vehicle ? `${vehicle.modelo || 'Veículo'} • ${vehicle.plate || vehicle.id.slice(0, 8)}` : 'Mercedes Sprinter • 1.500kg'}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-900">Motorista</p>
              <p className="text-[10px] text-gray-500 font-medium">
                {driver?.nome || 'Roberto Silva'} • {driver?.status || 'Disponível'}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </div>
      </div>
    </section>

    <button 
      type="button"
      onClick={onOptimize}
      disabled={isOptimizing}
      className={`w-full py-[23px] bg-primary text-white rounded-[24px] font-black text-base tracking-normal shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3
        ${isOptimizing ? 'opacity-50 cursor-wait' : 'hover:opacity-90'}`}
    >
      {isOptimizing ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Otimizando Rotas...
        </>
      ) : (
        <>
          <Zap size={20} fill="currentColor" />
          Gerar Rota Inteligente
        </>
      )}
    </button>
  </div>
  );
};

const OtimizacaoView = () => {
  const { insights, refreshIntelligence } = useRoteirizacaoIntelligence();
  return (
  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
    <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10">
      <h3 className="mb-2 flex items-center gap-2 !text-[14px] !font-black uppercase !leading-tight !tracking-[0] text-primary">
        <Zap size={16} fill="currentColor" /> Configurações do Motor
      </h3>
      <p className="text-xs text-gray-600 font-medium leading-relaxed">Selecione os parâmetros que a IA deve priorizar ao calcular o trajeto.</p>
    </div>

    <div className="space-y-4">
      {[
        { label: 'Menor Distância Total', desc: 'Foca em reduzir o KM rodado geral.', active: true },
        { label: 'Menor Tempo de Rota', desc: 'Prioriza vias rápidas e evita trânsito.', active: false },
        { label: 'Menor Consumo/Custo', desc: 'Calcula custo de combustível e pedágios.', active: false },
        { label: 'Janelas de Entrega', desc: 'Garante o cumprimento dos horários.', active: true },
      ].map((config, i) => (
        <div key={i} className={`p-5 rounded-2xl border transition-all cursor-pointer ${config.active ? 'bg-white border-primary shadow-sm' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
          <div className="flex justify-between items-center mb-1">
            <h4 className="logta-sidebar-list-title">{config.label}</h4>
            <div className={`w-10 h-5 rounded-full relative transition-all ${config.active ? 'bg-primary' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.active ? 'right-1' : 'left-1'}`} />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 font-medium">{config.desc}</p>
        </div>
      ))}
    </div>

    <div className="bg-gray-900 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <Activity size={20} className="text-primary" />
        <h4 className="text-xs font-black uppercase tracking-normal">Status do Cluster</h4>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-[10px] font-bold text-gray-400">
          <span>Otimização Regional</span>
          <span>98.2%</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: '98%' }} />
        </div>
        <p className="text-[10px] text-gray-500 font-medium">IA detectou clusters de entrega otimizáveis na operação atual.</p>
      </div>
    </div>

    <div className="space-y-3">
      {insights.map((ins) => (
        <div key={ins.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-900">{ins.title}</p>
          <p className="mt-1 text-[10px] font-medium text-gray-500">{ins.description}</p>
        </div>
      ))}
    </div>

    <button
      type="button"
      onClick={refreshIntelligence}
      className="w-full rounded-2xl border border-gray-200 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50"
    >
      Reanalisar rotas com IA
    </button>
  </div>
  );
};

type RotasAtivasCard = {
  id: string;
  driver: string;
  subtitle?: string;
  stops: number;
  progress: number;
  status: string;
};

const DEMO_ROTAS: RotasAtivasCard[] = [
  { id: 'RT-2201', driver: 'Carlos Lima', stops: 8, progress: 65, status: 'Em Rota' },
  { id: 'RT-2202', driver: 'Ana Paula', stops: 12, progress: 30, status: 'Em Rota' },
  { id: 'RT-2203', driver: 'Marcos Reis', stops: 5, progress: 100, status: 'Concluído' },
];

const RotasAtivasView = ({ manualRoutes }: { manualRoutes: ManualRouteRecord[] }) => {
  const { activeRoutes } = useRoteirizacaoIntelligence();

  const manualCards: RotasAtivasCard[] = manualRoutes.map((m) => ({
    id: m.id,
    driver: m.nome,
    subtitle: `${m.motorista}${m.veiculo ? ` · ${m.veiculo}` : ''} — ${m.origem} → ${m.destino}`,
    stops: m.stops,
    progress: m.progress,
    status: m.status,
  }));

  const intelCards: RotasAtivasCard[] = activeRoutes.map((r) => ({
    id: r.id,
    driver: r.driver,
    stops: r.stops,
    progress: r.progress,
    status: r.status,
  }));

  const routes =
    manualCards.length > 0 || intelCards.length > 0 ? [...manualCards, ...intelCards] : DEMO_ROTAS;

  return (
  <div className="space-y-6">
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input 
        type="text" 
        placeholder="Buscar rota ou motorista..." 
        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-medium outline-none focus:bg-white focus:border-primary/30 transition-all"
      />
    </div>

    <div className="space-y-4">
      {routes.map((route) => (
        <div key={route.id} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase tracking-normal">{route.id}</span>
            <span className={`text-[9px] font-black uppercase tracking-normal ${route.status === 'Concluído' ? 'text-green-500' : 'text-blue-500 animate-pulse'}`}>{route.status}</span>
          </div>
          <h4 className="logta-sidebar-list-title mb-1">{route.driver}</h4>
          {route.subtitle ? (
            <p className="mb-2 text-[10px] font-medium leading-relaxed text-gray-500">{route.subtitle}</p>
          ) : null}
          <p className="text-[10px] text-gray-500 font-medium mb-4">{route.stops} Paradas programadas</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase">
              <span>Progresso</span>
              <span>{route.progress}%</span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${route.status === 'Concluído' ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${route.progress}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};

const PerformanceView = () => {
  const { analytics, insights, routeOptimized } = useRoteirizacaoIntelligence();

  return (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Entregas em rota</p>
        <h4 className="text-xl font-black text-primary">{analytics.entregasEmRota}</h4>
        <p className="text-[9px] text-green-500 font-bold mt-1">{analytics.entregasPendentes} pendentes</p>
      </div>
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Rotas críticas</p>
        <h4 className="text-xl font-black text-gray-900">{analytics.rotasCriticas}</h4>
        <p className="text-[9px] text-amber-600 font-bold mt-1">{analytics.rotasAtivas} ativas</p>
      </div>
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Custo médio</p>
        <h4 className="text-lg font-black text-red-500">R$ {analytics.custoPorEntrega.toFixed(0)}</h4>
        <p className="text-[9px] text-gray-500 font-bold mt-1">por entrega</p>
      </div>
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Margem rota</p>
        <h4 className="text-xl font-black text-primary">{analytics.margemOperacional.toFixed(0)}%</h4>
        <p className="text-[9px] text-green-500 font-bold mt-1">
          {routeOptimized ? `-${analytics.economiaPercent}% KM` : 'Otimize a rota'}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Km economizado</p>
        <h4 className="text-xl font-black text-primary">{analytics.economiaKm.toFixed(0)} km</h4>
        <p className="text-[9px] text-green-500 font-bold mt-1">IA Logta</p>
      </div>
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Lucro projetado</p>
        <h4 className="text-lg font-black text-gray-900">R$ {analytics.lucroProjetado.toFixed(0)}</h4>
        <p className="text-[9px] text-green-500 font-bold mt-1">{analytics.motoristasAtivos} motoristas</p>
      </div>
    </div>

    <div className="bg-gray-50 border border-gray-100 p-6 rounded-[32px]">
      <h3 className="logta-panel-section-title">Eficiência por Veículo</h3>
      <div className="space-y-6">
        {[
          { label: 'Sprinter BRA-2L22', val: 92 },
          { label: 'Caminhão KJU-9011', val: 78 },
          { label: 'Moto Delivery PK-02', val: 95 },
        ].map((v, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-gray-600">
              <span>{v.label}</span>
              <span>{v.val}%</span>
            </div>
            <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${v.val}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-primary p-6 rounded-[32px] text-white relative overflow-hidden">
       <div className="relative z-10 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-normal mb-2 flex items-center gap-2"><ArrowUpRight size={16} /> Insights IA</h4>
        {insights.slice(0, 2).map((ins) => (
          <p key={ins.id} className="text-[11px] font-medium leading-relaxed opacity-90">{ins.description}</p>
        ))}
       </div>
       <Zap size={80} className="pointer-events-none absolute bottom-8 right-7 opacity-10" fill="currentColor" />
    </div>
  </div>
  );
};

export default Roteirizacao;

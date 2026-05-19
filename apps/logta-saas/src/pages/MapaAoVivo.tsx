import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  AlertCircle, 
  Search, 
  Filter, 
  Maximize2, 
  Layers, 
  Activity, 
  Clock, 
  DollarSign, 
  ChevronRight, 
  Bell, 
  ShieldCheck,
  Zap,
  MoreVertical,
  Plus,
  Phone
} from 'lucide-react';
import { OperationalMapCanvas, type OperationalMapVehicle } from '../components/OperationalMapCanvas';
import { LogtaEmptyState } from '../components/EmptyState';

type LiveVehicle = OperationalMapVehicle & {
  battery: number;
  cargo: string;
  temp: string;
};

const MapaAoVivo = () => {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([
    { id: 1, driver: 'Roberto Silva', plate: 'BRA-2L22', x: 25, y: 35, speed: '62 km/h', status: 'Em Rota', battery: 85, cargo: 'Alimentos', temp: '4°C' },
    { id: 2, driver: 'Ana Paula', plate: 'KJU-9011', x: 45, y: 65, speed: '0 km/h', status: 'Parado', battery: 92, cargo: 'Eletrônicos', temp: 'N/A' },
    { id: 3, driver: 'Carlos Lima', plate: 'MNH-4455', x: 75, y: 25, speed: '54 km/h', status: 'Em Rota', battery: 78, cargo: 'Químicos', temp: '18°C' },
    { id: 4, driver: 'Marcos Reis', x: 60, y: 50, speed: '42 km/h', status: 'Em Rota', battery: 88, cargo: 'Geral', plate: 'PKO-0012', temp: 'N/A' },
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState<LiveVehicle | null>(null);
  const [events, setEvents] = useState([
    { id: 1, type: 'success', msg: 'Entrega concluída em Cajamar', time: 'Agora' },
    { id: 2, type: 'warning', msg: 'Congestionamento detectado na BR-116', time: '2m' },
    { id: 3, type: 'info', msg: 'Motorista Roberto Silva iniciou jornada', time: '15m' },
  ]);

  // Simulate real-time movement
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (v.status === 'Em Rota') {
          return {
            ...v,
            x: Math.max(5, Math.min(95, v.x + (Math.random() - 0.5) * 1.5)),
            y: Math.max(5, Math.min(95, v.y + (Math.random() - 0.5) * 1.5)),
            speed: `${Math.floor(Math.random() * 20 + 50)} km/h`
          };
        }
        return v;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-50">
      {/* Top Command Center Bar */}
      <div className="z-10 flex flex-col gap-3 border-b border-gray-200 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 lg:py-4">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-0 text-left">
            <h1 className="logta-page-title">Monitoramento Live</h1>
          </div>

          <div className="mx-4 hidden h-10 w-px bg-gray-100 sm:block" />

          <div className="flex flex-wrap gap-4 sm:gap-8 lg:gap-10">
            <div className="text-left">
              <p className="text-[9px] font-black uppercase tracking-normal text-gray-400">Veículos Ativos</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-black text-gray-900 sm:text-xl">28</p>
                <span className="rounded bg-green-50 px-1.5 text-[10px] font-bold text-green-500">+4</span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black uppercase tracking-normal text-gray-400">Nível de Serviço</p>
              <p className="text-lg font-black text-primary sm:text-xl">98.4%</p>
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black uppercase tracking-normal text-gray-400">Alertas Críticos</p>
              <p className="text-lg font-black text-red-500 sm:text-xl">02</p>
            </div>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="relative min-w-0 flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400 sm:left-4" />
            <input
              type="text"
              placeholder="Placa ou motorista..."
              className="w-full rounded-[20px] border-transparent bg-gray-100 py-3 pl-10 pr-4 text-xs font-bold shadow-inner outline-none transition-all focus:border-primary/20 focus:bg-white sm:w-72 sm:pl-12"
            />
          </div>
          <div className="flex shrink-0 gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              className="rounded-[20px] border border-gray-100 bg-white p-3 text-gray-600 shadow-sm transition-all hover:bg-gray-50"
            >
              <Layers size={20} />
            </button>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-gray-900 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-black/10 transition-all hover:bg-black sm:flex-initial sm:px-6"
            >
              <Maximize2 size={18} /> <span className="whitespace-nowrap">Full Screen</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <OperationalMapCanvas
            className="absolute inset-0"
            vehicles={vehicles}
            showZoomControls
            selectedVehicle={selectedVehicle}
            onSelectedVehicleChange={(v) =>
              setSelectedVehicle(!v ? null : vehicles.find((x) => x.id === v.id) ?? null)
            }
          >
            <div className="pointer-events-none absolute right-10 top-10 z-30 w-80 space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="flex animate-in slide-in-from-right items-start gap-4 rounded-[24px] border border-white bg-white/90 p-4 shadow-xl backdrop-blur-md duration-500 pointer-events-auto">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    ev.type === 'success' ? 'bg-green-50 text-green-500' : 
                    ev.type === 'warning' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                    {ev.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[11px] font-bold leading-snug text-gray-900">{ev.msg}</p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-normal text-gray-400">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </OperationalMapCanvas>
        </div>

        {/* Right Telemetry Panel */}
        <div className={`w-[450px] bg-white border-l border-gray-100 flex flex-col transition-all duration-700 shadow-2xl ${selectedVehicle ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}`}>
          {selectedVehicle ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header with Glassmorphism */}
              <div className="p-10 bg-gray-50/50 border-b border-gray-100">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-[32px] bg-white border-4 border-white shadow-xl overflow-hidden relative group">
                      <img src={`https://i.pravatar.cc/150?u=v${selectedVehicle.id}`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedVehicle.driver}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-gray-900 text-white text-[9px] font-black rounded uppercase tracking-normal">{selectedVehicle.plate}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-normal">Caminhoneiro Master</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedVehicle(null)} className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 hover:text-gray-900 transition-all">
                    <Plus className="rotate-45" size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white rounded-3xl shadow-sm border border-gray-100 text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-1 flex items-center gap-2">
                      <Zap size={14} className="text-primary" fill="currentColor" /> Velocidade
                    </p>
                    <p className="text-2xl font-black text-gray-900">{selectedVehicle.speed}</p>
                  </div>
                  <div className={`p-5 bg-white rounded-3xl shadow-sm border border-gray-100 text-left`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-1">Carga Atual</p>
                    <p className="text-lg font-black text-primary">{selectedVehicle.cargo}</p>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="p-10 space-y-10 overflow-y-auto scrollbar-hide text-left">
                <section>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-[2px] mb-6 flex items-center gap-3">
                    <div className="w-2 h-6 bg-primary rounded-full" /> Jornada & Status
                  </h4>
                  <div className="space-y-4">
                    <div className="p-6 bg-gray-900 text-white rounded-[40px] relative overflow-hidden shadow-2xl">
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-normal mb-1">Próxima Entrega</p>
                            <h5 className="text-lg font-black leading-tight">CD Logística Ambev - Barueri/SP</h5>
                          </div>
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <Truck size={24} className="text-primary" />
                          </div>
                        </div>
                        <div className="flex items-center gap-10">
                          <div>
                            <p className="text-[10px] font-bold text-white/40 uppercase">Previsão (ETA)</p>
                            <p className="text-xl font-black text-primary">16:20</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-white/40 uppercase">Distância</p>
                            <p className="text-xl font-black">12.4 km</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-[2px] mb-6">Telemetria Adicional</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-normal">Temperatura</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedVehicle.temp === 'N/A' ? 'bg-gray-300' : 'bg-blue-500 animate-pulse'}`} />
                        <p className="text-xl font-black text-gray-900">{selectedVehicle.temp}</p>
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-normal">Combustível</p>
                      <p className="text-xl font-black text-gray-900">{selectedVehicle.battery}%</p>
                      <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${selectedVehicle.battery}%` }} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Direct Action Bar */}
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <button className="py-5 bg-white border border-gray-200 text-gray-900 rounded-[24px] font-black text-[11px] uppercase tracking-normal hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-3">
                    <Phone size={18} /> Ligar Agora
                  </button>
                  <button className="py-5 bg-primary text-white rounded-[24px] font-black text-[11px] uppercase tracking-normal hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3">
                    <Navigation size={18} /> Ver Rota
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50/30">
              <LogtaEmptyState 
                type="rastreamento" 
                onAction={() => {}}
                iaSuggestion={{
                  text: "Deseja que eu gere um mapa de calor para identificar gargalos geográficos na sua frota agora?",
                  actionLabel: "Mapa de Calor IA",
                  onAction: () => alert('Gerando mapa de calor...')
                }}
              />
              
              <div className="mt-8 w-full max-w-xs space-y-3">
                <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Frota Monitorada</span>
                  <span className="text-sm font-black text-gray-900">100%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Latência GPS</span>
                  <span className="text-sm font-black text-green-500">~ 200ms</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapaAoVivo;

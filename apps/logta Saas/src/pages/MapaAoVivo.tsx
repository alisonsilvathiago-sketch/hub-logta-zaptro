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

type LiveVehicle = {
  id: number;
  driver: string;
  plate: string;
  x: number;
  y: number;
  speed: string;
  status: string;
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
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Command Center Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="text-left">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Monitoramento Live</h1>
          </div>
          
          <div className="h-10 w-[1px] bg-gray-100 mx-4" />
          
          <div className="flex gap-10">
            <div className="text-left">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal">Veículos Ativos</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-black text-gray-900">28</p>
                <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 rounded">+4</span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal">Nível de Serviço</p>
              <p className="text-xl font-black text-primary">98.4%</p>
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal">Alertas Críticos</p>
              <p className="text-xl font-black text-red-500">02</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar placa ou motorista..." 
              className="pl-12 pr-4 py-3 bg-gray-100 border-transparent rounded-[20px] text-xs font-bold outline-none w-72 focus:bg-white focus:border-primary/20 transition-all shadow-inner" 
            />
          </div>
          <button className="p-3 bg-white border border-gray-100 text-gray-600 rounded-[20px] hover:bg-gray-50 transition-all shadow-sm"><Layers size={20} /></button>
          <button className="px-6 py-3 bg-gray-900 text-white rounded-[20px] font-bold text-xs hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center gap-2">
            <Maximize2 size={18} /> Full Screen
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Map Container */}
        <div className="flex-1 relative bg-[#F8F9FA] overflow-hidden group cursor-crosshair">
          {/* Animated Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          
          {/* Styled Map Graphics */}
          <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none">
            <path d="M-100,200 C300,400 700,100 1200,500 S1800,200 2200,400" stroke="#000" strokeWidth="40" fill="none" />
            <path d="M500,-100 C700,300 400,800 900,1200" stroke="#000" strokeWidth="30" fill="none" />
          </svg>

          {/* Vehicle Markers */}
          {vehicles.map((v) => (
            <div 
              key={v.id}
              className="absolute transition-all duration-[4000ms] ease-linear cursor-pointer z-20"
              style={{ left: `${v.x}%`, top: `${v.y}%`, transform: 'translate(-50%, -50%)' }}
              onClick={() => setSelectedVehicle(v)}
            >
              <div className={`relative transition-all duration-500 ${
                selectedVehicle?.id === v.id ? 'scale-125' : 'hover:scale-110'
              }`}>
                {/* Marker Pulse Background */}
                {selectedVehicle?.id === v.id && (
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-ping scale-150" />
                )}
                
                <div className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center shadow-2xl ${
                  selectedVehicle?.id === v.id 
                    ? 'bg-primary border-primary text-white' 
                    : 'bg-white border-white text-gray-900 group-hover:border-primary/20'
                }`}>
                  <Truck size={24} />
                  
                  {/* Direction Arrow */}
                  {v.status === 'Em Rota' && (
                    <div className="absolute -bottom-2 -right-2 bg-white text-primary p-1 rounded-lg shadow-md border border-gray-100">
                      <Navigation size={12} className="rotate-45" />
                    </div>
                  )}
                </div>
                
                {/* Live Info Tag */}
                {(selectedVehicle?.id === v.id || v.status === 'Parado') && (
                  <div className={`absolute left-1/2 -top-12 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-2xl animate-in zoom-in duration-300`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'Parado' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      {v.plate} • {v.speed}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Active Path Draw */}
          {selectedVehicle && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
              <path 
                d={`M ${selectedVehicle.x}% ${selectedVehicle.y}% L ${selectedVehicle.x + 15}% ${selectedVehicle.y + 10}% L ${selectedVehicle.x + 5}% ${selectedVehicle.y + 25}%`} 
                stroke="var(--color-primary)" 
                strokeWidth="6" 
                strokeLinecap="round"
                strokeDasharray="1,12" 
                fill="none" 
                className="animate-pulse" 
              />
            </svg>
          )}

          {/* Map Controls Floating Overlay */}
          <div className="absolute bottom-10 left-10 flex flex-col gap-3">
            <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-[24px] border border-white p-1.5 flex flex-col gap-1 shadow-gray-900/5">
              <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-900 hover:bg-primary hover:text-white transition-all font-black shadow-sm">+</button>
              <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-900 hover:bg-primary hover:text-white transition-all font-black shadow-sm">-</button>
            </div>
            <button className="w-14 h-14 bg-primary text-white shadow-2xl shadow-primary/30 rounded-2xl flex items-center justify-center hover:scale-105 transition-all mt-4"><Navigation size={24} /></button>
          </div>

          {/* Live Events Feed (Floating) */}
          <div className="absolute top-10 right-10 w-80 space-y-3 z-30 pointer-events-none">
            {events.map((ev) => (
              <div key={ev.id} className="bg-white/90 backdrop-blur-md p-4 rounded-[24px] border border-white shadow-xl pointer-events-auto animate-in slide-in-from-right duration-500 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  ev.type === 'success' ? 'bg-green-50 text-green-500' : 
                  ev.type === 'warning' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                }`}>
                  {ev.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[11px] font-bold text-gray-900 leading-snug">{ev.msg}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-normal">{ev.time}</p>
                </div>
              </div>
            ))}
          </div>
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
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
              <div className="w-24 h-24 bg-white rounded-[48px] flex items-center justify-center text-gray-200 shadow-xl mb-8 relative">
                <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping" />
                <Navigation size={48} className="relative z-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Centro de Controle Ativo</h3>
              <p className="text-sm text-gray-500 max-w-xs font-medium leading-relaxed">Selecione um veículo no mapa para acessar telemetria avançada, câmeras live e status de entrega.</p>
              
              <div className="mt-12 w-full space-y-3">
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

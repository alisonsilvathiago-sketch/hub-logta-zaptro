import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
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
  Maximize2
} from 'lucide-react';

const Roteirizacao = () => {
  const location = useLocation();
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const tabs = [
    { id: 'planejamento', label: 'Planejamento', icon: Layers, path: '/roteirizacao/planejamento' },
    { id: 'otimizacao', label: 'Motor de IA', icon: Zap, path: '/roteirizacao/otimizacao' },
    { id: 'rotas-ativas', label: 'Rotas Ativas', icon: Navigation, path: '/roteirizacao/rotas' },
    { id: 'eficiencia', label: 'Performance', icon: Activity, path: '/roteirizacao/eficiencia' },
  ];

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => setIsOptimizing(false), 2000);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar Control Panel */}
      <div className="w-[420px] bg-white border-r border-gray-100 flex flex-col h-full z-10 shadow-xl">
        <div className="p-8 pb-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Roteirização</h1>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">Planeje e otimize rotas com inteligência artificial para reduzir custos.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="px-8 mb-6">
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-[20px]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname.startsWith(tab.path) || (location.pathname === '/roteirizacao' && tab.id === 'planejamento');
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all
                    ${isActive 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                >
                  <Icon size={18} className={isActive ? 'text-primary' : 'text-gray-400'} />
                  <span className="text-[10px] font-bold mt-1 tracking-normal">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 scrollbar-hide space-y-8 pb-8">
          <Routes>
            <Route index element={<Navigate to="/roteirizacao/planejamento" replace />} />
            <Route path="planejamento" element={<PlanejamentoView onOptimize={handleOptimize} isOptimizing={isOptimizing} />} />
            <Route path="otimizacao" element={<OtimizacaoView />} />
            <Route path="rotas" element={<RotasAtivasView />} />
            <Route path="eficiencia" element={<PerformanceView />} />
          </Routes>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="flex-1 relative bg-gray-100">
        {/* Real-time Map (Placeholder for Mapbox/Google Maps) */}
        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-46.6627,-23.5414,12/1600x1200?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTAwMHozN282YXloZzcyM3IifQ.0E_68nTM90yYvOT5v65_Cw')] bg-cover">
          {/* Map Overlay Elements */}
          <div className="absolute inset-0 bg-black/5" />
          
          {/* Simulated Delivery Pins */}
          <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white cursor-pointer hover:scale-110 transition-all">
            <Package size={14} />
          </div>
          <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white cursor-pointer hover:scale-110 transition-all">
            <Truck size={14} />
          </div>
          <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white cursor-pointer hover:scale-110 transition-all">
            <AlertTriangle size={14} />
          </div>
        </div>

        {/* Map UI Overlays */}
        <div className="absolute top-8 right-8 flex gap-3">
          <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 text-gray-500 hover:text-gray-900 transition-all">
            <Layers size={20} />
          </button>
          <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 text-gray-500 hover:text-gray-900 transition-all">
            <Maximize2 size={20} />
          </button>
        </div>

        {/* Bottom Route Summary Card */}
        <div className="absolute bottom-6 left-8 right-8 bg-white/95 backdrop-blur-xl p-5 rounded-[28px] shadow-2xl border border-white/50 flex items-center justify-between animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex gap-8">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-1">Distância Total</p>
              <h4 className="text-lg font-bold text-gray-900">142.5 km</h4>
            </div>
            <div className="h-10 w-[1px] bg-gray-200 mt-1" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-1">Tempo Est. Viagem</p>
              <h4 className="text-lg font-bold text-gray-900">04h 15m</h4>
            </div>
            <div className="h-10 w-[1px] bg-gray-200 mt-1" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-1">Custo Est. Rota</p>
              <h4 className="text-lg font-bold text-red-500">R$ 382.00</h4>
            </div>
            <div className="h-10 w-[1px] bg-gray-200 mt-1" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-1">Lucro Projetado</p>
              <h4 className="text-lg font-bold text-primary">R$ 1.250.00</h4>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button className="px-6 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md shadow-black/10 flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <Download size={16} /> Exportar
            </button>
            <button className="px-6 py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <Send size={16} /> Enviar p/ Motoristas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View Components ---

const PlanejamentoView = ({ onOptimize, isOptimizing }: { onOptimize: () => void, isOptimizing: boolean }) => (
  <div className="space-y-8">
    <section>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-normal">Entregas Pendentes</h3>
        <span className="text-[10px] font-bold text-gray-400">12 selecionadas</span>
      </div>
      <div className="space-y-3">
        {[
          { id: '#9011', dest: 'Av. Paulista, 1000 - SP', weight: '120kg', priority: 'Alta' },
          { id: '#9012', dest: 'Rua Augusta, 450 - SP', weight: '45kg', priority: 'Normal' },
          { id: '#9013', dest: 'Al. Campinas, 22 - SP', weight: '18kg', priority: 'Baixa' },
        ].map((item, i) => (
          <div key={i} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl hover:border-primary/30 transition-all cursor-pointer group flex items-center gap-4">
            <div className="w-5 h-5 border-2 border-gray-300 rounded-lg group-hover:border-primary transition-all flex items-center justify-center">
               {i === 0 && <div className="w-2 h-2 bg-primary rounded-sm" />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-900">{item.dest}</p>
              <div className="flex gap-3 mt-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-normal">{item.id}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-normal">{item.weight}</span>
              </div>
            </div>
            <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-normal ${
              item.priority === 'Alta' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'
            }`}>
              {item.priority}
            </span>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h3 className="text-xs font-black text-gray-900 uppercase tracking-normal mb-4">Alocação de Recurso</h3>
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Truck size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-900">Veículo Disponível</p>
              <p className="text-[10px] text-gray-500 font-medium">Mercedes Sprinter • 1.500kg</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-900">Motorista</p>
              <p className="text-[10px] text-gray-500 font-medium">Roberto Silva • Disponível</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </div>
      </div>
    </section>

    <button 
      onClick={onOptimize}
      disabled={isOptimizing}
      className={`w-full py-5 bg-primary text-white rounded-[24px] font-black text-sm shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3
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

const OtimizacaoView = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
    <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10">
      <h3 className="text-sm font-black text-primary uppercase tracking-normal mb-2 flex items-center gap-2">
        <Zap size={18} fill="currentColor" /> Configurações do Motor
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
            <h4 className="text-xs font-bold text-gray-900">{config.label}</h4>
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
        <p className="text-[10px] text-gray-500 font-medium">IA detectou 3 clusters de entrega otimizáveis para a região Centro-Oeste.</p>
      </div>
    </div>
  </div>
);

const RotasAtivasView = () => (
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
      {[
        { id: 'RT-2201', driver: 'Carlos Lima', stops: 8, progress: 65, status: 'Em Rota' },
        { id: 'RT-2202', driver: 'Ana Paula', stops: 12, progress: 30, status: 'Em Rota' },
        { id: 'RT-2203', driver: 'Marcos Reis', stops: 5, progress: 100, status: 'Concluído' },
      ].map((route, i) => (
        <div key={i} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase tracking-normal">{route.id}</span>
            <span className={`text-[9px] font-black uppercase tracking-normal ${route.status === 'Concluído' ? 'text-green-500' : 'text-blue-500 animate-pulse'}`}>{route.status}</span>
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">{route.driver}</h4>
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

const PerformanceView = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Km Economizado</p>
        <h4 className="text-xl font-black text-primary">1.242 km</h4>
        <p className="text-[9px] text-green-500 font-bold mt-1">+18.2% vs mês ant.</p>
      </div>
      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Redução Custo</p>
        <h4 className="text-xl font-black text-gray-900">14.5%</h4>
        <p className="text-[9px] text-green-500 font-bold mt-1">Meta: 15%</p>
      </div>
    </div>

    <div className="bg-gray-50 border border-gray-100 p-6 rounded-[32px]">
      <h3 className="text-xs font-black text-gray-900 uppercase tracking-normal mb-6">Eficiência por Veículo</h3>
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
       <div className="relative z-10">
        <h4 className="text-xs font-black uppercase tracking-normal mb-2 flex items-center gap-2"><ArrowUpRight size={16} /> Insights AI</h4>
        <p className="text-[11px] font-medium leading-relaxed opacity-90">Agrupando entregas da Zona Sul com a rota RT-2201 você economizará R$ 124,00 extras em combustível hoje.</p>
       </div>
       <Zap size={80} className="absolute -right-4 -bottom-4 opacity-10" fill="currentColor" />
    </div>
  </div>
);

export default Roteirizacao;

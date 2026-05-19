import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Lock, 
  FileText, 
  Activity, 
  Zap, 
  DollarSign, 
  Truck,
  Plus,
  Search,
  Bell,
  Shield,
  Radio,
  FileCheck,
  LifeBuoy
} from 'lucide-react';
import { LogtaEmptyState } from '../components/EmptyState';
import { LogtaWaveTabStrip } from '../components/LogtaWaveTabStrip';
import { LogtaModuleHeader } from '../components/LogtaModuleHeader';

// --- Sub-View Components ---

const PGRDashboardView = () => {
  const [activeAlerts, setActiveAlerts] = useState([
    { id: 'EV-901', vehicle: 'BRA-2L22', type: 'Desvio de Rota', severity: 'Alta', time: '5m atrás', status: 'Em Análise' },
    { id: 'EV-905', vehicle: 'KJU-9011', type: 'Parada não Autorizada', severity: 'Média', time: '12m atrás', status: 'Resolvendo' },
    { id: 'EV-899', vehicle: 'MNH-4455', type: 'Perda de Sinal GPS', severity: 'Crítica', time: '20m atrás', status: 'Equipe Acionada' },
  ]);

  const stats = [
    { label: 'Viagens em Curso', value: '42', desc: '100% monitoradas', Icon: Truck, color: 'text-gray-900' },
    { label: 'Nível de Risco', value: 'Baixo', desc: `${activeAlerts.length} alertas ativos`, Icon: ShieldCheck, color: activeAlerts.length > 2 ? 'text-orange-500' : 'text-green-500' },
    { label: 'Valor Segurado', value: 'R$ 12.4M', desc: 'Total em trânsito', Icon: DollarSign, color: 'text-primary' },
    { label: 'Eventos Risco', value: '03', desc: 'Últimas 24h', Icon: AlertTriangle, color: 'text-red-500' },
  ];

  const handleResolve = (id: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="logta-stat-card group text-left transition-all hover:border-primary/20">
            <div className="relative z-10">
              <p className="logta-stat-card__label">{stat.label}</p>
              <p className="logta-stat-card__value">{stat.value}</p>
              <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tight">{stat.desc}</p>
            </div>
            <stat.Icon
              size={60}
              className="pointer-events-none absolute bottom-8 right-7 text-gray-900 opacity-[0.02] transition-all group-hover:opacity-[0.05]"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Alerts */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div className="text-left">
              <h3 className="logta-card-heading">Monitoramento de Risco em Tempo Real</h3>
              <p className="text-xs text-gray-400 font-medium">Alertas gerados automaticamente pelo PGR e Sensores GPS</p>
            </div>
            <span className="flex items-center gap-2 text-[10px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-xl uppercase tracking-normal animate-pulse">
              <Radio size={14} /> Live feed
            </span>
          </div>
          
          <div className="space-y-4">
            {activeAlerts.length === 0 ? (
              <div className="py-6">
                <LogtaEmptyState 
                  type="rastreamento" 
                  onAction={() => {}}
                  iaSuggestion={{
                    text: "Deseja ativar o monitoramento preditivo para antecipar desvios de rota?",
                    actionLabel: "Ativar Monitoramento IA",
                    onAction: () => alert('Monitoramento preditivo ativado.')
                  }}
                />
              </div>
            ) : (
              activeAlerts.map((ev, i) => (
                <div key={ev.id} className="p-5 bg-gray-50/50 rounded-3xl border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-lg transition-all flex items-center justify-between animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      ev.severity === 'Crítica' ? 'bg-red-100 text-red-500' : 
                      ev.severity === 'Alta' ? 'bg-orange-100 text-orange-500' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      <AlertTriangle size={24} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-gray-900">{ev.type} • {ev.vehicle}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{ev.id} • {ev.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className={`text-[10px] font-black uppercase tracking-normal block mb-1 ${
                        ev.severity === 'Crítica' ? 'text-red-500' : 'text-orange-500'
                      }`}>{ev.status}</span>
                      <Link to="/mapa-ao-vivo" className="text-[9px] font-black text-primary hover:underline uppercase tracking-normal flex items-center gap-1 justify-end">
                        <MapPin size={10} /> Ver no Mapa
                      </Link>
                    </div>
                    <button 
                      onClick={() => handleResolve(ev.id)}
                      className="p-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all group"
                      title="Resolver Ocorrência"
                    >
                      <Zap size={16} className="group-hover:text-primary transition-colors" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Insurance Overview */}
        <div className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
          <div className="relative z-10 text-left">
            <h3 className="text-xl font-bold mb-8 text-white/90">Apólices Ativas</h3>
            <div className="space-y-6">
              <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-normal">RCTR-C</span>
                  <FileCheck size={20} className="text-primary" />
                </div>
                <p className="text-xs font-bold text-white/60 mb-1">Vigência até Jan/2027</p>
                <p className="text-lg font-black tracking-tight">R$ 5.000.000,00</p>
              </div>
              <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-normal">RCF-DC</span>
                  <FileCheck size={20} className="text-primary" />
                </div>
                <p className="text-xs font-bold text-white/60 mb-1">Vigência até Mar/2027</p>
                <p className="text-lg font-black tracking-tight">R$ 2.500.000,00</p>
              </div>
            </div>
          </div>
          <button className="mt-8 py-4 bg-primary text-gray-900 rounded-[20px] font-black text-[11px] uppercase tracking-normal hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <Plus size={18} /> Renovar Apólices
          </button>
          <Shield size={200} className="absolute -right-20 -bottom-20 text-white opacity-[0.02] pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

const PGRRulesView = () => {
  const [sendingMacro, setSendingMacro] = useState<string | null>(null);

  const handleSendMacro = (macro: string) => {
    setSendingMacro(macro);
    setTimeout(() => setSendingMacro(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="logta-panel-card p-8">
          <h3 className="logta-card-heading mb-8 text-left">Regras Gerais do PGR</h3>
          <div className="space-y-4">
            {[
              { label: 'Limite de Parada', value: '20 min', desc: 'Máximo em postos não autorizados' },
              { label: 'Horário de Trânsito', value: '05:00 - 22:00', desc: 'Proibido rodar na madrugada' },
              { label: 'Áreas de Risco', value: 'Bloqueio Ativo', desc: 'Corte de combustível automático' },
              { label: 'Comunicação', value: 'A cada 15 min', desc: 'Envio de macro obrigatório' },
            ].map((rule, i) => (
              <div key={i} className="p-5 bg-gray-50 rounded-3xl flex justify-between items-center">
                <div className="text-left">
                  <p className="text-xs font-black text-gray-900">{rule.label}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{rule.desc}</p>
                </div>
                <span className="px-4 py-2 bg-white rounded-xl text-xs font-black text-primary border border-gray-100 shadow-sm">{rule.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="logta-panel-card--dark p-8 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 text-left">
            <h3 className="logta-card-heading mb-4">Configuração de Macros</h3>
            <p className="text-gray-400 text-xs font-medium mb-8 leading-relaxed">Automatize a comunicação com o motorista e o rastreador central.</p>
            
            <div className="grid grid-cols-2 gap-3">
              {['Início de Viagem', 'Parada em Posto', 'Chegada Destino', 'Emergência/SOS', 'Refeição', 'Descanso'].map((macro, i) => (
                <div 
                  key={i} 
                  onClick={() => handleSendMacro(macro)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                    sendingMacro === macro 
                      ? 'bg-primary border-primary text-gray-900' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-[10px] font-black uppercase tracking-normal ${sendingMacro === macro ? 'text-gray-900' : 'text-primary'}`}>M{i+1}</p>
                    {sendingMacro === macro && <Activity size={14} className="animate-pulse" />}
                  </div>
                  <p className="text-xs font-bold">{sendingMacro === macro ? 'Enviando...' : macro}</p>
                </div>
              ))}
            </div>
          </div>
          <Radio size={120} className="absolute -right-10 -bottom-10 text-white opacity-5" />
        </div>
      </div>
    </div>
  );
};

const SegurosView = () => {
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);

  const policies = [
    { id: 'POL-2024-88', branch: 'RCTR-C', insurer: 'Porto Seguro S.A.', expire: '15/01/2027', lmg: 'R$ 5.000.000', status: 'Ativo', desc: 'Responsabilidade Civil Obrigatória do Transportador Rodoviário de Carga' },
    { id: 'POL-2024-92', branch: 'RCF-DC', insurer: 'Tokio Marine S.A.', expire: '22/03/2027', lmg: 'R$ 2.500.000', status: 'Ativo', desc: 'Responsabilidade Civil Facultativa por Desaparecimento de Carga (Roubo/Furto)' },
    { id: 'POL-2023-45', branch: 'Vida Motorista', insurer: 'Azul Seguros', expire: '10/12/2025', lmg: 'R$ 100.000', status: 'Renovando', desc: 'Seguro de Vida em Grupo e Acidentes Pessoais para Motoristas de Pesados' },
  ];

  return (
    <div className="space-y-8 text-left relative">
      <div className="logta-panel-card p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="logta-card-heading">Controle de Apólices e Endossos</h3>
          <button className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-normal flex items-center gap-2 hover:bg-black transition-all">
            <FileText size={18} /> Novo Endosso
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">Apólice / Ramo</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">Seguradora</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">Vigência</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">LMG (Limite Máximo)</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {policies.map((p, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedPolicy(p)}
                  className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <td className="py-6">
                    <p className="logta-table-emphasis group-hover:text-primary transition-colors">{p.id}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-normal mt-1">{p.branch}</p>
                  </td>
                  <td className="py-6">
                    <p className="text-xs font-bold text-gray-600">{p.insurer}</p>
                  </td>
                  <td className="py-6">
                    <p className="text-xs font-bold text-gray-600">{p.expire}</p>
                  </td>
                  <td className="py-6">
                    <p className="logta-table-emphasis">{p.lmg}</p>
                  </td>
                  <td className="py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-normal ${
                      p.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
              {policies.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12">
                    <LogtaEmptyState 
                      type="documentos" 
                      onAction={() => {}}
                      iaSuggestion={{
                        text: "Deseja que eu valide automaticamente suas apólices via OCR para garantir vigência?",
                        actionLabel: "Ativar Validador OCR",
                        onAction: () => alert('OCR de apólices ativado.')
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charcoal Detail Popup Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#18191B] rounded-[40px] border border-neutral-800 shadow-2xl p-8 max-w-xl w-full text-left animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-neutral-800">
              <div>
                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-normal block w-fit mb-2">
                  {selectedPolicy.branch} • Apólice Ativa
                </span>
                <h3 className="logta-modal-title leading-none tracking-tight">
                  {selectedPolicy.id}
                </h3>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-normal mt-1.5">
                  Detalhes Técnicos da Cobertura
                </p>
              </div>
              <button 
                onClick={() => setSelectedPolicy(null)}
                className="w-10 h-10 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-6">
              <div className="p-5 bg-neutral-900 rounded-3xl border border-neutral-800">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-normal mb-1">Ramo do Seguro</p>
                <p className="text-xs font-bold text-white leading-relaxed">{selectedPolicy.desc}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Seguradora</p>
                  <p className="text-xs font-bold text-white">{selectedPolicy.insurer}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Vigência Limite</p>
                  <p className="text-xs font-bold text-white">{selectedPolicy.expire}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">LMG (Limite Máximo)</p>
                  <p className="text-xs font-black text-primary">{selectedPolicy.lmg},00</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-normal mb-0.5">Sub-limite por Evento</p>
                  <p className="text-xs font-bold text-white">R$ 1.500.000,00</p>
                </div>
              </div>

              <div className="p-5 bg-neutral-900 rounded-3xl border border-neutral-800 space-y-3">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-normal">Coberturas Ativas</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-neutral-300">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Colisão e Capotamento
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Incêndio e Explosão
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Avarias de Carga
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Limpeza de Pista
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setSelectedPolicy(null)}
                className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-normal transition-all cursor-pointer hover:bg-neutral-800"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PGR = () => {
  const location = useLocation();
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const tabs = [
    { id: 'dashboard', label: 'Monitor', shortLabel: 'Monitor', icon: Activity, path: '/pgr/dashboard' },
    { id: 'regras', label: 'PGR', shortLabel: 'PGR', icon: Lock, path: '/pgr/regras' },
    { id: 'seguros', label: 'Apólices', shortLabel: 'Apólices', icon: ShieldCheck, path: '/pgr/seguros' },
    { id: 'sinistros', label: 'Sinistros', shortLabel: 'Sinist.', icon: LifeBuoy, path: '/pgr/sinistros' },
  ];

  return (
    <div className="logta-page h-full w-full max-w-full space-y-6 overflow-x-hidden animate-in fade-in duration-700 sm:space-y-8">
      <LogtaModuleHeader
        title="PGR & Seguros"
        titleClassName="logta-page-title italic"
        tabs={<LogtaWaveTabStrip tabs={tabs} basePath="/pgr" defaultTabId="dashboard" />}
        tabQuickAddLabel={isMonitoring ? 'Monitoramento ativo' : 'Ativar monitoramento'}
        tabQuickAddActive={isMonitoring}
        onTabQuickAdd={() => setIsMonitoring(!isMonitoring)}
      />

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Routes>
          <Route index element={<Navigate to="/pgr/dashboard" replace />} />
          <Route path="dashboard" element={<PGRDashboardView />} />
          <Route path="regras" element={<PGRRulesView />} />
          <Route path="seguros" element={<SegurosView />} />
          <Route path="sinistros" element={<div className="px-8 py-10 w-full h-full text-left font-black text-gray-400">Gestão de Sinistros em Desenvolvimento...</div>} />
        </Routes>
      </div>
    </div>
  );
};

export default PGR;

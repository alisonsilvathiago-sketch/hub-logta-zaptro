import React from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  DollarSign, 
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  FileText,
  Plus
} from 'lucide-react';

const StatCard = ({ title, value, trend, icon: Icon, subtitle, iconBg = "bg-gray-100", iconColor = "text-gray-900" }: any) => (
  <div className="bg-white border border-gray-100 p-6 rounded-[32px] relative overflow-hidden group hover:border-gray-300 transition-all shadow-sm hover:shadow-md text-left">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${iconBg} shadow-sm flex items-center justify-center`}>
        <Icon className={iconColor} size={24} />
      </div>
      {trend && (
        <span className={`text-xs font-bold flex items-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    {subtitle && <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-normal">{subtitle}</p>}
    
    <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.06] transition-opacity text-gray-900">
      <Icon size={120} />
    </div>
  </div>
);

const Dashboard = () => {
  const [selectedTrip, setSelectedTrip] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState({
    client: 'Transportes Transville',
    origin: 'São Paulo, SP',
    dest: 'Curitiba, PR',
    driver: 'Roberto Silva',
    plate: 'BRA-2L22',
    value: 'R$ 4.500,00',
    type: 'Expresso'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Nova operação registrada com sucesso!', 'Operação Criada');
    }
    setTimeout(() => {
      setSuccess(false);
      setIsModalOpen(false);
    }, 2000);
  };

  return (
    <div className="px-16 py-10 w-full h-full space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Centro de Comando</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-normal mt-1">Logta Matriz • Terça-feira, 05 de Maio</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 group cursor-pointer">
            <FileText size={16} className="group-hover:text-primary transition-colors" /> Exportar Relatório
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Nova Operação
          </button>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Receita Estimada" 
          value="R$ 1.242.500,00" 
          trend={12.5} 
          icon={DollarSign} 
          subtitle="Projeção para o mês"
          iconBg="bg-neutral-950"
          iconColor="text-white"
        />
        <StatCard 
          title="Viagens em Curso" 
          value="156" 
          trend={8.2} 
          icon={Package} 
          subtitle="Cargas em trânsito agora"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard 
          title="Ocupação de Frota" 
          value="88.4%" 
          trend={-1.1} 
          icon={TrendingUp} 
          subtitle="Capacidade utilizada"
          iconBg="bg-neutral-950"
          iconColor="text-blue-400"
        />
        <StatCard 
          title="Riscos Detectados" 
          value="02" 
          icon={AlertCircle} 
          subtitle="Ação imediata necessária"
          iconBg="bg-white border border-gray-200/50"
          iconColor="text-neutral-950"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Real-time Logistics Monitor */}
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Monitoramento em Tempo Real</h2>
                <p className="text-sm text-gray-500 font-medium">Acompanhamento de rotas críticas e prazos</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 mr-2">Filtro:</span>
                <select className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none text-gray-700">
                  <option>Todas as Filiais</option>
                  <option>Matriz SP</option>
                  <option>Filial PR</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'TR-901', route: 'São Paulo → Curitiba', driver: 'Roberto Silva', plate: 'BRA-2L22', prog: 85, status: 'No Prazo', time: 'ETA 2h', value: 'R$ 4.500,00', cargo: 'Eletrônicos e Autopeças', speed: '82 km/h' },
                { id: 'TR-902', route: 'Campinas → Rio de Janeiro', driver: 'Carlos Lima', plate: 'KJU-9011', prog: 42, status: 'Atenção', time: 'Atraso 40m', warning: true, value: 'R$ 6.200,00', cargo: 'Alimentos Perecíveis', speed: '65 km/h', warningMsg: 'Desvio de rota PGR detectado na Rodovia Presidente Dutra (Km 142). Central de segurança já enviou macro de alerta ao motorista.' },
                { id: 'TR-903', route: 'Belo Horizonte → Vitória', driver: 'Ana Paula', plate: 'MNH-4455', prog: 68, status: 'No Prazo', time: 'ETA 5h', value: 'R$ 7.100,00', cargo: 'Cosméticos', speed: '78 km/h' },
                { id: 'TR-904', route: 'Goiânia → Brasília', driver: 'Marcos Reis', plate: 'BRA-2L22', prog: 92, status: 'Finalizando', time: 'ETA 15m', value: 'R$ 3.800,00', cargo: 'Medicamentos', speed: '54 km/h' },
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedTrip(item)}
                  className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-[32px] bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 transition-all group border border-transparent hover:border-gray-100 cursor-pointer text-left select-none"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${item.warning ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white' : 'bg-white text-gray-400 group-hover:bg-primary group-hover:text-white shadow-sm'}`}>
                    <MapPin size={24} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{item.route}</h4>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                          Motorista: {item.driver}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">{item.time}</span>
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-normal ${item.warning ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-normal">
                        <span>Progresso da Viagem</span>
                        <span>{item.prog}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${item.warning ? 'bg-red-500' : 'bg-primary'}`} 
                          style={{ width: `${item.prog}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 py-4 text-sm font-bold text-primary hover:bg-primary/5 rounded-2xl transition-all border border-dashed border-gray-200 hover:border-primary/30">
              Visualizar Mapa de Calor Completo
            </button>
          </div>

          {/* Operational Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Status da Frota</h3>
              <div className="space-y-6">
                {[
                  { label: 'Veículos Disponíveis', count: 42, color: 'bg-green-500' },
                  { label: 'Em Manutenção', count: 8, color: 'bg-red-500' },
                  { label: 'Aguardando Carga', count: 15, color: 'bg-yellow-500' },
                ].map((st, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                      <span className="text-sm font-medium text-gray-600">{st.label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{st.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Faturamento Diário</h3>
              <div className="flex items-end gap-2 h-24">
                {[40, 65, 45, 90, 55, 75, 60].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/10 hover:bg-primary transition-all rounded-t-lg group relative h-full">
                    <div className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-500" style={{ height: `${h}%` }} />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      R$ {h * 120}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-normal">
                <span>SEG</span>
                <span>TER</span>
                <span>QUA</span>
                <span>QUI</span>
                <span>SEX</span>
                <span>SAB</span>
                <span>DOM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Activity & Alerts */}
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-8 text-gray-900 flex items-center justify-between">
              Timeline 
              <span className="text-[10px] bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-normal">Live</span>
            </h2>
            <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
              {[
                { label: 'Entrega Concluída', info: 'Pedido #4589 • SP', time: '10 min atrás', color: 'bg-green-500' },
                { label: 'Nova Carga Criada', info: 'Rota: RJ → MG', time: '45 min atrás', color: 'bg-primary' },
                { label: 'Manutenção Veicular', info: 'Placa: ABC-1234', time: '2 horas atrás', color: 'bg-red-500' },
                { label: 'Documento Emitido', info: 'CTe: 004592', time: '3 horas atrás', color: 'bg-blue-600' },
                { label: 'Motorista Online', info: 'Ricardo Santos', time: '4 horas atrás', color: 'bg-yellow-500' },
              ].map((item, i) => (
                <div key={i} className="relative pl-10 group cursor-pointer">
                  <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full ${item.color} border-4 border-white z-10 shadow-sm group-hover:scale-125 transition-transform`} />
                  <div className="group-hover:translate-x-1 transition-transform">
                    <p className="text-sm font-bold text-gray-900 mb-0.5">{item.label}</p>
                    <p className="text-xs text-gray-500 mb-1">{item.info}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-normal">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-10 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm text-gray-700 hover:bg-gray-100 transition-all shadow-sm">
              Ver Histórico Operacional
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#111] to-[#222] rounded-[40px] p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
              <Sparkles size={100} className="text-[#D7FF00]" />
            </div>
            <div className="relative z-10">
              <h3 className="text-[#D7FF00] font-black text-xs uppercase tracking-[3px] mb-4">Logta Insights AI</h3>
              <p className="text-white text-lg font-bold leading-tight mb-6">
                "Detectamos um padrão de economia de 12% se você consolidar as cargas da Filial PR."
              </p>
              <button className="w-full py-3 bg-[#D7FF00] text-black font-black text-xs uppercase tracking-normal rounded-xl hover:bg-white transition-all">
                Analisar Oportunidade
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Operation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#18191B] rounded-[40px] max-w-lg w-full p-8 shadow-2xl border border-neutral-800 animate-in slide-in-from-bottom-8 duration-300 text-white">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="text-primary" size={24} /> Criar Nova Operação de Frete
            </h3>
            
            {success ? (
              <div className="py-12 text-center space-y-4 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-950/40 text-green-400 rounded-full flex items-center justify-center mx-auto border border-neutral-800 shadow-sm">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="text-lg font-bold text-white">Operação Criada com Sucesso!</h4>
                <p className="text-xs text-neutral-400">O frete foi registrado e as notificações automáticas foram enviadas.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Cliente Solicitante</label>
                  <select 
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                  >
                    <option className="bg-neutral-900">Transportes Transville</option>
                    <option className="bg-neutral-900">Indústria Metalúrgica SA</option>
                    <option className="bg-neutral-900">Varejo Global LTDA</option>
                    <option className="bg-neutral-900">AgroBrasil Log</option>
                    <option className="bg-neutral-900">Cimento Forte</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Origem (Cidade/UF)</label>
                    <input 
                      type="text" 
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Destino (Cidade/UF)</label>
                    <input 
                      type="text" 
                      value={formData.dest}
                      onChange={(e) => setFormData({ ...formData, dest: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Motorista</label>
                    <input 
                      type="text" 
                      value={formData.driver}
                      onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Placa do Veículo</label>
                    <input 
                      type="text" 
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Valor do Frete</label>
                    <input 
                      type="text" 
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Tipo de Serviço</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                    >
                      <option className="bg-neutral-900">Expresso</option>
                      <option className="bg-neutral-900">Normal</option>
                      <option className="bg-neutral-900">Dedicado</option>
                      <option className="bg-neutral-900">Pesado</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl font-bold text-sm transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-primary/20 cursor-pointer"
                  >
                    Confirmar Registro
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Charcoal Detail Popup Modal for Selected Trip */}
      {selectedTrip && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#18191B] rounded-[40px] border border-neutral-800 shadow-2xl p-8 max-w-xl w-full text-left animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-neutral-800">
              <div>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider block w-fit mb-2 ${selectedTrip.warning ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                  {selectedTrip.id} • {selectedTrip.status}
                </span>
                <h3 className="text-2xl font-black text-white leading-none tracking-tight">
                  {selectedTrip.route}
                </h3>
                <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1.5">
                  Telemetria e Detalhes da Carga em Trânsito
                </p>
              </div>
              <button 
                onClick={() => setSelectedTrip(null)}
                className="w-10 h-10 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-6">
              {selectedTrip.warningMsg && (
                <div className="p-4 bg-red-950/40 border border-red-800 rounded-3xl flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 animate-ping shrink-0" />
                  <p className="text-xs font-bold text-red-200 leading-relaxed">
                    {selectedTrip.warningMsg}
                  </p>
                </div>
              )}

              <div className="p-5 bg-neutral-900 rounded-3xl border border-neutral-800 space-y-2">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Status do Progresso ({selectedTrip.prog}%)</p>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${selectedTrip.warning ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${selectedTrip.prog}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-0.5">Motorista</p>
                  <p className="text-xs font-bold text-white">{selectedTrip.driver}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-0.5">Veículo / Placa</p>
                  <p className="text-xs font-bold text-white">{selectedTrip.plate}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-0.5">Mercadoria / Tipo</p>
                  <p className="text-xs font-bold text-white">{selectedTrip.cargo}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-0.5">Velocidade Atual</p>
                  <p className="text-xs font-bold text-white">{selectedTrip.speed}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-0.5">Valor de Carga</p>
                  <p className="text-xs font-black text-primary">{selectedTrip.value}</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-0.5">Tempo Estimado</p>
                  <p className="text-xs font-bold text-white">{selectedTrip.time}</p>
                </div>
              </div>

              <div className="p-5 bg-neutral-900 rounded-3xl border border-neutral-800 space-y-1">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2">Últimos Eventos PGR</p>
                <div className="space-y-2 text-[11px] text-neutral-300">
                  <div className="flex justify-between">
                    <span className="font-semibold">Sinal GPS Recebido</span>
                    <span className="text-neutral-500 font-bold">Há 2m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Temperatura do Baú: 12ºC</span>
                    <span className="text-neutral-500 font-bold">Há 5m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Velocidade em conformidade</span>
                    <span className="text-neutral-500 font-bold">Ok</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setSelectedTrip(null)}
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

export default Dashboard;

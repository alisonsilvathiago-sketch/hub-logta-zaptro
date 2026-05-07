import React from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone,
  Building2,
  KanbanSquare,
  Truck,
  DollarSign,
  BarChart3,
  FileText,
  MessageSquare,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Activity,
  ChevronRight,
  Star,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Download,
  ExternalLink
} from 'lucide-react';

const CRM = () => {
  const location = useLocation();
  const isDetailPage = /^\/crm\/clientes\/.+/.test(location.pathname);

  const tabs = [
    { id: 'clientes', label: 'Gestão de Clientes', icon: Users, path: '/crm/clientes' },
    { id: 'vendas', label: 'Funil de Vendas', icon: KanbanSquare, path: '/crm/vendas' },
    { id: 'operacoes', label: 'Operações', icon: Truck, path: '/crm/operacoes' },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, path: '/crm/financeiro' },
    { id: 'inteligencia', label: 'Inteligência', icon: BarChart3, path: '/crm/inteligencia' },
  ];

  if (isDetailPage) {
    return (
      <div className="px-16 py-10 w-full h-full animate-in fade-in duration-500 text-left overflow-y-auto scrollbar-hide">
        <Routes>
          <Route path="clientes/:id" element={<ClientePerfilView />} />
        </Routes>
      </div>
    );
  }

  const [cards, setCards] = React.useState([
    { id: '1', title: 'Logística Express', value: 'R$ 45k', tag: 'E-commerce', time: '2h ago', col: 'leads' },
    { id: '2', title: 'Frigo Master', value: 'R$ 120k', tag: 'Alimentício', time: '5h ago', col: 'contato' },
    { id: '3', title: 'Mineração Vale', value: 'R$ 800k', tag: 'Pesados', time: '1d ago', col: 'proposta' },
    { id: '4', title: 'Tecno Sul', value: 'R$ 15k', tag: 'Tech', time: '10m ago', col: 'fechado' },
  ]);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = React.useState(false);
  const [newLeadForm, setNewLeadForm] = React.useState({
    title: '',
    value: '',
    tag: 'E-commerce',
    col: 'leads'
  });

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead = {
      id: String(Date.now()),
      title: newLeadForm.title,
      value: newLeadForm.value.startsWith('R$') ? newLeadForm.value : `R$ ${newLeadForm.value}`,
      tag: newLeadForm.tag,
      time: 'Agora mesmo',
      col: newLeadForm.col
    };
    setCards([newLead, ...cards]);
    if ((window as any).showToast) {
      (window as any).showToast('success', `Lead ${newLead.title} cadastrado com sucesso!`, 'Lead Adicionado');
    }
    setIsAddLeadModalOpen(false);
    setNewLeadForm({ title: '', value: '', tag: 'E-commerce', col: 'leads' });
  };

  // Operations Kanban State
  const [opCards, setOpCards] = React.useState([
    { id: '4591', client: 'Transportes ABC', weight: '1.250kg', origin: 'São Paulo', destination: 'Rio de Janeiro', driver: 'Jorge Luiz', plate: 'BRA-4L22', col: 'coleta', progress: 0, eta: 'Aguardando' },
    { id: '8891', client: 'Logística Express SP', weight: '3.500kg', origin: 'São Paulo', destination: 'Curitiba', driver: 'João M.', plate: 'KJU-9011', col: 'rota', progress: 60, eta: '4h' },
    { id: '4592', client: 'Frigo Master', weight: '850kg', origin: 'Santos', destination: 'Campinas', driver: 'Ana Paula', plate: 'MNH-4455', col: 'separacao', progress: 20, eta: '2h' },
  ]);
  const [selectedOpCard, setSelectedOpCard] = React.useState<any>(null);
  const [isAddOpModalOpen, setIsAddOpModalOpen] = React.useState(false);
  const [newOpForm, setNewOpForm] = React.useState({
    client: '',
    weight: '',
    origin: '',
    destination: '',
    driver: '',
    plate: '',
    col: 'coleta'
  });

  const handleAddOp = (e: React.FormEvent) => {
    e.preventDefault();
    const newOp = {
      id: String(Math.floor(1000 + Math.random() * 9000)),
      client: newOpForm.client,
      weight: newOpForm.weight,
      origin: newOpForm.origin,
      destination: newOpForm.destination,
      driver: newOpForm.driver,
      plate: newOpForm.plate,
      col: newOpForm.col,
      progress: newOpForm.col === 'rota' ? 10 : 0,
      eta: newOpForm.col === 'rota' ? '6h' : 'Aguardando'
    };
    setOpCards([newOp, ...opCards]);
    if ((window as any).showToast) {
      (window as any).showToast('success', `Operação #${newOp.id} cadastrada com sucesso!`, 'Operação Adicionada');
    }
    setIsAddOpModalOpen(false);
    setNewOpForm({ client: '', weight: '', origin: '', destination: '', driver: '', plate: '', col: 'coleta' });
  };

  return (
    <div className="px-16 py-10 space-y-8 animate-in fade-in duration-700 w-full h-full text-left overflow-y-auto scrollbar-hide">
      {/* Header Section */}
      <div className="flex justify-between items-end h-[87px]">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight h-[46px] mt-[74px]">CRM Estratégico</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">Gestão 360º: Clientes, Vendas e Operação.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3.5 bg-white text-gray-700 rounded-xl text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 group cursor-pointer">
            <FileText size={16} className="group-hover:text-primary transition-colors" /> Exportar Relatório
          </button>
          <button 
            onClick={() => {
              if (location.pathname.endsWith('/vendas')) {
                setIsAddLeadModalOpen(true);
              } else if (location.pathname.endsWith('/operacoes')) {
                setIsAddOpModalOpen(true);
              } else {
                setIsAddLeadModalOpen(true);
              }
            }}
            className="px-6 py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Novo Registro
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Native URLs using Links) */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-[24px] w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path) || (location.pathname === '/crm' && tab.id === 'clientes');
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all
                ${isActive 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
            >
              <Icon size={18} className={isActive ? 'text-primary' : 'text-gray-400'} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Dynamic Content via Router */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Routes>
          <Route index element={<Navigate to="/crm/clientes" replace />} />
          <Route path="clientes" element={<ClientesView />} />
          <Route path="clientes/:id" element={<ClientePerfilView />} />
          <Route path="vendas" element={<VendasKanban cards={cards} setCards={setCards} setIsAddLeadModalOpen={setIsAddLeadModalOpen} setNewLeadForm={setNewLeadForm} />} />
          <Route path="operacoes" element={<OperacoesKanban opCards={opCards} setOpCards={setOpCards} setSelectedOpCard={setSelectedOpCard} setIsAddOpModalOpen={setIsAddOpModalOpen} setNewOpForm={setNewOpForm} />} />
          <Route path="financeiro" element={<FinanceiroView />} />
          <Route path="inteligencia" element={<InteligenciaView />} />
        </Routes>
      </div>

      {/* Popup modal for adding a new lead */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#18191B] rounded-[40px] max-w-lg w-full p-8 shadow-2xl border border-neutral-800 animate-in slide-in-from-bottom-8 duration-300 text-white">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <KanbanSquare className="text-primary" size={24} /> Adicionar Novo Lead
            </h3>
            
            <form onSubmit={handleAddLead} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Razão Social / Nome da Empresa</label>
                <input 
                  type="text" 
                  value={newLeadForm.title}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, title: e.target.value })}
                  placeholder="Ex: Logística Express"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Valor Estimado</label>
                  <input 
                    type="text" 
                    value={newLeadForm.value}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, value: e.target.value })}
                    placeholder="Ex: 45k"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Segmento / Tag</label>
                  <select 
                    value={newLeadForm.tag}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, tag: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                  >
                    <option className="bg-neutral-900">E-commerce</option>
                    <option className="bg-neutral-900">Alimentício</option>
                    <option className="bg-neutral-900">Pesados</option>
                    <option className="bg-neutral-900">Tech</option>
                    <option className="bg-neutral-900">Agronegócio</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Etapa do Funil</label>
                <select 
                  value={newLeadForm.col}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, col: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                >
                  <option className="bg-neutral-900" value="leads">Leads (Novos)</option>
                  <option className="bg-neutral-900" value="contato">Em Contato</option>
                  <option className="bg-neutral-900" value="proposta">Proposta Enviada</option>
                  <option className="bg-neutral-900" value="fechado">Ativo (Fechado)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-md shadow-primary/20 cursor-pointer"
                >
                  Adicionar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup modal for adding a new operation */}
      {isAddOpModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#18191B] rounded-[40px] max-w-lg w-full p-8 shadow-2xl border border-neutral-800 animate-in slide-in-from-bottom-8 duration-300 text-white">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Truck className="text-primary" size={24} /> Adicionar Nova Operação
            </h3>
            
            <form onSubmit={handleAddOp} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Cliente</label>
                <input 
                  type="text" 
                  value={newOpForm.client}
                  onChange={(e) => setNewOpForm({ ...newOpForm, client: e.target.value })}
                  placeholder="Ex: Transportes ABC"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Origem</label>
                  <input 
                    type="text" 
                    value={newOpForm.origin}
                    onChange={(e) => setNewOpForm({ ...newOpForm, origin: e.target.value })}
                    placeholder="Ex: São Paulo"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Destino</label>
                  <input 
                    type="text" 
                    value={newOpForm.destination}
                    onChange={(e) => setNewOpForm({ ...newOpForm, destination: e.target.value })}
                    placeholder="Ex: Rio de Janeiro"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Motorista</label>
                  <input 
                    type="text" 
                    value={newOpForm.driver}
                    onChange={(e) => setNewOpForm({ ...newOpForm, driver: e.target.value })}
                    placeholder="Ex: Jorge Luiz"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Placa do Veículo</label>
                  <input 
                    type="text" 
                    value={newOpForm.plate}
                    onChange={(e) => setNewOpForm({ ...newOpForm, plate: e.target.value })}
                    placeholder="Ex: BRA-4L22"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Peso da Carga</label>
                  <input 
                    type="text" 
                    value={newOpForm.weight}
                    onChange={(e) => setNewOpForm({ ...newOpForm, weight: e.target.value })}
                    placeholder="Ex: 1.250kg"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Etapa</label>
                  <select 
                    value={newOpForm.col}
                    onChange={(e) => setNewOpForm({ ...newOpForm, col: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                  >
                    <option className="bg-neutral-900" value="coleta">Aguardando Coleta</option>
                    <option className="bg-neutral-900" value="separacao">Em Separação</option>
                    <option className="bg-neutral-900" value="rota">Em Rota</option>
                    <option className="bg-neutral-900" value="problema">Problemas / Dev</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpModalOpen(false)}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-md shadow-primary/20 cursor-pointer"
                >
                  Adicionar Operação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operation Details Modal */}
      {selectedOpCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#18191B] rounded-[40px] max-w-lg w-full p-8 shadow-2xl border border-neutral-800 animate-in slide-in-from-bottom-8 duration-300 text-white">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Truck className="text-primary" size={24} /> Detalhes da Operação #{selectedOpCard.id}
            </h3>

            <div className="space-y-4 text-left text-sm">
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-neutral-800">
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase">Cliente</p>
                  <p className="font-bold text-white">{selectedOpCard.client}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase">Status</p>
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase bg-primary/10 text-primary">
                    {selectedOpCard.col}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-b border-neutral-800">
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase">Origem</p>
                  <p className="font-bold text-white">{selectedOpCard.origin || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase">Destino</p>
                  <p className="font-bold text-white">{selectedOpCard.destination || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-b border-neutral-800">
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase">Motorista</p>
                  <p className="font-bold text-white">{selectedOpCard.driver || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase">Veículo / Placa</p>
                  <p className="font-bold text-white">{selectedOpCard.plate || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-b border-neutral-800">
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase">Peso da Carga</p>
                  <p className="font-bold text-white">{selectedOpCard.weight || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase">ETA / Previsão</p>
                  <p className="font-bold text-white">{selectedOpCard.eta || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button 
                onClick={() => setSelectedOpCard(null)}
                className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-xs hover:bg-neutral-800 transition-all cursor-pointer shadow-md"
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

// --- View Components ---

const ClientesView = () => {
  const navigate = useNavigate();

  const clients = [
    { id: 'transville', name: 'Transportes Transville', segment: 'Logística Regional', type: 'Contrato Fixo', status: 'Ativo', volume: 'R$ 145.000,00', alert: false },
    { id: 'metalurgica', name: 'Indústria Metalúrgica SA', segment: 'Pesados', type: 'Avulso (Spot)', status: 'Bloqueado', volume: 'R$ 12.000,00', alert: true },
    { id: 'global', name: 'Varejo Global LTDA', segment: 'E-commerce', type: 'Recorrente', status: 'Ativo', volume: 'R$ 282.300,00', alert: false },
    { id: 'agrobrasil', name: 'AgroBrasil Log', segment: 'Agronegócio', type: 'Sazonal', status: 'Inativo', volume: 'R$ 42.000,00', alert: false },
    { id: 'cimento', name: 'Cimento Forte', segment: 'Construção', type: 'Contrato Fixo', status: 'Ativo', volume: 'R$ 98.000,00', alert: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, CNPJ, contrato ou cidade..." 
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 outline-none focus:border-primary/50 transition-all shadow-sm"
          />
        </div>
        <button className="px-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm font-bold">
          <Filter size={20} /> Filtros Avançados
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-[40px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Cliente / Segmento</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Tipo de Frete</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Status / Inadimplência</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-right">Volume Mensal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => (
              <tr 
                key={client.id} 
                onClick={() => navigate(`/crm/clientes/${client.id}`)}
                className="hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{client.segment}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm font-bold text-gray-700">{client.type}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-normal ${
                      client.status === 'Ativo' ? 'bg-green-100 text-green-700' : 
                      client.status === 'Bloqueado' ? 'bg-red-100 text-red-700' : 
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {client.status}
                    </span>
                    {client.alert && <AlertCircle size={16} className="text-red-500 animate-pulse" />}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <p className="text-sm font-black text-gray-900">{client.volume}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- CLIENTE PERFIL VIEW (HIGH FIDELITY CUSTOMER WORKSPACE) ---

const ClientePerfilView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Custom rich data depending on client ID
  const clientsData: Record<string, any> = {
    transville: {
      name: 'Transportes Transville',
      segment: 'Logística Regional',
      cnpj: '12.345.678/0001-90',
      contractType: 'Contrato Fixo',
      status: 'Ativo',
      volume: 'R$ 145.000,00',
      contactName: 'Carlos Eduardo',
      contactPhone: '(47) 3431-2000',
      contactEmail: 'operacoes@transville.com.br',
      address: 'Joinville, SC',
      activeFretesCount: 2,
      totalRevenue: 'R$ 145.000,00',
      paidVolume: 'R$ 80.000,00',
      pendingVolume: 'R$ 65.000,00',
      limit: 'R$ 300.000',
      nps: 4.8,
      hasZaptro: true,
      fretes: [
        { id: 'FR-8890', origin: 'São Paulo, SP', dest: 'Curitiba, PR', status: 'Em Trânsito', value: 'R$ 4.500,00', date: '05/05 10:30' },
        { id: 'FR-8893', origin: 'Campinas, SP', dest: 'Joinville, SC', status: 'Coleta Agendada', value: 'R$ 3.800,00', date: '05/05 14:00' }
      ],
      fiscal: [
        { nr: '12401', doc: 'CT-e', date: '05/05 10:30', val: 'R$ 4.500,00', sefaz: 'Autorizado' },
        { nr: '4450', doc: 'MDF-e', date: '05/05 11:00', val: '-', sefaz: 'Autorizado' }
      ],
      crmLogs: [
        { date: '04/05/2026', type: 'Ligação', desc: 'Carlos Eduardo solicitou cotação extra para rota Campinas.' },
        { date: '28/04/2026', type: 'E-mail', desc: 'Fatura de Abril enviada para o financeiro e confirmada.' }
      ]
    },
    metalurgica: {
      name: 'Indústria Metalúrgica SA',
      segment: 'Pesados',
      cnpj: '98.765.432/0001-11',
      contractType: 'Avulso (Spot)',
      status: 'Bloqueado',
      volume: 'R$ 12.000,00',
      contactName: 'André Silveira',
      contactPhone: '(11) 4004-1234',
      contactEmail: 'comercial@metalurgicasa.com',
      address: 'Guarulhos, SP',
      activeFretesCount: 0,
      totalRevenue: 'R$ 12.000,00',
      paidVolume: 'R$ 0,00',
      pendingVolume: 'R$ 12.000,00',
      limit: 'R$ 50.000',
      nps: 4.2,
      hasZaptro: false,
      fretes: [
        { id: 'FR-8892', origin: 'Campinas, SP', dest: 'Vitória, ES', status: 'Atrasado', value: 'R$ 8.200,00', date: '05/05 12:00' }
      ],
      fiscal: [
        { nr: '12403', doc: 'CT-e', date: '05/05 12:00', val: 'R$ 8.200,00', sefaz: 'Rejeitado' }
      ],
      crmLogs: [
        { date: '05/05/2026', type: 'Ligação', desc: 'Cliente cobrado sobre fatura em atraso. Prometeu retorno financeiro.' }
      ]
    },
    global: {
      name: 'Varejo Global LTDA',
      segment: 'E-commerce',
      cnpj: '55.444.333/0002-88',
      contractType: 'Recorrente',
      status: 'Ativo',
      volume: 'R$ 282.300,00',
      contactName: 'Patricia Lima',
      contactPhone: '(21) 98888-2233',
      contactEmail: 'patricia@varejoglobal.com',
      address: 'Rio de Janeiro, RJ',
      activeFretesCount: 4,
      totalRevenue: 'R$ 282.300,00',
      paidVolume: 'R$ 282.300,00',
      pendingVolume: 'R$ 0,00',
      limit: 'R$ 500.000',
      nps: 4.9,
      hasZaptro: true,
      fretes: [
        { id: 'FR-8891', origin: 'Rio de Janeiro, RJ', dest: 'Belo Horizonte, MG', status: 'Entregue', value: 'R$ 2.800,00', date: '05/05 11:15' }
      ],
      fiscal: [
        { nr: '12402', doc: 'CT-e', date: '05/05 11:15', val: 'R$ 2.800,00', sefaz: 'Autorizado' }
      ],
      crmLogs: [
        { date: '02/05/2026', type: 'Visita', desc: 'Alinhamento mensal de nível de serviço (SLA). NPS avaliado com nota 10.' }
      ]
    },
    agrobrasil: {
      name: 'AgroBrasil Log',
      segment: 'Agronegócio',
      cnpj: '33.222.111/0001-02',
      contractType: 'Sazonal',
      status: 'Inativo',
      volume: 'R$ 42.000,00',
      contactName: 'Ricardo Silveira',
      contactPhone: '(65) 3621-1122',
      contactEmail: 'ricardo@agrobrasil.log.br',
      address: 'Cuiabá, MT',
      activeFretesCount: 0,
      totalRevenue: 'R$ 42.000,00',
      paidVolume: 'R$ 42.000,00',
      pendingVolume: 'R$ 0,00',
      limit: 'R$ 200.000',
      nps: 4.5,
      hasZaptro: false,
      fretes: [],
      fiscal: [],
      crmLogs: [
        { date: '10/04/2026', type: 'E-mail', desc: 'Encerramento de safra temporária. Próximo ciclo previsto para Agosto.' }
      ]
    },
    cimento: {
      name: 'Cimento Forte',
      segment: 'Construção',
      cnpj: '10.203.405/0001-44',
      contractType: 'Contrato Fixo',
      status: 'Ativo',
      volume: 'R$ 98.000,00',
      contactName: 'Marcos Almeida',
      contactPhone: '(41) 3321-4455',
      contactEmail: 'marcos@cementforte.com.br',
      address: 'Curitiba, PR',
      activeFretesCount: 1,
      totalRevenue: 'R$ 98.000,00',
      paidVolume: 'R$ 98.000,00',
      pendingVolume: 'R$ 0,00',
      limit: 'R$ 150.000',
      nps: 4.7,
      hasZaptro: true,
      fretes: [
        { id: 'FR-8895', origin: 'Curitiba, PR', dest: 'Londrina, PR', status: 'Em Trânsito', value: 'R$ 5.100,00', date: '05/05 16:30' }
      ],
      fiscal: [
        { nr: '12410', doc: 'CT-e', date: '05/05 16:30', val: 'R$ 5.100,00', sefaz: 'Autorizado' }
      ],
      crmLogs: [
        { date: '05/05/2026', type: 'E-mail', desc: 'Enviados orçamentos das rotas de expansão para Londrina.' }
      ]
    }
  };

  const [client, setClient] = React.useState(() => {
    const base = clientsData[id || 'transville'] || clientsData.transville;
    return { ...base };
  });

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: '',
    segment: '',
    cnpj: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    limit: '',
    status: ''
  });

  React.useEffect(() => {
    const base = clientsData[id || 'transville'] || clientsData.transville;
    setClient({ ...base });
  }, [id]);

  const handleOpenEdit = () => {
    setEditForm({
      name: client.name,
      segment: client.segment,
      cnpj: client.cnpj,
      contactName: client.contactName,
      contactPhone: client.contactPhone,
      contactEmail: client.contactEmail,
      limit: client.limit,
      status: client.status
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setClient(prev => ({
      ...prev,
      ...editForm
    }));
    setSuccess(true);
    if ((window as any).showToast) {
      (window as any).showToast('success', 'Dados da empresa atualizados com sucesso!', 'Cadastro Atualizado');
    }
    setTimeout(() => {
      setSuccess(false);
      setIsEditModalOpen(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* Return Button */}
      <button 
        onClick={() => navigate('/crm/clientes')}
        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Voltar para Gestão de Clientes
      </button>

      {/* Main Profile Header */}
      <div className="bg-transparent border-none p-0 shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center">
            <Building2 size={40} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">{client.name}</h2>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-normal ${
                client.status === 'Ativo' ? 'bg-green-100 text-green-700' : 
                client.status === 'Bloqueado' ? 'bg-red-100 text-red-700 animate-pulse' : 
                'bg-gray-100 text-gray-500'
              }`}>
                {client.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-normal">{client.segment} • CNPJ: {client.cnpj}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <a href={`mailto:${client.contactEmail}`} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-500 transition-colors">
            <Mail size={20} />
          </a>
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (client.hasZaptro) {
                if ((window as any).showToast) {
                  (window as any).showToast('success', 'Direcionando para o sistema Zaptro integrado...', 'Zaptro Conectado');
                }
                window.open('http://localhost:5174/inicio', '_blank');
              } else {
                const cleanPhone = client.contactPhone.replace(/\D/g, '');
                window.open(`https://wa.me/55${cleanPhone}`, '_blank');
              }
            }} 
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-500 transition-colors cursor-pointer"
          >
            <Phone size={20} />
          </button>
          <button 
            onClick={handleOpenEdit}
            className="px-6 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md cursor-pointer whitespace-nowrap"
          >
            Editar Conta
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Volume Faturado', value: client.totalRevenue, sub: 'Faturamento Acumulado', color: 'text-gray-900' },
          { label: 'Cargas Ativas', value: `${client.activeFretesCount} fretes`, sub: 'Em rota no momento', color: 'text-primary' },
          { label: 'Limite de Crédito', value: client.limit, sub: 'Disponível no Contrato', color: 'text-blue-500' },
          { label: 'Score Satisfação', value: `${client.nps} / 5.0`, sub: 'NPS Recorrente', color: 'text-emerald-500' },
        ].map((m, i) => (
          <div key={i} className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">{m.label}</p>
            <h4 className={`text-2xl font-black ${m.color}`}>{m.value}</h4>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-normal mt-2">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Layout Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ACTIVE FREIGHTS & FISCAL */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Freights Section */}
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6">Fretes & Viagens em Andamento</h3>
            {client.fretes.length > 0 ? (
              <div className="border border-gray-100 rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-normal">
                      <th className="px-6 py-4">ID do Frete</th>
                      <th className="px-6 py-4">Rota</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                    {client.fretes.map((f: any, idx: number) => (
                      <tr 
                        key={idx} 
                        onClick={() => navigate(`/fretes/lista/${f.id}`)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 text-primary">{f.id}</td>
                        <td className="px-6 py-4">{f.origin} → {f.dest}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-normal ${
                            f.status === 'Entregue' ? 'bg-green-100 text-green-700' : 
                            f.status === 'Atrasado' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-black">{f.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase">Nenhuma carga ativa no momento</p>
              </div>
            )}
          </div>

          {/* Fiscal Documentation History */}
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6">Documentos Fiscais Emitidos</h3>
            {client.fiscal.length > 0 ? (
              <div className="space-y-4">
                {client.fiscal.map((doc: any, idx: number) => (
                  <div key={idx} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{doc.doc} #{doc.nr}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{doc.date} • Valor: {doc.val}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                        doc.sefaz === 'Autorizado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {doc.sefaz}
                      </span>
                      <button className="p-2 text-gray-400 hover:text-primary transition-colors"><Download size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase">Nenhum documento fiscal emitido</p>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: CONTACT DETAILS & CRM LOGS */}
        <div className="space-y-8">
          
          {/* Contact Details Card */}
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-4">Responsável da Conta</h3>
            <div className="space-y-4 text-xs font-medium">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal mb-1">Nome de Contato</p>
                <p className="text-gray-900 font-bold text-sm">{client.contactName}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal mb-1">Telefone Comercial</p>
                <p className="text-gray-900 font-bold text-sm">{client.contactPhone}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal mb-1">E-mail Operacional</p>
                <p className="text-gray-900 font-bold text-sm">{client.contactEmail}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-normal mb-1">Localização Principal</p>
                <p className="text-gray-900 font-bold text-sm">{client.address}</p>
              </div>
            </div>
          </div>

          {/* CRM logs Timeline */}
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-4">Linha do Tempo CRM</h3>
            <div className="space-y-6">
              {client.crmLogs.map((log: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-start relative group">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare size={14} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-normal">{log.date} • {log.type}</span>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">{log.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Edit Account Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#18191B] rounded-[40px] max-w-lg w-full p-8 shadow-2xl border border-neutral-800 animate-in slide-in-from-bottom-8 duration-300 text-white">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Building2 className="text-primary" size={24} /> Editar Informações do Cliente
            </h3>
            
            {success ? (
              <div className="py-12 text-center space-y-4 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-950/40 text-green-400 rounded-full flex items-center justify-center mx-auto border border-neutral-800 shadow-sm">
                  <Check size={36} className="text-green-400" />
                </div>
                <h4 className="text-lg font-bold text-white">Cadastro Atualizado!</h4>
                <p className="text-xs text-neutral-400">As informações foram atualizadas e salvas com sucesso.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Razão Social / Nome</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Segmento</label>
                    <input 
                      type="text" 
                      value={editForm.segment}
                      onChange={(e) => setEditForm({ ...editForm, segment: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">CNPJ</label>
                    <input 
                      type="text" 
                      value={editForm.cnpj}
                      onChange={(e) => setEditForm({ ...editForm, cnpj: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Responsável Comercial</label>
                  <input 
                    type="text" 
                    value={editForm.contactName}
                    onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Telefone de Contato</label>
                    <input 
                      type="text" 
                      value={editForm.contactPhone}
                      onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">E-mail de Contato</label>
                    <input 
                      type="email" 
                      value={editForm.contactEmail}
                      onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Limite de Crédito</label>
                    <input 
                      type="text" 
                      value={editForm.limit}
                      onChange={(e) => setEditForm({ ...editForm, limit: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Status do Cadastro</label>
                    <select 
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                    >
                      <option className="bg-neutral-900">Ativo</option>
                      <option className="bg-neutral-900">Bloqueado</option>
                      <option className="bg-neutral-900">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-md shadow-primary/20 cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const VendasKanban = ({ 
  cards, 
  setCards, 
  setIsAddLeadModalOpen, 
  setNewLeadForm 
}: { 
  cards: any[], 
  setCards: any, 
  setIsAddLeadModalOpen: any, 
  setNewLeadForm: any 
}) => {
  const columns = [
    { id: 'leads', label: 'Leads (Novos)', color: 'bg-blue-500' },
    { id: 'contato', label: 'Em Contato', color: 'bg-purple-500' },
    { id: 'proposta', label: 'Proposta Enviada', color: 'bg-yellow-500' },
    { id: 'fechado', label: 'Ativo (Fechado)', color: 'bg-green-500' },
  ];

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    setCards((prev: any[]) => prev.map(c => c.id === cardId ? { ...c, col: colId } : c));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[600px]">
      {columns.map((col) => (
        <div 
          key={col.id} 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          className="bg-gray-50/50 rounded-[32px] p-6 border border-gray-100 text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              <h3 className="font-bold text-gray-900 text-sm">{col.label}</h3>
            </div>
            <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded-lg shadow-sm">
              {cards.filter(c => c.col === col.id).length}
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {col.id === 'leads' && (
              <button 
                onClick={() => {
                  setNewLeadForm({ title: '', value: '', tag: 'E-commerce', col: 'leads' });
                  setIsAddLeadModalOpen(true);
                }}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
              >
                <Plus size={16} /> Adicionar Lead
              </button>
            )}

            {cards.filter(c => c.col === col.id).map((card, i) => (
              <div 
                key={card.id || i} 
                draggable
                onDragStart={(e) => handleDragStart(e, card.id)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase tracking-normal">{card.tag}</span>
                  <button className="text-gray-300 hover:text-gray-600 cursor-pointer"><MoreVertical size={14} /></button>
                </div>
                <h4 className="font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">{card.title}</h4>
                <p className="text-lg font-black text-gray-900 mb-4">{card.value}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex -space-x-2">
                    {[1, 2].map(u => <div key={u} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />)}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><Clock size={10} /> {card.time}</span>
                </div>
              </div>
            ))}

            {col.id !== 'leads' && (
              <button 
                onClick={() => {
                  setNewLeadForm({ title: '', value: '', tag: 'E-commerce', col: col.id });
                  setIsAddLeadModalOpen(true);
                }}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
              >
                <Plus size={16} /> Adicionar Lead
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const OperacoesKanban = ({ 
  opCards, 
  setOpCards, 
  setSelectedOpCard, 
  setIsAddOpModalOpen, 
  setNewOpForm 
}: { 
  opCards: any[], 
  setOpCards: any, 
  setSelectedOpCard: any, 
  setIsAddOpModalOpen: any, 
  setNewOpForm: any 
}) => {
  const columns = [
    { id: 'coleta', label: 'Aguardando Coleta', color: 'bg-yellow-500' },
    { id: 'separacao', label: 'Em Separação', color: 'bg-blue-500' },
    { id: 'rota', label: 'Em Rota', color: 'bg-primary' },
    { id: 'problema', label: 'Problemas / Dev', color: 'bg-red-500' },
  ];

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    setOpCards((prev: any[]) => prev.map(c => {
      if (c.id === cardId) {
        const progress = colId === 'rota' ? 60 : 0;
        const eta = colId === 'rota' ? '4h' : 'Aguardando';
        return { ...c, col: colId, progress, eta };
      }
      return c;
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[600px]">
      {columns.map((col) => (
        <div 
          key={col.id} 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          className="bg-gray-50/50 rounded-[32px] p-6 border border-gray-100 text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              <h3 className="font-bold text-gray-900 text-sm">{col.label}</h3>
            </div>
            <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded-lg shadow-sm">
              {opCards.filter(c => c.col === col.id).length}
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {col.id === 'coleta' && (
              <button 
                onClick={() => {
                  setNewOpForm({ client: '', weight: '', origin: '', destination: '', driver: '', plate: '', col: 'coleta' });
                  setIsAddOpModalOpen(true);
                }}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer mb-2"
              >
                <Plus size={16} /> Adicionar Operação
              </button>
            )}

            {opCards.filter(c => c.col === col.id).map((card, i) => (
              <div 
                key={card.id || i} 
                draggable
                onDragStart={(e) => handleDragStart(e, card.id)}
                onClick={() => setSelectedOpCard(card)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing group text-left"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] font-black ${card.col === 'rota' ? 'text-primary bg-primary/5 px-2 py-1 rounded-lg' : 'text-gray-400'} uppercase tracking-normal`}>
                    {card.col === 'rota' ? `ID: #${card.id}` : `Pedido #${card.id}`}
                  </span>
                  <div className="flex gap-1">
                    {card.col === 'rota' ? (
                      <Activity size={12} className="text-primary animate-pulse" />
                    ) : (
                      <>
                        <Truck size={12} className="text-primary" />
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      </>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  Cliente: {card.client}
                </h4>

                {card.col === 'rota' ? (
                  <>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-4">
                      <span>{card.origin || 'São Paulo'}</span>
                      <ChevronRight size={10} className="self-center" />
                      <span>{card.destination}</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${card.progress || 60}%` }} />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Peso:</span>
                      <span className="font-bold text-gray-700">{card.weight}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Destino:</span>
                      <span className="font-bold text-gray-700">{card.destination}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                    <Users size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-900">Motorista: {card.driver}</p>
                    <p className="text-[10px] text-gray-500">
                      {card.col === 'rota' ? `ETA: ${card.eta}` : `Placa: ${card.plate}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {col.id !== 'coleta' && (
              <button 
                onClick={() => {
                  setNewOpForm({ client: '', weight: '', origin: '', destination: '', driver: '', plate: '', col: col.id });
                  setIsAddOpModalOpen(true);
                }}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer mt-2"
              >
                <Plus size={16} /> Adicionar Operação
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const FinanceiroView = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
    <div className="md:col-span-2 space-y-6">
      <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-8">Faturamento Consolidado por Cliente</h3>
        <div className="space-y-6">
          {[
            { name: 'Indústria Metalúrgica SA', total: 'R$ 842.500', paid: 'R$ 800.000', pending: 'R$ 42.500', perc: 92 },
            { name: 'Varejo Global LTDA', total: 'R$ 312.000', paid: 'R$ 312.000', pending: 'R$ 0', perc: 100 },
            { name: 'Transportes Transville', total: 'R$ 156.400', paid: 'R$ 80.000', pending: 'R$ 76.400', perc: 51 },
          ].map((item, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-bold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500 font-medium">Pago: {item.paid} • Pendente: {item.pending}</p>
                </div>
                <span className="text-sm font-black text-gray-900">{item.total}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${item.perc}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Últimas Faturas Emitidas</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Fatura #FT-0023{i}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Emissão: 05/05/2026</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-gray-900">R$ 4.590,00</p>
                <span className="text-[10px] font-black text-green-600 uppercase">Pago</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-primary rounded-[40px] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <DollarSign size={80} />
        </div>
        <div className="relative z-10">
          <h4 className="text-white/70 text-xs font-bold uppercase tracking-normal mb-2">Crédito Total Disponível</h4>
          <p className="text-3xl font-black mb-6">R$ 2.450.000</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-sm text-white/70">Limite Global</span>
              <span className="text-sm font-bold">R$ 5.0M</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-white/70">Utilizado</span>
              <span className="text-sm font-bold">48%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Alertas Financeiros</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-xs text-red-700 font-bold leading-tight">3 clientes com faturas vencidas há mais de 10 dias.</p>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-50 border border-yellow-100">
            <AlertCircle size={20} className="text-yellow-600" />
            <p className="text-xs text-yellow-700 font-bold leading-tight">Limite de crédito de "Indústria SA" atingido.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const InteligenciaView = () => (
  <div className="space-y-8 text-left">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { label: 'Top Receita', value: 'Indústria Metal SA', desc: 'R$ 1.2M acumulado', color: 'text-primary' },
        { label: 'Maior Frequência', value: 'Varejo Global', desc: '24 coletas / mês', color: 'text-blue-500' },
        { label: 'Melhor Margem', value: 'Logística Express', desc: '42% de rentabilidade', color: 'text-green-500' },
      ].map((card, i) => (
        <div key={i} className="bg-white border border-gray-200 p-8 rounded-[40px] shadow-sm hover:border-primary/30 transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-2">{card.label}</p>
          <h4 className="text-xl font-black text-gray-900 mb-1">{card.value}</h4>
          <p className={`text-xs font-bold ${card.color}`}>{card.desc}</p>
        </div>
      ))}
    </div>

    <div className="bg-white border border-gray-200 rounded-[40px] p-10 shadow-sm">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-2xl font-black text-gray-900">Análise de Performance</h3>
          <p className="text-gray-500 font-medium">Rentabilidade e volumetria por perfil de cliente</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all">Últimos 6 meses</button>
          <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all">Este Ano</button>
        </div>
      </div>
      
      <div className="h-64 flex items-end gap-6 mb-10 px-4">
        {[60, 45, 90, 75, 40, 85, 65, 50, 70, 55, 95, 80].map((h, i) => (
          <div key={i} className="flex-1 bg-gray-50 rounded-t-2xl relative group">
            <div className="absolute bottom-0 w-full bg-primary/20 rounded-t-2xl transition-all duration-500 group-hover:bg-primary" style={{ height: `${h}%` }} />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-xl">
              R$ {h * 15}k
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-10 border-t border-gray-100">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Tempo Médio de Entrega</p>
          <p className="text-xl font-black text-gray-900">1.8 dias</p>
          <p className="text-[10px] text-green-600 font-bold flex items-center gap-1"><ArrowUpRight size={12} /> 12% mais rápido</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Taxa de Reclamações</p>
          <p className="text-xl font-black text-gray-900">0.4%</p>
          <p className="text-[10px] text-green-600 font-bold flex items-center gap-1"><ArrowUpRight size={12} /> -2% vs mês anterior</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">NPS dos Clientes</p>
          <p className="text-xl font-black text-gray-900">88.4</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="text-yellow-400 fill-yellow-400" />)}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Novos Clientes (Mês)</p>
          <p className="text-xl font-black text-gray-900">12</p>
          <p className="text-[10px] text-primary font-bold">Meta atingida</p>
        </div>
      </div>
    </div>
  </div>
);

export default CRM;

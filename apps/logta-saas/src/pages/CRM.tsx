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
  Check,
  Download,
  ExternalLink,
  X,
  MessageCircle,
  Zap,
  Receipt,
} from 'lucide-react';
import { ExportFormatModal } from '../components/ExportFormatModal';
import { LogtaEmptyState } from '../components/EmptyState';
import { LogtaWaveTabStrip } from '../components/LogtaWaveTabStrip';
import { LogtaModuleHeader } from '../components/LogtaModuleHeader';
import { LogtaModalHeader } from '../components/LogtaModalHeader';
import { supabase } from '../lib/supabase';
import { getZaptroAppOrigin } from '../lib/logtaApp';
import { useTenant } from '../contexts/TenantContext';
import { showToast } from '../components/Toast';
import {
  getSandboxClientProfile,
  getSandboxCrmClients,
  getSandboxCrmLeads,
  resolveColaboradorIdByOwnerName,
  resolveDemoCompanyId,
  shouldUseLogtaSandbox,
} from '../lib/seed';
import { ComercialColaboradorPerfilView, CrmFinanceiroView } from '../modules/crm';
import { OrcamentoDashboardView, OrcamentoDetailView } from '../modules/orcamento';

const crmStatusToCol = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('problema') || s.includes('atrasado') || s.includes('alerta')) return 'problema';
  if (s.includes('trânsito') || s.includes('rota') || s.includes('viagem')) return 'rota';
  if (s.includes('separação') || s.includes('preparando')) return 'separacao';
  return 'coleta';
};

const CRM = () => {
  const { config } = useTenant();
  const location = useLocation();
  const isDetailPage =
    /^\/crm\/clientes\/.+/.test(location.pathname) ||
    /^\/crm\/comercial\/.+/.test(location.pathname) ||
    /^\/crm\/orcamentos\/.+/.test(location.pathname);

  const tabs = [
    { id: 'clientes', label: 'Clientes', shortLabel: 'Clientes', icon: Users, path: '/crm/clientes' },
    { id: 'vendas', label: 'Vendas', shortLabel: 'Vendas', icon: KanbanSquare, path: '/crm/vendas' },
    { id: 'operacoes', label: 'Operações', shortLabel: 'Oper.', icon: Truck, path: '/crm/operacoes' },
    { id: 'financeiro', label: 'Financeiro', shortLabel: 'Financ.', icon: DollarSign, path: '/crm/financeiro' },
    { id: 'inteligencia', label: 'BI', shortLabel: 'BI', icon: BarChart3, path: '/crm/inteligencia' },
  ];

  const [cards, setCards] = React.useState<any[]>([]);
  const [opCards, setOpCards] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [crmExportOpen, setCrmExportOpen] = React.useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = React.useState(false);
  const [newLeadForm, setNewLeadForm] = React.useState({
    title: '',
    nomeFantasia: '',
    document: '',
    documentType: 'cnpj' as 'cnpj' | 'cpf',
    email: '',
    phone: '',
    value: '',
    tag: 'E-commerce',
    col: 'leads',
  });

  const fetchCrmData = React.useCallback(async () => {
    if (!config?.id) return;
    setLoading(true);
    
    try {
      const [leadsRes, opsRes] = await Promise.all([
        supabase.from('leads').select('*').eq('company_id', config.id),
        supabase.from('shipments').select('*, motoristas(nome), vehicles(plate)').eq('company_id', config.id).limit(50)
      ]);

      const leadRows = leadsRes.data?.length ? leadsRes.data : [];
      const sandboxLeads = shouldUseLogtaSandbox() ? getSandboxCrmLeads(resolveDemoCompanyId(config.id)) : [];
      const mergedLeads = leadRows.length >= 2 ? leadRows : [...leadRows, ...sandboxLeads.filter((s) => !leadRows.some((l) => l.id === s.id))];

      if (mergedLeads.length) {
        setCards(
          mergedLeads.map((l: any) => ({
            id: l.id,
            title: l.name || l.company_name || 'Lead',
            value: l.value ? `R$ ${Number(l.value).toLocaleString('pt-BR')}` : 'Sob consulta',
            tag: l.metadata?.segmento || 'E-commerce',
            time: 'Recente',
            col: l.status || 'leads',
            clientId: l.metadata?.client_id || l.id,
            ownerName: l.metadata?.owner_name || l.owner_name || 'Comercial Logta',
            ownerRole: l.metadata?.owner_role || l.owner_role || 'Vendas',
          })),
        );
      }

      if (opsRes.data?.length) {
        setOpCards(opsRes.data.map(o => ({
          id: o.metadata?.numero_frete || o.id.slice(0, 8),
          client: o.metadata?.cliente_nome || 'Cliente',
          clientId: o.id,
          weight: o.weight_kg ? `${o.weight_kg}kg` : '--',
          origin: o.origin,
          destination: o.destination,
          driver: o.motoristas?.nome || 'Motorista',
          plate: o.vehicles?.plate || '--',
          col: crmStatusToCol(o.status),
          progress: (o.status === 'in_transit') ? 50 : 0,
          eta: (o.status === 'in_transit') ? '4h' : 'Aguardando'
        })));
      }
    } catch (err) {
      console.error('Erro CRM:', err);
    } finally {
      setLoading(false);
    }
  }, [config?.id]);

  React.useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData]);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config?.id) return;

    const val = parseFloat(newLeadForm.value.replace(/[^\d.]/g, '')) || 0;
    
    const { data, error } = await supabase.from('leads').insert({
      company_id: config.id,
      name: newLeadForm.title,
      value: val,
      status: newLeadForm.col,
      metadata: {
        segmento: newLeadForm.tag,
        nome_fantasia: newLeadForm.nomeFantasia || newLeadForm.title,
        document: newLeadForm.document,
        document_type: newLeadForm.documentType,
        email: newLeadForm.email,
        phone: newLeadForm.phone,
      },
    }).select().single();

    if (!error && data) {
      if (newLeadForm.col === 'fechado' || newLeadForm.document) {
        await supabase.from('clients').insert({
          company_id: config.id,
          name: newLeadForm.nomeFantasia || newLeadForm.title,
          cnpj: newLeadForm.document || null,
          email: newLeadForm.email || null,
          status: 'ativo',
          metadata: { origem: 'crm_lead', lead_id: data.id, segmento: newLeadForm.tag },
        });
      }
      fetchCrmData();
      if ((window as any).showToast) {
        (window as any).showToast('success', `Lead ${newLeadForm.title} cadastrado com sucesso!`, 'Lead Adicionado');
      }
      setIsAddLeadModalOpen(false);
      setNewLeadForm({
        title: '',
        nomeFantasia: '',
        document: '',
        documentType: 'cnpj',
        email: '',
        phone: '',
        value: '',
        tag: 'E-commerce',
        col: 'leads',
      });
    }
  };

  // Operations Kanban Actions
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

  const handleAddOp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config?.id) return;

    // Redireciona para o módulo de fretes para criação real ou simula aqui se necessário
    // Por enquanto, apenas alerta para usar o módulo de fretes
    if ((window as any).showToast) {
      (window as any).showToast('info', 'Por favor, utilize o módulo de Fretes para cadastrar novas operações reais.', 'Redirecionamento');
    }
    setIsAddOpModalOpen(false);
  };

  if (isDetailPage) {
    return (
      <div className="logta-page h-full w-full animate-in fade-in duration-500 overflow-y-auto text-left scrollbar-hide">
        <Routes>
          <Route path="clientes/:id" element={<ClientePerfilView />} />
          <Route path="comercial/:id" element={<ComercialColaboradorPerfilView />} />
          <Route path="orcamentos/:id" element={<OrcamentoDetailView />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="logta-page h-full min-h-full w-full space-y-5 text-left animate-in fade-in duration-700 sm:space-y-8">
      <LogtaModuleHeader
        title="CRM Estratégico"
        subtitle="Gestão 360º: clientes, vendas e operação."
        tabs={<LogtaWaveTabStrip tabs={tabs} basePath="/crm" defaultTabId="clientes" />}
        actions={
          <Link
            to="/crm/orcamentos"
            className="logta-module-header__icon-action logta-module-header__icon-action--dark"
            title="Orçamento Online"
            aria-label="Orçamento Online"
          >
            <Receipt size={18} strokeWidth={2.25} />
          </Link>
        }
        tabQuickAddLabel="Novo registro"
        onTabQuickAdd={() => {
          if (location.pathname.endsWith('/vendas')) {
            setIsAddLeadModalOpen(true);
          } else if (location.pathname.endsWith('/operacoes')) {
            setIsAddOpModalOpen(true);
          } else {
            setIsAddLeadModalOpen(true);
          }
        }}
      />

      {/* Dynamic Content via Router */}
      <div className="logta-page__body animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Routes>
          <Route index element={<Navigate to="/crm/clientes" replace />} />
          <Route path="clientes" element={<ClientesView onAddClick={() => setIsAddLeadModalOpen(true)} />} />
          <Route path="clientes/:id" element={<ClientePerfilView />} />
          <Route path="vendas" element={<VendasKanban cards={cards} setCards={setCards} setIsAddLeadModalOpen={setIsAddLeadModalOpen} setNewLeadForm={setNewLeadForm} />} />
          <Route path="operacoes" element={<OperacoesKanban opCards={opCards} setOpCards={setOpCards} setSelectedOpCard={setSelectedOpCard} setIsAddOpModalOpen={setIsAddOpModalOpen} setNewOpForm={setNewOpForm} />} />
          <Route path="financeiro" element={<CrmFinanceiroView />} />
          <Route path="inteligencia" element={<InteligenciaView />} />
          <Route path="orcamentos" element={<OrcamentoDashboardView />} />
          <Route path="orcamentos/:id" element={<OrcamentoDetailView />} />
          <Route path="comercial/:id" element={<ComercialColaboradorPerfilView />} />
        </Routes>
      </div>

      {/* Popup modal for adding a new lead */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#18191B] rounded-[40px] max-w-lg w-full p-8 shadow-2xl border border-neutral-800 animate-in slide-in-from-bottom-8 duration-300 text-white">
            <LogtaModalHeader
              icon={KanbanSquare}
              title="Adicionar Novo Lead / Cliente"
              onClose={() => setIsAddLeadModalOpen(false)}
            />

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
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Nome fantasia</label>
                  <input
                    type="text"
                    value={newLeadForm.nomeFantasia}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, nomeFantasia: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white text-sm font-semibold"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">CNPJ / CPF</label>
                  <input
                    type="text"
                    value={newLeadForm.document}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, document: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">E-mail</label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white text-sm font-semibold"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-normal ml-1">Telefone</label>
                  <input
                    type="tel"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white text-sm font-semibold"
                  />
                </div>
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
            <LogtaModalHeader
              icon={Truck}
              title="Adicionar Nova Operação"
              dotClassName="bg-blue-500"
              onClose={() => setIsAddOpModalOpen(false)}
            />

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
            <LogtaModalHeader
              icon={Truck}
              title={`Detalhes da Operação #${selectedOpCard.id}`}
              dotClassName="bg-blue-500"
              onClose={() => setSelectedOpCard(null)}
            />

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

      <ExportFormatModal
        open={crmExportOpen}
        onClose={() => setCrmExportOpen(false)}
        title="Exportar CRM"
        getTabularData={() => ({
          title: 'CRM — leads e operações (exportação)',
          filenameBase: 'crm-logta-export',
          columns: ['Tipo', 'Título / Cliente', 'Valor ou carga', 'Etapa', 'Extra'],
          rows: [
            ...cards.map((c) => ['Lead', c.title, c.value, c.col, c.tag]),
            ...opCards.map((o) => [
              'Operação',
              o.client,
              `${o.weight} • ${o.origin} → ${o.destination}`,
              o.col,
              `${o.driver} • ${o.plate}`,
            ]),
          ],
        })}
      />
    </div>
  );
};

// --- View Components ---

type ClienteStatusFilter = 'todos' | 'ativos' | 'inativos' | 'outros';

function clientStatusBucket(status?: string): 'ativo' | 'inativo' | 'outro' {
  const s = (status || '').toLowerCase();
  if (s === 'ativo') return 'ativo';
  if (['inativo', 'inadimplente', 'bloqueado'].includes(s)) return 'inativo';
  return 'outro';
}

function openColaboradorComercial(
  e: React.MouseEvent,
  ownerName: string | undefined,
  navigate: ReturnType<typeof useNavigate>,
) {
  e.stopPropagation();
  const colabId = resolveColaboradorIdByOwnerName(ownerName);
  if (colabId) navigate(`/crm/comercial/${colabId}`);
}

const ClientesView = ({ onAddClick }: { onAddClick: () => void }) => {
  const navigate = useNavigate();
  const { config } = useTenant();
  const [clients, setClients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<ClienteStatusFilter>('todos');

  const fetchClients = React.useCallback(async () => {
    if (!config?.id) return;
    const companyId = resolveDemoCompanyId(config.id);
    const sandbox = shouldUseLogtaSandbox()
      ? getSandboxCrmClients(companyId).map((c) => ({ ...c, nome_fantasia: c.name }))
      : [];
    if (sandbox.length) {
      setClients(sandbox);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const { data } = await supabase.from('clients').select('*').eq('company_id', config.id).order('name');
    const db = data || [];
    const merged =
      db.length >= 2
        ? db.map((c) => ({
            ...c,
            nome_fantasia: c.name,
            owner_name: c.metadata?.owner_name ?? c.owner_name,
            owner_role: c.metadata?.owner_role ?? c.owner_role,
          }))
        : [
            ...db.map((c) => ({
              ...c,
              nome_fantasia: c.name,
              owner_name: c.metadata?.owner_name,
              owner_role: c.metadata?.owner_role,
            })),
            ...sandbox.filter((s) => !db.some((d) => d.id === s.id)).map((s) => ({ ...s, nome_fantasia: s.name })),
          ];
    setClients(merged);
    setLoading(false);
  }, [config?.id]);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const stats = React.useMemo(() => {
    let ativos = 0;
    let inativos = 0;
    let outros = 0;
    clients.forEach((c) => {
      const bucket = clientStatusBucket(c.status);
      if (bucket === 'ativo') ativos += 1;
      else if (bucket === 'inativo') inativos += 1;
      else outros += 1;
    });
    return { total: clients.length, ativos, inativos, outros };
  }, [clients]);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cnpj ?? '').includes(searchTerm) ||
      (c.email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    const bucket = clientStatusBucket(c.status);
    if (statusFilter === 'ativos') return bucket === 'ativo';
    if (statusFilter === 'inativos') return bucket === 'inativo';
    if (statusFilter === 'outros') return bucket === 'outro';
    return true;
  });

  const statCards: { id: ClienteStatusFilter; label: string; value: number }[] = [
    { id: 'todos', label: 'Total', value: stats.total },
    { id: 'ativos', label: 'Ativos', value: stats.ativos },
    { id: 'inativos', label: 'Não ativos', value: stats.inativos },
    { id: 'outros', label: 'Outros', value: stats.outros },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => {
          const active = statusFilter === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setStatusFilter(card.id)}
              className={`logta-stat-card text-left transition-all ${
                active ? 'ring-2 ring-primary/40 border-primary/30' : 'hover:border-gray-200'
              }`}
            >
              <p className="logta-stat-card__label logta-stat-card__label--spaced">{card.label}</p>
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg">
                {loading ? '—' : card.value}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, CNPJ, contrato ou cidade..." 
            className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-gray-900 shadow-sm outline-none transition-all focus:border-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button type="button" className="hub-premium-pill secondary">
          <Filter size={20} /> <span className="whitespace-nowrap">Filtros Avançados</span>
        </button>
      </div>

      <div className="rounded-[24px] border border-gray-200 bg-white shadow-sm sm:rounded-[40px]">
        <div className="logta-table-wrap">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Activity className="animate-spin text-primary" size={32} />
              <p className="text-xs font-bold text-gray-400 uppercase">Sincronizando clientes...</p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Cliente / Segmento</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">CNPJ / E-mail</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal">Status / Responsável</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-normal text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => (
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
                          <p className="font-bold text-gray-900">{client.nome_fantasia}</p>
                          <p className="text-xs text-gray-500 font-medium">{client.email || 'Sem e-mail'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-gray-700">{client.cnpj || '---'}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-normal ${
                            client.status === 'ativo'
                              ? 'bg-green-100 text-green-700'
                              : client.status === 'inadimplente'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {client.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => openColaboradorComercial(e, client.owner_name, navigate)}
                          className={`flex items-center gap-1.5 text-left text-[11px] font-semibold ${
                            client.owner_name ? 'text-primary hover:underline' : 'text-gray-600'
                          }`}
                        >
                          <Users size={12} className="shrink-0 text-primary" />
                          {client.owner_name || '—'}
                        </button>
                        {client.owner_role ? (
                          <p className="text-[10px] font-medium text-gray-400">{client.owner_role}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline">
                        Ver perfil <ChevronRight size={14} />
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12">
                       <LogtaEmptyState type="clientes" onAction={onAddClick} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// --- CLIENTE PERFIL VIEW (HIGH FIDELITY CUSTOMER WORKSPACE) ---

const ClientePerfilView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);

  const sandboxProfile = React.useMemo(() => {
    if (!id || !shouldUseLogtaSandbox()) return null;
    return getSandboxClientProfile(id, companyId);
  }, [id, companyId]);

  const [client, setClient] = React.useState<any>(() => sandboxProfile);
  const [loading, setLoading] = React.useState(() => Boolean(id) && !sandboxProfile);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [contactPopup, setContactPopup] = React.useState<null | 'email' | 'phone'>(null);
  const [fiscalDocExport, setFiscalDocExport] = React.useState<null | {
    nr: string;
    doc: string;
    date: string;
    val: string;
    sefaz: string;
  }>(null);
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

  const shipmentStatusLabel = (status?: string) => {
    const map: Record<string, string> = {
      in_transit: 'Em trânsito',
      delivered: 'Entregue',
      delayed: 'Atrasado',
      loading: 'Carregando',
      pending: 'Pendente',
      stopped: 'Parado',
      unloading: 'Descarga',
      incident: 'Ocorrência',
    };
    return map[status ?? ''] ?? status ?? '—';
  };

  const fetchClientData = React.useCallback(async () => {
    if (!id) {
      setClient(null);
      setLoading(false);
      return;
    }

    if (sandboxProfile) {
      setClient(sandboxProfile);
      setLoading(false);
      return;
    }

    if (!config?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: c } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('company_id', config.id)
        .maybeSingle();

      if (c) {
        const statusRaw = String(c.metadata?.status ?? c.status ?? 'ativo').toLowerCase();
        const statusLabel =
          statusRaw === 'ativo' ? 'Ativo' : statusRaw === 'inadimplente' ? 'Inadimplente' : 'Bloqueado';

        const { data: f } = await supabase
          .from('shipments')
          .select('*')
          .eq('client_id', id)
          .eq('company_id', config.id)
          .order('created_at', { ascending: false })
          .limit(20);

        const fretesList = (f ?? []).map((x) => ({
          id: x.metadata?.numero_frete || x.id.slice(0, 8),
          shipmentId: x.id,
          origin: x.origin,
          dest: x.destination,
          status: shipmentStatusLabel(x.status),
          value: `R$ ${Number(x.metadata?.valor_frete || 0).toLocaleString('pt-BR')}`,
          date: new Date(x.created_at).toLocaleDateString('pt-BR'),
        }));

        const activeFretesCount = (f ?? []).filter(
          (s) => s.status && !['delivered', 'entregue'].includes(s.status),
        ).length;

        setClient({
          name: c.name,
          segment: c.metadata?.segmento || 'Logística',
          cnpj: c.document || c.cnpj || '---',
          contractType: 'Contrato Ativo',
          status: statusLabel,
          volume: 'R$ 0,00',
          contactName: c.metadata?.contato_nome || 'Não informado',
          contactPhone: c.phone || 'Não informado',
          contactEmail: c.email || 'Não informado',
          address: c.address || c.city || 'Endereço não cadastrado',
          activeFretesCount,
          totalRevenue: 'R$ 0,00',
          paidVolume: 'R$ 0,00',
          pendingVolume: 'R$ 0,00',
          limit: 'R$ 0,00',
          nps: 5.0,
          hasZaptro: !!c.phone,
          fretes: fretesList,
          fiscal: [],
          crmLogs: [],
        });
      } else {
        setClient(null);
      }
    } catch (err) {
      console.error('Erro Perfil Cliente:', err);
      setClient(null);
    } finally {
      setLoading(false);
    }
  }, [id, config?.id, sandboxProfile]);

  React.useEffect(() => {
    if (sandboxProfile) {
      setClient(sandboxProfile);
      setLoading(false);
    }
  }, [sandboxProfile]);

  React.useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const { error } = await supabase
      .from('clients')
      .update({
        name: editForm.name,
        document: editForm.cnpj,
        phone: editForm.contactPhone,
        email: editForm.contactEmail,
        metadata: {
          segmento: editForm.segment,
          contato_nome: editForm.contactName,
          status: editForm.status === 'Ativo' ? 'ativo' : 'bloqueado'
        }
      })
      .eq('id', id);

    if (!error) {
      setSuccess(true);
      fetchClientData();
      if ((window as any).showToast) {
        (window as any).showToast('success', 'Dados da empresa atualizados com sucesso!', 'Cadastro Atualizado');
      }
      setTimeout(() => {
        setSuccess(false);
        setIsEditModalOpen(false);
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <Activity className="animate-spin text-primary" size={40} />
        <p className="text-xs font-bold uppercase tracking-normal text-gray-400">Carregando perfil do cliente…</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/crm/clientes')}
          className="flex cursor-pointer items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} /> Voltar para Gestão de Clientes
        </button>
        <LogtaEmptyState type="clientes" onAction={() => navigate('/crm/clientes')} />
      </div>
    );
  }

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
              <h2 className="text-[40px] font-bold leading-[55px] tracking-[0] text-gray-900">{client.name}</h2>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-normal ${
                client.status === 'Ativo' ? 'bg-green-100 text-green-700' : 
                client.status === 'Bloqueado' ? 'bg-red-100 text-red-700 animate-pulse' : 
                'bg-gray-100 text-gray-500'
              }`}>
                {client.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-normal">{client.segment} • CNPJ: {client.cnpj}</p>
            {client.ownerName ? (
              <button
                type="button"
                onClick={() => {
                  const colabId = resolveColaboradorIdByOwnerName(client.ownerName);
                  if (colabId) navigate(`/crm/comercial/${colabId}`);
                }}
                className="mt-1 flex items-center gap-1.5 text-left text-xs font-semibold text-primary hover:underline"
              >
                <Users size={14} className="shrink-0" />
                Responsável: <span>{client.ownerName}</span>
                {client.ownerRole ? <span className="text-gray-400 no-underline">· {client.ownerRole}</span> : null}
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setContactPopup('email')}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-500 transition-colors cursor-pointer"
            title="Ver e-mail do contato"
          >
            <Mail size={20} />
          </button>
          <button 
            type="button"
            onClick={() => setContactPopup('phone')}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-500 transition-colors cursor-pointer"
            title="Ligar ou WhatsApp"
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
            <h4 className={`my-[15px] text-xl font-extrabold tracking-normal ${m.color}`}>{m.value}</h4>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-normal mt-2">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Layout Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ACTIVE FREIGHTS & FISCAL */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Freights Section */}
          <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:rounded-[40px] sm:p-8">
            <h3 className="mb-6 text-xl font-black tracking-normal text-gray-900">Fretes & Viagens em Andamento</h3>
            {client.fretes.length > 0 ? (
              <div className="rounded-3xl border border-gray-100">
                <div className="logta-table-wrap">
                <table className="w-full min-w-[560px] border-collapse text-left">
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
                        onClick={() => navigate(`/fretes/operacional/${f.shipmentId ?? f.id}`)}
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
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase">Nenhuma carga ativa no momento</p>
              </div>
            )}
          </div>

          {/* Fiscal Documentation History */}
          <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
            <h3 className="mb-6 text-xl font-black tracking-normal text-gray-900">Documentos Fiscais Emitidos</h3>
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
                      <button
                        type="button"
                        onClick={() => setFiscalDocExport(doc)}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                        title="Exportar documento"
                      >
                        <Download size={16} />
                      </button>
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
            <h3 className="border-b border-gray-50 pb-4 text-xl font-black tracking-normal text-gray-900">Responsável da Conta</h3>
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
            <h3 className="border-b border-gray-50 pb-4 text-xl font-black tracking-normal text-gray-900">Linha do Tempo CRM</h3>
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
            <LogtaModalHeader
              icon={Building2}
              title="Editar Informações do Cliente"
              onClose={() => setIsEditModalOpen(false)}
            />

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

      {contactPopup && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Fechar"
            onClick={() => setContactPopup(null)}
          />
          <div
            className="relative w-full max-w-md animate-in zoom-in-95 rounded-[40px] border border-neutral-800 bg-[#18191B] p-7 text-left shadow-2xl duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-popup-title"
          >
            <button
              type="button"
              onClick={() => setContactPopup(null)}
              className="absolute right-3 top-3 rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            {contactPopup === 'email' ? (
              <>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Mail size={22} />
                </div>
                <h3 id="contact-popup-title" className="pr-10 text-lg font-black text-white">
                  E-mail do contato
                </h3>
                <p className="mt-1 text-xs font-medium text-neutral-400">
                  Copie ou abra no seu aplicativo de e-mail.
                </p>
                <p className="mt-5 break-all rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm font-bold text-white">
                  {client.contactEmail}
                </p>
                <div className="mt-6 flex flex-wrap gap-2 py-[30px]">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(client.contactEmail);
                        (window as any).showToast?.('success', 'E-mail copiado para a área de transferência.', 'Copiado');
                      } catch {
                        (window as any).showToast?.('error', 'Não foi possível copiar.', 'Erro');
                      }
                    }}
                    className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-neutral-200 transition-colors hover:bg-neutral-800"
                  >
                    Copiar
                  </button>
                  <a
                    href={`mailto:${encodeURIComponent(client.contactEmail)}`}
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Abrir app de e-mail
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <Phone size={22} />
                </div>
                <h3 id="contact-popup-title" className="pr-10 text-lg font-black text-white">
                  Telefone comercial
                </h3>
                <p className="mt-1 text-xs font-medium text-neutral-400">
                  Ligue, copie o número ou inicie uma conversa no WhatsApp.
                </p>
                <p className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm font-bold text-white">
                  {client.contactPhone}
                </p>
                {(() => {
                  const digits = client.contactPhone.replace(/\D/g, '');
                  const waNumber = digits && !digits.startsWith('55') ? `55${digits}` : digits;
                  const telHref =
                    digits && (digits.startsWith('55') ? `tel:+${digits}` : `tel:+55${digits}`);
                  const waHref = waNumber ? `https://wa.me/${waNumber}` : '#';
                  const zaptroWhatsappUrl = `${getZaptroAppOrigin()}/whatsapp/${encodeURIComponent(id || 'global')}`;

                  return (
                    <div className="mt-6 flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2 py-[30px]">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(client.contactPhone);
                              (window as any).showToast?.('success', 'Telefone copiado.', 'Copiado');
                            } catch {
                              (window as any).showToast?.('error', 'Não foi possível copiar.', 'Erro');
                            }
                          }}
                          className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-neutral-200 transition-colors hover:bg-neutral-800"
                        >
                          Copiar
                        </button>
                        {telHref && (
                          <a
                            href={telHref}
                            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                          >
                            Ligar
                          </a>
                        )}
                        {waHref !== '#' && (
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                          >
                            <MessageCircle size={14} />
                            WhatsApp Web
                          </a>
                        )}
                      </div>
                      {client.hasZaptro && (
                        <a
                          href={zaptroWhatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                        >
                          <ExternalLink size={14} />
                          Abrir conversa no Zaptro
                        </a>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      <ExportFormatModal
        open={fiscalDocExport !== null}
        onClose={() => setFiscalDocExport(null)}
        title="Exportar documento fiscal"
        getTabularData={() => {
          if (!fiscalDocExport) {
            return {
              title: 'Documento',
              filenameBase: 'documento',
              columns: ['Campo', 'Valor'],
              rows: [['—', '—']],
            };
          }
          const d = fiscalDocExport;
          return {
            title: `${d.doc} nº ${d.nr} — ${client.name}`,
            filenameBase: `${d.doc}-${d.nr}`,
            columns: ['Campo', 'Valor'],
            rows: [
              ['Cliente', client.name],
              ['Documento', d.doc],
              ['Número', d.nr],
              ['Data', d.date],
              ['Valor', d.val],
              ['SEFAZ', d.sefaz],
            ],
          };
        }}
      />
    </div>
  );
};

const KANBAN_CLIENT_AVATAR =
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=96&h=96&q=80';
const KANBAN_STAFF_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&h=96&q=80';

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
  const navigate = useNavigate();
  const dragLockRef = React.useRef(false);

  const columns = [
    { id: 'leads', label: 'Leads (Novos)', color: 'bg-blue-500' },
    { id: 'contato', label: 'Em Contato', color: 'bg-purple-500' },
    { id: 'proposta', label: 'Proposta Enviada', color: 'bg-yellow-500' },
    { id: 'fechado', label: 'Ativo (Fechado)', color: 'bg-green-500' },
  ];

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    dragLockRef.current = true;
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragEnd = () => {
    window.setTimeout(() => {
      dragLockRef.current = false;
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain');
    setCards((prev: any[]) => prev.map(c => c.id === cardId ? { ...c, col: colId } : c));
  };

  const openLeadClient = (card: any) => {
    if (dragLockRef.current) return;
    const cid = card.clientId || 'global';
    navigate(`/crm/clientes/${cid}`);
  };

  return (
    <div className="logta-kanban-board grid-cols-1 gap-6 md:grid-cols-4">
      {columns.map((col) => (
        <div 
          key={col.id} 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          className="flex h-full min-h-0 flex-col rounded-[32px] border border-gray-100 bg-gray-50/50 p-6 text-left"
        >
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              <h3 className="logta-kanban-column-title">{col.label}</h3>
            </div>
            <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded-lg shadow-sm">
              {cards.filter(c => c.col === col.id).length}
            </span>
          </div>

          <button 
            type="button"
            onClick={() => {
              setNewLeadForm({ title: '', value: '', tag: 'E-commerce', col: col.id });
              setIsAddLeadModalOpen(true);
            }}
            className="w-full shrink-0 mb-4 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
          >
            <Plus size={16} /> Adicionar Lead
          </button>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scrollbar-hide">
            {cards.filter(c => c.col === col.id).map((card, i) => (
              <div 
                key={card.id || i} 
                draggable
                onDragStart={(e) => handleDragStart(e, card.id)}
                onDragEnd={handleDragEnd}
                role="button"
                tabIndex={0}
                onClick={() => openLeadClient(card)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLeadClient(card);
                  }
                }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group text-left"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase tracking-normal">{card.tag}</span>
                  <button 
                    type="button"
                    className="text-gray-300 hover:text-gray-600 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
                <h4 className="logta-kanban-card-title mb-1 group-hover:text-primary transition-colors">{card.title}</h4>
                <p className="text-lg font-black text-gray-900 mb-4">{card.value}</p>
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={(e) => openColaboradorComercial(e, card.ownerName, navigate)}
                    className="flex min-w-0 items-center gap-2 text-left transition-opacity hover:opacity-80"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users size={12} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-bold text-primary">{card.ownerName || 'Comercial'}</p>
                      <p className="truncate text-[9px] font-medium text-gray-400">{card.ownerRole || 'Negociação'}</p>
                    </div>
                  </button>
                  <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-gray-400">
                    <Clock size={10} /> {card.time}
                  </span>
                </div>
              </div>
            ))}
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
    <div className="logta-kanban-board grid-cols-1 gap-6 md:grid-cols-4">
      {columns.map((col) => (
        <div 
          key={col.id} 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          className="flex h-full min-h-0 flex-col rounded-[32px] border border-gray-100 bg-gray-50/50 p-6 text-left"
        >
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              <h3 className="logta-kanban-column-title">{col.label}</h3>
            </div>
            <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded-lg shadow-sm">
              {opCards.filter(c => c.col === col.id).length}
            </span>
          </div>

          <button 
            type="button"
            onClick={() => {
              setNewOpForm({ client: '', weight: '', origin: '', destination: '', driver: '', plate: '', col: col.id });
              setIsAddOpModalOpen(true);
            }}
            className="w-full shrink-0 mb-4 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
          >
            <Plus size={16} /> Adicionar Operação
          </button>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scrollbar-hide">
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

                <div className="flex -space-x-2 mb-3">
                  <Link
                    to={`/crm/clientes/${card.clientId || ''}`}
                    onClick={(e) => e.stopPropagation()}
                    className="relative z-10 w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-gray-100 ring-1 ring-gray-100 hover:ring-primary/40 transition-all"
                    title="Ver cliente"
                  >
                    <img src={KANBAN_CLIENT_AVATAR} alt="" className="h-full w-full object-cover" />
                  </Link>
                  <Link
                    to="/rh/equipe"
                    onClick={(e) => e.stopPropagation()}
                    className="relative z-10 w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-gray-100 ring-1 ring-gray-100 hover:ring-primary/40 transition-all"
                    title="Ver colaboradores"
                  >
                    <img src={KANBAN_STAFF_AVATAR} alt="" className="h-full w-full object-cover" />
                  </Link>
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
          </div>
        </div>
      ))}
    </div>
  );
};


const InteligenciaView = () => {
  const [reportExportOpen, setReportExportOpen] = React.useState(false);

  return (
  <div className="space-y-8 text-left">
    <div className="logta-panel-card p-8 sm:p-10">
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
      
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center">
        <p className="text-sm font-bold text-gray-500">Dados insuficientes para gerar a análise</p>
        <button type="button" onClick={() => setReportExportOpen(true)} className="hub-premium-pill dark">
          Gerar relatório
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-10 border-t border-gray-100">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Tempo Médio de Entrega</p>
          <p className="text-xl font-black text-gray-900">0 dias</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Taxa de Reclamações</p>
          <p className="text-xl font-black text-gray-900">0.0%</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">NPS dos Clientes</p>
          <p className="text-xl font-black text-gray-900">0.0</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="text-gray-200 fill-gray-200" />)}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">Novos Clientes (Mês)</p>
          <p className="text-xl font-black text-gray-900">0</p>
        </div>
      </div>
    </div>

    <ExportFormatModal
      open={reportExportOpen}
      onClose={() => setReportExportOpen(false)}
      title="Gerar relatório"
      description="Exporte um resumo da inteligência comercial em PDF ou planilha."
      getTabularData={() => ({
        title: 'CRM — Inteligência',
        filenameBase: 'relatorio-crm-inteligencia',
        columns: ['Indicador', 'Valor'],
        rows: [
          ['Tempo médio de entrega', '0 dias'],
          ['Taxa de reclamações', '0,0%'],
          ['NPS dos clientes', '0,0'],
          ['Novos clientes (mês)', '0'],
        ],
      })}
    />
  </div>
  );
};

export default CRM;

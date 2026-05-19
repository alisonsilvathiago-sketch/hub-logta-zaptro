import React from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
import { 
  Truck, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  MapPin, 
  Clock, 
  DollarSign, 
  FileText, 
  AlertCircle,
  BarChart3,
  ChevronRight,
  User,
  Package,
  Activity,
  ArrowUpRight,
  Map as MapIcon,
  ArrowLeft,
  Phone,
  Shield,
  Download,
  CheckCircle,
  ExternalLink,
  Loader2,
  Lock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { useOperationalData } from '../contexts/OperationalDataContext';
import { showToast } from '../components/Toast';
import { OperationalMapCanvas } from '../components/OperationalMapCanvas';
import { LogtaStandardMap } from '../components/LogtaStandardMap';
import { ExportFormatModal } from '../components/ExportFormatModal';
import { LogtaDataTable } from '../components/LogtaDataTable';
import { LogtaEmptyState } from '../components/EmptyState';
import { useLogtaProfile } from '../contexts/LogtaProfileContext';
import { LogtaWaveTabStrip } from '../components/LogtaWaveTabStrip';
import { LogtaModuleHeader } from '../components/LogtaModuleHeader';
import { LogtaModalHeader } from '../components/LogtaModalHeader';
import {
  getOrCreateMotoristaLink,
  motoristaPublicUrl,
} from '../modules/motorista/motoristaOperationalStorage';
import {
  findShipmentForDetail,
  normalizeFreteDetail,
} from '../lib/freteDetailNormalize';
import { getSandboxOperationalBundle, resolveDemoCompanyId } from '../lib/seed';
import {
  appendFreteAuditEntry,
  auditEntryToDisplayLog,
  loadFreteAuditHistory,
  type FreteAuditCategory,
  type FreteAuditDisplayLog,
} from '../lib/freteSecurityAudit';
import {
  FretesIntelligenceProvider,
  FretesAlertsInlinePanel,
  FretesCentralOperacional,
  FretesFinanceiroInteligente,
  normalizeShipment,
  useFretesIntelligence,
} from '../modules/fretes';

function LogtaMapLoadingPanel({ label, minHeight = '400px' }: { label: string; minHeight?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-gray-100"
      style={{ minHeight }}
    >
      <LogtaStandardMap
        className="absolute inset-0 h-full w-full"
        showMetricsBubble={false}
        showHeroCar={false}
        showDestinationPin={false}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/50 backdrop-blur-[2px]">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-base font-extrabold uppercase tracking-normal text-gray-600">{label}</p>
      </div>
    </div>
  );
}

const KANBAN_CLIENT_AVATAR =
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=96&h=96&q=80';
const KANBAN_DRIVER_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&h=96&q=80';

function clienteNomeToCrmSlug(nome: string) {
  const n = (nome || '').toLowerCase();
  if (n.includes('global') || n.includes('varejo') || n.includes('express')) return 'global';
  if (n.includes('metal') || n.includes('minera')) return 'metalurgica';
  if (n.includes('cimento')) return 'cimento';
  if (n.includes('agro')) return 'agrobrasil';
  return 'transville';
}

function statusToKanbanCol(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel')) return 'problema';
  if (s.includes('ocorr')) return 'problema';
  if (s.includes('entregue') || s === 'delivered') return 'concluido';
  if (s.includes('atrasad') || s.includes('delayed')) return 'problema';
  if (s.includes('descarreg') || s.includes('entrega')) return 'entrega';
  if (s.includes('trânsito') || s.includes('transito') || s.includes('rota') || s === 'in_transit') return 'transito';
  if (s.includes('carregando') || s.includes('parada')) return 'transito';
  if (s.includes('agendad') || s.includes('coleta') || s.includes('pending')) return 'agendado';
  return 'pedido';
}

const Fretes = () => {
  const { config } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();
  const isDetailPage = /^\/fretes\/(lista|operacional)\/.+/.test(location.pathname);
  
  const [isNovoFreteOpen, setIsNovoFreteOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [metrics, setMetrics] = React.useState({
    total: 0,
    transito: 0,
    entregues: 0,
    atrasados: 0,
    receita: 0,
    lucro: 0
  });

  const [novoFreteForm, setNovoFreteForm] = React.useState({
    client: '',
    origin: '',
    dest: '',
    driver_id: '',
    vehicle_id: '',
    value: '',
    type: 'Expresso',
    peso: '',
    volume: '',
    prioridade: 'Normal',
    seguro: 'Sim',
  });

  const { shipments: shipmentsNorm, motoristas: drivers, vehicles, loading: dataLoading, refresh } = useOperationalData();

  React.useEffect(() => {
    const stats = shipmentsNorm.reduce(
      (acc, curr) => {
        acc.total++;
        const s = (curr.status || '').toLowerCase();
        if (s === 'in_transit' || s.includes('transito') || s.includes('rota')) acc.transito++;
        if (s === 'delivered' || s.includes('entregue')) acc.entregues++;
        if (s === 'delayed' || s.includes('atrasad')) acc.atrasados++;
        acc.receita += Number(curr.valor_frete || 0);
        return acc;
      },
      { total: 0, transito: 0, entregues: 0, atrasados: 0, receita: 0 },
    );
    setMetrics({ ...stats, lucro: stats.receita * 0.28 });
  }, [shipmentsNorm]);

  const handleCreateFrete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config?.id) return;
    
    setIsSubmitting(true);
    const newId = `FR-${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      const { error } = await supabase.from('shipments').insert({
        company_id: config.id,
        client_id: null,
        origin: novoFreteForm.origin,
        destination: novoFreteForm.dest,
        driver_id: novoFreteForm.driver_id || null,
        vehicle_id: novoFreteForm.vehicle_id || null,
        metadata: {
          numero_frete: newId,
          cliente_nome: novoFreteForm.client,
          valor_frete: parseFloat(novoFreteForm.value.replace(/[^\d.,]/g, '').replace(',', '.')),
          tipo_carga: novoFreteForm.type,
          peso_kg: novoFreteForm.peso ? parseFloat(novoFreteForm.peso) : undefined,
          volume_m3: novoFreteForm.volume ? parseFloat(novoFreteForm.volume) : undefined,
          prioridade: novoFreteForm.prioridade,
          seguro_carga: novoFreteForm.seguro,
        },
        status: 'pending',
      });

      if (error) throw error;

      showToast('success', `Operação de frete ${newId} criada com sucesso!`, 'Frete Agendado');
      setIsNovoFreteOpen(false);
      setNovoFreteForm({
        client: '',
        origin: '',
        dest: '',
        driver_id: '',
        vehicle_id: '',
        value: '',
        type: 'Expresso',
        peso: '',
        volume: '',
        prioridade: 'Normal',
        seguro: 'Sim',
      });
      await refresh();
      
      // Trigger a refresh event for the list view
      window.dispatchEvent(new CustomEvent('frete_created'));
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao criar frete', 'Erro');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const tabs = [
    { id: 'operacional', label: 'Operacional', shortLabel: 'Oper.', icon: Truck, path: '/fretes/operacional' },
    { id: 'kanban', label: 'Kanban', shortLabel: 'Kanban', icon: Activity, path: '/fretes/kanban' },
    { id: 'mapa', label: 'Mapa', shortLabel: 'Mapa', icon: MapIcon, path: '/fretes/mapa' },
    { id: 'financeiro', label: 'Financeiro', shortLabel: 'Financ.', icon: DollarSign, path: '/fretes/financeiro' },
    { id: 'central', label: 'Central', shortLabel: 'Central', icon: AlertCircle, path: '/fretes/central' },
  ];

  if (isDetailPage) {
    return (
      <FretesIntelligenceProvider shipments={shipmentsNorm} motoristas={drivers} vehicles={vehicles} loading={dataLoading} autoPopup={false}>
        <div className="logta-page h-full w-full animate-in fade-in duration-500 overflow-y-auto text-left scrollbar-hide">
          <Routes>
            <Route path="lista/:id" element={<FreteDetalheView />} />
            <Route path="operacional/:id" element={<FreteDetalheView />} />
          </Routes>
        </div>
      </FretesIntelligenceProvider>
    );
  }

  return (
    <FretesIntelligenceProvider shipments={shipmentsNorm} motoristas={drivers} vehicles={vehicles} loading={dataLoading} autoPopup={false}>
    <div className="logta-page h-full w-full space-y-5 overflow-y-auto text-left scrollbar-hide animate-in fade-in duration-700 sm:space-y-8">
      <LogtaModuleHeader
        title="Gestão de Fretes"
        subtitle="Centro operacional logístico inteligente — Kanban, mapa, financeiro e IA em tempo real."
        tabs={<LogtaWaveTabStrip tabs={tabs} basePath="/fretes" defaultTabId="operacional" />}
        tabQuickAddLabel="Novo frete"
        onTabQuickAdd={() => setIsNovoFreteOpen(true)}
      />

      <FretesAlertsInlinePanel />

      <FretesExecutiveMetricsBar fallback={metrics} loading={dataLoading} />

      {/* Sub-views via Routes */}
      <div className="min-h-0 flex-1 animate-in fade-in duration-500">
        <Routes>
          <Route index element={<Navigate to="/fretes/operacional" replace />} />
          <Route path="lista" element={<Navigate to="/fretes/operacional" replace />} />
          <Route path="operacional" element={<FretesListaView setIsNovoFreteOpen={setIsNovoFreteOpen} />} />
          <Route path="lista/:id" element={<FreteDetalheView />} />
          <Route path="operacional/:id" element={<FreteDetalheView />} />
          <Route path="kanban" element={<FretesKanbanView />} />
          <Route path="mapa" element={<FretesRastreamentoView />} />
          <Route path="rastreamento" element={<Navigate to="/fretes/mapa" replace />} />
          <Route path="financeiro" element={<FretesFinanceiroInteligente />} />
          <Route path="central" element={<FretesCentralOperacional />} />
        </Routes>
      </div>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar relatório de fretes"
        getTabularData={() => ({
          title: 'Gestão de Fretes — indicadores atuais',
          filenameBase: 'fretes-logta-resumo',
          columns: ['Métrica', 'Valor'],
          rows: [
            ['Fretes hoje', metrics.total],
            ['Em trânsito', metrics.transito],
            ['Entregues', metrics.entregues],
            ['Atrasados', metrics.atrasados],
            ['Receita dia (R$)', metrics.receita],
            ['Lucro est. (R$)', metrics.lucro],
          ],
        })}
      />

      {isNovoFreteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg animate-in zoom-in-95 rounded-[40px] border border-neutral-800 bg-[#18191B] p-8 shadow-2xl duration-300">
            <LogtaModalHeader
              icon={Package}
              title="Novo Agendamento de Frete"
              onClose={() => setIsNovoFreteOpen(false)}
            />

            <form onSubmit={handleCreateFrete} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Cliente</label>
                  <input
                    required
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none transition-all focus:border-primary/50"
                    placeholder="Nome do Cliente"
                    value={novoFreteForm.client}
                    onChange={(e) => setNovoFreteForm({ ...novoFreteForm, client: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Valor do Frete</label>
                  <input
                    required
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none transition-all focus:border-primary/50"
                    placeholder="Ex: 1500,00"
                    value={novoFreteForm.value}
                    onChange={(e) => setNovoFreteForm({ ...novoFreteForm, value: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Origem (Cidade/UF)</label>
                  <input
                    required
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none transition-all focus:border-primary/50"
                    placeholder="Ex: São Paulo, SP"
                    value={novoFreteForm.origin}
                    onChange={(e) => setNovoFreteForm({ ...novoFreteForm, origin: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Destino (Cidade/UF)</label>
                  <input
                    required
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none transition-all focus:border-primary/50"
                    placeholder="Ex: Curitiba, PR"
                    value={novoFreteForm.dest}
                    onChange={(e) => setNovoFreteForm({ ...novoFreteForm, dest: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Motorista</label>
                  <select
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none transition-all focus:border-primary/50"
                    value={novoFreteForm.driver_id}
                    onChange={(e) => setNovoFreteForm({ ...novoFreteForm, driver_id: e.target.value })}
                  >
                    <option className="bg-neutral-900" value="">
                      Selecionar Motorista
                    </option>
                    {drivers.map((d) => (
                      <option className="bg-neutral-900" key={d.id} value={d.id}>
                        {d.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Veículo</label>
                  <select
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none transition-all focus:border-primary/50"
                    value={novoFreteForm.vehicle_id}
                    onChange={(e) => setNovoFreteForm({ ...novoFreteForm, vehicle_id: e.target.value })}
                  >
                    <option className="bg-neutral-900" value="">
                      Selecionar Veículo
                    </option>
                    {vehicles.map((v) => (
                      <option className="bg-neutral-900" key={v.id} value={v.id}>
                        {v.plate} ({v.modelo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Peso (kg)</label>
                  <input
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50"
                    placeholder="Ex: 12000"
                    value={novoFreteForm.peso}
                    onChange={(e) => setNovoFreteForm({ ...novoFreteForm, peso: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Volume (m³)</label>
                  <input
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50"
                    placeholder="Ex: 45"
                    value={novoFreteForm.volume}
                    onChange={(e) => setNovoFreteForm({ ...novoFreteForm, volume: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Prioridade</label>
                  <select
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50"
                    value={novoFreteForm.prioridade}
                    onChange={(e) => setNovoFreteForm({ ...novoFreteForm, prioridade: e.target.value })}
                  >
                    <option className="bg-neutral-900" value="Normal">Normal</option>
                    <option className="bg-neutral-900" value="Alta">Alta</option>
                    <option className="bg-neutral-900" value="Urgente">Urgente</option>
                  </select>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Seguro carga</label>
                  <select
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-primary/50"
                    value={novoFreteForm.seguro}
                    onChange={(e) => setNovoFreteForm({ ...novoFreteForm, seguro: e.target.value })}
                  >
                    <option className="bg-neutral-900" value="Sim">Sim</option>
                    <option className="bg-neutral-900" value="Não">Não</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="ml-1 text-[10px] font-semibold uppercase tracking-normal text-neutral-400">Tipo de Carga</label>
                <select
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-semibold text-white outline-none transition-all focus:border-primary/50"
                  value={novoFreteForm.type}
                  onChange={(e) => setNovoFreteForm({ ...novoFreteForm, type: e.target.value })}
                >
                  <option className="bg-neutral-900" value="Expresso">Expresso</option>
                  <option className="bg-neutral-900" value="Normal">Normal</option>
                  <option className="bg-neutral-900" value="Dedicado">Dedicado</option>
                  <option className="bg-neutral-900" value="Pesado">Pesado</option>
                  <option className="bg-neutral-900" value="Refrigerada">Refrigerada</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-[23px] text-base font-black uppercase tracking-normal text-white shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Agendar Operação de Frete'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </FretesIntelligenceProvider>
  );
};

function FretesExecutiveMetricsBar({
  fallback,
  loading,
}: {
  fallback: { total: number; transito: number; entregues: number; atrasados: number; receita: number; lucro: number };
  loading: boolean;
}) {
  const { analytics } = useFretesIntelligence();
  const items = loading
    ? [
        { label: 'Fretes ativos', value: '—', color: 'text-primary' },
        { label: 'Em rota', value: '—', color: 'text-blue-500' },
        { label: 'Entregas hoje', value: '—', color: 'text-green-500' },
        { label: 'Atrasados', value: '—', color: 'text-red-500' },
        { label: 'Faturamento', value: '—', color: 'text-gray-900' },
        { label: 'Margem média', value: '—', color: 'text-primary' },
      ]
    : [
        { label: 'Fretes ativos', value: String(analytics.fretesAtivos || fallback.total), color: 'text-primary' },
        { label: 'Em rota', value: String(analytics.emRota || fallback.transito), color: 'text-blue-500' },
        { label: 'Entregas hoje', value: String(analytics.entreguesHoje || fallback.entregues), color: 'text-green-500' },
        { label: 'Atrasados', value: String(analytics.atrasados || fallback.atrasados), color: 'text-red-500' },
        {
          label: 'Faturamento',
          value: `R$ ${((analytics.faturamentoDiario || fallback.receita) / 1000).toFixed(1)}k`,
          color: 'text-gray-900',
        },
        {
          label: 'Margem média',
          value: `${analytics.margemMedia.toFixed(0)}%`,
          color: 'text-primary',
        },
      ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((m, i) => (
        <div key={i} className="logta-metric-card">
          <p className="logta-metric-card__label">{m.label}</p>
          <p className={`logta-metric-card__value ${m.color}`}>{m.value}</p>
        </div>
      ))}
    </div>
  );
}

// --- Sub-View Components ---

const FRETES_EXPORT_COLUMNS = ['ID / Cliente', 'Origem → Destino', 'Motorista / Veículo', 'Status', 'Valor (R$)'];

function mapFretesToExportRows(list: any[]) {
  return list.map((frete) => [
    `${frete.numero_frete} · ${frete.cliente_nome}`,
    `${frete.origem} → ${frete.destino}`,
    `${frete.motoristas?.nome ?? '—'} · ${frete.veiculos?.placa ?? '—'}`,
    frete.status ?? '—',
    Number(frete.valor_frete || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  ]);
}

const KANBAN_STATUS_LABEL: Record<string, string> = {
  pedido: 'Pedido recebido',
  agendado: 'Coleta agendada',
  transito: 'Em trânsito',
  entrega: 'Saiu para entrega',
  concluido: 'Entregue',
  problema: 'Ocorrência',
};

const FretesListaView = ({ setIsNovoFreteOpen }: { setIsNovoFreteOpen: (open: boolean) => void }) => {
  const navigate = useNavigate();
  const { config } = useTenant();
  const { profile } = useLogtaProfile();
  const { shipments, loading } = useOperationalData();
  const [searchTerm, setSearchTerm] = React.useState('');

  const fretes = React.useMemo(
    () =>
      shipments.map((s) => ({
        id: s.id,
        numero_frete: s.numero_frete,
        cliente_nome: s.cliente_nome,
        origem: s.origin,
        destino: s.destination,
        status: s.status,
        kanbanCol: statusToKanbanCol(s.status ?? ''),
        valor_frete: s.valor_frete,
        tipo_carga: s.tipo_carga,
        motoristas: s.motoristas?.id ? { nome: s.motoristas.nome } : null,
        veiculos: s.vehicles?.plate ? { placa: s.vehicles.plate } : null,
      })),
    [shipments],
  );

  const filteredFretes = fretes.filter(f => 
    (f.numero_frete || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.cliente_nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.motoristas?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.veiculos?.placa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const emptyState = !loading && filteredFretes.length === 0 ? (
    <LogtaEmptyState type="operacoes" onAction={() => setIsNovoFreteOpen(true)} />
  ) : undefined;

  const tableContent =
    !loading && filteredFretes.length > 0 ? (
      <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">ID / Cliente</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">Origem → Destino</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">Motorista / Veículo</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">Status</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-normal text-gray-400">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredFretes.map((frete) => {
              const st = (frete.status || '').toLowerCase();
              const statusLabel = KANBAN_STATUS_LABEL[frete.kanbanCol] || frete.status;
              return (
              <tr
                key={frete.id}
                onClick={() => navigate(`/fretes/operacional/${frete.id}`)}
                className="group cursor-pointer transition-colors hover:bg-gray-50"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{frete.numero_frete}</p>
                      <p className="text-[10px] font-bold uppercase tracking-normal text-gray-500">{frete.cliente_nome}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{frete.origem}</span>
                    <ChevronRight size={12} className="my-0.5 text-gray-300" />
                    <span className="text-sm font-bold text-gray-900">{frete.destino}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-200" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{frete.motoristas?.nome || 'Não atribuído'}</p>
                      <p className="text-[10px] font-medium text-gray-500">Placa: {frete.veiculos?.placa || '---'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span
                    className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-normal ${
                      st.includes('entregue') || st === 'delivered'
                        ? 'bg-green-100 text-green-700'
                        : st.includes('atrasad') || st.includes('incident') || frete.kanbanCol === 'problema'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <p className="text-sm font-black text-gray-900">
                    R$ {Number(frete.valor_frete).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400">{frete.tipo_carga}</p>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
    ) : null;

  return (
    <LogtaDataTable
      title="Gestão de Fretes"
      filenameBase="fretes-logta"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ID, cliente, motorista, placa..."
      loading={loading}
      loadingLabel="Carregando fretes..."
      empty={emptyState}
      filteredItems={filteredFretes.length}
      totalItems={fretes.length}
      filtersSummary={searchTerm.trim() ? `Busca: "${searchTerm.trim()}"` : 'Listagem operacional completa'}
      exportMeta={{
        companyName: config.companyName,
        generatedBy: profile?.full_name?.trim() || 'Equipe Logta',
        subtitle: 'Listagem operacional de fretes',
      }}
      getExportData={(scope) => ({
        title: 'Gestão de Fretes — Logta',
        filenameBase: scope === 'all' ? 'fretes-todos' : 'fretes-filtrados',
        columns: FRETES_EXPORT_COLUMNS,
        rows: mapFretesToExportRows(scope === 'all' ? fretes : filteredFretes),
      })}
      filterSlot={
        <button
          type="button"
          className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 font-bold text-gray-500 shadow-sm transition-all hover:text-gray-900 sm:px-6 sm:py-4"
        >
          <Filter size={20} className="shrink-0" />
          <span className="whitespace-nowrap">Filtros</span>
        </button>
      }
    >
      {tableContent}
    </LogtaDataTable>
  );
};


// --- FRETE DETALHE VIEW (HIGH FIDELITY FREIGHT WORKSPACE) ---

const FreteDetalheView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useTenant();
  const { profile } = useLogtaProfile();
  const { shipments } = useOperationalData();
  const companyId = resolveDemoCompanyId(config?.id);
  const [frete, setFrete] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const [progress, setProgress] = React.useState(0);
  const [eta, setEta] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [logs, setLogs] = React.useState<FreteAuditDisplayLog[]>([]);
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [cteNumber, setCteNumber] = React.useState('---');
  const [cteStatus, setCteStatus] = React.useState('Autorizado SEFAZ');
  const [mdfeNumber, setMdfeNumber] = React.useState('---');
  const [mdfeStatus, setMdfeStatus] = React.useState('Autorizado SEFAZ');
  const [fiscalExportKind, setFiscalExportKind] = React.useState<null | 'cte' | 'mdfe'>(null);
  const [isFiscalModalOpen, setIsFiscalModalOpen] = React.useState(false);
  const [fiscalModalStep, setFiscalModalStep] = React.useState('');
  const [isOcorrenciaOpen, setIsOcorrenciaOpen] = React.useState(false);
  const [ocorrenciaTipo, setOcorrenciaTipo] = React.useState('Atraso');
  const [ocorrenciaDesc, setOcorrenciaDesc] = React.useState('');
  const viewLoggedRef = React.useRef<string | null>(null);

  const auditActor = React.useMemo(
    () => ({
      actorId: profile?.id,
      actorName: profile?.full_name?.trim() || 'Usuário do sistema',
      actorRole: profile?.role ?? undefined,
    }),
    [profile?.id, profile?.full_name, profile?.role],
  );

  const freteStorageId = String(frete?.id || id || '');

  const pushAudit = React.useCallback(
    (
      category: FreteAuditCategory,
      action: string,
      detail: string,
      metadata?: Record<string, unknown>,
    ) => {
      if (!freteStorageId) return null;
      const numeroFrete =
        String(frete?.numero_frete || frete?.metadata?.numero_frete || id || '').trim() || undefined;
      const entry = appendFreteAuditEntry({
        companyId,
        freteId: freteStorageId,
        numeroFrete,
        action,
        category,
        detail,
        actor: auditActor,
        metadata,
      });
      setLogs((prev) => [auditEntryToDisplayLog(entry), ...prev.filter((l) => l.id !== entry.id)]);
      return entry;
    },
    [auditActor, companyId, frete, freteStorageId, id],
  );

  const refreshAuditLogs = React.useCallback(() => {
    if (!freteStorageId) return;
    const history = loadFreteAuditHistory(companyId, freteStorageId);
    setLogs(history.map(auditEntryToDisplayLog));
  }, [companyId, freteStorageId]);

  React.useEffect(() => {
    let cancelled = false;

    const resolveLocal = () => {
      if (!id) return null;
      const fromCtx = findShipmentForDetail(shipments, id);
      if (fromCtx) return fromCtx;
      const sandbox = getSandboxOperationalBundle(resolveDemoCompanyId(config?.id));
      return findShipmentForDetail(sandbox.shipments, id);
    };

    const applyLocal = (row: ReturnType<typeof findShipmentForDetail>) => {
      if (!row || cancelled) return false;
      setFrete(normalizeFreteDetail(row as unknown as Record<string, unknown>, id));
      setLoading(false);
      return true;
    };

    if (!id) {
      setFrete(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    const local = resolveLocal();
    if (applyLocal(local)) {
      if (!config?.id) {
        return () => {
          cancelled = true;
        };
      }
    }

    const fetchFrete = async () => {
      const cached = resolveLocal();
      if (applyLocal(cached)) {
        if (!config?.id) return;
      }

      if (!config?.id) {
        if (!cancelled) {
          setFrete(cached ? normalizeFreteDetail(cached as unknown as Record<string, unknown>, id) : null);
          setLoading(false);
        }
        return;
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let q = supabase
        .from('shipments')
        .select('*, motoristas(*), vehicles(*)')
        .eq('company_id', config.id);
      q = isUuid ? q.eq('id', id) : q.eq('metadata->>numero_frete', id.trim());
      const { data, error } = await q.maybeSingle();
      if (cancelled) return;

      const fallback = resolveLocal();
      if (!error && data) {
        setFrete(normalizeFreteDetail(data as Record<string, unknown>, id));
      } else if (fallback) {
        setFrete(normalizeFreteDetail(fallback as unknown as Record<string, unknown>, id));
      } else {
        setFrete(null);
      }
      setLoading(false);
    };

    void fetchFrete();
    return () => {
      cancelled = true;
    };
  }, [id, config?.id, shipments]);

  React.useEffect(() => {
    if (!frete) return;
    const delivered =
      frete.status === 'Entregue' ||
      String(frete.status).toLowerCase() === 'delivered' ||
      String(frete.status).toLowerCase() === 'entregue';
    setProgress(delivered ? 100 : 0);
    setEta(delivered ? 'Entregue' : 'Calculando...');
    setStatus(frete.status);
    setCteNumber(frete.cte != null && frete.cte !== '' ? String(frete.cte) : '---');
    setMdfeNumber(frete.mdfe != null && frete.mdfe !== '' ? String(frete.mdfe) : '---');
    setCteStatus('Autorizado SEFAZ');
    setMdfeStatus('Autorizado SEFAZ');
    refreshAuditLogs();

    const viewKey = `${companyId}:${freteStorageId}`;
    if (viewLoggedRef.current !== viewKey) {
      viewLoggedRef.current = viewKey;
      const nr =
        String(frete.numero_frete || frete.metadata?.numero_frete || freteStorageId).toUpperCase();
      pushAudit(
        'visualizacao',
        'frete.detalhe_aberto',
        `Acesso ao detalhe do frete ${nr} — trilha de segurança iniciada.`,
        { ip: 'client', userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : '' },
      );
    }
  }, [frete?.id, companyId, freteStorageId, refreshAuditLogs, pushAudit]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-40">
        <Loader2 className="text-primary animate-spin" size={32} />
        <p className="text-base font-extrabold text-gray-400 uppercase tracking-normal">Carregando detalhes do frete...</p>
      </div>
    );
  }

  if (!frete) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-40">
        <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-500">
          <AlertCircle size={32} />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-gray-900">Frete não encontrado</p>
          <button onClick={() => navigate('/fretes/operacional')} className="text-xs text-primary font-bold hover:underline mt-2">Voltar para lista</button>
        </div>
      </div>
    );
  }

  const freteNorm = normalizeFreteDetail(frete as Record<string, unknown>, id) || frete;

  const freteData = {
    ...freteNorm,
    id: freteNorm.numero_frete,
    client: freteNorm.cliente_nome,
    origin: freteNorm.origem,
    dest: freteNorm.destino,
    driver: freteNorm.motoristas?.nome || 'Não atribuído',
    plate: freteNorm.veiculos?.placa || freteNorm.vehicles?.plate || '---',
    value: `R$ ${Number(frete.valor_frete).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    type: frete.tipo_carga,
    eta: frete.status === 'Entregue' ? 'Entregue' : 'Calculando...',
    distance: frete.distancia_km ? `${frete.distancia_km} km` : '--- km',
    progress: frete.status === 'Entregue' ? 100 : 0,
    driverPhone: frete.motoristas?.telefone || '---',
    driverCnh: frete.motoristas?.cnh || '---',
    cargoType: frete.tipo_carga,
    weight: frete.peso_kg ? `${frete.peso_kg} kg` : '--- kg',
    insurance: 'Logta Seguros',
    policy: '#LOGTA-998',
    driverCost: `R$ ${(Number(frete.valor_frete) * 0.6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    tollCost: frete.valor_pedagio ? `R$ ${Number(frete.valor_pedagio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
    dieselCost: frete.valor_combustivel ? `R$ ${Number(frete.valor_combustivel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
    balance: `R$ ${(Number(frete.valor_frete) * 0.4).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    cte: frete.cte || '---',
    mdfe: frete.mdfe || '---',
    logs: [
      { time: 'Recente', status: frete.status, text: `Operação de frete atualizada para ${frete.status}` }
    ]
  };

  const currentFrete = freteData;

  const handleEmitirOcorrencia = () => {
    const desc = ocorrenciaDesc.trim() || 'Sem descrição adicional';
    pushAudit(
      'ocorrencia',
      'frete.ocorrencia_registrada',
      `Ocorrência [${ocorrenciaTipo}]: ${desc}`,
      { tipo: ocorrenciaTipo, gravidade: 'media' },
    );
    setIsOcorrenciaOpen(false);
    setOcorrenciaDesc('');
    showToast('warning', `Ocorrência "${ocorrenciaTipo}" registrada no histórico de segurança.`, 'Ocorrência');
  };

  const handleEmitirCte = () => {
    pushAudit('fiscal', 'fiscal.cte_iniciado', 'Início da emissão de CT-e via SEFAZ (ambiente produção).');
    setIsFiscalModalOpen(true);
    setFiscalModalStep('Estabelecendo conexão segura com SEFAZ SP...');
    
    setTimeout(() => {
      setFiscalModalStep('Validando dados fiscais do frete e alíquotas de ICMS...');
    }, 1000);

    setTimeout(() => {
      setFiscalModalStep('Assinando digitalmente o XML com o Certificado Digital A1...');
    }, 2000);

    setTimeout(() => {
      setFiscalModalStep('Transmitindo lote de CT-e para o ambiente de produção da SEFAZ...');
    }, 3000);

    setTimeout(() => {
      setIsFiscalModalOpen(false);
      const nextNumber = String(Number(cteNumber) + 4);
      setCteNumber(nextNumber);
      setCteStatus('Autorizado SEFAZ');
      
      // Dynamic High-Fidelity Audio Feedback via native Web Audio API (success ping)
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.log(e);
      }

      pushAudit('fiscal', 'fiscal.cte_autorizado', `CT-e #${nextNumber} autorizado pela SEFAZ SP.`, {
        numero: nextNumber,
      });

      if ((window as any).showToast) {
        (window as any).showToast('success', `CT-e #${nextNumber} autorizado com sucesso pela SEFAZ de São Paulo!`, 'SEFAZ Autorizado');
      }
    }, 4200);
  };

  const startSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setProgress(0);
    setStatus('Em Trânsito');
    setEta('4h 30m');

    pushAudit(
      'simulacao',
      'frete.simulacao_iniciada',
      `Simulação de viagem iniciada — motorista ${currentFrete.driver}, placa ${currentFrete.plate}.`,
      { origem: currentFrete.origin, destino: currentFrete.dest },
    );

    showToast('info', `Motorista ${currentFrete.driver} iniciou a jornada.`, 'Viagem Iniciada');

    const timeline = [
      { 
        progress: 25, 
        eta: '3h 15m', 
        status: 'Em Trânsito', 
        log: { time: 'Agora + 2s', status: 'Em Rota', text: `Caminhão ${currentFrete.plate} em deslocamento.` },
        toast: { type: 'info', message: `Caminhão ${currentFrete.plate} em deslocamento.`, title: 'Em Rota' }
      },
      { 
        progress: 50, 
        eta: '2h 10m', 
        status: 'Em Trânsito', 
        log: { time: 'Agora + 4s', status: 'Pedágio Pago', text: 'Passou pelo pedágio automático (Tag Logta ativa).' },
        toast: { type: 'success', message: 'Passou pelo pedágio automático (Tag Logta ativa).', title: 'Pedágio Pago' }
      },
      { 
        progress: 75, 
        eta: '1h 05m', 
        status: 'Em Trânsito', 
        log: { time: 'Agora + 6s', status: 'Otimização AI', text: 'Rota otimizada pelo Logta IA para evitar congestionamento.' },
        toast: { type: 'warning', message: 'Rota otimizada pelo Logta IA.', title: 'Otimização AI' }
      },
      { 
        progress: 100, 
        eta: 'Entregue', 
        status: 'Entregue', 
        log: { time: 'Agora + 8s', status: 'Concluído', text: `Entrega concluída em ${currentFrete.dest}!` },
        toast: { type: 'success', message: `Entrega concluída em ${currentFrete.dest}!`, title: 'Entrega Concluída' }
      }
    ];

    timeline.forEach((step, index) => {
      setTimeout(() => {
        setProgress(step.progress);
        setEta(step.eta);
        setStatus(step.status);
        pushAudit('rastreamento', `frete.simulacao_etapa_${index + 1}`, step.log.text, {
          progresso: step.progress,
          eta: step.eta,
          status: step.status,
        });
        showToast(step.toast.type as any, step.toast.message, step.toast.title);
        if (index === timeline.length - 1) {
          setIsSimulating(false);
          pushAudit(
            'status',
            'frete.status_entregue',
            `Frete marcado como entregue em ${currentFrete.dest} (simulação concluída).`,
            { progresso: 100 },
          );
          void supabase.from('shipments').update({ status: 'delivered' }).eq('id', frete.id);
        }
      }, (index + 1) * 2000);
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* Back Link */}
      <button 
        onClick={() => {
          pushAudit('visualizacao', 'frete.detalhe_fechado', 'Usuário saiu do detalhe do frete (voltar para lista).');
          navigate('/fretes/operacional');
        }}
        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Voltar para Fretes
      </button>

      {/* Freight Header Card */}
      <div className="bg-transparent border-none p-0 shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center">
            <Package size={32} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">
                {freteNorm.numero_frete || frete.id}
              </h2>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-normal ${
                status === 'Entregue' ? 'bg-green-100 text-green-700' : 
                status === 'Atrasado' ? 'bg-red-100 text-red-700 animate-pulse' : 
                'bg-blue-100 text-blue-700'
              }`}>
                {status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-normal">Cliente:</span>
              <Link 
                to={`/crm/clientes/${frete.clientId}`}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 group"
              >
                {frete.client} <ExternalLink size={10} className="opacity-50 group-hover:opacity-100" />
              </Link>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setIsOcorrenciaOpen(true)}
            className="px-6 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-black text-sm uppercase tracking-normal transition-all cursor-pointer"
          >
            Emitir Ocorrência
          </button>
          <button 
            onClick={startSimulation}
            disabled={isSimulating}
            className={`px-6 py-3.5 rounded-xl font-black text-sm uppercase tracking-normal transition-all shadow-lg cursor-pointer
              ${isSimulating 
                ? 'bg-primary text-white animate-pulse shadow-primary/20 cursor-wait' 
                : 'bg-gray-900 text-white hover:bg-black shadow-gray-950/20'}`}
          >
            {isSimulating ? 'Simulando Viagem...' : 'Iniciar Simulação'}
          </button>
        </div>
      </div>

      {/* Tracking and Progress Simulator */}
      <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-normal">Acompanhamento de Rota</h3>
            <p className="text-[21px] font-black leading-tight text-gray-900">{frete.origin} → {frete.dest}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-bold uppercase">Previsão / ETA</p>
            <p className="text-lg font-black text-primary">{eta}</p>
          </div>
        </div>

        {/* Progress Bar with Truck Icon */}
        <div className="relative pt-6 pb-2">
          <div className="w-full h-2 bg-gray-100 rounded-full relative">
            <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
            <div 
              className="absolute top-1/2 -translate-y-1/2 -mt-3.5 bg-white border border-gray-200 shadow-lg w-10 h-10 rounded-full flex items-center justify-center text-primary transition-all duration-1000 ease-out"
              style={{ left: `calc(${progress}% - 20px)` }}
            >
              <Truck size={18} className="animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-normal mt-6">
            <span>{frete.origin}</span>
            <span>Distância Total: {frete.distance}</span>
            <span>{frete.dest}</span>
          </div>
        </div>
      </div>

      {/* Grid of Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT CARD: DRIVER & VEHICLE */}
        <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-4">Motorista & Veículo</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500">
              <User size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">{frete.driver}</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Placa: {frete.plate}</p>
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-gray-50 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase tracking-normal">Telefone:</span>
              <span className="font-bold text-gray-700">{frete.driverPhone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase tracking-normal">CNH Motorista:</span>
              <span className="font-bold text-gray-700">{frete.driverCnh}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase tracking-normal">Categoria Carga:</span>
              <span className="font-bold text-gray-700">{frete.cargoType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase tracking-normal">Peso Total:</span>
              <span className="font-bold text-gray-700">{frete.weight}</span>
            </div>
          </div>
        </div>

        {/* MIDDLE CARD: FINANCIAL BREAKDOWN */}
        <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-4">Custos & Financeiro</h3>
          <div className="space-y-4 text-xs font-medium">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-400 font-bold uppercase">Frete Motorista</span>
              <span className="font-bold text-gray-900">{frete.driverCost}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-400 font-bold uppercase">Pedágio Estimado</span>
              <span className="font-bold text-gray-900">{frete.tollCost}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-400 font-bold uppercase">Adiantamento Diesel</span>
              <span className="font-bold text-red-500">{frete.dieselCost}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-sm font-black">
              <span className="text-gray-900 font-bold uppercase">Saldo de Viagem</span>
              <span className="text-primary">{frete.balance}</span>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: FISCAL & SAFETY */}
        <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-4">Documentação Fiscal</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-primary" />
                <div>
                  <p className="text-xs font-bold text-gray-900">CT-e #{cteNumber}</p>
                  <p className="text-[10px] text-green-600 font-black uppercase">{cteStatus}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  pushAudit('fiscal', 'fiscal.exportar_cte', `Exportação do CT-e #${cteNumber} solicitada.`);
                  setFiscalExportKind('cte');
                }}
                className="p-2 text-gray-400 hover:text-primary transition-colors"
                title="Exportar CT-e"
              >
                <Download size={16} />
              </button>
            </div>

            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-primary" />
                <div>
                  <p className="text-xs font-bold text-gray-900">MDF-e #{mdfeNumber}</p>
                  <p className="text-[10px] text-green-600 font-black uppercase">{mdfeStatus}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  pushAudit('fiscal', 'fiscal.exportar_mdfe', `Exportação do MDF-e #${mdfeNumber} solicitada.`);
                  setFiscalExportKind('mdfe');
                }}
                className="p-2 text-gray-400 hover:text-primary transition-colors"
                title="Exportar MDF-e"
              >
                <Download size={16} />
              </button>
            </div>

            <button 
              onClick={handleEmitirCte}
              className="w-full mt-2 py-3.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-black uppercase tracking-normal transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText size={14} /> Emitir Novo CT-e (SEFAZ)
            </button>
          </div>

          <div className="pt-4 border-t border-gray-50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal mb-1">Apólice de Seguro</p>
            <p className="text-xs font-bold text-gray-700 leading-tight">{frete.insurance} ({frete.policy})</p>
          </div>
        </div>

      </div>

      {/* Histórico de segurança — trilha imutável */}
      <div className="rounded-[40px] border-2 border-primary/20 bg-primary/[0.02] p-8 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Histórico de segurança</h3>
              <p className="text-[10px] font-bold uppercase tracking-normal text-gray-500">
                Todas as ações ficam registradas por motivo de segurança e auditoria
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-white px-3 py-1 text-[9px] font-black uppercase text-primary">
            <Lock size={10} /> Trilha imutável
          </span>
        </div>
        <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Nenhum evento registrado ainda.</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-gray-400">{log.time}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[8px] font-black uppercase text-primary">
                      {log.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-gray-800">{log.text}</p>
                  <p className="mt-1 text-[10px] font-medium text-gray-500">
                    Por: <span className="font-bold text-gray-700">{log.actor}</span>
                    {log.action !== 'ephemeral' ? (
                      <span className="ml-2 text-gray-400">· {log.action}</span>
                    ) : null}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isOcorrenciaOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Fechar"
            onClick={() => setIsOcorrenciaOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-[28px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl">
            <h3 className="text-lg font-black">Registrar ocorrência</h3>
            <p className="mt-1 text-xs text-neutral-400">Será gravado no histórico de segurança do frete.</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">Tipo</label>
                <select
                  value={ocorrenciaTipo}
                  onChange={(e) => setOcorrenciaTipo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold"
                >
                  <option>Atraso</option>
                  <option>Avaria</option>
                  <option>Desvio de rota</option>
                  <option>Acidente</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">Descrição</label>
                <textarea
                  value={ocorrenciaDesc}
                  onChange={(e) => setOcorrenciaDesc(e.target.value)}
                  rows={3}
                  placeholder="Descreva o que aconteceu..."
                  className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold placeholder-neutral-500"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsOcorrenciaOpen(false)}
                className="flex-1 rounded-xl border border-neutral-700 py-3 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEmitirOcorrencia}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold"
              >
                Registrar no histórico
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ExportFormatModal
        open={fiscalExportKind !== null}
        onClose={() => setFiscalExportKind(null)}
        title="Exportar documento fiscal"
        getTabularData={() => {
          const kind = fiscalExportKind ?? 'cte';
          if (kind === 'mdfe') {
            return {
              title: `MDF-e nº ${mdfeNumber} — Frete ${currentFrete.id}`,
              filenameBase: `mdfe-${mdfeNumber}`,
              columns: ['Campo', 'Valor'],
              rows: [
                ['Documento', 'MDF-e'],
                ['Número', String(mdfeNumber)],
                ['Status SEFAZ', mdfeStatus],
                ['Frete', String(currentFrete.id)],
                ['Cliente', String(currentFrete.client)],
                ['Origem', String(currentFrete.origin)],
                ['Destino', String(currentFrete.dest)],
              ],
            };
          }
          return {
            title: `CT-e nº ${cteNumber} — Frete ${currentFrete.id}`,
            filenameBase: `cte-${cteNumber}`,
            columns: ['Campo', 'Valor'],
            rows: [
              ['Documento', 'CT-e'],
              ['Número', String(cteNumber)],
              ['Status SEFAZ', cteStatus],
              ['Frete', String(currentFrete.id)],
              ['Cliente', String(currentFrete.client)],
              ['Origem', String(currentFrete.origin)],
              ['Destino', String(currentFrete.dest)],
            ],
          };
        }}
      />

      {isFiscalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm animate-in zoom-in-95 rounded-[40px] border border-neutral-800 bg-[#18191B] p-8 text-center shadow-2xl duration-300">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText size={32} className="animate-pulse" />
            </div>
            <h3 className="mb-2 text-lg font-black text-white">Conexão SEFAZ Ativa</h3>
            <div className="mx-auto my-6 h-10 w-10 animate-spin rounded-full border-4 border-neutral-800 border-t-primary" />
            <p className="min-h-[40px] text-xs font-bold leading-relaxed text-neutral-400 transition-all">{fiscalModalStep}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const FretesKanbanView = () => {
  const navigate = useNavigate();
  const { config } = useTenant();
  const { shipments, loading: dataLoading, refresh } = useOperationalData();
  const [selectedFrete, setSelectedFrete] = React.useState<any>(null);
  const [motoristaLink, setMotoristaLink] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const dragState = React.useRef({ active: false, startX: 0, scrollLeft: 0 });

  const fretes = React.useMemo(
    () =>
      shipments.map((s) => ({
        id: s.id,
        numero_frete: s.numero_frete,
        cliente_nome: s.cliente_nome,
        origem: s.origin,
        destino: s.destination,
        status: s.status,
        valor_frete: s.valor_frete,
        motoristas: s.motoristas?.id ? { id: s.motoristas.id, nome: s.motoristas.nome } : null,
        veiculos: s.vehicles?.plate ? { placa: s.vehicles.plate } : null,
      })),
    [shipments],
  );

  const loading = dataLoading;

  const columns = [
    { id: 'pedido', label: 'Pedido Recebido', color: 'bg-gray-400' },
    { id: 'agendado', label: 'Coleta Agendada', color: 'bg-purple-500' },
    { id: 'transito', label: 'Em Trânsito', color: 'bg-blue-500' },
    { id: 'entrega', label: 'Saiu para Entrega', color: 'bg-yellow-500' },
    { id: 'concluido', label: 'Entregue', color: 'bg-green-500' },
    { id: 'problema', label: 'Ocorrências', color: 'bg-red-500' },
  ];

  React.useEffect(() => {
    const onRefresh = () => void refresh();
    window.addEventListener('frete_created', onRefresh);
    window.addEventListener('logta-operational-sync', onRefresh);
    return () => {
      window.removeEventListener('frete_created', onRefresh);
      window.removeEventListener('logta-operational-sync', onRefresh);
    };
  }, [refresh]);

  React.useEffect(() => {
    if (!selectedFrete || !config?.id) {
      setMotoristaLink('');
      return;
    }
    const session = getOrCreateMotoristaLink({
      companyId: config.id,
      shipmentId: selectedFrete.id,
      numeroFrete: selectedFrete.numero_frete,
      clienteNome: selectedFrete.cliente_nome,
      origem: selectedFrete.origem,
      destino: selectedFrete.destino,
      motoristaId: selectedFrete.motoristas?.id,
      motoristaNome: selectedFrete.motoristas?.nome,
      placa: selectedFrete.veiculos?.placa,
      shipmentStatus: selectedFrete.status,
    });
    setMotoristaLink(motoristaPublicUrl(session.token));
  }, [selectedFrete, config?.id]);

  const progressForStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('entregue')) return 100;
    if (s.includes('atrasad')) return 35;
    if (s.includes('trânsito') || s.includes('transito')) return 65;
    if (s.includes('entrega')) return 85;
    if (s.includes('agendad') || s.includes('coleta')) return 40;
    return 15;
  };

  const handleBoardMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-kanban-card]')) return;
    if ((e.target as HTMLElement).closest('a')) return;
    const el = scrollRef.current;
    if (!el) return;
    dragState.current = { active: true, startX: e.pageX, scrollLeft: el.scrollLeft };
  };

  const handleBoardMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current.active || !scrollRef.current) return;
    e.preventDefault();
    const dx = e.pageX - dragState.current.startX;
    scrollRef.current.scrollLeft = dragState.current.scrollLeft - dx;
  };

  const handleBoardMouseUp = () => {
    dragState.current.active = false;
  };

  if (loading) {
    return <LogtaMapLoadingPanel label="Carregando Kanban..." minHeight="420px" />;
  }

  return (
    <>
      <div
        ref={scrollRef}
        onMouseDown={handleBoardMouseDown}
        onMouseMove={handleBoardMouseMove}
        onMouseUp={handleBoardMouseUp}
        onMouseLeave={handleBoardMouseUp}
        className="flex cursor-grab gap-6 overflow-x-auto pb-8 select-none scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent active:cursor-grabbing"
      >
        {columns.map((col) => {
          const colFretes = fretes.filter((f) => statusToKanbanCol(f.status ?? '') === col.id);
          return (
            <div key={col.id} className="flex min-w-[320px] flex-col rounded-[32px] border border-gray-100 bg-gray-50/50 p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="logta-kanban-column-title flex items-center gap-2">
                  <div className={`h-2 w-2 shrink-0 rounded-full ${col.color}`} />
                  {col.label}
                </h3>
                <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-gray-400 shadow-sm">
                  {colFretes.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-4">
                {colFretes.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-gray-200 bg-white/60 py-8 text-center text-[10px] font-bold uppercase text-gray-400">
                    Nenhum frete neste estágio
                  </p>
                ) : (
                  colFretes.map((frete) => {
                    const pct = progressForStatus(frete.status ?? '');
                    const crmSlug = clienteNomeToCrmSlug(frete.cliente_nome ?? '');
                    const motoristaId = frete.motoristas?.id;
                    return (
                      <div
                        key={frete.id}
                        data-kanban-card
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setSelectedFrete(frete)}
                        className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-primary/30"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="rounded-lg bg-primary/5 px-2 py-1 text-[10px] font-black uppercase tracking-normal text-primary">
                            {frete.numero_frete}
                          </span>
                          <Activity size={12} className="text-gray-300" />
                        </div>
                        <h4 className="logta-kanban-card-title mb-2 transition-colors group-hover:text-primary">
                          {frete.cliente_nome}
                        </h4>
                        <div className="mb-4 flex justify-between text-[10px] font-bold uppercase text-gray-400">
                          <span className="truncate pr-1">{frete.origem}</span>
                          <ChevronRight size={10} className="shrink-0 self-center" />
                          <span className="truncate pl-1">{frete.destino}</span>
                        </div>
                        <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/crm/clientes/${crmSlug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="relative z-10 h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-gray-100 ring-1 ring-gray-100 transition-all hover:ring-primary/40"
                              title="Ver cliente"
                            >
                              <img src={KANBAN_CLIENT_AVATAR} alt="" className="h-full w-full object-cover" />
                            </Link>
                            <Link
                              to={motoristaId ? `/rh/equipe/${motoristaId}` : '/rh/equipe'}
                              onClick={(e) => e.stopPropagation()}
                              className="relative z-10 h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-gray-100 ring-1 ring-gray-100 transition-all hover:ring-primary/40"
                              title="Ver colaborador"
                            >
                              <img src={KANBAN_DRIVER_AVATAR} alt="" className="h-full w-full object-cover" />
                            </Link>
                            <span className="text-[10px] font-bold text-gray-600">
                              {frete.motoristas?.nome?.split(' ')[0] || '—'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">{frete.status}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedFrete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-label="Fechar"
            onClick={() => setSelectedFrete(null)}
          />
          <div className="relative w-full max-w-md animate-in zoom-in-95 rounded-[40px] border border-neutral-800 bg-[#18191B] p-6 text-left shadow-2xl duration-200">
            <LogtaModalHeader
              icon={Truck}
              title={selectedFrete.cliente_nome}
              onClose={() => setSelectedFrete(null)}
            />
            <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-primary">{selectedFrete.numero_frete}</p>
            <p className="mt-2 text-xs text-neutral-400">
              {selectedFrete.origem} → {selectedFrete.destino}
            </p>
            <div className="mt-4 space-y-2 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 text-xs text-neutral-200">
              <p>
                <span className="font-bold text-neutral-500">Status: </span>
                {selectedFrete.status}
              </p>
              <p>
                <span className="font-bold text-neutral-500">Motorista: </span>
                {selectedFrete.motoristas?.nome || '—'}
              </p>
              <p>
                <span className="font-bold text-neutral-500">Placa: </span>
                {selectedFrete.veiculos?.placa || '—'}
              </p>
              <p>
                <span className="font-bold text-neutral-500">Valor: </span>R${' '}
                {Number(selectedFrete.valor_frete || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {motoristaLink ? (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <p className="text-[10px] font-black uppercase text-primary">Link operacional do motorista</p>
                <p className="mt-2 break-all text-[11px] font-semibold text-neutral-200">{motoristaLink}</p>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(motoristaLink);
                    showToast('success', 'Link copiado. Envie ao motorista pelo WhatsApp.', 'Motorista');
                  }}
                  className="mt-3 w-full rounded-xl border border-primary/40 bg-primary/20 py-2.5 text-[10px] font-bold uppercase text-white hover:bg-primary/30"
                >
                  Copiar link para o motorista
                </button>
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  navigate(`/fretes/operacional/${selectedFrete.id}`);
                  setSelectedFrete(null);
                }}
                className="min-w-[140px] flex-1 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-md shadow-primary/20 transition-opacity hover:opacity-90"
              >
                Abrir ficha completa
              </button>
              <button
                type="button"
                onClick={() => setSelectedFrete(null)}
                className="rounded-xl border border-neutral-700 px-4 py-3 text-xs font-bold text-neutral-300 transition-colors hover:bg-neutral-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function FretesRastreamentoView() {
  const navigate = useNavigate();
  const { shipments, activeAlerts } = useFretesIntelligence();
  const vehicles = React.useMemo(
    () =>
      shipments.slice(0, 8).map((s, i) => ({
        id: i + 1,
        driver: s.motoristas?.nome || 'Motorista',
        plate: s.vehicles?.plate || '—',
        x: 15 + (i % 4) * 22,
        y: 20 + Math.floor(i / 4) * 35,
        speed: (s.status || '').toLowerCase().includes('transit') ? '54 km/h' : '0 km/h',
        status: (s.status || '').toLowerCase().includes('transit') ? 'Em Rota' : 'Parado',
        shipmentId: s.id,
      })),
    [shipments],
  );

  const ocorrencias = React.useMemo(() => {
    const fromAlerts = activeAlerts.slice(0, 5).map((a) => ({
      type: a.priority === 'critical' ? 'Atraso' : 'Operação',
      desc: a.message,
      time: 'Agora',
      color: a.priority === 'critical' ? 'text-red-500' : 'text-amber-500',
      path: a.actionPath,
    }));
    if (fromAlerts.length) return fromAlerts;
    return [
      { type: 'Atraso', desc: 'Congestionamento na BR-116', time: '10m', color: 'text-red-500', path: '/fretes/kanban' },
      { type: 'Avaria', desc: 'Caixa danificada no descarregamento', time: '2h', color: 'text-red-500', path: '/fretes/kanban' },
    ];
  }, [activeAlerts]);

  return (
  <div className="grid grid-cols-1 gap-8 text-left lg:grid-cols-3">
    <div className="relative min-h-[480px] h-[min(560px,calc(100dvh-14rem))] overflow-hidden rounded-[20px] border border-gray-200 bg-gray-50 lg:col-span-2">
      <OperationalMapCanvas
        className="absolute inset-0 h-full w-full"
        showMetricsBubble
        showHeroCar={false}
        vehicles={vehicles}
      />
      <div className="pointer-events-none absolute left-0 right-0 top-6 z-30 flex justify-center px-4">
        <div className="rounded-2xl border border-white/60 bg-white/90 px-5 py-3 text-center shadow-xl backdrop-blur-md">
          <h3 className="logta-card-heading">Mapa de Rastreamento Live</h3>
          <p className="text-sm font-medium text-gray-500">Mesmo mapa operacional do Mapa ao vivo — veículos em tempo real.</p>
        </div>
      </div>
      <div className="pointer-events-auto absolute bottom-8 left-8 right-8 z-30 flex gap-4">
        {vehicles.slice(0, 2).map((v, i) => (
          <div
            key={i}
            className="flex flex-1 items-center gap-4 rounded-2xl border border-white/50 bg-white/90 p-4 shadow-xl backdrop-blur-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900">
                {v.driver} ({v.plate})
              </p>
              <p className="text-[10px] font-bold text-gray-500">
                {v.status} • {v.speed}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-6">
      <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="logta-card-heading mb-6">Ocorrências Recentes</h3>
        <div className="space-y-4">
          {ocorrencias.map((oc, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(oc.path || '/fretes/kanban')}
              className="flex w-full items-start gap-3 rounded-2xl border border-transparent bg-gray-50 p-4 text-left transition-all hover:border-gray-100 hover:bg-white"
            >
              <div className={`rounded-lg bg-white p-2 shadow-sm ${oc.color}`}>
                <AlertCircle size={16} />
              </div>
              <div>
                <p className={`mb-0.5 text-xs font-black uppercase tracking-normal ${oc.color}`}>{oc.type}</p>
                <p className="text-xs font-medium leading-relaxed text-gray-600">{oc.desc}</p>
                <p className="mt-1 text-[10px] font-bold text-gray-400">{oc.time}</p>
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate('/fretes/kanban')}
          className="mt-6 w-full rounded-xl border border-gray-100 bg-gray-50 py-3 text-xs font-bold text-gray-500 transition-all hover:bg-gray-100"
        >
          Ver todas ocorrências
        </button>
      </div>
    </div>
  </div>
  );
}


export default Fretes;

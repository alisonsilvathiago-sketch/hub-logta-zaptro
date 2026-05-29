import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  RhModuleHub,
  RhFeatureRoute,
  RhExecutiveDashboard,
  RhAdminSectionDashboard,
  RhAlertasView,
  RhDocumentosView,
  ColaboradorJornadaView,
  EquipeInteligenteView,
  ColaboradorEquipePerfilView,
  mergeRhColaboradores,
  canManageRhEquipe,
  NovoColaboradorModal,
  isRhAdministrativoSectionId,
  type RhColaboradorListItem,
  resolveEquipeListRouteId,
} from '../modules/rh';
import { resolveDemoCompanyId, seedLocalSandboxModules, shouldUseLogtaSandbox } from '../lib/seed';
import type { RhAdminHubId, RhAdministrativoSectionId } from '../modules/rh';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { 
  Users, 
  Truck, 
  Activity, 
  DollarSign, 
  Clock, 
  FileText, 
  AlertCircle, 
  Plus, 
  ChevronRight, 
  Star,
  Calendar,
  Briefcase,
  Award,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { useOperationalData } from '../contexts/OperationalDataContext';
import { LogtaEmptyState } from '../components/EmptyState';
import { useLogtaProfile } from '../contexts/LogtaProfileContext';
import { LogtaWaveTabStrip } from '../components/LogtaWaveTabStrip';
import { LogtaModuleHeader } from '../components/LogtaModuleHeader';
import { showToast } from '../components/Toast';
import { LogtaStandardPageLayout } from '../components/LogtaStandardPageLayout';

const RH = () => {
  const location = useLocation();
  const isDetailPage = /^\/rh\/(equipe|motoristas)\/.+/.test(location.pathname);
  const { config } = useTenant();
  const {
    motoristas: opMotoristas,
    profiles: opProfiles,
    refresh: refreshOperational,
    lastSyncAt,
  } = useOperationalData();
  const { profile: logtaProfile } = useLogtaProfile();
  const canManageEquipe = canManageRhEquipe(logtaProfile);
  const [loading, setLoading] = useState(true);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    motoristasAtivos: 0,
    folhaEst: 'R$ 0',
    alertas: 0
  });
  const [isColaboradorOpen, setIsColaboradorOpen] = useState(false);

  const applyEquipeState = (
    companyId: string,
    perfis: RhColaboradorListItem[],
    mot: typeof opMotoristas,
  ) => {
    const motList = opMotoristas.length > 0 ? opMotoristas : mot;
    const opList: RhColaboradorListItem[] = (opProfiles || []).map((p) => {
      const row = p as RhColaboradorListItem & { fullName?: string };
      const full_name = row.full_name || row.fullName || 'Colaborador';
      const equipeRouteId = resolveEquipeListRouteId({
        equipeRouteId: row.equipeRouteId,
        id: row.id,
        full_name,
        email: row.email,
      });
      return {
        ...row,
        id: equipeRouteId,
        equipeRouteId,
        full_name,
        created_at: row.created_at || new Date().toISOString(),
      };
    });
    const mergedEquipe = mergeRhColaboradores(companyId, perfis, opList, motList);
    setColaboradores(mergedEquipe);
    setMotoristas(motList);

    const totalColab = mergedEquipe.length;
    const totalMot =
      motList.filter((m) => m.status === 'ativo' || m.status === 'active').length || 0;

    const alertasDocs = motList.filter((m) => {
      if (!m.cnh_vencimento) return false;
      const venc = new Date(m.cnh_vencimento);
      if (Number.isNaN(venc.getTime())) return false;
      const diff = (venc.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff <= 60;
    }).length;

    setStats({
      total: totalColab,
      motoristasAtivos: totalMot,
      folhaEst: `R$ ${(totalColab * 4500).toLocaleString('pt-BR')}`,
      alertas: alertasDocs,
    });
  };

  const fetchData = async () => {
    const companyId = resolveDemoCompanyId(config?.id);
    if (shouldUseLogtaSandbox()) {
      seedLocalSandboxModules(companyId);
    }

    setLoading(true);
    let perfis: RhColaboradorListItem[] = [];
    let mot: typeof opMotoristas = [];

    try {
      const [profRes, motRes] = await Promise.all([
        config?.id
          ? supabase.from('profiles').select('*').eq('company_id', config.id)
          : Promise.resolve({ data: [], error: null }),
        config?.id
          ? supabase.from('motoristas').select('*').eq('company_id', config.id)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!profRes.error) perfis = (profRes.data || []) as RhColaboradorListItem[];
      if (!motRes.error) mot = motRes.data || [];
    } catch (error: unknown) {
      console.error('Erro ao buscar dados do RH:', error);
      if (!shouldUseLogtaSandbox()) {
        (window as any).showToast?.(
          'error',
          'Não foi possível carregar os dados do RH. Exibindo equipe disponível no ambiente.',
          'Erro de Conexão',
        );
      }
    }

    applyEquipeState(companyId, perfis, mot);
    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, [config?.id, opProfiles, opMotoristas]);

  useEffect(() => {
    const onTeamUpdate = () => void fetchData();
    window.addEventListener('logta-rh-team-updated', onTeamUpdate);
    window.addEventListener('logta-operational-sync', onTeamUpdate);
    return () => {
      window.removeEventListener('logta-rh-team-updated', onTeamUpdate);
      window.removeEventListener('logta-operational-sync', onTeamUpdate);
    };
  }, [config?.id]);

  const jornadaPontoTab = {
    id: 'jornada-ponto',
    label: 'Jornada & Ponto',
    shortLabel: 'Jornada',
    icon: Clock,
    path: '/rh/jornada-ponto/controle-ponto',
    matchPath: '/rh/jornada-ponto',
  };

  const tabs = [
    { id: 'dashboard', label: 'Painel', shortLabel: 'Painel', icon: Activity, path: '/rh/dashboard' },
    { id: 'equipe', label: 'Equipe', shortLabel: 'Equipe', icon: Users, path: '/rh/equipe' },
    { id: 'motoristas', label: 'Motoristas', shortLabel: 'Mot.', icon: Truck, path: '/rh/motoristas' },
    { id: 'documentos', label: 'Documentos', shortLabel: 'Docs', icon: FileText, path: '/rh/documentos' },
    { id: 'desempenho', label: 'Ranking', shortLabel: 'Rank', icon: Award, path: '/rh/desempenho' },
    { id: 'administrativo', label: 'Administrativo', shortLabel: 'Admin', icon: Briefcase, path: '/rh/administrativo' },
    { id: 'documentos-compliance', label: 'Documentos & Compliance', shortLabel: 'Compliance', icon: ShieldCheck, path: '/rh/documentos-compliance' },
    { id: 'operacional', label: 'Operacional', shortLabel: 'Oper.', icon: Truck, path: '/rh/operacional' },
  ];

  if (isDetailPage) {
    return (
      <div className="logta-page logta-page--flush h-full w-full min-h-0 overflow-y-auto text-left scrollbar-hide">
        <Routes>
          <Route path="equipe/:id/*" element={<ColaboradorEquipePerfilView />} />
          <Route path="equipe/:id" element={<ColaboradorEquipePerfilView />} />
          <Route path="motoristas/:id/*" element={<ColaboradorEquipePerfilView />} />
          <Route path="motoristas/:id" element={<ColaboradorEquipePerfilView />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="logta-page w-full min-h-0 flex-1 space-y-8">
      <LogtaModuleHeader
        title="Recursos Humanos"
        subtitle="Centro operacional inteligente para transportadoras — equipe, jornada, documentos e frota."
        tabs={
          <LogtaWaveTabStrip
            tabs={tabs}
            trailingTabs={[jornadaPontoTab]}
            basePath="/rh"
            defaultTabId="dashboard"
          />
        }
      />

      {/* Rotas sempre montadas para as abas funcionarem; loading só indica sincronização */}
      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500">
            <Loader2 size={18} className="shrink-0 animate-spin text-primary" />
            Sincronizando base de RH com o Supabase…
          </div>
        ) : null}
        <Routes>
          <Route index element={<Navigate to="/rh/dashboard" replace />} />
          <Route
            path="administrativo/controle-ponto"
            element={<Navigate to="/rh/jornada-ponto/controle-ponto" replace />}
          />
          <Route path="dashboard" element={<RhExecutiveDashboard stats={stats} />} />
          <Route
            path="administrativo"
            element={
              <RhModuleHub
                category="admin"
                adminHubId="administrativo"
                title="RH Administrativo"
                subtitle="Pessoas, performance, comunicação e governança para sua transportadora."
              />
            }
          />
          <Route
            path="administrativo/pessoas"
            element={
              <RhAdminSectionDashboard
                sectionId="pessoas"
                colaboradoresCount={colaboradores.length}
                motoristasCount={motoristas.length}
              />
            }
          />
          <Route
            path="administrativo/performance"
            element={
              <RhAdminSectionDashboard
                sectionId="performance"
                colaboradoresCount={colaboradores.length}
                motoristasCount={motoristas.length}
              />
            }
          />
          <Route
            path="administrativo/comunicacao"
            element={
              <RhAdminSectionDashboard
                sectionId="comunicacao"
                colaboradoresCount={colaboradores.length}
                motoristasCount={motoristas.length}
              />
            }
          />
          <Route
            path="administrativo/governanca"
            element={
              <RhAdminSectionDashboard
                sectionId="governanca"
                colaboradoresCount={colaboradores.length}
                motoristasCount={motoristas.length}
              />
            }
          />
          <Route
            path="administrativo/:slug"
            element={
              <RhAdminFeaturePage
                adminHubId="administrativo"
                colaboradoresCount={colaboradores.length}
                motoristasCount={motoristas.length}
                colaboradores={colaboradores}
              />
            }
          />
          <Route
            path="jornada-ponto"
            element={
              <RhModuleHub
                category="admin"
                adminHubId="jornada-ponto"
                title="Jornada & Ponto"
                subtitle="Escalas, batidas de ponto, banco de horas, folgas, férias e geolocalização."
                colaboradoresCount={colaboradores.length}
              />
            }
          />
          <Route
            path="jornada-ponto/colaborador/:id"
            element={<ColaboradorJornadaPage />}
          />
          <Route
            path="jornada-ponto/:slug"
            element={
              <RhAdminFeaturePage
                adminHubId="jornada-ponto"
                colaboradoresCount={colaboradores.length}
                motoristasCount={motoristas.length}
                colaboradores={colaboradores}
              />
            }
          />
          <Route
            path="documentos-compliance"
            element={
              <RhModuleHub
                category="admin"
                adminHubId="documentos-compliance"
                title="Documentos & Compliance"
                subtitle="Documentação, CNH, exames, vencimentos, assinatura digital e conformidade."
              />
            }
          />
          <Route
            path="documentos-compliance/:slug"
            element={
              <RhAdminFeaturePage
                adminHubId="documentos-compliance"
                colaboradoresCount={colaboradores.length}
                motoristasCount={motoristas.length}
                colaboradores={colaboradores}
              />
            }
          />
          <Route
            path="operacional"
            element={
              <RhModuleHub
                category="operational"
                title="RH Operacional"
                subtitle="Motoristas, viagens, jornada na estrada, KPIs e integrações logísticas."
                excludeSectionIds={['equipe-op']}
              />
            }
          />
          <Route
            path="operacional/:slug"
            element={
              <RhOperacionalFeaturePage
                colaboradoresCount={colaboradores.length}
                motoristasCount={motoristas.length}
              />
            }
          />
          <Route path="documentos" element={<RhDocumentosView motoristas={motoristas} />} />
          <Route
            path="equipe"
            element={
              <EquipeInteligenteView
                colaboradores={colaboradores}
                motoristas={motoristas}
                loading={loading}
                onNewColaborador={() => setIsColaboradorOpen(true)}
                canManageEquipe={canManageEquipe}
              />
            }
          />
          <Route
            path="equipe/:id/*"
            element={<ColaboradorEquipePerfilView />}
          />
          <Route
            path="motoristas/:id/*"
            element={<ColaboradorEquipePerfilView />}
          />
          <Route path="motoristas" element={<MotoristasManagementView motoristas={motoristas} onNewColaborador={() => setIsColaboradorOpen(true)} />} />
          <Route path="desempenho" element={<PerformanceRankingView motoristas={motoristas} />} />
        </Routes>
      </div>

      <NovoColaboradorModal
        open={isColaboradorOpen}
        companyId={config?.id}
        onClose={() => setIsColaboradorOpen(false)}
        onSaved={() => {
          void refreshOperational();
          void fetchData();
        }}
      />
    </div>
  );
};

// --- Sub-View Components ---

function RhAdminFeaturePage({
  adminHubId,
  colaboradoresCount,
  motoristasCount,
  colaboradores,
}: {
  adminHubId: RhAdminHubId;
  colaboradoresCount: number;
  motoristasCount: number;
  colaboradores: RhColaboradorListItem[];
}) {
  const { slug } = useParams();
  if (adminHubId === 'administrativo' && slug && isRhAdministrativoSectionId(slug)) {
    return (
      <RhAdminSectionDashboard
        sectionId={slug as RhAdministrativoSectionId}
        colaboradoresCount={colaboradoresCount}
        motoristasCount={motoristasCount}
      />
    );
  }
  return (
    <RhFeatureRoute
      category="admin"
      slug={slug ?? ''}
      adminHubId={adminHubId}
      colaboradoresCount={colaboradoresCount}
      motoristasCount={motoristasCount}
      colaboradores={colaboradores}
    />
  );
}

function ColaboradorJornadaPage() {
  return <ColaboradorJornadaView hubPath="/rh/jornada-ponto" hubLabel="Jornada & Ponto" />;
}

function RhOperacionalFeaturePage({
  colaboradoresCount,
  motoristasCount,
}: {
  colaboradoresCount: number;
  motoristasCount: number;
}) {
  const { slug } = useParams();
  return (
    <RhFeatureRoute
      category="operational"
      slug={slug ?? ''}
      colaboradoresCount={colaboradoresCount}
      motoristasCount={motoristasCount}
    />
  );
}


const MotoristasManagementView = ({ motoristas, onNewColaborador }: { motoristas: any[]; onNewColaborador: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const filtered = motoristas.filter((driver) => {
    const matchesSearch = (driver.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
    const status = (driver.status || '').toLowerCase();
    const matchesStatus = 
      statusFilter === 'todos' || 
      (statusFilter === 'inativo' && (status === 'inativo' || status === 'afastado')) ||
      status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const afastadosCount = motoristas.filter((d) => ['inativo', 'afastado'].includes((d.status || '').toLowerCase())).length;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            placeholder={`Pesquisar entre ${motoristas.length} motoristas...`}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-primary/50" 
            type="search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="hidden lg:flex items-center gap-4 text-xs font-black uppercase tracking-wide">
          <span className="text-gray-400">{filtered.length} Motorista{filtered.length !== 1 ? 's' : ''}</span>
          {afastadosCount > 0 && (
            <span className="text-red-400 bg-red-50 px-2 py-1 rounded-md">{afastadosCount} Afastado{afastadosCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto scrollbar-hide">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-bold text-gray-700 shadow-sm outline-none cursor-pointer"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativo">Ativos</option>
            <option value="em_rota">Em Rota</option>
            <option value="inativo">Inativos / Afastados</option>
          </select>
          <button 
            onClick={onNewColaborador}
            title="Novo Motorista"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white hover:opacity-90 shadow-sm transition-all shrink-0"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((driver: any, i: number) => (
        <div key={i} className="logta-panel-card p-8 transition-all group hover:shadow-md">
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 border-4 border-primary overflow-hidden shadow-sm group-hover:scale-105 transition-all flex items-center justify-center">
              {(driver.avatar_url || driver.perfis?.avatar_url) ? <img src={driver.avatar_url || driver.perfis?.avatar_url} className="w-full h-full object-cover" /> : <Truck size={30} className="text-gray-300" />}
            </div>
            <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-xl">
              <Star size={14} fill="currentColor" />
              <span className="text-xs font-black">{driver.rating || '5.0'}</span>
            </div>
          </div>
          <div className="space-y-1 mb-6">
            <h4 className="logta-card-heading">{driver.nome || 'Motorista'}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-normal">CNH {driver.cnh_categoria || '-'} ({driver.cnh_vencimento || 'N/A'})</p>
          </div>
          <div className="space-y-3 pt-6 border-t border-gray-50">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-400">Status Operacional</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${driver.status === 'ativo' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {driver.status}
              </span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-400">Documento</span>
              <span className="text-gray-900 font-bold">{driver.cnh_numero || 'Pendente'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <Link to={`/rh/equipe/${driver.id}`} className="py-3 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-bold hover:bg-gray-100 transition-all text-center flex items-center justify-center">Perfil</Link>
            <Link to={`/rh/equipe/${driver.id}?tab=documentos`} className="py-3 bg-gray-900 text-white rounded-xl text-[10px] font-bold hover:bg-black transition-all text-center flex items-center justify-center">Documentos</Link>
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="col-span-full">
          <LogtaEmptyState type="rh" onAction={onNewColaborador} />
        </div>
      )}
    </div>
  </div>
  );
};

const PerformanceRankingView = ({ motoristas = [] }: { motoristas?: any[] }) => {
  const [selectedMotorista, setSelectedMotorista] = React.useState<any | null>(null);
  const sorted = [...motoristas].sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5));

  const kpis = [
    { title: 'Média da Equipe', value: '8.7', trend: 'up' as const, trendValue: '+0.3 pts', icon: Award },
    { title: 'Avaliações Feitas', value: motoristas.length.toString(), icon: Users },
    { title: 'Assiduidade', value: '94%', trend: 'up' as const, trendValue: '+2%', icon: ShieldCheck },
    { title: 'Meta de Jornada', value: '88%', trend: 'down' as const, trendValue: '-1.2%', icon: Clock },
  ];

  const sidePanel = (
    <>
      <div className="rounded-[24px] bg-blue-50/50 border border-blue-200 p-6 relative overflow-hidden">
        <h3 className="logta-card-heading mb-4 text-blue-900">Métricas de Retenção</h3>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black text-blue-500/70 uppercase tracking-normal mb-1">Turnover Mês</p>
            <h4 className="text-xl font-black text-blue-950">2.4%</h4>
            <p className="text-[10px] text-green-600 font-bold flex items-center gap-1"><TrendingUp size={12} className="rotate-180" /> -0.8% saudável</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-500/70 uppercase tracking-normal mb-1">Tempo Médio Casa</p>
            <h4 className="text-xl font-black text-blue-950">2.8 anos</h4>
          </div>
        </div>
      </div>
      <div className="logta-panel-card p-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Assiduidade 100%</h3>
        <div className="space-y-3">
          {sorted.slice(0, 3).map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-black text-[10px]">100%</div>
              <div>
                <p className="text-xs font-bold text-gray-900 line-clamp-1">{m.nome || 'Motorista'}</p>
                <p className="text-[10px] font-medium text-gray-400">Zero faltas no ano</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <LogtaStandardPageLayout
        title="Ranking de Desempenho"
        kpis={kpis}
        onExportPdf={() => showToast('info', 'Exportando PDF...', 'RH')}
        onExportExcel={() => showToast('info', 'Exportando Excel...', 'RH')}
        mainContentTitle="Top Performance (Mês)"
        sidePanel={sidePanel}
      >
        {sorted.map((p, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedMotorista(p)}
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-sm cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-primary font-black text-sm shrink-0">
                #{i+1}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 line-clamp-1">{p.nome || 'Motorista'}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{p.funcao || 'Motorista'}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <p className="text-sm font-black text-primary">{Number(p.rating || 5).toFixed(1)} <span className="text-[10px]">pts</span></p>
                <p className="text-[10px] text-green-500 font-bold">+1.2%</p>
              </div>
              <ChevronRight size={18} className="text-gray-300 hidden sm:block group-hover:text-primary transition-colors" />
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-xs text-gray-400 font-medium">Nenhum motorista avaliado.</p>
        )}
      </LogtaStandardPageLayout>

      {/* Modal permanece igual */}
      {selectedMotorista && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onClick={() => setSelectedMotorista(null)}>
          <div className="w-full max-w-lg animate-in zoom-in-95 rounded-[40px] border border-neutral-800 bg-[#18191B] p-8 shadow-2xl duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                  #{sorted.findIndex(m => m.id === selectedMotorista.id) + 1}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{selectedMotorista.nome || 'Colaborador'}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase">{selectedMotorista.funcao || 'Motorista'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMotorista(null)} className="text-gray-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-neutral-900/50 rounded-2xl p-4 border border-neutral-800">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Pontuação Geral</p>
                <p className="text-2xl font-black text-primary mt-1">{Number(selectedMotorista.rating || 5).toFixed(1)}</p>
              </div>
              <div className="bg-neutral-900/50 rounded-2xl p-4 border border-neutral-800">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Assiduidade</p>
                <p className="text-2xl font-black text-green-500 mt-1">100%</p>
              </div>
            </div>

            <p className="text-sm font-medium text-gray-400 mb-6">
              Excelente performance neste ciclo. O colaborador manteve pontualidade em todas as rotas e não apresentou ocorrências graves no LogDock.
            </p>

            <button onClick={() => setSelectedMotorista(null)} className="w-full py-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors">
              Fechar Relatório
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RH;

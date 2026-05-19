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
  isRhAdministrativoSectionId,
} from '../modules/rh';
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
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  MoreVertical,
  Star,
  Calendar,
  Briefcase,
  Award,
  ShieldCheck,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import { useOperationalData } from '../contexts/OperationalDataContext';
import { LogtaEmptyState } from '../components/EmptyState';
import { LogtaDataTable } from '../components/LogtaDataTable';
import { useLogtaProfile } from '../contexts/LogtaProfileContext';
import { LogtaWaveTabStrip } from '../components/LogtaWaveTabStrip';
import { LogtaModuleHeader } from '../components/LogtaModuleHeader';
import { LogtaModalHeader } from '../components/LogtaModalHeader';
import { showToast } from '../components/Toast';

const RH = () => {
  const location = useLocation();
  const isDetailPage = /^\/rh\/equipe\/.+/.test(location.pathname);
  const { config } = useTenant();
  const { motoristas: opMotoristas, profiles: opProfiles, refresh: refreshOperational } = useOperationalData();
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

  const fetchData = async () => {
    if (!config?.id) return;
    setLoading(true);
    try {
      // Fetch Equipe (Profiles)
      const { data: perfis, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', config.id);

      if (pError) throw pError;

      // Fetch Motoristas
      const { data: mot, error: mError } = await supabase
        .from('motoristas')
        .select('*')
        .eq('company_id', config.id);

      if (mError) throw mError;

      setColaboradores(opProfiles.length > 0 ? opProfiles.map((p) => ({ ...p, nome: p.full_name })) : perfis || []);
      setMotoristas(opMotoristas.length > 0 ? opMotoristas : mot || []);

      // Calculate Stats
      const totalColab = perfis?.length || 0;
      const totalMot = mot?.filter((m: any) => m.status === 'ativo' || m.status === 'active').length || 0;
      
      const alertasDocs = (mot || []).filter((m: any) => {
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

    } catch (error: any) {
      console.error('Erro ao buscar dados do RH:', error);
      (window as any).showToast?.('error', 'Não foi possível carregar os dados do RH.', 'Erro de Conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [config?.id]);

  const tabs = [
    { id: 'dashboard', label: 'Painel', shortLabel: 'Painel', icon: Activity, path: '/rh/dashboard' },
    { id: 'administrativo', label: 'Administrativo', shortLabel: 'Admin', icon: Briefcase, path: '/rh/administrativo' },
    {
      id: 'jornada-ponto',
      label: 'Jornada & Ponto',
      shortLabel: 'Jornada',
      icon: Clock,
      path: '/rh/jornada-ponto/controle-ponto',
      matchPath: '/rh/jornada-ponto',
    },
    { id: 'documentos-compliance', label: 'Documentos & Compliance', shortLabel: 'Compliance', icon: ShieldCheck, path: '/rh/documentos-compliance' },
    { id: 'operacional', label: 'Operacional', shortLabel: 'Oper.', icon: Truck, path: '/rh/operacional' },
    { id: 'equipe', label: 'Equipe', shortLabel: 'Equipe', icon: Users, path: '/rh/equipe' },
    { id: 'motoristas', label: 'Motoristas', shortLabel: 'Mot.', icon: Truck, path: '/rh/motoristas' },
    { id: 'alertas', label: 'Alertas', shortLabel: 'Alert.', icon: AlertCircle, path: '/rh/alertas' },
    { id: 'documentos', label: 'Documentos', shortLabel: 'Docs', icon: FileText, path: '/rh/documentos' },
    { id: 'desempenho', label: 'Ranking', shortLabel: 'Rank', icon: Award, path: '/rh/desempenho' },
  ];

  if (isDetailPage) {
    return (
      <div className="logta-page h-full w-full overflow-y-auto text-left animate-in fade-in duration-500 scrollbar-hide">
        <Routes>
          <Route path="equipe/:id" element={<ColaboradorPerfilView />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="logta-page w-full min-h-0 flex-1 space-y-8 animate-in fade-in duration-700">
      <LogtaModuleHeader
        title="Recursos Humanos"
        subtitle="Centro operacional inteligente para transportadoras — equipe, jornada, documentos e frota."
        tabs={<LogtaWaveTabStrip tabs={tabs} basePath="/rh" defaultTabId="dashboard" />}
      />

      {/* Rotas sempre montadas para as abas funcionarem; loading só indica sincronização */}
      <div className="min-h-0 flex-1 animate-in fade-in duration-500">
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
          <Route path="alertas" element={<RhAlertasView alertasCount={stats.alertas} motoristas={motoristas} />} />
          <Route path="documentos" element={<RhDocumentosView />} />
          <Route path="equipe" element={<EquipeManagementView colaboradores={colaboradores} onNewColaborador={() => setIsColaboradorOpen(true)} />} />
          <Route path="equipe/:id" element={<ColaboradorPerfilView />} />
          <Route path="motoristas" element={<MotoristasManagementView motoristas={motoristas} onNewColaborador={() => setIsColaboradorOpen(true)} />} />
          <Route path="desempenho" element={<PerformanceRankingView />} />
        </Routes>
      </div>

      {isColaboradorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsColaboradorOpen(false)} />
          <div className="relative w-full max-w-lg rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl animate-in zoom-in duration-200">
            <LogtaModalHeader icon={Users} title="Novo colaborador" onClose={() => setIsColaboradorOpen(false)} />
            <form
              className="mt-6 space-y-4 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const nome = (form.elements.namedItem('nome') as HTMLInputElement).value;
                showToast('success', `${nome} cadastrado. Convite por e-mail em preparação.`, 'RH');
                setIsColaboradorOpen(false);
                void fetchData();
              }}
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-neutral-400">Nome completo</label>
                <input name="nome" required placeholder="Ex: Maria Silva" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-neutral-400">E-mail corporativo</label>
                <input name="email" type="email" required placeholder="nome@empresa.com.br" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Cargo</label>
                  <input name="cargo" required placeholder="Ex: Analista" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Departamento</label>
                  <input name="departamento" placeholder="Ex: Logística" className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary" />
                </div>
              </div>
              <button type="submit" className="w-full rounded-xl bg-primary py-4 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90">
                Salvar colaborador
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-View Components ---

function RhAdminFeaturePage({
  adminHubId,
  colaboradoresCount,
  motoristasCount,
}: {
  adminHubId: RhAdminHubId;
  colaboradoresCount: number;
  motoristasCount: number;
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


const EquipeManagementView = ({ colaboradores, onNewColaborador }: { colaboradores: any[]; onNewColaborador: () => void }) => {
  const navigate = useNavigate();
  const { config } = useTenant();
  const { profile } = useLogtaProfile();
  const [search, setSearch] = React.useState('');

  const filtered = colaboradores.filter((member) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(member.full_name ?? '').toLowerCase().includes(q) ||
      String(member.email ?? '').toLowerCase().includes(q) ||
      String(member.role ?? member.department ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <LogtaDataTable
      title="Equipe RH"
      filenameBase="rh-equipe"
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar por nome, CPF ou cargo..."
      filteredItems={filtered.length}
      totalItems={colaboradores.length}
      filtersSummary={search.trim() ? `Busca: "${search.trim()}"` : 'Equipe completa'}
      exportMeta={{
        companyName: config.companyName,
        generatedBy: profile?.full_name?.trim() || 'RH Logta',
      }}
      getExportData={(scope) => {
        const rows = scope === 'all' ? colaboradores : filtered;
        return {
          title: 'Equipe RH — Logta',
          filenameBase: scope === 'all' ? 'rh-equipe-todos' : 'rh-equipe-filtrado',
          columns: ['Colaborador', 'Cargo', 'Cadastro', 'Módulo'],
          rows: rows.map((member: any) => [
            member.full_name || member.email || 'Colaborador',
            member.role || member.department || 'Membro',
            new Date(member.created_at).toLocaleDateString('pt-BR'),
            'SaaS Logta',
          ]),
        };
      }}
      filterSlot={
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-4 font-bold text-gray-500 shadow-sm transition-all hover:text-gray-900"
        >
          <Filter size={20} /> Filtrar Equipe
        </button>
      }
      empty={colaboradores.length === 0 ? <LogtaEmptyState type="rh" onAction={onNewColaborador} /> : undefined}
    >
      <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">Colaborador / Cargo</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-normal text-gray-400">Cadastro</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-normal text-gray-400">Módulo Acesso</th>
              <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-normal text-gray-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((member: any) => (
              <tr
                key={member.id}
                onClick={() => navigate(`/rh/equipe/${member.id}`)}
                className="group cursor-pointer transition-colors hover:bg-gray-50"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gray-100 shadow-sm">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Users size={20} className="text-gray-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{member.full_name || member.email || 'Colaborador'}</p>
                      <p className="text-[10px] font-bold uppercase tracking-normal text-gray-400">
                        {member.role || member.department || 'Membro'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-xs font-bold text-gray-600">
                  {new Date(member.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-8 py-6 text-right">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-normal text-blue-700">
                    SaaS Logta
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                  <button type="button" className="p-2 text-gray-400 transition-all hover:text-primary">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && colaboradores.length > 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm font-semibold text-gray-500">
                  Nenhum colaborador encontrado para esta busca.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
    </LogtaDataTable>
  );
};


const MotoristasManagementView = ({ motoristas, onNewColaborador }: { motoristas: any[]; onNewColaborador: () => void }) => (
  <div className="space-y-6 text-left">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {motoristas.map((driver: any, i: number) => (
        <div key={i} className="logta-panel-card p-8 transition-all group hover:shadow-md">
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 border-4 border-white overflow-hidden shadow-sm group-hover:scale-105 transition-all flex items-center justify-center">
              {driver.perfis?.avatar_url ? <img src={driver.perfis.avatar_url} className="w-full h-full object-cover" /> : <Truck size={30} className="text-gray-300" />}
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
            <button className="py-3 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-bold hover:bg-gray-100 transition-all">Perfil</button>
            <button className="py-3 bg-gray-900 text-white rounded-xl text-[10px] font-bold hover:bg-black transition-all">Documentos</button>
          </div>
        </div>
      ))}
      {motoristas.length === 0 && (
        <div className="col-span-full">
          <LogtaEmptyState type="rh" onAction={onNewColaborador} />
        </div>
      )}
    </div>
  </div>
);

const PerformanceRankingView = () => (
  <div className="logta-performance-section grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
    <div className="logta-panel-card logta-panel-card--ranking p-8">
      <h3 className="logta-card-heading mb-8">Top Performance (Mês)</h3>
      <div className="space-y-4">
        {[
          { name: 'Equipe Logística', role: 'Setor', score: 98, trend: '+4.2%' },
          { name: 'Motoristas Próprios', role: 'Categoria', score: 95, trend: '+1.5%' },
        ].map((p, i) => (
          <div key={i} className="flex items-center justify-between rounded-[20px] border border-transparent bg-gray-50/50 p-6 transition-all hover:border-gray-100 hover:bg-white group">
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary font-black text-sm">
                #{i+1}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{p.name}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{p.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="text-right">
                <p className="text-sm font-black text-primary">{p.score} pts</p>
                <p className="text-[10px] text-green-500 font-bold">{p.trend}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-6">
      <div className="logta-panel-card--dark logta-panel-card--retention p-8 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="logta-card-heading mb-6">Métricas de Retenção</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-normal mb-2">Turnover Mês</p>
              <h4 className="text-3xl font-black">2.4%</h4>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp size={14} className="rotate-180" /> -0.8% saudável</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-normal mb-2">Tempo Médio Casa</p>
              <h4 className="text-3xl font-black">2.8 anos</h4>
              <p className="text-xs text-primary mt-1">+0.4 anos vs 2023</p>
            </div>
          </div>
        </div>
        <Award size={150} className="absolute -right-12 -bottom-12 opacity-5 text-white" />
      </div>
    </div>
  </div>
);

const ColaboradorPerfilView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error) setMember(data);
      setLoading(false);
    };
    fetchMember();
  }, [id]);

  if (loading) return <div className="p-20 text-center animate-pulse">Carregando perfil...</div>;
  if (!member) return <div className="p-20 text-center">Colaborador não encontrado.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <button 
        onClick={() => navigate('/rh/equipe')}
        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Voltar para Gestão de Equipe
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
             {member.avatar_url ? <img src={member.avatar_url} className="w-full h-full object-cover" /> : <Users size={32} />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">{member.full_name || member.email || 'Colaborador'}</h2>
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-normal bg-green-100 text-green-700">Ativo</span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-normal">{member.cargo} • Contrato CLT</p>
          </div>
        </div>
        {id?.startsWith('colab-') ? (
          <Link
            to={`/crm/comercial/${id}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90"
          >
            Carteira comercial CRM <ChevronRight size={14} />
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default RH;

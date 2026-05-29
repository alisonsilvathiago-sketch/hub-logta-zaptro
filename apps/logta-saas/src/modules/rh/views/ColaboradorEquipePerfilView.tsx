import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Camera,
  Clock,
  DollarSign,
  FileText,
  GitBranch,
  LayoutDashboard,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Pause,
  Phone,
  Play,
  Shield,
  Target,
  User,
  ClipboardList,
} from 'lucide-react';
import { LogtaWaveTabStrip } from '../../../components/LogtaWaveTabStrip';
import { LogtaModalHeader } from '../../../components/LogtaModalHeader';
import { supabase } from '../../../lib/supabase';
import {
  resolveDemoCompanyId,
  refreshSandboxRhProfiles,
  seedLocalSandboxModules,
  shouldUseLogtaSandbox,
} from '../../../lib/seed';
import { useTenant } from '../../../contexts/TenantContext';
import { usePontoConfig } from '../ponto/hooks/usePontoConfig';
import { buildColaborador360 } from '../lib/colaborador360';
import {
  buildEquipeRouteId,
  equipeProfileUrl,
  normalizeEquipeRouteId,
} from '../lib/equipeRouteId';
import {
  DOC_CATEGORIES,
  PanelAgenda,
  PanelAlertas,
  PanelDashboardKpis,
  PanelDadosColaborador,
  PanelDocumentos,
  PanelFinanceiro,
  PanelGestao,
  PanelJornada,
  PanelMetas,
  ColaboradorRhIaAlertStrip,
  PanelTimeline,
} from '../components/colaborador360/Colaborador360Panels';
import { ColaboradorFinanceiroTab } from '../components/colaborador360/ColaboradorFinanceiroTab';
import {
  addColaboradorDocument,
  addInternalRhNote,
  addManualHistoryNote,
  addSalaryEntry,
  computeRhTenure,
  enrichProfileFromSupabase,
  findColaboradorRhProfileByRouteId,
  getPontoRecordsForCollaborator,
  isOnVacation,
  mergeProfileFromPontoRecord,
  saveColaboradorProfile,
  setEmploymentStatus,
  type ColaboradorDocumentCategory,
  type ColaboradorRhProfile,
  type RhEmploymentStatus,
} from '../ponto/colaboradorRhStorage';
import type { PontoRecord, PontoRecordType } from '../ponto/types';
import { equipeAvatarUrl } from '../lib/equipeInteligente';
import { EditarColaboradorDadosModal } from '../components/EditarColaboradorDadosModal';
import { FeriasAprovacaoPanel } from '../pessoas/components/FeriasAprovacaoPanel';
import { RegistrarPontoManualModal } from '../ponto/components/RegistrarPontoManualModal';
import { showToast } from '../../../components/Toast';

const PONTO_LABEL: Record<PontoRecordType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  pausa_inicio: 'Pausa',
  pausa_fim: 'Retorno',
};

const STATUS_UI: Record<RhEmploymentStatus, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-green-100 text-green-700' },
  afastado: { label: 'Afastado / doente', className: 'bg-amber-100 text-amber-800' },
  desligado: { label: 'Desligado', className: 'bg-gray-200 text-gray-700' },
  falecido: { label: 'Falecido', className: 'bg-slate-800 text-white' },
};

type PerfilTab =
  | 'visao'
  | 'dados'
  | 'jornada'
  | 'financeiro'
  | 'documentos'
  | 'timeline'
  | 'agenda'
  | 'metas'
  | 'gestao';

const PERFIL_TABS = [
  { id: 'visao' as const, label: 'Dashboard 360°', icon: LayoutDashboard },
  { id: 'dados' as const, label: 'Dados do colaborador', icon: User },
  { id: 'jornada' as const, label: 'Jornada completa', icon: Clock },
  { id: 'financeiro' as const, label: 'Financeiro RH', icon: DollarSign },
  { id: 'documentos' as const, label: 'Documentos', icon: FileText },
  { id: 'timeline' as const, label: 'Timeline', icon: GitBranch },
  { id: 'agenda' as const, label: 'Agenda', icon: Calendar },
  { id: 'metas' as const, label: 'Metas', icon: Target },
  { id: 'gestao' as const, label: 'Solicitações & mais', icon: ClipboardList },
];

export function ColaboradorEquipePerfilView() {
  const params = useParams<{ id: string; '*': string }>();
  const { id } = params;
  const subRoute = params['*']?.replace(/\/$/, '');
  const navigate = useNavigate();
  const location = useLocation();
  const rhNav = location.state as {
    rhReturnTo?: string;
    rhReturnLabel?: string;
    rhDismissedProfile?: boolean;
    feriasApprovalId?: string;
  } | null;
  const { config: tenantConfig } = useTenant();
  const companyId = resolveDemoCompanyId(tenantConfig?.id);
  const { records, refreshRecords, config: pontoConfig, companyId: pontoCompanyId } =
    usePontoConfig(companyId);

  useEffect(() => {
    if (!shouldUseLogtaSandbox()) return;
    seedLocalSandboxModules(companyId);
    refreshSandboxRhProfiles(companyId);
  }, [companyId]);

  const routeId = decodeURIComponent(id ?? '');
  const [profile, setProfile] = useState<ColaboradorRhProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [statusDraft, setStatusDraft] = useState<RhEmploymentStatus>('ativo');
  const [statusNote, setStatusNote] = useState('');
  const [salaryDraft, setSalaryDraft] = useState('');
  const [salaryNote, setSalaryNote] = useState('');
  const [docCategory, setDocCategory] = useState<string>('contrato');
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profile?.photoUrl, profile?.id]);
  
  // Roteamento baseado em URL
  const activeTab: PerfilTab = PERFIL_TABS.some((t) => t.id === subRoute)
    ? (subRoute as PerfilTab)
    : rhNav?.feriasApprovalId
      ? 'agenda'
      : 'visao';
  const setActiveTab = (tab: PerfilTab) => {
    const canonical = profile ? buildEquipeRouteId(profile) : routeId;
    navigate(`${equipeProfileUrl(canonical)}/${tab}`, { state: location.state });
  };

  useEffect(() => {
    if (!rhNav?.feriasApprovalId || !profile || subRoute === 'agenda') return;
    const canonical = buildEquipeRouteId(profile);
    navigate(`${equipeProfileUrl(canonical)}/agenda`, {
      replace: true,
      state: {
        rhReturnTo: rhNav.rhReturnTo,
        rhReturnLabel: rhNav.rhReturnLabel,
        feriasApprovalId: rhNav.feriasApprovalId,
      },
    });
  }, [rhNav?.feriasApprovalId, rhNav?.rhReturnTo, rhNav?.rhReturnLabel, profile?.id, subRoute, navigate, profile]);

  const [historyTitle, setHistoryTitle] = useState('');
  const [historyDetail, setHistoryDetail] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [blockAccessDraft, setBlockAccessDraft] = useState(true);
  const [rhStripDismissed, setRhStripDismissed] = useState(false);
  const [selectedPontoDate, setSelectedPontoDate] = useState<{ date: string; records: PontoRecord[] } | null>(null);
  const [editDadosOpen, setEditDadosOpen] = useState(false);
  const [pontoManualOpen, setPontoManualOpen] = useState(false);

  useEffect(() => {
    if (!routeId) return;
    refreshRecords();
  }, [companyId, routeId, refreshRecords]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!routeId) {
        setLoading(false);
        return;
      }
      setLoading(true);

      let rhProfile = findColaboradorRhProfileByRouteId(companyId, routeId);
      const pontoCollabId = rhProfile?.id ?? routeId;
      const pontoForColab = getPontoRecordsForCollaborator(records, pontoCollabId);

      if (!rhProfile && pontoForColab[0]) {
        rhProfile = mergeProfileFromPontoRecord(companyId, pontoForColab[0]);
      }

      const supabaseLookupId = rhProfile?.linkedProfileId || routeId;
      if (/^[0-9a-f-]{36}$/i.test(supabaseLookupId) || supabaseLookupId.startsWith('prof-')) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseLookupId)
          .maybeSingle();
        if (data && rhProfile) rhProfile = enrichProfileFromSupabase(rhProfile, data);
      }

      if (!cancelled) {
        setProfile(rhProfile);
        setStatusDraft(rhProfile?.employmentStatus ?? 'ativo');
        setSalaryDraft(rhProfile?.currentSalary ? String(rhProfile.currentSalary) : '');
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [companyId, routeId, records]);

  useEffect(() => {
    if (!routeId || routeId === 'undefined') {
      navigate('/rh/equipe', { replace: true });
      return;
    }
    if (!profile) return;
    const canonical = buildEquipeRouteId(profile);
    const current = normalizeEquipeRouteId(routeId);
    
    // Anexar sub-rota para não perder a navegação
    const suffix = subRoute ? `/${subRoute}` : '/visao';

    if (!current || current === 'undefined') {
      navigate(`${equipeProfileUrl(canonical)}${suffix}`, { replace: true });
      return;
    }
    if (current !== canonical) {
      navigate(`${equipeProfileUrl(canonical)}${suffix}`, { replace: true });
    }
  }, [profile, routeId, navigate, subRoute]);

  const history = useMemo(
    () => getPontoRecordsForCollaborator(records, profile?.id ?? routeId),
    [records, profile?.id, routeId],
  );

  const groupedHistory = useMemo(() => {
    const groups: Record<string, PontoRecord[]> = {};
    history.forEach((r) => {
      const dateStr = new Date(r.timestamp).toLocaleDateString('pt-BR');
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(r);
    });
    return Object.entries(groups).map(([date, recs]) => ({ date, records: recs }));
  }, [history]);

  const tenure = useMemo(() => computeRhTenure(profile?.admissionDate), [profile?.admissionDate]);
  const bundle = useMemo(
    () => (profile ? buildColaborador360(profile, history) : null),
    [profile, history],
  );

  const emFerias = profile ? isOnVacation(profile) : false;
  const status = profile?.employmentStatus ?? 'ativo';
  const statusUi = STATUS_UI[status];
  const isExColaborador =
    status === 'desligado' ||
    status === 'falecido' ||
    Boolean(rhNav?.rhDismissedProfile);

  const timeline = useMemo(
    () =>
      [...(profile?.timeline ?? [])].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      ),
    [profile?.timeline],
  );

  const persist = (next: ColaboradorRhProfile) => {
    setProfile(next);
    setStatusDraft(next.employmentStatus ?? 'ativo');
    setSalaryDraft(next.currentSalary ? String(next.currentSalary) : '');
  };

  const handleStatusSave = () => {
    if (!profile) return;
    if (
      (statusDraft === 'desligado' || statusDraft === 'falecido') &&
      !statusNote.trim()
    ) {
      showToast('error', 'Informe o motivo do desligamento ou falecimento.', 'RH');
      return;
    }
    try {
      persist(
        setEmploymentStatus(profile, statusDraft, statusNote, {
          blockSystemAccess: blockAccessDraft,
        }),
      );
      setStatusModal(false);
      setStatusNote('');
      showToast('success', 'Situação e bloqueio de acesso registrados no dossiê.', 'RH');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Erro ao salvar.', 'RH');
    }
  };

  const handleHistoryNote = () => {
    if (!profile) return;
    try {
      persist(addManualHistoryNote(profile, historyTitle, historyDetail));
      setHistoryTitle('');
      setHistoryDetail('');
      showToast('success', 'Registro salvo no histórico do colaborador.', 'RH');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Erro ao salvar.', 'RH');
    }
  };

  const handleInternalNote = () => {
    if (!profile) return;
    try {
      persist(addInternalRhNote(profile, noteDraft));
      setNoteDraft('');
      showToast('success', 'Observação registrada.', 'RH');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Erro ao salvar.', 'RH');
    }
  };

  const handleSalarySave = () => {
    if (!profile) return;
    const amount = Number(String(salaryDraft).replace(/\./g, '').replace(',', '.'));
    if (!amount || amount <= 0) {
      showToast('error', 'Informe um valor de salário válido.', 'RH');
      return;
    }
    persist(addSalaryEntry(profile, amount, salaryNote.trim() || undefined));
    setSalaryNote('');
    showToast('success', 'Histórico salarial atualizado.', 'RH');
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const cat = DOC_CATEGORIES.find((c) => c.value === docCategory);
    const next = addColaboradorDocument(profile, {
      name: file.name.replace(/\.[^.]+$/, ''),
      type: cat?.label ?? 'Documento',
      category: docCategory as ColaboradorDocumentCategory,
      status: 'ok',
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
    });
    persist(next);
    showToast('success', `${file.name} salvo no dossiê.`, 'Documento');
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-xs font-bold uppercase tracking-normal text-gray-400">
          Carregando Central 360°…
        </p>
      </div>
    );
  }

  if (!profile || !bundle) {
    return (
      <div className="space-y-6 py-12 text-center">
        <p className="text-sm font-bold text-gray-500">Colaborador não encontrado.</p>
        <button
          type="button"
          onClick={() => navigate('/rh/equipe')}
          className="text-xs font-black uppercase text-primary"
        >
          Voltar para equipe
        </button>
      </div>
    );
  }

  const avatarSrc = equipeAvatarUrl({
    full_name: profile.fullName,
    avatar_url: profile.photoUrl,
    id: profile.linkedProfileId || profile.id,
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Selecione um arquivo de imagem (JPG, PNG, etc.).', 'RH');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setAvatarFailed(false);
      persist(saveColaboradorProfile({ ...profile, photoUrl: dataUrl }));
      showToast('success', 'Foto salva no dossiê do colaborador.', 'RH');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="logta-page-content space-y-8 text-left">
      <button
        type="button"
        onClick={() => navigate(rhNav?.rhReturnTo ?? '/rh/equipe')}
        className="flex cursor-pointer items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {rhNav?.rhReturnLabel ?? 'Equipe'}
      </button>

      {isExColaborador ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-black text-amber-950">
            {status === 'falecido'
              ? 'Registro encerrado — falecimento'
              : 'Colaborador desligado — não faz mais parte da equipe ativa'}
          </p>
          <p className="mt-1 text-xs font-medium text-amber-900/90">
            {profile.lastStatusReason?.trim() ||
              'O histórico completo permanece disponível para consulta e auditoria.'}
            {profile.systemAccessBlocked ? ' · Acesso ao sistema bloqueado.' : ''}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-6 py-[11px]">
          <div className="group relative h-[66px] w-[66px] shrink-0">
            <div className="flex h-full w-full flex-col flex-nowrap items-start justify-start overflow-hidden rounded-3xl border border-gray-100 bg-primary/10 shadow-sm">
              {!avatarFailed ? (
                <img
                  src={avatarSrc}
                  alt={profile.fullName}
                  className="h-full w-full shrink-0 object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-primary">
                  <User size={28} />
                </div>
              )}
            </div>
            <label
              className="absolute inset-0 flex cursor-pointer flex-col flex-nowrap items-center justify-center rounded-3xl bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
              title="Adicionar ou trocar foto"
            >
              <Camera size={18} className="text-white" />
              <span className="mt-0.5 text-[8px] font-black uppercase text-white">
                {profile.photoUrl ? 'Trocar' : 'Foto'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[32px] font-black leading-tight tracking-normal text-gray-900 sm:text-[40px]">
                {profile.fullName}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-[9px] font-black uppercase ${statusUi.className}`}
              >
                {statusUi.label}
              </span>
              {emFerias ? (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-[9px] font-black uppercase text-blue-700">
                  Em férias
                </span>
              ) : null}
              {profile.systemAccessBlocked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[9px] font-black uppercase text-red-800">
                  <Lock size={10} /> Acesso bloqueado
                </span>
              ) : null}
            </div>
            <p className="text-xs font-bold uppercase tracking-normal text-gray-400">
              {profile.role || 'Colaborador'} • {profile.sector || '—'} • CPF {profile.document || '—'}
            </p>
            <p className="text-xs font-semibold text-gray-600">
              <Briefcase size={12} className="mr-1 inline text-primary" />
              Central 360° RH · {tenure.label} na empresa
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch md:w-auto md:max-w-full md:items-end">
          <div className="logta-icon-tabs-scroll logta-icon-tabs-scroll--profile-header-row">
            <div className="logta-icon-tabs-profile-toolbar">
              <LogtaWaveTabStrip
                variant="button"
                tabs={PERFIL_TABS}
                activeId={activeTab}
                onTabChange={(tabId) => setActiveTab(tabId as PerfilTab)}
                className="logta-icon-tabs--header logta-icon-tabs--wide shrink-0"
              />
              <div className="logta-icon-tabs__trailing logta-icon-tabs__trailing--profile-actions shrink-0">
              {profile.phone ? (
                <a
                  href={`tel:${profile.phone.replace(/\D/g, '')}`}
                  className="logta-icon-tabs__item"
                  data-tooltip="Ligar"
                  title="Ligar"
                  aria-label="Ligar"
                >
                  <Phone size={20} strokeWidth={2} />
                </a>
              ) : null}
              {profile.email ? (
                <a
                  href={`mailto:${profile.email}`}
                  className="logta-icon-tabs__item"
                  data-tooltip="E-mail"
                  title="E-mail"
                  aria-label="E-mail"
                >
                  <Mail size={20} strokeWidth={2} />
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => setStatusModal(true)}
                className="logta-icon-tabs__item logta-icon-tabs__item--status"
                data-tooltip="Situação / desligamento"
                title="Situação / desligamento"
                aria-label="Situação / desligamento"
              >
                <Shield size={20} strokeWidth={2} />
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!rhStripDismissed ? (
        <ColaboradorRhIaAlertStrip
          bundle={bundle}
          onTabChange={(tab) => setActiveTab(tab as PerfilTab)}
          onDismiss={() => setRhStripDismissed(true)}
        />
      ) : null}

      {rhNav?.feriasApprovalId && profile ? (
        <FeriasAprovacaoPanel
          companyId={companyId}
          profile={profile}
          feriasId={rhNav.feriasApprovalId}
          returnTo={rhNav.rhReturnTo ?? '/rh/administrativo/aprovacao-ferias'}
          returnLabel={rhNav.rhReturnLabel ?? 'Aprovação de Férias'}
          onProfileUpdated={(next) => persist(next)}
        />
      ) : null}

      {activeTab === 'visao' ? (
        <div className="space-y-6">
          <PanelDashboardKpis bundle={bundle} />
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <PanelAlertas bundle={bundle} />
            </div>
            <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3 sm:p-8">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-[16px] font-black text-gray-900">Últimos dias de ponto</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('jornada')}
                  className="text-[10px] font-bold uppercase text-primary hover:underline"
                >
                  Ver jornada
                </button>
              </div>
              {groupedHistory.length === 0 ? (
                <p className="text-sm text-gray-400">Sem ponto registrado.</p>
              ) : (
                <ul className="space-y-3">
                  {groupedHistory.slice(0, 5).map((group) => (
                    <li
                      key={group.date}
                      onClick={() => setSelectedPontoDate(group)}
                      className="cursor-pointer rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:bg-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{group.date}</p>
                          <p className="text-[10px] font-bold uppercase text-gray-400">
                            {group.records.length} batida{group.records.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-xs font-bold text-primary">Ver detalhes &rarr;</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className="flex w-full items-center justify-between rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-5 py-4 text-left transition-colors hover:bg-primary/10"
          >
            <span className="flex items-center gap-2 text-xs font-bold text-primary">
              <User size={16} /> Ver cadastro completo do colaborador
            </span>
            <span className="text-[10px] font-black uppercase text-gray-400">Aba Dados →</span>
          </button>
        </div>
      ) : null}

      {activeTab === 'dados' ? (
        <PanelDadosColaborador
          profile={profile}
          tenureLabel={tenure.label}
          statusLabel={statusUi.label}
          bundle={bundle}
          onEdit={() => setEditDadosOpen(true)}
        />
      ) : null}

      {activeTab === 'jornada' ? (
        <PanelJornada
          bundle={bundle}
          pontoHistory={history}
          collaboratorName={profile.fullName}
          onRegistrarBatida={() => setPontoManualOpen(true)}
        />
      ) : null}

      {activeTab === 'financeiro' ? (
        <ColaboradorFinanceiroTab
          profile={profile}
          companyId={companyId}
          onSaveConfig={(cfg) => persist(saveColaboradorProfile({ ...profile, financialConfig: cfg }))}
          onSaveSalary={(val, note) => {
            const updated = addSalaryEntry(profile, val, note);
            persist(updated);
            showToast('success', 'Salário atualizado.', 'RH');
          }}
        />
      ) : null}

      {activeTab === 'documentos' ? (
        <PanelDocumentos
          profile={profile}
          docCategory={docCategory}
          onCategory={setDocCategory}
          onUpload={handleDocUpload}
        />
      ) : null}

      {activeTab === 'timeline' ? (
        <PanelTimeline
          timeline={timeline}
          historyTitle={historyTitle}
          historyDetail={historyDetail}
          onTitle={setHistoryTitle}
          onDetail={setHistoryDetail}
          onSave={handleHistoryNote}
        />
      ) : null}

      {activeTab === 'agenda' ? <PanelAgenda profile={profile} /> : null}
      {activeTab === 'metas' ? <PanelMetas profile={profile} /> : null}

      {activeTab === 'gestao' ? (
        <PanelGestao
          profile={profile}
          bundle={bundle}
          noteDraft={noteDraft}
          onNoteDraft={setNoteDraft}
          onAddNote={handleInternalNote}
        />
      ) : null}

      {selectedPontoDate ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl">
            <LogtaModalHeader
              icon={Clock}
              title={`Batidas do dia ${selectedPontoDate.date}`}
              onClose={() => setSelectedPontoDate(null)}
            />
            <ul className="mt-6 max-h-[60vh] space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700">
              {selectedPontoDate.records.map((r) => (
                <PontoHistoryModalItem key={r.id} record={r} />
              ))}
            </ul>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => setSelectedPontoDate(null)}
                className="w-full rounded-xl border border-neutral-600 py-3 text-xs font-bold text-neutral-300 transition-colors hover:bg-neutral-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {statusModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl">
            <LogtaModalHeader
              icon={Shield}
              title="Situação do colaborador"
              onClose={() => setStatusModal(false)}
            />
            <p className="mt-2 text-xs text-neutral-400">
              Desligamento e falecimento exigem motivo. Bloqueie o acesso ao sistema na hora.
            </p>
            <select
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value as RhEmploymentStatus)}
              className="mt-4 w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-bold text-white"
            >
              <option value="ativo">Ativo</option>
              <option value="afastado">Afastado / doente</option>
              <option value="desligado">Desligado</option>
              <option value="falecido">Falecido</option>
            </select>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder={
                statusDraft === 'desligado' || statusDraft === 'falecido'
                  ? 'Motivo obrigatório…'
                  : 'Observação…'
              }
              rows={3}
              className="mt-3 w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white"
            />
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-300">
              <input
                type="checkbox"
                checked={blockAccessDraft}
                onChange={(e) => setBlockAccessDraft(e.target.checked)}
              />
              <Lock size={14} /> Bloquear acesso ao sistema Logta imediatamente
            </label>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStatusModal(false)}
                className="flex-1 rounded-xl border border-neutral-600 py-3 text-xs font-bold text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStatusSave}
                className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-white"
              >
                Salvar no sistema
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <EditarColaboradorDadosModal
        open={editDadosOpen}
        profile={profile}
        onClose={() => setEditDadosOpen(false)}
        onSaved={(next) => {
          persist(next);
          const canonical = buildEquipeRouteId(next);
          const current = normalizeEquipeRouteId(routeId);
          if (current && canonical && current !== canonical) {
            navigate(equipeProfileUrl(canonical), { replace: true });
          }
        }}
      />

      <RegistrarPontoManualModal
        open={pontoManualOpen}
        profile={profile}
        companyId={pontoCompanyId}
        pontoConfig={pontoConfig}
        onClose={() => setPontoManualOpen(false)}
        onSaved={() => refreshRecords()}
      />
    </div>
  );
}

function PontoHistoryItem({ record }: { record: PontoRecord }) {
  const when = new Date(record.timestamp);
  const Icon =
    record.type === 'entrada'
      ? LogIn
      : record.type === 'saida'
        ? LogOut
        : record.type === 'pausa_inicio'
          ? Pause
          : Play;

  return (
    <li className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900">{PONTO_LABEL[record.type]}</p>
        <p className="text-[10px] font-bold uppercase text-gray-400">{when.toLocaleString('pt-BR')}</p>
      </div>
    </li>
  );
}

function PontoHistoryModalItem({ record }: { record: PontoRecord }) {
  const when = new Date(record.timestamp);
  const Icon =
    record.type === 'entrada'
      ? LogIn
      : record.type === 'saida'
        ? LogOut
        : record.type === 'pausa_inicio'
          ? Pause
          : Play;

  return (
    <li className="flex items-start gap-3 rounded-xl border border-neutral-700 bg-neutral-800/50 px-4 py-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{PONTO_LABEL[record.type]}</p>
        <p className="text-[10px] font-bold uppercase text-neutral-400">
          {when.toLocaleTimeString('pt-BR')}
        </p>
      </div>
    </li>
  );
}

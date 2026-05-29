import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  Bell,
  Brain,
  Briefcase,
  Calendar,
  Car,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Gift,
  IdCard,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  Pencil,
  Plus,
  Upload,
  User,
  X,
} from 'lucide-react';
import { downloadExcelCsv } from '../../../../lib/reportExport';
import { showToast } from '../../../../components/Toast';
import type { Colaborador360Bundle } from '../../lib/colaborador360';
import {
  competenciaLabel,
  downloadHoleritePdf,
  downloadHoleritesCsv,
  holeriteStatusClass,
  holeriteStatusLabel,
  loadCollaboratorFinancePayments,
  resolveColaboradorHolerites,
  sumPaidAmount,
} from '../../lib/rhColaboradorFinance';
import { buildEquipeRouteId, formatEquipeDisplayId } from '../../lib/equipeRouteId';
import type { ColaboradorRhProfile, ColaboradorTimelineEvent } from '../../ponto/colaboradorRhStorage';
import type { PontoRecord, PontoRecordType } from '../../ponto/types';

const PONTO_LABEL: Record<PontoRecordType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  pausa_inicio: 'Pausa',
  pausa_fim: 'Retorno',
};

const DOC_CATEGORIES = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'rg', label: 'RG' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnh', label: 'CNH' },
  { value: 'medico', label: 'Exames / ASO' },
  { value: 'certificado', label: 'Certificados' },
  { value: 'ferias', label: 'Férias' },
  { value: 'advertencia', label: 'Advertências' },
  { value: 'treinamento', label: 'Treinamento / NR' },
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'outro', label: 'Outro' },
] as const;

export type ColaboradorPerfilTabId =
  | 'visao'
  | 'dados'
  | 'jornada'
  | 'financeiro'
  | 'documentos'
  | 'timeline'
  | 'agenda'
  | 'metas'
  | 'gestao';

/** Faixa IA + avisos — mesmo padrão do ecossistema (LogtaGlobalOperationalStrip). */
export function ColaboradorRhIaAlertStrip({
  bundle,
  onTabChange,
  onDismiss,
}: {
  bundle: Colaborador360Bundle;
  onTabChange: (tab: ColaboradorPerfilTabId) => void;
  onDismiss?: () => void;
}) {
  const top = bundle.alerts[0];
  const critical = bundle.alerts.filter((a) => a.severity === 'critical').length;
  const total = bundle.alerts.length;

  const nivelClass =
    critical > 0
      ? 'border-red-200 bg-red-50/90'
      : total > 0
        ? 'border-amber-200 bg-amber-50/90'
        : 'border-green-200 bg-green-50/80';

  const headline =
    total === 0
      ? bundle.smartSummary
      : critical > 0
        ? `${critical} crítico(s) · ${total} alerta(s) no dossiê RH`
        : `${total} alerta(s) no dossiê RH`;

  const nowLabel = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 shadow-md ${nivelClass}`}
      data-colaborador-rh-strip="active"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="rounded-lg bg-primary px-2 py-0.5 text-[9px] font-black uppercase text-white">
          IA ativa
        </span>
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <span className="max-w-2xl text-xs font-bold text-gray-900">{headline}</span>
        <span className="text-[9px] font-medium text-gray-500">{nowLabel}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {top ? (
          <button
            type="button"
            onClick={() => onTabChange('visao')}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[9px] font-bold text-white hover:opacity-90"
          >
            <AlertTriangle size={12} />
            RH: {top.title}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onTabChange('dados')}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-gray-700 hover:bg-gray-50"
        >
          <User size={12} /> Dados
        </button>
        <button
          type="button"
          onClick={() => onTabChange('documentos')}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-gray-700 hover:bg-gray-50"
        >
          <FileText size={12} /> Documentos
        </button>
        <button
          type="button"
          onClick={() => onTabChange('financeiro')}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[9px] font-bold text-white hover:opacity-90"
        >
          <DollarSign size={12} className="text-white" /> Financeiro
        </button>
        <button
          type="button"
          onClick={() => onTabChange('jornada')}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-gray-600 hover:bg-gray-50"
        >
          <Clock size={12} /> Ponto
        </button>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            title="Dispensar aviso"
          >
            <X size={12} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Alias — barra de avisos no lugar do card de resumo. */
export function PanelResumoInteligente({
  bundle,
  onTabChange,
  onDismiss,
}: {
  bundle: Colaborador360Bundle;
  onTabChange: (tab: ColaboradorPerfilTabId) => void;
  onDismiss?: () => void;
}) {
  return (
    <ColaboradorRhIaAlertStrip bundle={bundle} onTabChange={onTabChange} onDismiss={onDismiss} />
  );
}

export function PanelDashboardKpis({ bundle }: { bundle: Colaborador360Bundle }) {
  const d = bundle.dashboard;
  const hero = [
    {
      label: 'Presença',
      value: `${d.presenca}%`,
      sub: 'Últimos 30 dias',
      icon: CheckCircle2,
      bg: 'from-emerald-500/10 to-white',
      color: 'text-emerald-600',
    },
    {
      label: 'Produtividade',
      value: `${d.produtividade}%`,
      sub: 'Metas & desempenho',
      icon: TrendingUp,
      bg: 'from-primary/10 to-white',
      color: 'text-primary',
    },
    {
      label: 'Férias disponíveis',
      value: `${d.feriasDisponiveis}d`,
      sub: 'Saldo acumulado',
      icon: Gift,
      bg: 'from-teal-500/10 to-white',
      color: 'text-teal-700',
    },
    {
      label: 'Ranking interno',
      value: `#${d.rankingInterno}`,
      sub: 'Na equipe',
      icon: Award,
      bg: 'from-violet-500/10 to-white',
      color: 'text-violet-700',
    },
  ];

  const secondary = [
    { label: 'Faltas', value: String(d.faltas), icon: User },
    { label: 'Atrasos', value: String(d.atrasos), icon: Clock },
    { label: 'Horas extras', value: `${d.horasExtras}h`, icon: Clock },
    { label: 'Banco de horas', value: `${d.bancoHoras}h`, icon: Calendar },
    { label: 'Treinamentos', value: String(d.treinamentosConcluidos), icon: Award },
    { label: 'Metas ativas', value: String(d.metasAtivas), icon: Target },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {hero.map((m) => (
          <div
            key={m.label}
            className={`rounded-[28px] border border-gray-100 bg-gradient-to-br ${m.bg} p-5 shadow-sm`}
          >
            <m.icon size={18} className={`mb-3 ${m.color}`} />
            <p className="text-[9px] font-black uppercase tracking-normal text-gray-400">{m.label}</p>
            <p className={`mt-1 text-2xl font-extrabold tracking-tight ${m.color}`}>{m.value}</p>
            <p className="mt-1 text-[10px] font-semibold text-gray-500">{m.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid w-full grid-cols-2 gap-3 py-[30px] sm:grid-cols-3 lg:grid-cols-6">
        {secondary.map((m) => (
          <div
            key={m.label}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
          >
            <m.icon size={16} className="shrink-0 text-gray-300" />
            <div className="min-w-0">
              <p className="truncate text-[8px] font-black uppercase text-gray-400">{m.label}</p>
              <p className="text-[14px] font-extrabold text-gray-900">{m.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PanelAlertas({ bundle }: { bundle: Colaborador360Bundle }) {
  const total = bundle.alerts.length;
  const critical = bundle.alerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[14px] font-black text-gray-900">
          <Bell size={14} className="text-amber-500" /> Alertas inteligentes RH
        </h3>
        {total > 0 ? (
          <span
            className={`rounded-full px-3 py-1 text-[9px] font-black uppercase ${
              critical > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {total} ativo{total !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[9px] font-black uppercase text-emerald-700">
            Tudo ok
          </span>
        )}
      </div>
      {total === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 size={32} className="text-emerald-500" />
          <p className="mt-3 text-sm font-bold text-gray-700">Nenhum alerta RH ativo.</p>
          <p className="mt-1 max-w-xs text-xs text-gray-500">
            Documentos, férias e jornada estão dentro do esperado.
          </p>
        </div>
      ) : (
        <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {bundle.alerts.map((a) => (
            <li
              key={a.id}
              className={`flex gap-3 rounded-2xl border px-4 py-3.5 ${
                a.severity === 'critical'
                  ? 'border-red-200 bg-red-50/80'
                  : a.severity === 'warn'
                    ? 'border-amber-200 bg-amber-50/80'
                    : 'border-blue-100 bg-blue-50/40'
              }`}
            >
              <AlertTriangle
                size={16}
                className={`mt-0.5 shrink-0 ${
                  a.severity === 'critical'
                    ? 'text-red-600'
                    : a.severity === 'warn'
                      ? 'text-amber-600'
                      : 'text-primary'
                }`}
              />
              <div className="min-w-0">
                <p className="text-xs font-black text-gray-900">{a.title}</p>
                <p className="text-[11px] font-medium leading-snug text-gray-600">{a.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PanelDadosPessoais({
  profile,
  tenureLabel,
  statusLabel,
}: {
  profile: ColaboradorRhProfile;
  tenureLabel: string;
  statusLabel: string;
}) {
  return (
    <PanelDadosColaborador
      profile={profile}
      tenureLabel={tenureLabel}
      statusLabel={statusLabel}
      compact
    />
  );
}

/** Dossiê cadastral completo do colaborador. */
export function PanelDadosColaborador({
  profile,
  tenureLabel,
  statusLabel,
  bundle,
  compact,
  onEdit,
}: {
  profile: ColaboradorRhProfile;
  tenureLabel: string;
  statusLabel: string;
  bundle?: Colaborador360Bundle;
  compact?: boolean;
  onEdit?: () => void;
}) {
  const salary =
    profile.currentSalary && profile.currentSalary > 0
      ? `R$ ${profile.currentSalary.toLocaleString('pt-BR')}`
      : '—';

  const sections = [
    {
      title: 'Identificação',
      icon: IdCard,
      fields: [
        { label: 'Nome completo', value: profile.fullName },
        { label: 'CPF', value: profile.document },
        {
          label: 'ID equipe (URL)',
          value: formatEquipeDisplayId(buildEquipeRouteId(profile)),
        },
        { label: 'Registro interno', value: profile.id },
        { label: 'Perfil vinculado', value: profile.linkedProfileId },
      ],
    },
    {
      title: 'Contato',
      icon: Mail,
      fields: [
        { label: 'E-mail corporativo', value: profile.email },
        { label: 'Telefone / WhatsApp', value: profile.phone },
      ],
    },
    {
      title: 'Endereço',
      icon: MapPin,
      fields: [
        { label: 'Logradouro', value: profile.address },
        { label: 'Cidade', value: profile.city },
        { label: 'UF', value: profile.state },
      ],
    },
    {
      title: 'Contrato & RH',
      icon: Briefcase,
      fields: [
        {
          label: 'Data de admissão',
          value: profile.admissionDate
            ? new Date(profile.admissionDate).toLocaleDateString('pt-BR')
            : undefined,
        },
        { label: 'Tempo de casa', value: tenureLabel },
        { label: 'Cargo', value: profile.role },
        { label: 'Setor / departamento', value: profile.sector },
        { label: 'Situação', value: statusLabel },
        { label: 'Salário atual', value: salary },
        {
          label: 'Férias disponíveis',
          value: bundle
            ? `${bundle.dashboard.feriasDisponiveis} dias`
            : profile.vacationDaysAvailable != null
              ? `${profile.vacationDaysAvailable} dias`
              : undefined,
        },
      ],
    },
    {
      title: 'Sistema Logta',
      icon: Shield,
      fields: [
        {
          label: 'Acesso ao sistema',
          value: profile.systemAccessBlocked ? 'Bloqueado pelo RH' : 'Liberado',
        },
        { label: 'Última movimentação', value: profile.lastStatusReason },
        {
          label: 'Documentos no dossiê',
          value: String(profile.documents?.length ?? 0),
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-[14px] font-black text-gray-900">Dados do colaborador</h3>
              <p className="text-xs font-semibold text-gray-500">
                Cadastro completo · contrato · contato · sistema
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {bundle ? (
              <>
                <Chip label="Presença" value={`${bundle.dashboard.presenca}%`} />
                <Chip label="Docs" value={String(profile.documents.length)} />
                <Chip label="Metas" value={String(bundle.dashboard.metasAtivas)} />
              </>
            ) : null}
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-black"
              >
                <Pencil size={14} /> Editar cadastro
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={
          compact
            ? 'rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm'
            : 'grid gap-6 lg:grid-cols-2'
        }
      >
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.title}
              className={
                compact
                  ? 'border-b border-gray-50 py-6 last:border-0 first:pt-0'
                  : 'm-0 rounded-[32px] border border-gray-100 p-[35px] shadow-sm'
              }
            >
              <h4 className="mt-[10px] mb-[25px] flex items-center gap-2 text-[15px] font-black text-gray-900">
                <Icon size={16} className="text-primary" />
                {sec.title}
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {sec.fields.map((f) => (
                  <Field key={f.label} label={f.label} value={f.value} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!compact && profile.photoUrl ? (
        <p className="text-center text-[10px] font-bold uppercase text-gray-400">
          Foto cadastrada no dossiê RH
        </p>
      ) : null}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-gray-700">
      <span className="font-black uppercase text-gray-400">{label}</span>
      {value}
    </span>
  );
}

const MESES = [
  { value: '', label: 'Todos os meses' },
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

function pontoOriginLabel(r: PontoRecord) {
  if (r.flags.includes('celular_offline')) return 'Offline RH';
  if (r.flags.includes('rh_manual')) return 'Manual RH';
  return 'Automático';
}

function groupPontoRecordsByDate(records: PontoRecord[]) {
  const map = new Map<string, PontoRecord[]>();
  for (const r of records) {
    const key = r.timestamp.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([isoDate, dayRecords]) => ({
      isoDate,
      label: new Date(`${isoDate}T12:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      records: dayRecords.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    }));
}

function JornadaHistoricoBatidas({
  pontoHistory,
  collaboratorName,
}: {
  pontoHistory: PontoRecord[];
  collaboratorName?: string;
}) {
  const now = new Date();
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(() => new Set());

  const yearsAvailable = useMemo(() => {
    const years = new Set<number>([now.getFullYear()]);
    pontoHistory.forEach((r) => years.add(new Date(r.timestamp).getFullYear()));
    return [...years].sort((a, b) => b - a);
  }, [pontoHistory, now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pontoHistory
      .filter((r) => {
        const d = new Date(r.timestamp);
        if (year && d.getFullYear() !== Number(year)) return false;
        if (month && d.getMonth() + 1 !== Number(month)) return false;
        if (!q) return true;
        const blob = [
          PONTO_LABEL[r.type],
          r.type,
          r.deviceInfo,
          pontoOriginLabel(r),
          new Date(r.timestamp).toLocaleString('pt-BR'),
          new Date(r.timestamp).toLocaleDateString('pt-BR'),
        ]
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [pontoHistory, search, year, month]);

  const grouped = useMemo(() => groupPontoRecordsByDate(filtered), [filtered]);

  const monthLabel = month ? MESES.find((m) => m.value === month)?.label : 'todos';

  const exportRows = (records: PontoRecord[]) =>
    records.map((r) => {
      const d = new Date(r.timestamp);
      return [
        d.toLocaleDateString('pt-BR'),
        d.toLocaleTimeString('pt-BR'),
        PONTO_LABEL[r.type],
        pontoOriginLabel(r),
        r.deviceInfo,
        r.validated ? 'Sim' : 'Não',
        r.flags.join('; ') || '—',
      ];
    });

  const handleExport = (records: PontoRecord[], filenameSuffix?: string) => {
    if (records.length === 0) {
      showToast('error', 'Não há batidas no período selecionado para exportar.', 'Ponto');
      return;
    }
    downloadExcelCsv({
      title: `Ponto — ${collaboratorName || 'Colaborador'}`,
      filenameBase: `ponto-${collaboratorName || 'colaborador'}-${filenameSuffix || `${year || 'todos'}${month ? `-${month}` : ''}`}`,
      columns: ['Data', 'Hora', 'Tipo', 'Origem', 'Dispositivo', 'Validado', 'Alertas'],
      rows: exportRows(records),
      meta: {
        filtersSummary: `Ano ${year || 'todos'} · ${monthLabel} · busca: ${search || '—'}`,
        exportScope: 'filtered',
      },
    });
    showToast('success', `${records.length} batida(s) exportada(s) em CSV.`, 'Ponto');
  };

  const toggleDay = (isoDate: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(isoDate)) next.delete(isoDate);
      else next.add(isoDate);
      return next;
    });
  };

  return (
    <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4">
        <h4 className="text-[14px] font-black text-gray-900">Histórico de batidas</h4>
        <p className="mt-1 text-[10px] font-semibold text-gray-500">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''} no filtro · agrupado por dia
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar tipo, horário, dispositivo…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-xs font-semibold text-gray-900 outline-none focus:border-primary"
          />
        </div>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-primary"
          aria-label="Ano"
        >
          <option value="">Todos os anos</option>
          {yearsAvailable.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-primary"
          aria-label="Mês"
        >
          {MESES.map((m) => (
            <option key={m.value || 'all'} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => handleExport(filtered)}
          disabled={filtered.length === 0}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[148px]"
          title="Baixar batidas do filtro atual em CSV"
        >
          <Download size={16} strokeWidth={2.25} />
          Baixar CSV
        </button>
      </div>

      {pontoHistory.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma batida no período. Registre manualmente se o celular estiver offline.</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma batida encontrada para os filtros selecionados.</p>
      ) : (
        <div className="max-h-[min(520px,55vh)] space-y-6 overflow-y-auto pr-1 scrollbar-hide">
          {grouped.map((day) => {
            const isCollapsed = collapsedDays.has(day.isoDate);
            return (
              <section key={day.isoDate}>
                <div className="sticky top-0 z-[1] mb-2 flex items-center gap-1 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => toggleDay(day.isoDate)}
                    className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
                    aria-expanded={!isCollapsed}
                  >
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-primary transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                      aria-hidden
                    />
                    <span className="min-w-0 truncate text-[11px] font-black uppercase tracking-normal text-primary">
                      {day.label}
                      <span className="ml-2 font-bold text-gray-400">
                        ({day.records.length} batida{day.records.length !== 1 ? 's' : ''})
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(day.records, day.isoDate)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[9px] font-bold uppercase text-gray-600 hover:bg-gray-100"
                    title={`Baixar batidas de ${day.label}`}
                  >
                    <Download size={12} />
                    Dia
                  </button>
                </div>
                {!isCollapsed ? (
                  <ul className="divide-y divide-gray-50">
                    {day.records.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{PONTO_LABEL[r.type]}</p>
                          <p className="text-[10px] font-semibold text-gray-500">
                            {new Date(r.timestamp).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="max-w-[220px] truncate text-[10px] font-bold text-gray-600">
                            {r.deviceInfo}
                          </p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                              r.flags.includes('celular_offline') || r.flags.includes('rh_manual')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {pontoOriginLabel(r)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PanelJornada({
  bundle,
  pontoHistory,
  onRegistrarBatida,
  collaboratorName,
}: {
  bundle: Colaborador360Bundle;
  pontoHistory: PontoRecord[];
  onRegistrarBatida?: () => void;
  collaboratorName?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-black text-gray-900">Jornada & ponto</h3>
          <p className="mt-1 text-xs font-semibold text-gray-500">
            Automático pelo celular ou link · registro manual pelo RH quando o aparelho estiver offline
          </p>
        </div>
        {onRegistrarBatida ? (
          <button
            type="button"
            onClick={onRegistrarBatida}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white shadow-md transition-colors hover:bg-black"
            title="Registrar batida"
            aria-label="Registrar batida"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Horas na semana" value={`${bundle.horasSemanais}h`} />
        <StatCard label="Horas extras (est.)" value={`${bundle.dashboard.horasExtras}h`} />
        <StatCard label="Batidas no período" value={String(pontoHistory.length)} />
      </div>

      <JornadaHistoricoBatidas
        pontoHistory={pontoHistory}
        collaboratorName={collaboratorName}
      />

      <div className="grid gap-6 py-[30px] lg:grid-cols-2">
        <div className="flex flex-col justify-between rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-900">
              <MapPin size={18} className="text-primary" /> Mapa de ponto
            </h3>
            <p className="mb-6 text-xs font-semibold text-gray-500">
              Geolocalização das batidas via integração com Controle de Ponto. Últimas marcações com GPS aparecem no mapa abaixo.
            </p>
          </div>
          <div className="flex h-48 items-center justify-center rounded-3xl border border-gray-100 bg-gray-50/50 text-center shadow-inner">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <MapPin size={24} />
              <p className="max-w-[200px] text-[10px] font-bold uppercase tracking-normal">Aguardando coordenadas GPS</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[40px] border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-8 shadow-sm transition-shadow hover:shadow-md">
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-gray-900">
              <Shield size={18} className="text-primary" /> Regras & descanso
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 size={12} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Intervalo obrigatório</p>
                  <p className="text-[11px] font-medium text-gray-500">Conforme política da transportadora</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock size={12} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Jornada semanal monitorada</p>
                  <p className="text-[11px] font-medium text-gray-500">{bundle.horasSemanais}h registradas no período</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <AlertTriangle size={12} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Descanso interjornada</p>
                  <p className="text-[11px] font-medium text-gray-500">Alerta automático emitido se &lt; 11h</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="mt-6">
            <Link
              to="/rh/jornada-ponto/controle-ponto"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-6 py-3.5 text-xs font-bold text-white transition-colors hover:bg-black"
            >
              <ExternalLink size={14} /> Abrir controle de ponto completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function HoleritesSection({
  profile,
  companyId,
}: {
  profile: ColaboradorRhProfile;
  companyId: string;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const payments = useMemo(
    () => loadCollaboratorFinancePayments(companyId, profile),
    [companyId, profile],
  );
  const holerites = useMemo(
    () => resolveColaboradorHolerites(profile, payments),
    [profile, payments],
  );

  const toggle = (comp: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(comp)) next.delete(comp);
      else next.add(comp);
      return next;
    });
  };

  if (holerites.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Defina o salário do colaborador para gerar holerites e competências.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => downloadHoleritesCsv(holerites, profile)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-gray-50"
        >
          <Download size={14} /> Baixar todos (CSV)
        </button>
      </div>
      <div className="max-h-[min(480px,50vh)] space-y-3 overflow-y-auto pr-1 scrollbar-hide">
        {holerites.map((h) => {
          const isCollapsed = collapsed.has(h.competencia);
          return (
            <section
              key={h.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50"
            >
              <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggle(h.competencia)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  aria-expanded={!isCollapsed}
                >
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-primary transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                  <span className="text-sm font-black text-gray-900">
                    {competenciaLabel(h.competencia)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${holeriteStatusClass(h.status)}`}
                  >
                    {holeriteStatusLabel(h.status)}
                  </span>
                </button>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Líquido</p>
                  <p className="text-sm font-black text-gray-900">
                    R$ {h.netSalary.toLocaleString('pt-BR')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadHoleritePdf(h, profile)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1.5 text-[9px] font-bold text-white hover:bg-black"
                  title="Baixar holerite em PDF"
                >
                  <Download size={12} /> PDF
                </button>
              </div>
              {!isCollapsed ? (
                <div className="grid gap-3 px-4 py-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400">Bruto</p>
                    <p className="text-sm font-bold text-gray-900">
                      R$ {h.grossSalary.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400">Descontos</p>
                    <p className="text-sm font-bold text-red-700">
                      R$ {h.discounts.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400">Pago em</p>
                    <p className="text-sm font-bold text-gray-900">
                      {h.paidAt ? new Date(h.paidAt).toLocaleDateString('pt-BR') : '—'}
                    </p>
                  </div>
                  {h.financeTransactionId ? (
                    <p className="sm:col-span-3 text-[10px] font-semibold text-primary">
                      Vinculado ao pagamento no Financeiro
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function PanelFinanceiro({
  profile,
  companyId,
  salaryDraft,
  salaryNote,
  onSalaryDraft,
  onSalaryNote,
  onSave,
}: {
  profile: ColaboradorRhProfile;
  companyId: string;
  salaryDraft: string;
  salaryNote: string;
  onSalaryDraft: (v: string) => void;
  onSalaryNote: (v: string) => void;
  onSave: () => void;
}) {
  const extras = profile.financialExtras ?? [];
  const salary = profile.currentSalary ?? 0;
  const payments = useMemo(
    () => loadCollaboratorFinancePayments(companyId, profile),
    [companyId, profile],
  );
  const holerites = useMemo(
    () => resolveColaboradorHolerites(profile, payments),
    [profile, payments],
  );
  const totalPago = sumPaidAmount(payments, holerites);
  const ultimoLiquido = holerites.find((h) => h.status === 'pago')?.netSalary ?? holerites[0]?.netSalary;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
        <p className="text-[10px] font-black uppercase text-primary">RH ↔ Financeiro</p>
        <p className="mt-1 text-xs font-semibold text-gray-700">
          O RH calcula a folha e gera holerites. O Financeiro registra o pagamento. Quando o
          lançamento de folha é pago, o holerite aparece como <strong>Pago</strong> aqui.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Salário atual"
          value={salary > 0 ? `R$ ${salary.toLocaleString('pt-BR')}` : '—'}
          large
        />
        <StatCard
          label="Último líquido (holerite)"
          value={ultimoLiquido ? `R$ ${ultimoLiquido.toLocaleString('pt-BR')}` : '—'}
        />
        <StatCard
          label="Total pago (Financeiro)"
          value={totalPago > 0 ? `R$ ${totalPago.toLocaleString('pt-BR')}` : '—'}
        />
        <StatCard
          label="Custo RH mensal (est.)"
          value={salary > 0 ? `R$ ${Math.round(salary * 1.42).toLocaleString('pt-BR')}` : '—'}
        />
      </div>

      <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[14px] font-black text-gray-900">
              <FileText size={18} className="text-primary" />
              Holerites
            </h3>
            <p className="mt-1 text-[10px] font-semibold text-gray-500">
              Competência, bruto, descontos, líquido e status · documento do colaborador no RH
            </p>
          </div>
        </div>
        <HoleritesSection profile={profile} companyId={companyId} />
      </div>

      <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[14px] font-black text-gray-900">Pagamentos no Financeiro</h3>
          <Link
            to="/financeiro/pagar"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/10"
          >
            <ExternalLink size={14} /> Abrir Financeiro
          </Link>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nenhum pagamento de folha vinculado a este colaborador no Financeiro. Lançamentos com
            categoria <span className="font-bold">folha</span> e tag{' '}
            <span className="font-mono text-[10px]">[colab:{profile.id}]</span> aparecem aqui.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{p.description}</p>
                  <p className="text-[10px] font-semibold text-gray-500">
                    {new Date(p.paidAt).toLocaleDateString('pt-BR')}
                    {p.competencia ? ` · ${competenciaLabel(p.competencia)}` : ''}
                  </p>
                </div>
                <p className="text-sm font-black text-gray-900">
                  R$ {p.amount.toLocaleString('pt-BR')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[14px] font-black text-gray-900">Salário & reajustes (RH)</h3>
          <Link
            to="/financeiro"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
          >
            <ExternalLink size={14} /> Custos RH no Financeiro
          </Link>
        </div>
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="text-[9px] font-black uppercase text-gray-400">Novo salário (R$)</span>
            <input
              type="text"
              value={salaryDraft}
              onChange={(e) => onSalaryDraft(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold"
            />
          </label>
          <label className="min-w-0 flex-[2]">
            <span className="text-[9px] font-black uppercase text-gray-400">Motivo</span>
            <input
              type="text"
              value={salaryNote}
              onChange={(e) => onSalaryNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold"
            />
          </label>
          <button
            type="button"
            onClick={onSave}
            className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white"
          >
            Registrar
          </button>
        </div>
        <SectionTitle>Histórico salarial</SectionTitle>
        <EntryList
          items={(profile.salaryHistory ?? []).map((s) => ({
            id: s.id,
            title: `R$ ${s.amount.toLocaleString('pt-BR')}`,
            sub: `${new Date(s.effectiveDate).toLocaleDateString('pt-BR')}${s.note ? ` · ${s.note}` : ''}`,
          }))}
          empty="Nenhum registro salarial."
        />
        <SectionTitle className="mt-8">Bônus, premiações, benefícios & diárias</SectionTitle>
        <EntryList
          items={extras.map((e) => ({
            id: e.id,
            title: e.label,
            sub: `${new Date(e.at).toLocaleDateString('pt-BR')}${e.amount ? ` · R$ ${e.amount.toLocaleString('pt-BR')}` : ''}${e.note ? ` · ${e.note}` : ''}`,
          }))}
          empty="Sem lançamentos extras — vincule no Financeiro ou cadastre no RH."
        />
      </div>
    </div>
  );
}

export function PanelDocumentos({
  profile,
  docCategory,
  onCategory,
  onUpload,
}: {
  profile: ColaboradorRhProfile;
  docCategory: string;
  onCategory: (v: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = profile.documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      (doc.category && doc.category.toLowerCase().includes(q)) ||
      (doc.type && doc.type.toLowerCase().includes(q))
    );
  });

  return (
    <div className="rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
      <h3 className="mb-2 text-[14px] font-black text-gray-900">Central de documentos</h3>
      <p className="mb-6 text-xs text-gray-500">
        Contrato, RG, CPF, CNH, exames, certificados, férias, advertências — upload, vencimento,
        download e histórico no dossiê.
      </p>
      
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-6">
        <div className="flex-1 relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-xs font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={docCategory}
            onChange={(e) => onCategory(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold"
          >
            {DOC_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-black transition-colors shadow-sm">
            <Plus size={16} /> Adicionar Arquivo
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={onUpload} />
          </label>
        </div>
      </div>
      
      <div className="space-y-3">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4"
          >
            <div className="flex items-center gap-4">
              <FileText size={18} className="text-primary" />
              <div>
                <p className="text-xs font-bold text-gray-900">{doc.name}</p>
                <p className="text-[10px] font-bold uppercase text-gray-400">
                  {doc.category || doc.type}
                  {doc.expiresAt
                    ? ` · vence ${new Date(doc.expiresAt).toLocaleDateString('pt-BR')}`
                    : ''}
                  {doc.signedAt ? ' · assinatura digital' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${
                  doc.status === 'ok'
                    ? 'bg-green-100 text-green-700'
                    : doc.status === 'vencendo'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {doc.status}
              </span>
              <button
                type="button"
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-primary"
                title="Download"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        ))}
        {profile.documents.length === 0 ? (
          <p className="text-xs text-gray-500">Nenhum documento no dossiê.</p>
        ) : null}
      </div>
    </div>
  );
}

export function PanelTimeline({
  timeline,
  historyTitle,
  historyDetail,
  onTitle,
  onDetail,
  onSave,
}: {
  timeline: ColaboradorTimelineEvent[];
  historyTitle: string;
  historyDetail: string;
  onTitle: (v: string) => void;
  onDetail: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm lg:col-span-2">
        <h3 className="text-[14px] font-black text-gray-900">Timeline completa — dossiê RH</h3>
        <p className="text-xs text-gray-500">
          Admitido → treinamento → promoção → férias → salário → entregas → advertências → situação
          atual.
        </p>
        {timeline.length > 0 ? (
          <div className="relative space-y-6 border-l-2 border-primary/20 pl-6">
            {timeline.map((ev) => (
              <div key={ev.id} className="relative">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-white" />
                <p className="text-[9px] font-black uppercase text-gray-400">
                  {new Date(ev.at).toLocaleString('pt-BR')}
                </p>
                <p className="text-sm font-bold text-gray-900">{ev.title}</p>
                {ev.detail ? (
                  <p className="text-[11px] text-gray-600">{ev.detail}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">Sem eventos.</p>
        )}
      </div>
      <div className="rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
        <h3 className="text-lg font-black text-gray-900">Adicionar ao histórico</h3>
        <input
          value={historyTitle}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="Título"
          className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold"
        />
        <textarea
          value={historyDetail}
          onChange={(e) => onDetail(e.target.value)}
          placeholder="Detalhes"
          rows={4}
          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={onSave}
          className="mt-4 w-full rounded-xl bg-primary py-3 text-xs font-bold text-white"
        >
          Salvar no dossiê
        </button>
      </div>
    </div>
  );
}

export function PanelIA({ bundle }: { bundle: Colaborador360Bundle }) {
  const ia = bundle.ia;
  const meters = [
    { label: 'Risco desligamento', value: ia.riscoDesligamento, invert: true },
    { label: 'Performance', value: ia.performance },
    { label: 'Previsão promoção', value: ia.previsaoPromocao },
    { label: 'Comportamento', value: ia.comportamento },
    { label: 'Produtividade', value: ia.produtividade },
    { label: 'Risco jornada', value: ia.riscoJornada, invert: true },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-violet-100 bg-violet-50/50 p-6">
        <h3 className="flex items-center gap-2 text-lg font-black text-gray-900">
          <Brain size={20} className="text-violet-600" /> IA RH — insights
        </h3>
        <ul className="mt-4 space-y-2">
          {ia.highlights.map((h) => (
            <li key={h} className="text-xs font-semibold text-gray-700">
              · {h}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {meters.map((m) => (
          <div key={m.label} className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-[9px] font-black uppercase text-gray-400">{m.label}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${m.invert ? (m.value > 50 ? 'bg-red-500' : 'bg-emerald-500') : 'bg-primary'}`}
                style={{ width: `${m.value}%` }}
              />
            </div>
            <p className="mt-1 text-sm font-black text-gray-900">{m.value}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PanelAgenda({ profile }: { profile: ColaboradorRhProfile }) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const items = [...(profile.agenda ?? [])].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
  return (
    <div className="rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-[14px] font-black text-gray-900">
        <Calendar size={20} className="text-primary" /> Agenda do colaborador
      </h3>
      <p className="mb-6 text-xs text-gray-500">
        Aniversário, férias, reuniões, escalas, treinamentos e eventos — integrável ao calendário da
        empresa.
      </p>
      <div className="space-y-3">
        {items.map((ev) => (
          <div
            key={ev.id}
            onClick={() => setSelectedEvent(ev)}
            className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 cursor-pointer hover:border-primary transition-colors"
          >
            <Calendar size={16} className="shrink-0 text-primary" />
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">
                {new Date(ev.at).toLocaleDateString('pt-BR')} · {ev.kind}
              </p>
              <p className="text-sm font-bold text-gray-900">{ev.title}</p>
              {ev.detail ? <p className="text-[11px] text-gray-600 line-clamp-1">{ev.detail}</p> : null}
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="text-xs text-gray-500">Agenda vazia — adicione eventos pelo RH.</p>
        ) : null}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-6 shadow-xl relative">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 font-bold"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-primary">{selectedEvent.kind}</p>
                <h3 className="text-lg font-black text-gray-900 leading-tight">{selectedEvent.title}</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Data & Hora</p>
                <p className="text-sm font-bold text-gray-900">{new Date(selectedEvent.at).toLocaleString('pt-BR')}</p>
              </div>
              
              {selectedEvent.detail && (
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Informações Adicionais</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEvent.detail}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-full rounded-xl bg-gray-900 px-5 py-3 text-xs font-bold text-white hover:bg-black"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PanelMetas({ profile }: { profile: ColaboradorRhProfile }) {
  const goals = profile.goals ?? [];
  return (
    <div className="space-y-6">
      <div className="rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-[14px] font-black text-gray-900">
          <Target size={20} className="text-primary" /> Metas & performance
        </h3>
        <div className="space-y-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            return (
              <div key={g.id} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-bold text-gray-900">{g.title}</p>
                  <span className="text-[10px] font-black uppercase text-gray-400">{g.status}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {g.current}
                  {g.unit ? ` ${g.unit}` : ''} / {g.target}
                  {g.teamRank ? ` · #${g.teamRank} na equipe` : ''}
                </p>
              </div>
            );
          })}
          {goals.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhuma meta cadastrada.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PanelGestao({
  profile,
  bundle,
  onAddNote,
  noteDraft,
  onNoteDraft,
}: {
  profile: ColaboradorRhProfile;
  bundle: Colaborador360Bundle;
  onAddNote: () => void;
  noteDraft: string;
  onNoteDraft: (v: string) => void;
}) {
  const requests = profile.requests ?? [];
  const notes = profile.internalNotes ?? [];
  const audit = profile.auditLog ?? [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section className="rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-[16px] font-black text-gray-900">
          <ClipboardList size={18} /> Solicitações
        </h3>
        <div className="space-y-2">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex justify-between rounded-xl border border-gray-100 px-4 py-3"
            >
              <div>
                <p className="text-xs font-bold text-gray-900">{r.title}</p>
                <p className="text-[10px] uppercase text-gray-400">
                  {r.type} · {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span className="text-[9px] font-black uppercase text-primary">{r.status}</span>
            </div>
          ))}
          {requests.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhuma solicitação aberta.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-[16px] font-black text-gray-900">
          <MessageSquare size={18} /> Comunicação & observações RH
        </h3>
        <div className="mb-4 space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase text-gray-400">
                {n.author} · {new Date(n.at).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs font-semibold text-gray-800">{n.body}</p>
            </div>
          ))}
        </div>
        <textarea
          value={noteDraft}
          onChange={(e) => onNoteDraft(e.target.value)}
          placeholder="Aviso ou observação interna…"
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={onAddNote}
          className="mt-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white"
        >
          Registrar aviso
        </button>
      </section>

      <section className="rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-[16px] font-black text-gray-900">
          <Shield size={18} /> Auditoria
        </h3>
        <div className="space-y-2">
          {audit.map((a) => (
            <div key={a.id} className="border-b border-gray-50 py-2 last:border-0">
              <p className="text-[10px] font-black uppercase text-gray-400">
                {new Date(a.at).toLocaleString('pt-BR')} · {a.actor}
              </p>
              <p className="text-xs font-bold text-gray-900">{a.action}</p>
              {a.detail ? <p className="text-[11px] text-gray-600">{a.detail}</p> : null}
            </div>
          ))}
          {audit.length === 0 ? (
            <p className="text-xs text-gray-500">Sem registros de auditoria.</p>
          ) : null}
        </div>
      </section>
      </div>

      {bundle.isMotorista && profile.motoristaOps ? (
        <PanelOperacao profile={profile} />
      ) : null}
    </div>
  );
}

export function PanelOperacao({ profile }: { profile: ColaboradorRhProfile }) {
  const ops = profile.motoristaOps!;
  return (
    <section className="rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-[14px] font-black text-gray-900">
        <Truck size={20} className="text-primary" /> Operação — motorista
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Km rodados" value={ops.kmRodados.toLocaleString('pt-BR')} />
        <StatCard label="Entregas" value={String(ops.entregas)} />
        <StatCard label="Multas" value={String(ops.multas)} />
        <StatCard label="Ocorrências" value={String(ops.ocorrencias)} />
      </div>
      <p className="mt-4 text-xs font-semibold text-gray-600">
        <Car size={14} className="mr-1 inline" />
        Veículos: {ops.trucksUsed.join(', ') || '—'}
        {ops.consumoMedio ? ` · Consumo: ${ops.consumoMedio}` : ''}
      </p>
    </section>
  );
}

export { DOC_CATEGORIES };

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="mb-1 text-[9px] font-black uppercase text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value?.trim() || '—'}</p>
    </div>
  );
}

function StatCard({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-[9px] font-black uppercase text-gray-400">{label}</p>
      <p className={`mt-1 font-extrabold text-gray-900 ${large ? 'text-2xl' : 'text-lg'}`}>
        {value}
      </p>
    </div>
  );
}

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h4 className={`text-[10px] font-black uppercase tracking-normal text-gray-400 ${className}`}>
      {children}
    </h4>
  );
}

function EntryList({
  items,
  empty,
}: {
  items: { id: string; title: string; sub: string }[];
  empty: string;
}) {
  if (items.length === 0) return <p className="text-xs text-gray-500">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div
          key={i.id}
          className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
        >
          <div>
            <p className="text-sm font-black text-gray-900">{i.title}</p>
            <p className="text-[10px] font-bold uppercase text-gray-400">{i.sub}</p>
          </div>
          <DollarSign size={14} className="text-primary/30" />
        </div>
      ))}
    </div>
  );
}

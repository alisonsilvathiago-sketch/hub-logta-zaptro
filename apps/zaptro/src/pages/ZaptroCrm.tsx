import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Phone,
  MapPin,
  Percent,
  Package,
  Calendar,
  CalendarClock,
  Tag,
  MessageSquare,
  FileSpreadsheet,
  Truck,
  X,
  Sparkles,
  Flame,
  Timer,
  TrendingUp,
  CircleAlert,
  Search,
  Lock,
  ArrowRightLeft,
  List,
  ClipboardList,
  ExternalLink,
  Navigation,
  Link2,
  Send,
  CheckCircle2,
  Check,
  Copy,
  Paperclip,
  MoreVertical,
  FileText,
  Zap,
  UserPlus,
  ArrowUpRight,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ZAPTRO_MAP_DEST_ICON, 
  ZAPTRO_MAP_VEHICLE_ICON,
} from '../constants/zaptroMapStyles';
import ZaptroLayout from '../components/Zaptro/ZaptroLayout';
import ZaptroKpiMetricCard from '../components/Zaptro/ZaptroKpiMetricCard';
import { CrmKanbanVirtualList } from '../components/Zaptro/CrmKanbanVirtualList';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useZaptroTheme } from '../context/ZaptroThemeContext';
import HubGuard from '../components/HubGuard';
import { appendZaptroActivityLog } from '../constants/zaptroActivityLogStore';
import { ZAPTRO_ROUTES, zaptroWhatsappInboxThreadPath } from '../constants/zaptroRoutes';
import { routesStorageKey, writeActiveRoutes, type ActiveRouteRow } from '../constants/zaptroCrmActiveRoutes';
import {
  type FreightQuote,
  QUOTE_STATUS_LABEL,
  readQuotesMap,
  quotesStorageKey,
  quotePublicPath,
} from '../constants/zaptroQuotes';
import { isZaptroBrandingEntitledByPlan } from '../utils/zaptroBrandingEntitlement';
import {
  fetchCrmTasksForLead,
  insertCrmTask,
  updateCrmTaskStatus,
  type ZaptroCrmTaskRow,
} from '../constants/zaptroCrmTasksDb';
import { isZaptroTenantAdminRole } from '../utils/zaptroPermissions';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { hubSupabase } from '../lib/hubSupabase';
import {
  fetchCrmWorkspace,
  upsertCrmWorkspace,
  readWorkspaceLocalTouchIso,
  writeWorkspaceLocalTouchIso,
  ZAPTRO_CRM_WORKSPACE_PAYLOAD_VERSION,
} from '../lib/zaptroCrmWorkspaceDb';
import {
  mergeWhatsappConversationsIntoLeads,
  type ZaptroWaConversationRow,
} from '../lib/zaptroCrmWhatsappInboxSync';
import { resolveMemberAvatarUrl } from '../utils/zaptroAvatar';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import { ZAPTRO_SHADOW } from '../constants/zaptroShadows';
import {
  ZAPTRO_CARD_BG_DARK,
  ZAPTRO_CARD_SHADOW_LIGHT,
  zaptroCardRowStyle,
  zaptroCardSurfaceStyle,
  zaptroIconOrbStyle,
} from '../constants/zaptroCardSurface';
import { ZaptroFollowUpModule } from '../components/Zaptro/ZaptroFollowUpModule';
import { ZaptroAgendaModule } from '../components/Zaptro/ZaptroAgendaModule';

const LIME = '#D9FF00';

type Stage = 'novos' | 'atendimento' | 'negociacao' | 'fechado' | 'perdido';

type LeadTag = 'urgente' | 'vip' | 'retorno' | null;

type CrmLead = {
  id: string;
  clientName: string;
  /** Logo / foto da empresa cliente (URL). Opcional — sem valor usamos imagem de apoio por `id`. */
  clientLogoUrl?: string | null;
  phone: string;
  origin: string;
  destination: string;
  cargoType: string;
  estimatedValue: number;
  assigneeId: string | null;
  assigneeName: string;
  assigneeAvatarUrl?: string | null;
  createdAt: string;
  tag: LeadTag;
  /** 1–5 segmentos preenchidos na barra de progresso */
  progress: number;
  stage: Stage;
  /** Orçamento aprovado via link público — desbloqueia «Criar carga». */
  approvedQuoteId?: string | null;
};

const STAGES: { id: Stage; label: string; accent: string; probHint: string }[] = [
  { id: 'novos', label: 'Novos Leads', accent: '#94A3B8', probHint: 'Prob. fecho típica ~12%' },
  { id: 'atendimento', label: 'Em Atendimento', accent: '#64748B', probHint: '~32% ponderado' },
  { id: 'negociacao', label: 'Negociação', accent: '#475569', probHint: '~62% ponderado' },
  { id: 'fechado', label: 'Fechado', accent: LIME, probHint: 'Ganho 100%' },
  { id: 'perdido', label: 'Perdido', accent: 'rgba(248, 113, 113, 0.95)', probHint: 'Arquivado' },
];

/** Peso para valor esperado no pipeline (pré-visualização comercial, não contabilidade). */
const STAGE_WIN_WEIGHT: Record<Stage, number> = {
  novos: 0.12,
  atendimento: 0.32,
  negociacao: 0.62,
  fechado: 1,
  perdido: 0,
};

type FollowUpStatus = 'pendente' | 'concluido' | 'atrasado' | 'cancelado';
type FollowUpKind = 'lembrete' | 'whatsapp_auto';
type FollowUpChannel = 'whatsapp' | 'interno';

type ZaptroFollowUp = {
  id: string;
  company_id: string;
  client_id: string;
  client_name: string;
  client_type: 'lead' | 'cliente';
  kind: FollowUpKind;
  channel: FollowUpChannel;
  scheduled_at: string; // ISO
  message?: string;
  status: FollowUpStatus;
  user_id: string;
  created_at: string;
};

type MeetingStatus = 'agendada' | 'concluida' | 'cancelada';
type ZaptroMeeting = {
  id: string;
  company_id: string;
  client_id: string;
  client_name: string;
  title: string;
  description?: string;
  scheduled_at: string; // ISO
  duration_minutes: number;
  status: MeetingStatus;
  user_id: string;
  created_at: string;
};

function daysSinceContact(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function leadHeat(lead: CrmLead): { label: string; variant: 'hot' | 'warm' | 'stale' | 'cold' } {
  const d = daysSinceContact(lead.createdAt);
  if (lead.stage === 'novos' && d >= 3) return { label: `Parado há ${d} dias`, variant: 'stale' };
  if (lead.tag === 'urgente' || lead.stage === 'negociacao') return { label: 'Quente', variant: 'hot' };
  if (lead.tag === 'vip' || lead.tag === 'retorno') return { label: 'Acompanhar', variant: 'warm' };
  if (d >= 7 && lead.stage !== 'fechado' && lead.stage !== 'perdido') {
    return { label: `Sem movimento · ${d}d`, variant: 'stale' };
  }
  return { label: 'Frio', variant: 'cold' };
}

/** Área do Kanban (tema claro) — cinza muito claro; colunas/cartões em branco. */
const CRM_KANBAN_COLUMN_BG_LIGHT = '#FFFFFF';

/** Superfície do cartão: branco puro (claro) / cartão Zaptro (escuro), sem lavado verde. */
function crmKanbanCardBg(_leadId: string, isDark: boolean): string {
  return isDark ? ZAPTRO_CARD_BG_DARK : '#FFFFFF';
}

function waDigits(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length >= 10 && d.length <= 11 && !d.startsWith('55')) return `55${d}`;
  return d;
}

function storageKey(companyId: string) {
  return `zaptro_crm_kanban_v3_${companyId}`;
}

function eventsStorageKey(crmId: string) {
  return `zaptro_crm_timeline_v1_${crmId}`;
}

type CrmTimelineKind = 'system' | 'whatsapp' | 'call' | 'stage' | 'proposal' | 'negotiation' | 'route' | 'assign' | 'quote';

type CrmTimelineEvent = {
  id: string;
  at: string;
  kind: CrmTimelineKind;
  title: string;
  body?: string;
  actor?: string;
};

function seedEventsForLeads(leads: CrmLead[], actorName: string): Record<string, CrmTimelineEvent[]> {
  const out: Record<string, CrmTimelineEvent[]> = {};
  for (const l of leads) {
    const stageLabel = STAGES.find((s) => s.id === l.stage)?.label || l.stage;
    out[l.id] = [
      {
        id: `${l.id}-seed-0`,
        at: l.createdAt,
        kind: 'system',
        title: 'Lead registado no CRM',
        body: `Canal: ${l.origin} · Interesse: ${l.destination} · Produto/Serviço: ${l.cargoType}`,
        actor: actorName,
      },
      {
        id: `${l.id}-seed-1`,
        at: l.createdAt,
        kind: 'stage',
        title: `Etapa: ${stageLabel}`,
        body: 'Estado inicial do pipeline comercial.',
        actor: actorName,
      },
    ];
  }
  return out;
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function timelineKindLabel(k: CrmTimelineKind): string {
  switch (k) {
    case 'system':
      return 'Sistema';
    case 'whatsapp':
      return 'WhatsApp';
    case 'call':
      return 'Chamada';
    case 'stage':
      return 'Pipeline';
    case 'proposal':
      return 'Proposta';
    case 'negotiation':
      return 'Oportunidade';
    case 'route':
      return 'Rota';
    case 'assign':
      return 'Responsável';
    case 'quote':
      return 'Orçamento';
    default:
      return k;
  }
}

function formatBrl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return '—';
  }
}

/** Admin age em tudo; sem responsável o lead está «livre» (qualquer um pode assumir); com responsável só o dono age. */
function canActOnLead(lead: CrmLead, isAdmin: boolean, userId: string | undefined): boolean {
  if (isAdmin) return true;
  if (!lead.assigneeId) return true;
  return lead.assigneeId === userId;
}

/** Estado comercial de alto nível (visível no detalhe — alinhado ao modelo HubSpot/Kommo). */
function crmAttentionBadge(stage: Stage): { label: string; hint: string } {
  switch (stage) {
    case 'novos':
      return { label: 'Livre / na fila', hint: 'Entrada ou ainda sem dono operacional' };
    case 'atendimento':
      return { label: 'Em atendimento', hint: 'Equipa comercial a tratar' };
    case 'negociacao':
      return { label: 'Aguardando cliente', hint: 'Proposta ou resposta pendente do cliente' };
    case 'fechado':
      return { label: 'Finalizado', hint: 'Ganho' };
    case 'perdido':
      return { label: 'Finalizado', hint: 'Perdido / arquivado' };
  }
}

function demoLeads(selfId: string, adminName: string): CrmLead[] {
  return [
    {
      id: 'lead-active-001',
      clientName: 'Logística Integrada Brasil',
      phone: '5511998776655',
      origin: 'São Paulo/SP',
      destination: 'Curitiba/PR',
      cargoType: 'Carga Fechada — 28t',
      estimatedValue: 12500,
      assigneeId: selfId,
      assigneeName: adminName,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      tag: 'vip',
      progress: 3,
      stage: 'atendimento'
    },
    {
      id: 'lead-active-002',
      clientName: 'Alimentos Norte Sul',
      phone: '5585991223344',
      origin: 'Fortaleza/CE',
      destination: 'Recife/PE',
      cargoType: 'Frigorificado — Perecíveis',
      estimatedValue: 8400,
      assigneeId: null,
      assigneeName: 'Aguardando Atendente',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      tag: 'urgente',
      progress: 1,
      stage: 'novos'
    },
    {
      id: 'lead-active-003',
      clientName: 'Mineração Vale do Sol',
      phone: '5531988112233',
      origin: 'Belo Horizonte/MG',
      destination: 'Santos/SP',
      cargoType: 'Maquinário Pesado',
      estimatedValue: 42000,
      assigneeId: selfId,
      assigneeName: adminName,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      tag: 'retorno',
      progress: 4,
      stage: 'negociacao'
    }
  ];
}

const ZaptroCrmContent: React.FC = () => {
  const { profile } = useAuth();
  const { company } = useTenant();
  const { palette } = useZaptroTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = isZaptroTenantAdminRole(profile?.role);
  const isDark = palette.mode === 'dark';
  const cardBg = isDark ? ZAPTRO_CARD_BG_DARK : '#FFFFFF';
  const border = isDark ? '#334155' : '#E4E4E7';

  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [teamOptions, setTeamOptions] = useState<{ id: string; full_name: string | null; avatar_url?: string | null }[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ativos' | 'perdidos' | 'todos'>('ativos');
  const [searchTerm, setSearchTerm] = useState('');
  const [detail, setDetail] = useState<CrmLead | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    clientName: '',
    phone: '',
    origin: '',
    destination: '',
    cargoType: '',
    estimatedValue: '',
    tag: '' as '' | LeadTag,
    assigneeId: '' as string,
  });

  const [leadEvents, setLeadEvents] = useState<Record<string, CrmTimelineEvent[]>>({});
  const [activeRoutes, setActiveRoutes] = useState<ActiveRouteRow[]>([]);
  const [crmUiMode, setCrmUiMode] = useState<'kanban' | 'listas' | 'followups' | 'agenda'>('kanban');

  // NOVOS ESTADOS: Follow-ups e Agenda
  const [followups, setFollowups] = useState<ZaptroFollowUp[]>([]);
  const [meetings, setMeetings] = useState<ZaptroMeeting[]>([]);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState<'todos' | 'hoje' | 'atrasados' | 'proximos'>('todos');
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalForm, setProposalForm] = useState<{
    kind: 'proposal' | 'negotiation';
    leadId: string;
    title: string;
    value: string;
    schedule: string;
    notes: string;
  }>({ kind: 'proposal', leadId: '', title: '', value: '', schedule: '', notes: '' });

  const [quotesByLead, setQuotesByLead] = useState<Record<string, FreightQuote[]>>({});
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteWizardStep, setQuoteWizardStep] = useState<1 | 2 | 3>(1);
  const [quoteForm, setQuoteForm] = useState({
    origin: '',
    destination: '',
    cargoType: '',
    weightQty: '',
    freightValue: '',
    deliveryDeadline: '',
    notes: '',
  });
  const [lastCreatedQuote, setLastCreatedQuote] = useState<FreightQuote | null>(null);

  const [leadTasks, setLeadTasks] = useState<ZaptroCrmTaskRow[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskContextLeadId, setTaskContextLeadId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', dueAt: '', notes: '' });
  const [taskSaving, setTaskSaving] = useState(false);
  const [callModalLead, setCallModalLead] = useState<CrmLead | null>(null);

  const [fuForm, setFuForm] = useState({
    clientId: '',
    clientName: '',
    clientType: 'lead' as 'lead' | 'cliente',
    kind: 'lembrete' as 'lembrete' | 'whatsapp_auto',
    channel: 'interno' as 'whatsapp' | 'interno',
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    message: ''
  });

  const [mtForm, setMtForm] = useState({
    clientId: '',
    clientName: '',
    title: '',
    description: '',
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    durationMinutes: 30
  });

  /** Um único fluxo: o modal escolhe Proposta vs Oportunidade. URLs só pré-seleccionam o tipo. */
  useEffect(() => {
    const action = searchParams.get('action');
    if (action !== 'new_proposal' && action !== 'new_negociation' && action !== 'new_negotiation') return;
    const kind: 'proposal' | 'negotiation' = action === 'new_proposal' ? 'proposal' : 'negotiation';
    setProposalForm({
      kind,
      leadId: detail?.id || leads[0]?.id || '',
      title: '',
      value: '',
      schedule: '',
      notes: '',
    });
    setProposalOpen(true);
    setSearchParams({}, { replace: true });
  }, [searchParams, detail?.id, leads, setSearchParams]);

  const companyId = profile?.company_id || '';
  /** Sem empresa no perfil ainda: mesmo assim mostramos o Kanban com dados locais de demonstração. */
  const crmStorageId = companyId || 'local-demo';

  /** Evita gravar no Supabase imediatamente a seguir a hidratação remota (debounce). */
  const workspaceUpsertSuppressUntilRef = useRef(0);

  const bumpWorkspaceLocalTouch = useCallback(() => {
    if (companyId) writeWorkspaceLocalTouchIso(companyId, new Date().toISOString());
  }, [companyId]);

  const loadFromStorage = useCallback(() => {
    let nextLeads: CrmLead[] = [];
    try {
      const raw = localStorage.getItem(storageKey(crmStorageId));
      if (raw) {
        const parsed = JSON.parse(raw) as CrmLead[];
        if (Array.isArray(parsed) && parsed.length) {
          nextLeads = parsed;
          setLeads(parsed);
        }
      }
      if (nextLeads.length === 0) {
        const seed = demoLeads(profile?.id || 'me', profile?.full_name || 'Você');
        nextLeads = seed;
        setLeads(seed);
        localStorage.setItem(storageKey(crmStorageId), JSON.stringify(seed));
      }
    } catch {
      const seed = demoLeads(profile?.id || 'me', profile?.full_name || 'Você');
      nextLeads = seed;
      setLeads(seed);
      try {
        localStorage.setItem(storageKey(crmStorageId), JSON.stringify(seed));
      } catch {
        /* ignore */
      }
    }

    try {
      const evRaw = localStorage.getItem(eventsStorageKey(crmStorageId));
      if (evRaw) {
        const parsed = JSON.parse(evRaw) as Record<string, CrmTimelineEvent[]>;
        if (parsed && typeof parsed === 'object') setLeadEvents(parsed);
        else setLeadEvents({});
      } else if (nextLeads.length > 0) {
        const seeded = seedEventsForLeads(nextLeads, profile?.full_name || 'Equipa');
        setLeadEvents(seeded);
        localStorage.setItem(eventsStorageKey(crmStorageId), JSON.stringify(seeded));
      } else {
        setLeadEvents({});
      }
    } catch {
      setLeadEvents({});
    }

    try {
      const rtRaw = localStorage.getItem(routesStorageKey(crmStorageId));
      if (rtRaw) {
        const parsed = JSON.parse(rtRaw) as ActiveRouteRow[];
        setActiveRoutes(Array.isArray(parsed) ? parsed : []);
      } else {
        setActiveRoutes([]);
      }
    } catch {
      setActiveRoutes([]);
    }

    setQuotesByLead(readQuotesMap(crmStorageId));
  }, [crmStorageId, profile?.full_name, profile?.id]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  /** Sincroniza com Supabase quando a linha existe e está mais recente que a última edição local. */
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    void (async () => {
      try {
        const row = await fetchCrmWorkspace(companyId);
        if (cancelled || !row) return;
        const localTouch = readWorkspaceLocalTouchIso(companyId);
        const tLocal = localTouch ? new Date(localTouch).getTime() : 0;
        const tRemote = new Date(row.updated_at).getTime();
        if (tRemote <= tLocal) return;

        const p = row.payload;
        const remoteLeads = Array.isArray(p.leads) ? (p.leads as CrmLead[]) : [];
        if (remoteLeads.length === 0) return;

        workspaceUpsertSuppressUntilRef.current = Date.now() + 2200;

        setLeads(remoteLeads);
        if (p.leadEvents && typeof p.leadEvents === 'object' && !Array.isArray(p.leadEvents)) {
          setLeadEvents(p.leadEvents as Record<string, CrmTimelineEvent[]>);
        } else {
          setLeadEvents({});
        }
        const qMap =
          p.quotesByLead && typeof p.quotesByLead === 'object' && !Array.isArray(p.quotesByLead)
            ? (p.quotesByLead as Record<string, FreightQuote[]>)
            : {};
        setQuotesByLead(qMap);
        const routes = Array.isArray(p.activeRoutes) ? (p.activeRoutes as ActiveRouteRow[]) : [];
        setActiveRoutes(routes);

        try {
          localStorage.setItem(storageKey(companyId), JSON.stringify(remoteLeads));
          localStorage.setItem(
            eventsStorageKey(companyId),
            JSON.stringify(
              p.leadEvents && typeof p.leadEvents === 'object' && !Array.isArray(p.leadEvents) ? p.leadEvents : {}
            )
          );
          writeQuotesMap(companyId, qMap);
          writeActiveRoutes(companyId, routes);
        } catch {
          /* ignore */
        }
        writeWorkspaceLocalTouchIso(companyId, row.updated_at);
      } catch {
        /* rede / RLS / tabela em falta */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const t = window.setTimeout(() => {
      if (Date.now() < workspaceUpsertSuppressUntilRef.current) return;
      const payload = {
        v: ZAPTRO_CRM_WORKSPACE_PAYLOAD_VERSION,
        leads,
        leadEvents,
        quotesByLead,
        activeRoutes,
      };
      void upsertCrmWorkspace(companyId, payload)
        .then((ok) => {
          if (ok) writeWorkspaceLocalTouchIso(companyId, new Date().toISOString());
        })
        .catch(() => {
          /* tabela em falta ou offline */
        });
    }, 1600);
    return () => window.clearTimeout(t);
  }, [companyId, leads, leadEvents, quotesByLead, activeRoutes]);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabaseZaptro
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('company_id', companyId)
        .order('full_name', { ascending: true });
      if (!cancelled && !error && data) setTeamOptions(data as typeof teamOptions);
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const persist = useCallback(
    (next: CrmLead[]) => {
      setLeads(next);
      try {
        localStorage.setItem(storageKey(crmStorageId), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      bumpWorkspaceLocalTouch();
    },
    [bumpWorkspaceLocalTouch, crmStorageId]
  );

  const waCrmSyncTimerRef = useRef(0);

  /** Sincroniza conversas `whatsapp_conversations` → cartões no Kanban (Realtime). */
  useEffect(() => {
    if (!companyId) return;
    const run = () => {
      void (async () => {
        try {
          const { data, error } = await supabaseZaptro
            .from('whatsapp_conversations')
            .select('id,sender_number,sender_name,last_message,status,last_customer_message_at')
            .eq('company_id', companyId);
          if (error) return;
          const rows = (data || []) as ZaptroWaConversationRow[];
          setLeads((prev) => {
            const { next, touched } = mergeWhatsappConversationsIntoLeads(prev, rows);
            if (!touched) return prev;
            try {
              localStorage.setItem(storageKey(crmStorageId), JSON.stringify(next));
            } catch {
              /* ignore */
            }
            bumpWorkspaceLocalTouch();
            return next as CrmLead[];
          });
        } catch {
          /* tabela em falta / rede */
        }
      })();
    };
    run();
    const channel = supabaseZaptro
      .channel(`zaptro_crm_wa_sync_${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_conversations', filter: `company_id=eq.${companyId}` },
        () => {
          window.clearTimeout(waCrmSyncTimerRef.current);
          waCrmSyncTimerRef.current = window.setTimeout(run, 320);
        },
      )
      .subscribe();
    return () => {
      window.clearTimeout(waCrmSyncTimerRef.current);
      void supabaseZaptro.removeChannel(channel);
    };
  }, [companyId, crmStorageId, bumpWorkspaceLocalTouch]);

  const appendLeadEvent = useCallback(
    (leadId: string, partial: Omit<CrmTimelineEvent, 'id'> & { id?: string }) => {
      const id = partial.id ?? `ev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const row: CrmTimelineEvent = {
        id,
        at: partial.at,
        kind: partial.kind,
        title: partial.title,
        body: partial.body,
        actor: partial.actor,
      };
      setLeadEvents((prev) => {
        const next = { ...prev, [leadId]: [...(prev[leadId] || []), row] };
        try {
          localStorage.setItem(eventsStorageKey(crmStorageId), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        bumpWorkspaceLocalTouch();
        return next;
      });
    },
    [bumpWorkspaceLocalTouch, crmStorageId]
  );

  const loadLeadTasks = useCallback(
    async (explicitLeadId?: string) => {
      const lid = explicitLeadId ?? detail?.id;
      if (!companyId || !lid) {
        if (!explicitLeadId) setLeadTasks([]);
        return;
      }
      setTasksLoading(true);
      try {
        const rows = await fetchCrmTasksForLead(companyId, lid);
        setLeadTasks(rows);
      } catch {
        setLeadTasks([]);
      } finally {
        setTasksLoading(false);
      }
    },
    [companyId, detail?.id]
  );

  useEffect(() => {
    void loadLeadTasks();
  }, [loadLeadTasks]);

  const openTaskScheduling = useCallback((leadId: string, clientName: string) => {
    setTaskContextLeadId(leadId);
    setTaskForm({
      title: `Retorno: ${clientName}`,
      dueAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
      notes: '',
    });
    setTaskModalOpen(true);
  }, []);

  const submitTaskModal = useCallback(async () => {
    if (!companyId || !taskContextLeadId || !profile?.id) {
      notifyZaptro('info', 'Tarefas', 'Associa o teu utilizador a uma empresa (company_id) para gravar tarefas no Supabase.');
      return;
    }
    const title = taskForm.title.trim();
    if (!title) {
      notifyZaptro('info', 'Tarefas', 'Indica um título para a tarefa.');
      return;
    }
    setTaskSaving(true);
    try {
      const dueAtIso = taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null;
      await insertCrmTask({
        companyId,
        leadId: taskContextLeadId,
        title,
        dueAtIso,
        notes: taskForm.notes.trim() || null,
        createdBy: profile.id,
      });
      appendLeadEvent(taskContextLeadId, {
        at: new Date().toISOString(),
        kind: 'system',
        title: 'Tarefa / retorno agendado',
        body: `${title}${dueAtIso ? ` · até ${new Date(dueAtIso).toLocaleString('pt-BR')}` : ''}`,
        actor: profile.full_name || '—',
      });
      notifyZaptro('success', 'Tarefas', 'Retorno gravado no Supabase.');
      setTaskModalOpen(false);
      await loadLeadTasks(taskContextLeadId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'MISSING_TABLE') {
        notifyZaptro(
          'error',
          'Tarefas',
          'Corre o SQL em logta/supabase/migrations/20260418000000_zaptro_crm_tasks.sql no Supabase (instruções em logta/supabase/README.md).',
        );
      } else {
        notifyZaptro('error', 'Tarefas', msg || 'Não foi possível gravar.');
      }
    } finally {
      setTaskSaving(false);
    }
  }, [companyId, taskContextLeadId, profile?.id, profile?.full_name, taskForm, appendLeadEvent, loadLeadTasks]);

  const markCrmTaskDone = useCallback(
    async (task: ZaptroCrmTaskRow) => {
      if (!companyId) return;
      try {
        await updateCrmTaskStatus(task.id, companyId, 'done');
        appendLeadEvent(task.lead_id, {
          at: new Date().toISOString(),
          kind: 'system',
          title: 'Tarefa concluída',
          body: task.title,
          actor: profile?.full_name || '—',
        });
        notifyZaptro('success', 'Tarefas', 'Marcada como feita.');
        await loadLeadTasks(task.lead_id);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '';
        if (msg === 'MISSING_TABLE') {
          notifyZaptro('error', 'Tarefas', 'Tabela `zaptro_crm_tasks` ainda não existe no projeto Supabase.');
        } else {
          notifyZaptro('error', 'Tarefas', msg || 'Erro ao atualizar.');
        }
      }
    },
    [companyId, appendLeadEvent, loadLeadTasks, profile?.full_name]
  );

  const persistQuotesMap = useCallback(
    (next: Record<string, FreightQuote[]>) => {
      setQuotesByLead(next);
      try {
        localStorage.setItem(quotesStorageKey(crmStorageId), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      try {
        window.dispatchEvent(new Event('zaptro-quotes-updated'));
      } catch {
        /* ignore */
      }
      bumpWorkspaceLocalTouch();
    },
    [bumpWorkspaceLocalTouch, crmStorageId]
  );

  useEffect(() => {
    const onDisk = () => {
      try {
        const raw = localStorage.getItem(storageKey(crmStorageId));
        if (raw) setLeads(JSON.parse(raw) as CrmLead[]);
        setQuotesByLead(readQuotesMap(crmStorageId));
        const evRaw = localStorage.getItem(eventsStorageKey(crmStorageId));
        if (evRaw) setLeadEvents(JSON.parse(evRaw) as Record<string, CrmTimelineEvent[]>);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('zaptro-quotes-updated', onDisk);
    return () => window.removeEventListener('zaptro-quotes-updated', onDisk);
  }, [crmStorageId]);

  const goToRoutesPage = useCallback(() => {
    navigate(ZAPTRO_ROUTES.ROUTES);
  }, [navigate]);

  const detailCanAct = useMemo(
    () => (detail ? canActOnLead(detail, isAdmin, profile?.id) : false),
    [detail, isAdmin, profile?.id]
  );

  const quotesForDetail = useMemo(
    () => (detail ? [...(quotesByLead[detail.id] || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []),
    [detail, quotesByLead]
  );

  const detailApprovedForCargo = useMemo(() => {
    if (!detail) return false;
    if (detail.approvedQuoteId) return true;
    return (quotesByLead[detail.id] || []).some((q) => q.status === 'aprovado');
  }, [detail, quotesByLead]);

  useEffect(() => {
    setDetail((d) => {
      if (!d) return d;
      const fresh = leads.find((l) => l.id === d.id);
      if (!fresh) return d;
      if (
        fresh.stage !== d.stage ||
        fresh.approvedQuoteId !== d.approvedQuoteId ||
        fresh.progress !== d.progress
      ) {
        return fresh;
      }
      return d;
    });
  }, [leads, detail?.id]);

  useEffect(() => {
    if (!callModalLead) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCallModalLead(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [callModalLead]);

  /** Visibilidade total da equipa: todos veem os mesmos cards; permissões em `canActOnLead`. */
  const visibleLeads = useMemo(() => {
    let list = leads;

    // Filter by stage
    if (filter === 'perdidos') {
      list = list.filter((l) => l.stage === 'perdido');
    } else if (filter === 'ativos') {
      list = list.filter((l) => l.stage !== 'perdido');
    }

    // Filter by search term
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((l) => {
        const hay = [
          l.clientName,
          l.phone,
          l.origin,
          l.destination,
          l.cargoType,
          l.assigneeName,
          l.tag,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }, [leads, filter, searchTerm]);

  const fetchFollowUps = useCallback(async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await hubSupabase
        .from('crm_followups')
        .select('*')
        .eq('company_id', company.id)
        .order('scheduled_at', { ascending: true });
      if (!error && data) setFollowups(data);
    } catch (err) {
      console.error('Error fetching followups:', err);
    }
  }, [company]);

  const fetchMeetings = useCallback(async () => {
    if (!company?.id) return;
    try {
      const { data, error } = await hubSupabase
        .from('crm_meetings')
        .select('*')
        .eq('company_id', company.id)
        .order('scheduled_at', { ascending: true });
      if (!error && data) setMeetings(data);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    }
  }, [company]);

  useEffect(() => {
    fetchFollowUps();
    fetchMeetings();
  }, [fetchFollowUps, fetchMeetings]);

  const createFollowUp = async (payload: any) => {
    if (!company?.id || !profile?.id) return;
    
    // Mapear camelCase (form) para snake_case (banco)
    const row = {
      company_id: company.id,
      user_id: profile.id,
      client_id: payload.clientId || payload.client_id,
      client_name: payload.clientName || payload.client_name,
      client_type: payload.clientType || payload.client_type || 'lead',
      kind: payload.kind || 'lembrete',
      channel: payload.channel || 'interno',
      scheduled_at: payload.scheduledAt || payload.scheduled_at,
      message: payload.message || '',
      status: 'pendente',
      created_at: new Date().toISOString()
    };

    const { error } = await hubSupabase.from('crm_followups').insert([row]);
    if (error) {
      console.error('Error creating follow-up:', error);
      throw error;
    }
    
    notifyZaptro('success', 'Follow-up', 'Agendado com sucesso no Hub!');
    fetchFollowUps();
    setFollowUpModalOpen(false);
  };

  const createMeeting = async (payload: Partial<ZaptroMeeting>) => {
    if (!company?.id || !profile?.id) return;
    const { error } = await hubSupabase.from('crm_meetings').insert([{
      ...payload,
      company_id: company.id,
      user_id: profile.id,
      status: 'agendada',
      created_at: new Date().toISOString()
    }]);
    if (!error) {
      notifyZaptro('success', 'Agenda', 'Reunião marcada com sucesso!');
      fetchMeetings();
      setMeetingModalOpen(false);
    } else {
      notifyZaptro('error', 'Erro', 'Falha ao marcar reunião.');
    }
  };

  const updateFollowUpStatus = async (id: string, status: FollowUpStatus) => {
    const { error } = await hubSupabase.from('crm_followups').update({ status }).eq('id', id);
    if (!error) fetchFollowUps();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // Check followups
      followups.forEach(fu => {
        if (fu.status !== 'pendente') return;
        const sched = new Date(fu.scheduledAt);
        const diffMs = sched.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        // 10 mins or 1 hour before
        if (diffMins === 10 || diffMins === 60) {
          notifyZaptro('info', 'Follow-up Próximo', `Follow-up com ${fu.clientName} em ${diffMins === 10 ? '10 minutos' : '1 hora'}.`);
        }
      });

      // Check meetings
      meetings.forEach(mt => {
        if (mt.status !== 'agendada') return;
        const sched = new Date(mt.scheduledAt);
        const diffMs = sched.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins === 10 || diffMins === 60) {
          notifyZaptro('info', 'Reunião Próxima', `Reunião "${mt.title}" com ${mt.clientName} em ${diffMins === 10 ? '10 minutos' : '1 hora'}.`);
        }
      });
    }, 60000);
    
    return () => clearInterval(interval);
  }, [followups, meetings]);

  const stats = useMemo(() => {
    const base = visibleLeads;
    const total = base.length;
    const novos = base.filter((l) => l.stage === 'novos').length;
    const atend = base.filter((l) => l.stage === 'atendimento').length;
    const fechados = base.filter((l) => l.stage === 'fechado').length;
    const emNeg = base.filter((l) => l.stage === 'negociacao').reduce((s, l) => s + l.estimatedValue, 0);
    return { total, novos, atend, fechados, emNeg };
  }, [visibleLeads]);

  const insights = useMemo(() => {
    const base = visibleLeads;
    const won = base.filter((l) => l.stage === 'fechado').length;
    const lost = base.filter((l) => l.stage === 'perdido').length;
    const decided = won + lost;
    const conversionPct = decided > 0 ? Math.round((100 * won) / decided) : 0;
    const pipelineLeads = base.filter((l) => l.stage !== 'fechado' && l.stage !== 'perdido');
    const weightedForecast = pipelineLeads.reduce((s, l) => s + l.estimatedValue * STAGE_WIN_WEIGHT[l.stage], 0);
    const staleInNovos = base.filter((l) => l.stage === 'novos' && daysSinceContact(l.createdAt) >= 3).length;
    const hotLeads = base.filter((l) => l.tag === 'urgente' || l.stage === 'negociacao').length;
    const avgDaysOpen =
      pipelineLeads.length > 0
        ? Math.round(
            pipelineLeads.reduce((s, l) => s + daysSinceContact(l.createdAt), 0) / pipelineLeads.length
          )
        : 0;
    return { conversionPct, weightedForecast, staleInNovos, hotLeads, avgDaysOpen };
  }, [visibleLeads]);

  const leadsByStage = useMemo(() => {
    const m: Record<Stage, CrmLead[]> = {
      novos: [],
      atendimento: [],
      negociacao: [],
      fechado: [],
      perdido: [],
    };
    for (const l of visibleLeads) {
      if (m[l.stage]) m[l.stage].push(l);
    }
    return m;
  }, [visibleLeads]);

  const updateLeadStage = (id: string, stage: Stage) => {
    const prevLead = leads.find((l) => l.id === id);
    persist(leads.map((l) => (l.id === id ? { ...l, stage } : l)));
    if (prevLead && prevLead.stage !== stage) {
      const fromL = STAGES.find((s) => s.id === prevLead.stage)?.label;
      const toL = STAGES.find((s) => s.id === stage)?.label;
      appendLeadEvent(id, {
        at: new Date().toISOString(),
        kind: 'stage',
        title: 'Pipeline atualizado',
        body: `De «${fromL}» para «${toL}».`,
        actor: profile?.full_name || '—',
      });
      appendZaptroActivityLog(crmStorageId, {
        type: 'atendimento',
        actorName: profile?.full_name || '—',
        clientLabel: prevLead.clientName,
        action: `Pipeline: ${fromL} → ${toL}`,
        details: `Lead ${prevLead.id}`,
      });

      // Se moveu para FECHADO, converter em CLIENTE e Sincronizar com HUB
      if (stage === 'fechado') {
        void handleCrmToHubSync(prevLead);
      }
    }
  };

  const handleCrmToHubSync = async (lead: CrmLead) => {
    try {
      // 1. Update whatsapp_conversations if possible
      if (lead.id.length > 30) { // Check if it's a UUID (probably from WA sync)
        await supabaseZaptro
          .from('whatsapp_conversations')
          .update({ crm_type: 'client' })
          .eq('id', lead.id);
      }

      // 2. Sync to Hub Master
      const clientName = lead.clientName || 'Novo Cliente';
      const clientSlug = clientName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);

      const { error: hError } = await hubSupabase
        .from('companies')
        .upsert({
          name: clientName,
          slug: clientSlug,
          document: lead.phone,
          status: 'active',
          origin: 'zaptro',
          metadata: {
            zaptro_lead_id: lead.id,
            synced_from: 'crm_kanban',
            synced_at: new Date().toISOString()
          }
        }, { onConflict: 'document' });

      if (hError) {
        notifyZaptro('warning', 'Hub Sync', 'Lead movido, mas falha ao sincronizar com o Master Hub.');
      } else {
        notifyZaptro('success', 'CRM', 'Cliente sincronizado com o Hub Master!');
      }
    } catch (err) {
      console.error('CRM Hub Sync Error:', err);
    }
  };

  const openDetail = (l: CrmLead) => {
    setDetail(l);
    setSearchParams({ leadId: l.id });
  };

  const openDetailById = (id: string) => {
    const l = leads.find(x => x.id === id);
    if (l) openDetail(l);
  };

  const saveDetailAssignee = (assigneeId: string | null, assigneeName: string, assigneeAvatarUrl?: string | null) => {
    if (!detail) return;
    const prevId = detail.assigneeId;
    const prevName = detail.assigneeName;
    persist(
      leads.map((l) =>
        l.id === detail.id
          ? { ...l, assigneeId, assigneeName, assigneeAvatarUrl: assigneeAvatarUrl !== undefined ? assigneeAvatarUrl : null }
          : l
      )
    );
    setDetail((d) =>
      d ? { ...d, assigneeId, assigneeName, assigneeAvatarUrl: assigneeAvatarUrl !== undefined ? assigneeAvatarUrl : null } : null
    );
    if (prevId !== assigneeId || prevName !== assigneeName) {
      appendLeadEvent(detail.id, {
        at: new Date().toISOString(),
        kind: 'assign',
        title: 'Responsável / encaminhamento',
        body: `De ${prevName || '—'} (${prevId || '—'}) para ${assigneeName || '—'}.`,
        actor: profile?.full_name || '—',
      });
      appendZaptroActivityLog(crmStorageId, {
        type: 'sistema',
        actorName: profile?.full_name || '—',
        clientLabel: detail.clientName,
        action: 'Responsável do lead alterado',
        details: `De ${prevName || '—'} para ${assigneeName || '—'}`,
      });
    }
  };

  const claimLead = () => {
    const isMaster = profile?.role?.toUpperCase() === 'MASTER' || profile?.role?.toUpperCase() === 'ADMIN';
    const isAdmin = isMaster; // Relaxed for immediate production feel
    if (!detail || !profile?.id) return;
    const name = profile.full_name?.trim() || 'Eu';
    persist(
      leads.map((l) =>
        l.id === detail.id
          ? { ...l, assigneeId: profile.id, assigneeName: name, assigneeAvatarUrl: profile.avatar_url ?? null }
          : l
      )
    );
    setDetail((d) =>
      d && d.id === detail.id
        ? { ...d, assigneeId: profile.id, assigneeName: name, assigneeAvatarUrl: profile.avatar_url ?? null }
        : d
    );
    notifyZaptro('success', 'CRM', 'Passaste a ser o responsável por este lead. As ações de contacto ficam desbloqueadas.');
    appendLeadEvent(detail.id, {
      at: new Date().toISOString(),
      kind: 'assign',
      title: 'Assumiu o atendimento',
      body: `${name} passou a ser o responsável único.`,
      actor: name,
    });
    appendZaptroActivityLog(crmStorageId, {
      type: 'atendimento',
      actorName: name,
      clientLabel: detail.clientName,
      action: 'Assumiu o atendimento do lead',
      details: `Lead ${detail.id}`,
    });
  };

  const requestContactHandoff = () => {
    if (!detail) return;
    notifyZaptro(
      'info',
      'Pedido enviado',
      `A equipa foi avisada (pré-visualização). Em produção isto notifica ${detail.assigneeName} ou o supervisor para decidir transferência ou contacto.`,
    );
    appendLeadEvent(detail.id, {
      at: new Date().toISOString(),
      kind: 'system',
      title: 'Pedido de contacto / colaboração',
      body: `${profile?.full_name || 'Colaborador'} pediu envolvimento no lead ainda atribuído a ${detail.assigneeName}.`,
      actor: profile?.full_name || '—',
    });
    appendZaptroActivityLog(crmStorageId, {
      type: 'atendimento',
      actorName: profile?.full_name || '—',
      clientLabel: detail.clientName,
      action: 'Pedido de contacto / colaboração',
      details: `Responsável actual: ${detail.assigneeName || '—'}`,
    });
  };

  const submitCreate = () => {
    if (!createForm.clientName.trim() || !createForm.phone.trim()) {
      notifyZaptro('info', 'CRM', 'Preencha pelo menos nome e telefone.');
      return;
    }
    const val = Number(String(createForm.estimatedValue).replace(/\D/g, '')) || 0;
    const assigneeId = isAdmin && createForm.assigneeId ? createForm.assigneeId : profile?.id || null;
    const assigneeName =
      teamOptions.find((t) => t.id === assigneeId)?.full_name?.trim() ||
      profile?.full_name ||
      'Responsável';
    const lead: CrmLead = {
      id: `lead-${Date.now()}`,
      clientName: createForm.clientName.trim(),
      phone: createForm.phone.trim(),
      origin: createForm.origin.trim() || '—',
      destination: createForm.destination.trim() || '—',
      cargoType: createForm.cargoType.trim() || '—',
      estimatedValue: val,
      assigneeId,
      assigneeName,
      assigneeAvatarUrl: null,
      createdAt: new Date().toISOString(),
      tag: createForm.tag || null,
      progress: 1,
      stage: 'novos',
    };
    persist([lead, ...leads]);
    appendLeadEvent(lead.id, {
      at: new Date().toISOString(),
      kind: 'system',
      title: 'Novo contacto criado',
      body: `${lead.clientName} · ${formatBrl(val)} · Responsável: ${assigneeName}`,
      actor: profile?.full_name || assigneeName,
    });
    setCreateOpen(false);
    setCreateForm({
      clientName: '',
      phone: '',
      origin: '',
      destination: '',
      cargoType: '',
      estimatedValue: '',
      tag: '',
      assigneeId: '',
    });
    notifyZaptro('success', 'CRM', 'Lead criado em Novos Leads.');
    appendZaptroActivityLog(crmStorageId, {
      type: 'atendimento',
      actorName: profile?.full_name || assigneeName,
      clientLabel: lead.clientName,
      action: 'Novo lead criado',
      details: `${lead.origin} → ${lead.destination} · ${formatBrl(val)}`,
    });
  };

  const openProposalModal = (presetKind: 'proposal' | 'negotiation' = 'proposal') => {
    setProposalForm({
      kind: presetKind,
      leadId: detail?.id || leads[0]?.id || '',
      title: '',
      value: '',
      schedule: '',
      notes: '',
    });
    setProposalOpen(true);
  };

  const submitProposal = () => {
    if (!proposalForm.leadId || !proposalForm.title.trim()) {
      notifyZaptro(
        'info',
        proposalForm.kind === 'proposal' ? 'Proposta' : 'Oportunidade',
        proposalForm.kind === 'proposal'
          ? 'Escolhe um lead e preenche o título da proposta.'
          : 'Escolhe um lead e o título da oportunidade.',
      );
      return;
    }
    const val = Number(String(proposalForm.value).replace(/\D/g, '')) || 0;
    const isProposal = proposalForm.kind === 'proposal';
    const parts = isProposal
      ? ([
          val ? `Valor: ${formatBrl(val)}` : null,
          proposalForm.schedule.trim() ? `Validade: ${proposalForm.schedule.trim()}` : null,
          proposalForm.notes.trim() ? proposalForm.notes.trim() : null,
        ].filter(Boolean) as string[])
      : ([
          val ? `Valor alvo: ${formatBrl(val)}` : null,
          proposalForm.schedule.trim() ? `Prazo: ${proposalForm.schedule.trim()}` : null,
          proposalForm.notes.trim() ? proposalForm.notes.trim() : null,
        ].filter(Boolean) as string[]);
    appendLeadEvent(proposalForm.leadId, {
      at: new Date().toISOString(),
      kind: isProposal ? 'proposal' : 'negotiation',
      title: isProposal
        ? `Proposta comercial: ${proposalForm.title.trim()}`
        : `Oportunidade: ${proposalForm.title.trim()}`,
      body: parts.join('\n') || undefined,
      actor: profile?.full_name || '—',
    });
    setProposalOpen(false);
    setProposalForm({ kind: 'proposal', leadId: '', title: '', value: '', schedule: '', notes: '' });
    notifyZaptro(
      'success',
      isProposal ? 'Proposta' : 'Oportunidade',
      isProposal
        ? 'Registada no histórico do lead. PDF e envio por e-mail serão ligados ao backend.'
        : 'Registada no histórico do lead.',
    );
    const lead = leads.find((l) => l.id === proposalForm.leadId);
    appendZaptroActivityLog(crmStorageId, {
      type: 'atendimento',
      actorName: profile?.full_name || '—',
      clientLabel: lead?.clientName || 'Lead',
      action: isProposal ? `Proposta: ${proposalForm.title.trim()}` : `Oportunidade: ${proposalForm.title.trim()}`,
      details: parts.join(' · ') || undefined,
    });
  };

  const openQuoteWizard = () => {
    if (!detail) return;
    setQuoteForm({
      origin: detail.origin,
      destination: detail.destination,
      cargoType: detail.cargoType,
      weightQty: '',
      freightValue: detail.estimatedValue ? String(detail.estimatedValue) : '',
      deliveryDeadline: '',
      notes: '',
    });
    setQuoteWizardStep(1);
    setLastCreatedQuote(null);
    setQuotesByLead(readQuotesMap(crmStorageId));
    setQuoteModalOpen(true);
  };

  const confirmQuoteStep2 = () => {
    if (!quoteForm.origin.trim() || !quoteForm.destination.trim()) {
      notifyZaptro('info', 'Orçamento', 'Preenche origem e destino.');
      return;
    }
    setQuoteWizardStep(2);
  };

  const commitQuotePendente = () => {
    if (!detail) return;
    const val = Number(String(quoteForm.freightValue).replace(/\D/g, '')) || 0;
    const now = new Date().toISOString();
    const id = `qt-${Date.now()}`;
    const token = `qt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    const cargo = quoteForm.cargoType.trim() || '—';
    const wq = quoteForm.weightQty.trim() || '—';
    const branded = isZaptroBrandingEntitledByPlan(company);
    const primaryHex =
      branded && company?.primary_color && /^#[0-9A-Fa-f]{3,8}$/.test(company.primary_color.trim())
        ? company.primary_color.trim()
        : undefined;
    const q: FreightQuote = {
      id,
      leadId: detail.id,
      token,
      clientNameSnapshot: detail.clientName,
      origin: quoteForm.origin.trim(),
      destination: quoteForm.destination.trim(),
      cargoType: cargo,
      weightQty: wq,
      productService: [cargo, wq].filter((x) => x && x !== '—').join(' · ') || 'Frete rodoviário',
      quantity: wq,
      quoteValue: val,
      freightValue: val,
      deliveryDeadline: quoteForm.deliveryDeadline.trim() || '—',
      notes: quoteForm.notes.trim(),
      status: 'pendente',
      createdAt: now,
      updatedAt: now,
      history: [{ at: now, action: 'Orçamento criado', detail: `Por ${profile?.full_name || 'Equipa'}` }],
      issuerCompanyName: company?.name?.trim() || 'Transportadora',
      issuerLogoUrl: company?.logo_url?.trim() || null,
      issuerPdfBranded: branded,
      issuerPrimaryColor: primaryHex,
    };
    const map = { ...readQuotesMap(crmStorageId) };
    map[detail.id] = [...(map[detail.id] || []), q];
    persistQuotesMap(map);
    appendLeadEvent(detail.id, {
      at: now,
      kind: 'quote',
      title: `Orçamento de frete · ${formatBrl(val)}`,
      body: `${q.origin} → ${q.destination}\nRef.: ${id}`,
      actor: profile?.full_name || '—',
    });
    setLastCreatedQuote(q);
    setQuoteWizardStep(3);
    notifyZaptro('success', 'Orçamento', 'Passo 3: partilha o link com o cliente ou simula o envio por WhatsApp.');
    appendZaptroActivityLog(crmStorageId, {
      type: 'atendimento',
      actorName: profile?.full_name || '—',
      clientLabel: detail.clientName,
      action: `Orçamento de frete criado · ${formatBrl(val)}`,
      details: `${q.origin} → ${q.destination} · ${id}`,
    });
  };

  const simulateSendQuoteWhatsApp = () => {
    if (!lastCreatedQuote || !detail) return;
    const map = { ...readQuotesMap(crmStorageId) };
    const arr = [...(map[detail.id] || [])];
    const idx = arr.findIndex((x) => x.id === lastCreatedQuote.id);
    if (idx === -1) return;
    const now = new Date().toISOString();
    const publicUrl = `${window.location.origin}${quotePublicPath(lastCreatedQuote.token)}`;
    const msg = `Olá! Segue o teu orçamento de frete 🚚\nValor: ${formatBrl(lastCreatedQuote.freightValue)}\nPrazo: ${lastCreatedQuote.deliveryDeadline}\nAcompanha e responde aqui: ${publicUrl}`;
    arr[idx] = {
      ...arr[idx],
      status: 'enviado',
      updatedAt: now,
      history: [...arr[idx].history, { at: now, action: 'Enviado ao cliente (simulação)', detail: 'WhatsApp + link público' }],
    };
    map[detail.id] = arr;
    persistQuotesMap(map);
    void navigator.clipboard?.writeText(msg).catch(() => {});
    appendLeadEvent(detail.id, {
      at: now,
      kind: 'quote',
      title: 'Orçamento enviado (simulação WhatsApp)',
      body: msg,
      actor: profile?.full_name || '—',
    });
    notifyZaptro('success', 'WhatsApp (prévia)', 'Mensagem modelo copiada para a área de transferência.');
    appendZaptroActivityLog(crmStorageId, {
      type: 'atendimento',
      actorName: profile?.full_name || '—',
      clientLabel: detail.clientName,
      action: 'Orçamento enviado (simulação WhatsApp)',
      details: `Ref. ${lastCreatedQuote.id}`,
    });
  };

  const copyQuotePublicLink = (q: FreightQuote) => {
    const url = `${window.location.origin}${quotePublicPath(q.token)}`;
    void navigator.clipboard?.writeText(url).catch(() => {});
    notifyZaptro('success', 'Link', 'Link público do orçamento copiado.');
  };

  const markExistingQuoteSent = (q: FreightQuote) => {
    if (!detail) return;
    const map = { ...readQuotesMap(crmStorageId) };
    const arr = [...(map[detail.id] || [])];
    const idx = arr.findIndex((x) => x.id === q.id);
    if (idx === -1) return;
    if (arr[idx].status === 'aprovado' || arr[idx].status === 'recusado') return;
    const now = new Date().toISOString();
    arr[idx] = {
      ...arr[idx],
      status: 'enviado',
      updatedAt: now,
      history: [...arr[idx].history, { at: now, action: 'Marcado como enviado', detail: 'Equipa comercial' }],
    };
    map[detail.id] = arr;
    persistQuotesMap(map);
    copyQuotePublicLink(q);
    appendLeadEvent(detail.id, {
      at: now,
      kind: 'quote',
      title: 'Orçamento marcado como enviado',
      body: `Ref. ${q.id}`,
      actor: profile?.full_name || '—',
    });
    appendZaptroActivityLog(crmStorageId, {
      type: 'atendimento',
      actorName: profile?.full_name || '—',
      clientLabel: detail.clientName,
      action: 'Orçamento marcado como enviado',
      details: `Ref. ${q.id}`,
    });
  };

  const panelCard = () => zaptroCardSurfaceStyle(isDark);
  const rowCard = () => zaptroCardRowStyle(isDark);

  const renderCard = (lead: CrmLead) => {
    const canAct = canActOnLead(lead, isAdmin, profile?.id);
    const lockedByOther = !canAct && !!lead.assigneeId;
    const av = lead.assigneeId
      ? resolveMemberAvatarUrl(
          { id: lead.assigneeId, avatar_url: lead.assigneeAvatarUrl },
          profile?.id,
          profile ? { id: profile.id, avatar_url: profile.avatar_url } : null
        )
      : null;
    const isDark = palette.mode === 'dark';
    const clientLogo = lead.clientLogoUrl?.trim() || null;
    const tagColor = LIME;
    const tagLabelColor = isDark ? '#fafafa' : '#000000';
    const heat = leadHeat(lead);
    const idleDays = daysSinceContact(lead.createdAt);
    const heatColors =
      heat.variant === 'hot'
        ? { bg: 'rgba(217, 255, 0, 0.14)', fg: isDark ? '#fafafa' : '#000000' }
        : heat.variant === 'stale'
          ? { bg: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(254, 243, 199, 0.95)', fg: isDark ? '#fdba74' : '#9a3412' }
          : heat.variant === 'warm'
            ? { bg: isDark ? 'rgba(59, 130, 246, 0.16)' : 'rgba(219, 234, 254, 0.95)', fg: isDark ? '#93c5fd' : '#1e40af' }
            : { bg: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)', fg: palette.textMuted };
    const cardBase = crmKanbanCardBg(lead.id, isDark);
    const cardSurface = cardBase;
    const progressPct = Math.round((lead.progress / 5) * 100);
    const stableHash = Math.abs(lead.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
    const commentCount = stableHash % 12;
    const attachCount = (stableHash >> 3) % 6;
    const checklist = [
      { label: 'Dados e contacto', done: lead.progress >= 1 },
      { label: 'Rota e mercadoria', done: lead.progress >= 3 },
      { label: 'Proposta / follow-up', done: lead.progress >= 5 },
    ] as const;
    const cargoSlug = (lead.cargoType.split(/\s+/)[0] || 'carga')
      .slice(0, 14)
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
    const tagChips: string[] = [`#${cargoSlug || 'carga'}`];
    if (lead.tag) tagChips.push(`#${lead.tag}`);
    else tagChips.push('#logística');
    const chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
    const chipBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

    const qaBtn: React.CSSProperties = {
      flex: '1 1 auto',
      minWidth: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      padding: '6px 8px',
      borderRadius: 12,
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'}`,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F4F4F5',
      fontSize: 11,
      fontWeight: 700,
      color: isDark ? '#fafafa' : '#000000',
      cursor: 'pointer',
    };

    const dotFill = (i: number) =>
      i <= lead.progress ? LIME : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

    return (
      <div
        role="button"
        tabIndex={0}
        draggable={canAct}
        onDragStart={(e) => {
          if (!canAct) {
            e.preventDefault();
            return;
          }
          setDragId(lead.id);
          e.dataTransfer.setData('leadId', lead.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => setDragId(null)}
        onClick={() => openDetail(lead)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openDetail(lead);
          }
        }}
        style={{
          borderRadius: 20,
          padding: 12,
          backgroundColor: cardSurface,
          border: lockedByOther
            ? `1px solid ${isDark ? 'rgba(217,255,0,0.35)' : 'rgba(217,255,0,0.3)'}`
            : `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: lockedByOther
            ? `0 0 0 2px ${isDark ? 'rgba(217,255,0,0.35)' : 'rgba(217,255,0,0.28)'}, ${ZAPTRO_SHADOW.md}`
            : dragId === lead.id
              ? `0 0 0 2px ${LIME}, 0 8px 24px rgba(15,23,42,0.08)`
              : heat.variant === 'hot'
                ? `0 0 0 1px rgba(217,255,0,0.4), ${isDark ? '0 8px 24px rgba(0,0,0,0.35)' : ZAPTRO_CARD_SHADOW_LIGHT}`
                : isDark
                  ? '0 8px 24px rgba(0,0,0,0.35)'
                  : ZAPTRO_CARD_SHADOW_LIGHT,
          cursor: canAct ? 'grab' : 'default',
          textAlign: 'left',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', minWidth: 0 }}>
            {tagChips.slice(0, 3).map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '4px 9px',
                  borderRadius: 10,
                  backgroundColor: chipBg,
                  color: palette.text,
                  border: `1px solid ${chipBorder}`,
                  letterSpacing: '-0.01em',
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <button
            type="button"
            style={{
              border: 'none',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)',
              borderRadius: 10,
              padding: 6,
              cursor: 'pointer',
              color: palette.textMuted,
              flexShrink: 0,
            }}
            onClick={(e) => {
              e.stopPropagation();
              notifyZaptro('info', 'CRM', 'Menu de ações do lead em desenvolvimento.');
            }}
            aria-label="Mais opções"
          >
            <MoreVertical size={17} strokeWidth={2.2} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          {lockedByOther && (
            <span title="Responsável: outro utilizador — só leitura neste cartão" style={{ flexShrink: 0, color: palette.textMuted, paddingTop: 2 }}>
              <Lock size={17} strokeWidth={2.4} />
            </span>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: palette.text, letterSpacing: '-0.03em', lineHeight: 1.25 }}>
              {lead.clientName}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '4px 9px',
                  borderRadius: 999,
                  backgroundColor: heatColors.bg,
                  color: heatColors.fg,
                }}
              >
                {heat.variant === 'hot' && <Flame size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />}
                {heat.variant === 'stale' && <Timer size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />}
                {heat.label}
              </span>
              <span style={{ fontSize: 10, fontWeight: 750, color: palette.textMuted }}>
                Último contacto: há {idleDays} dia{idleDays === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          {clientLogo ? (
            <img
              src={clientLogo}
              alt=""
              width={40}
              height={40}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                objectFit: 'cover',
                flexShrink: 0,
                border: `1px solid ${chipBorder}`,
                backgroundColor: isDark ? ZAPTRO_CARD_BG_DARK : '#f4f4f5',
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                flexShrink: 0,
                border: `1px solid ${chipBorder}`,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: palette.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 15,
              }}
              aria-hidden
            >
              {(lead.clientName || '?')[0].toUpperCase()}
            </div>
          )}
        </div>

        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 650, color: palette.textMuted, lineHeight: 1.45 }}>
          <span style={{ fontWeight: 700, color: palette.text }}>Nota:</span> {lead.origin} → {lead.destination} · {lead.cargoType}
        </p>

        <ul style={{ margin: '0 0 12px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {checklist.map((row) => (
            <li key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, fontWeight: 700, color: row.done ? palette.textMuted : palette.text }}>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  marginTop: 1,
                  flexShrink: 0,
                  border: `2px solid ${row.done ? LIME : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)'}`,
                  backgroundColor: row.done ? LIME : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-hidden
              >
                {row.done ? <Check size={10} color="#000000" strokeWidth={3} /> : null}
              </span>
              <span style={{ textDecoration: row.done ? 'line-through' : 'none', opacity: row.done ? 0.75 : 1 }}>{row.label}</span>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Phone size={13} /> {lead.phone}
          </span>
          <span style={{ fontSize: 17, fontWeight: 700, color: palette.text, letterSpacing: '-0.02em' }}>{formatBrl(lead.estimatedValue)}</span>
        </div>
        {lead.tag && (
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag size={13} color={tagColor} />
            <span style={{ fontSize: 10, fontWeight: 700, color: tagLabelColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {lead.tag}
            </span>
          </div>
        )}

        <div role="presentation" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          <button
            type="button"
            disabled={!canAct}
            style={{
              ...qaBtn,
              opacity: canAct ? 1 : 0.48,
              cursor: canAct ? 'pointer' : 'not-allowed',
            }}
            title={canAct ? 'Ligar' : 'Apenas o responsável ou admin pode contactar'}
            onClick={() => {
              if (!canAct) return;
              const d = waDigits(lead.phone);
              if (!d) {
                notifyZaptro('warning', 'Telefone', 'Número inválido para chamada.');
                return;
              }
              setCallModalLead(lead);
            }}
          >
            <Phone size={14} /> Ligar
          </button>
          <button
            type="button"
            disabled={!canAct}
            style={{
              ...qaBtn,
              opacity: canAct ? 1 : 0.48,
              cursor: canAct ? 'pointer' : 'not-allowed',
            }}
            title={canAct ? 'Abrir conversa no Zaptro (WhatsApp interno)' : 'Apenas o responsável ou admin pode contactar'}
            onClick={() => {
              if (!canAct) return;
              const d = waDigits(lead.phone);
              if (!d) {
                notifyZaptro('warning', 'WhatsApp', 'Número inválido.');
                return;
              }
              appendLeadEvent(lead.id, {
                at: new Date().toISOString(),
                kind: 'whatsapp',
                title: 'Abriu o inbox Zaptro a partir do cartão',
                body: `Telefone ${d} — conversa no sistema.`,
                actor: profile?.full_name || '—',
              });
              appendZaptroActivityLog(crmStorageId, {
                type: 'atendimento',
                actorName: profile?.full_name || '—',
                clientLabel: lead.clientName,
                action: 'Abriu conversa Zaptro (WhatsApp) a partir do cartão',
                details: `Lead ${lead.id}`,
              });
              navigate(zaptroWhatsappInboxThreadPath(d));
            }}
          >
            <MessageSquare size={14} /> WA
          </button>
          <button
            type="button"
            disabled={!canAct}
            style={{
              ...qaBtn,
              opacity: canAct ? 1 : 0.48,
              cursor: canAct ? 'pointer' : 'not-allowed',
            }}
            title={canAct ? 'Agendar retorno (tarefa)' : 'Apenas o responsável ou admin'}
            onClick={() => {
              if (!canAct) return;
              openDetail(lead);
              openTaskScheduling(lead.id, lead.clientName);
            }}
          >
            <CalendarClock size={14} /> Follow-up
          </button>
          <button type="button" style={qaBtn} title="Detalhe e permissões" onClick={() => openDetail(lead)}>
            <Truck size={14} /> Detalhe
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  backgroundColor: dotFill(i),
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: palette.textMuted }}>{progressPct}%</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            paddingTop: 12,
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', minHeight: 32 }}>
            {av ? (
              <img
                src={av}
                alt=""
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  objectFit: 'cover',
                  border: `2px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                  flexShrink: 0,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  border: `2px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'}`,
                  background: '#000000',
                  color: LIME,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 12,
                  zIndex: 1,
                }}
              >
                {(lead.assigneeName || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: palette.textMuted, fontSize: 11, fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <MessageSquare size={14} strokeWidth={2.2} /> {commentCount}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Paperclip size={14} strokeWidth={2.2} /> {attachCount}
            </span>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 10, fontWeight: 750, color: palette.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={11} /> Criado {formatDate(lead.createdAt)} · {lead.assigneeName}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        style={{
          width: '100%',
          maxWidth: 'none',
          margin: 0,
          padding: '0 0 48px',
          boxSizing: 'border-box',
          /** Transparente: herda o fundo da área principal (`palette.pageBg` no layout). */
          backgroundColor: 'transparent',
          minHeight: '100%',
        }}
      >
        <header style={{ marginBottom: 22 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: palette.textMuted }}>PIPELINE COMERCIAL</p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              columnGap: 37,
              rowGap: 24,
              height: 107,
              paddingLeft: 0,
              paddingRight: 0,
              marginTop: 41,
            }}
          >
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: '-1.2px', color: palette.text }}>
                CRM — Pipeline e contactos
              </h1>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'flex-end' }}>
              {[
                { label: 'Gerar Proposta', icon: FileText, color: '#3b82f6', action: () => openProposalModal('proposal') },
              ].map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={chip.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 16,
                    backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff',
                    border: `1px solid ${border}`,
                    color: palette.mode === 'dark' ? '#fff' : '#000',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <chip.icon size={16} color={chip.color} />
                  {chip.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: `1px solid ${LIME}`,
                  backgroundColor: 'rgba(217, 255, 0, 0.14)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <Plus size={14} strokeWidth={2.5} color="#000" /> Novo Negócio
              </button>
            </div>
          </div>
        </header>

        {/* Painel estratégico — cartões alinhados ao resto do painel (borda + sombra suave). */}
        {/* Painel estratégico — cartões alinhados ao resto do painel (borda + sombra suave). */}
        <div className="zaptro-crm-kpi-grid" style={{ width: '100%', marginBottom: 28, boxSizing: 'border-box' }}>
          <ZaptroKpiMetricCard
            icon={TrendingUp}
            title="VALOR PONDERADO"
            value={formatBrl(insights.weightedForecast)}
            subtitle="Em aberto × probabilidade por etapa."
            accentBorder
            titleCaps
          />
          <ZaptroKpiMetricCard
            icon={Percent}
            title="TAXA DE FECHO"
            value={`${insights.conversionPct}%`}
            subtitle={`${stats.fechados} ganhos · ${visibleLeads.filter((l) => l.stage === 'perdido').length} perdidos (vista).`}
            titleCaps
          />
          <ZaptroKpiMetricCard
            icon={Timer}
            title="TEMPO MÉDIO"
            value={
              <>
                {insights.avgDaysOpen || '—'}
                {insights.avgDaysOpen ? <span style={{ fontSize: 18, fontWeight: 600 }}> dias</span> : null}
              </>
            }
            subtitle="Média desde a criação do lead (vista)."
            titleCaps
          />
          <ZaptroKpiMetricCard
            icon={Flame}
            title="LEADS QUENTES"
            value={insights.hotLeads}
            subtitle="Urgentes ou em negociação."
            titleCaps
          />
        </div>





        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
            padding: '10px 14px',
            borderRadius: 20,
            border: `1px solid ${border}`,
            backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
            boxSizing: 'border-box',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            height: 74,
          }}
        >
          <button
            type="button"
            onClick={() => setFilter('ativos')}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: 999,
              border: filter === 'ativos' ? `1px solid ${LIME}` : `1px solid ${border}`,
              backgroundColor: filter === 'ativos' ? 'rgba(217, 255, 0, 0.14)' : 'transparent',
              color: '#000',
              fontWeight: 700,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Abertos <span style={{ opacity: 0.85 }}>({visibleLeads.filter((l) => l.stage !== 'perdido').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('perdidos')}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: 999,
              border: filter === 'perdidos' ? `1px solid ${LIME}` : `1px solid ${border}`,
              backgroundColor: filter === 'perdidos' ? 'rgba(217, 255, 0, 0.14)' : 'transparent',
              color: '#000',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Perdidos <span style={{ opacity: 0.85 }}>({leads.filter((l) => l.stage === 'perdido').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('todos')}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: 999,
              border: filter === 'todos' ? `1px solid ${palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.14)'}` : `1px solid ${border}`,
              backgroundColor: filter === 'todos' ? (palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
              color: palette.text,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Todos
          </button>
          {insights.staleInNovos > 0 ? (
            <button
              type="button"
              aria-label={`Atenção: ${insights.staleInNovos} lead(s) em Novos há mais de três dias. Passe o rato para ver sugestão e valor em negociação.`}
              title={`Atenção: ${insights.staleInNovos} lead(s) em «Novos» há 3+ dias sem avançar. Prioriza contacto ou arrasta para atendimento — leads parados arrefecem conversão. Sugestão: há oportunidade em leads parados — envia mensagem ou reatribui. Valor bruto em negociação: ${formatBrl(stats.emNeg)}.`}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.45)'}`,
                backgroundColor: palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(254, 243, 199, 0.9)',
                color: palette.text,
                fontWeight: 700,
                fontSize: 11,
                cursor: 'help',
                fontFamily: 'inherit',
              }}
            >
              <CircleAlert size={14} color={LIME} aria-hidden />
              {insights.staleInNovos} parado{insights.staleInNovos === 1 ? '' : 's'} em Novos
            </button>
          ) : null}
          <div
            style={{
              flex: 1,
              minWidth: 200,
              maxWidth: 400,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={14}
              color={palette.textMuted}
              style={{ position: 'absolute', left: 14, pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="Pesquisar por cliente, origem, destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 44,
                padding: '0 14px 0 38px',
                borderRadius: 12,
                border: `1px solid ${border}`,
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                color: palette.text,
                fontSize: 13,
                fontWeight: 600,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8 }} role="group" aria-label="Modo de visualização do CRM">
            <button
              type="button"
              onClick={() => setCrmUiMode('kanban')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 12,
                border: crmUiMode === 'kanban' ? `1px solid ${LIME}` : `1px solid ${border}`,
                backgroundColor: crmUiMode === 'kanban' ? 'rgba(217, 255, 0, 0.14)' : palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
                color: '#000',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={14} /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setCrmUiMode('listas')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 12,
                border: crmUiMode === 'listas' ? `1px solid ${LIME}` : `1px solid ${border}`,
                backgroundColor: crmUiMode === 'listas' ? 'rgba(217, 255, 0, 0.14)' : palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
                color: '#000',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <List size={14} /> Listas
            </button>
            <button
              type="button"
              onClick={() => setCrmUiMode('followups')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 12,
                border: crmUiMode === 'followups' ? `1px solid ${LIME}` : `1px solid ${border}`,
                backgroundColor: crmUiMode === 'followups' ? 'rgba(217, 255, 0, 0.14)' : palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
                color: '#000',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <CalendarClock size={14} /> Follow-ups
            </button>
            <button
              type="button"
              onClick={() => setCrmUiMode('agenda')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 12,
                border: crmUiMode === 'agenda' ? `1px solid ${LIME}` : `1px solid ${border}`,
                backgroundColor: crmUiMode === 'agenda' ? 'rgba(217, 255, 0, 0.14)' : palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
                color: '#000',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <Calendar size={14} /> Agenda
            </button>
          </div>
        </div>

        {!isAdmin && (
          <div
            style={{
              marginBottom: 18,
              padding: '12px 16px',
              borderRadius: 16,
              border: `1px solid ${border}`,
              backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F4F4F5',
              fontSize: 13,
              fontWeight: 700,
              color: palette.text,
            }}
          >
            <Lock size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 8 }} />
            <strong style={{ color: palette.text }}>Dono do lead:</strong> cada card tem um responsável. Toda a equipa vê o pipeline; só o dono (ou admin)
            move etapa e usa Ligar / WhatsApp a partir do cartão. Abre o detalhe para <strong>Assumir</strong>, <strong>Solicitar contacto</strong> ou ver histórico.
          </div>
        )}

        {crmUiMode === 'kanban' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
            width: '100%',
            overflowX: 'auto',
            paddingTop: 16,
            paddingBottom: 24,
            paddingLeft: palette.mode === 'light' ? 12 : 0,
            paddingRight: palette.mode === 'light' ? 12 : 0,
            alignItems: 'stretch',
            minHeight: 'calc(100vh - 400px)',
            scrollbarWidth: 'thin',
          }}
          className="zaptro-crm-kanban-grid"
        >
          {STAGES.map((col) => (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('leadId');
                if (!id) return;
                const lead = leads.find((l) => l.id === id);
                if (!lead) return;
                if (!canActOnLead(lead, isAdmin, profile?.id)) return;
                updateLeadStage(id, col.id);
              }}
              style={{
                flex: '0 0 280px', // Largura estável para as colunas
                borderRadius: 26,
                padding: '12px 12px 16px',
                backgroundColor: palette.mode === 'dark' ? ZAPTRO_CARD_BG_DARK : CRM_KANBAN_COLUMN_BG_LIGHT,
                border: `1px solid ${palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: palette.mode === 'light' ? '0 1px 3px rgba(15,23,42,0.06)' : 'none',
                minHeight: 450,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ height: 3, borderRadius: 999, backgroundColor: col.accent, marginBottom: 2 }} />
              <div style={{ padding: '2px 4px 2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: palette.text, letterSpacing: '-0.02em', flex: 1, minWidth: 0 }}>
                    {col.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button
                      type="button"
                      title="Novo lead"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreateOpen(true);
                      }}
                      style={{
                        border: 'none',
                        background: palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#fff',
                        borderRadius: 10,
                        padding: 6,
                        cursor: 'pointer',
                        color: palette.text,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: palette.mode === 'dark' ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                      }}
                      aria-label="Adicionar lead"
                    >
                      <Plus size={16} strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      title="Opções da coluna"
                      onClick={(e) => {
                        e.stopPropagation();
                        notifyZaptro('info', 'CRM', 'Opções da coluna em desenvolvimento.');
                      }}
                      style={{
                        border: 'none',
                        background: palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#fff',
                        borderRadius: 10,
                        padding: 6,
                        cursor: 'pointer',
                        color: palette.textMuted,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: palette.mode === 'dark' ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                      }}
                      aria-label="Mais opções da coluna"
                    >
                      <MoreVertical size={16} strokeWidth={2.2} />
                    </button>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: palette.textMuted,
                        minWidth: 22,
                        textAlign: 'center',
                        padding: '2px 6px',
                        borderRadius: 8,
                        backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
                      }}
                    >
                      {leadsByStage[col.id].length}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: palette.textMuted, display: 'block', lineHeight: 1.35 }}>
                  {col.probHint}
                </span>
              </div>
              <CrmKanbanVirtualList items={leadsByStage[col.id]} renderItem={(lead) => renderCard(lead)} />
            </div>
          ))}
        </div>
        ) : crmUiMode === 'listas' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {STAGES.map((col) => {
            const rows = leadsByStage[col.id];
            return (
              <section
                key={col.id}
                style={{
                  borderRadius: 20,
                  border: `1px solid ${border}`,
                  backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fff',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '14px 18px',
                    borderBottom: `1px solid ${border}`,
                    backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#FAFAFA',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 4, height: 22, borderRadius: 999, backgroundColor: col.accent }} aria-hidden />
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: palette.text }}>{col.label}</h2>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: palette.textMuted }}>{rows.length} contacto(s)</span>
                </div>
                {rows.length === 0 ? (
                  <p style={{ margin: 0, padding: 20, fontSize: 13, color: palette.textMuted, fontWeight: 600 }}>Nenhum lead nesta etapa na vista atual.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: palette.textMuted, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em' }}>
                          <th style={{ padding: '12px 16px' }}>Cliente</th>
                          <th style={{ padding: '12px 16px' }}>Telefone</th>
                          <th style={{ padding: '12px 16px' }}>Valor</th>
                          <th style={{ padding: '12px 16px' }}>Responsável</th>
                          <th style={{ padding: '12px 16px' }}>Registado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((l) => (
                          <tr
                            key={l.id}
                            onClick={() => openDetail(l)}
                            style={{
                              borderTop: `1px solid ${border}`,
                              cursor: 'pointer',
                              fontWeight: 700,
                              color: palette.text,
                            }}
                          >
                            <td style={{ padding: '12px 16px' }}>{l.clientName}</td>
                            <td style={{ padding: '12px 16px', color: palette.textMuted }}>{l.phone}</td>
                            <td style={{ padding: '12px 16px' }}>{formatBrl(l.estimatedValue)}</td>
                            <td style={{ padding: '12px 16px', color: palette.textMuted }}>{l.assigneeName}</td>
                            <td style={{ padding: '12px 16px', color: palette.textMuted, whiteSpace: 'nowrap' }}>{formatDateTime(l.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
        ) : crmUiMode === 'followups' ? (
          <ZaptroFollowUpModule 
            followups={followups}
            onAdd={() => {
              setFuForm({
                clientId: detail?.id || '',
                clientName: detail?.clientName || '',
                clientType: 'lead',
                kind: 'lembrete',
                channel: 'interno',
                scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                message: ''
              });
              setFollowUpModalOpen(true);
            }}
            onStatusChange={updateFollowUpStatus}
            isDark={isDark}
            border={border}
            text={palette.text}
            muted={palette.textMuted}
            LIME={LIME}
          />
        ) : (
          <ZaptroAgendaModule 
            meetings={meetings}
            onAdd={() => {
              setMtForm({
                clientId: detail?.id || '',
                clientName: detail?.clientName || '',
                title: 'Reunião Comercial',
                description: '',
                scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                durationMinutes: 30
              });
              setMeetingModalOpen(true);
            }}
            isDark={isDark}
            border={border}
            text={palette.text}
            muted={palette.textMuted}
            LIME={LIME}
          />
        )}

        <style>{`
          .zaptro-crm-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
          }
          @media (max-width: 1100px) {
            .zaptro-crm-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 560px) {
            .zaptro-crm-kpi-grid {
              grid-template-columns: minmax(0, 1fr);
            }
          }
          @media (max-width: 640px) {
            .zaptro-crm-kanban-grid {
              flex-direction: column;
            }
            .zaptro-crm-kanban-grid > div {
              flex: 1 0 auto;
              width: 100%;
            }
          }
        `}</style>
      </div>

      <button
        type="button"
        aria-label="Novo contato"
        title="Novo contato"
        onClick={() => setCreateOpen(true)}
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 40,
          width: 58,
          height: 58,
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(180deg, #0a0a0a 0%, #000000 100%)',
          color: LIME,
          boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {createOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5000,
            backgroundColor: 'rgba(15,23,42,0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setCreateOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 960,
              padding: 32,
              borderRadius: 32,
              backgroundColor: cardBg,
              border: `1px solid ${border}`,
              color: palette.text,
              boxShadow: palette.mode === 'dark' ? 'none' : ZAPTRO_SHADOW.lg,
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Novo contato</h2>
              <button 
                type="button" 
                style={{ 
                  border: 'none', 
                  background: palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9', 
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: palette.textMuted
                }} 
                onClick={() => setCreateOpen(false)} 
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {[
                ['clientName', 'Cliente / empresa'],
                ['phone', 'Telefone / WhatsApp'],
                ['origin', 'Origem'],
                ['destination', 'Destino'],
                ['cargoType', 'Tipo de carga'],
              ].map(([key, lab]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: palette.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {lab}
                  </label>
                  <input
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '14px 16px',
                      borderRadius: 16,
                      border: `1px solid ${border}`,
                      backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f4f4f4',
                      color: palette.text,
                      fontWeight: 700,
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    value={(createForm as any)[key]}
                    onChange={(e) => setCreateForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: palette.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Valor estimado (R$)
                </label>
                <input
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '14px 16px',
                    borderRadius: 16,
                    border: `1px solid ${border}`,
                    backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f4f4f4',
                    color: palette.text,
                    fontWeight: 700,
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  value={createForm.estimatedValue}
                  onChange={(e) => setCreateForm((f) => ({ ...f, estimatedValue: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: palette.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Tag
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 16,
                    border: `1px solid ${border}`,
                    backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f4f4f4',
                    color: palette.text,
                    fontWeight: 700,
                    fontSize: 14,
                    outline: 'none',
                    appearance: 'none',
                    fontFamily: 'inherit'
                  }}
                  value={createForm.tag}
                  onChange={(e) => setCreateForm((f) => ({ ...f, tag: e.target.value as any }))}
                >
                  <option value="">—</option>
                  <option value="urgente">Urgente</option>
                  <option value="vip">VIP</option>
                  <option value="retorno">Retorno</option>
                </select>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: palette.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Responsável
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 16,
                      border: `1px solid ${border}`,
                      backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f4f4f4',
                      color: palette.text,
                      fontWeight: 700,
                      fontSize: 14,
                      outline: 'none',
                      appearance: 'none',
                      fontFamily: 'inherit'
                    }}
                    value={createForm.assigneeId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, assigneeId: e.target.value }))}
                  >
                    <option value="">Eu ({profile?.full_name || 'admin'})</option>
                    {teamOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name || t.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
              <button 
                type="button" 
                onClick={() => setCreateOpen(false)} 
                style={{ 
                  padding: '14px 24px', 
                  borderRadius: 16, 
                  border: `1px solid ${border}`, 
                  background: 'transparent', 
                  fontWeight: 700, 
                  fontSize: 14,
                  cursor: 'pointer', 
                  color: palette.textMuted,
                  fontFamily: 'inherit'
                }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={submitCreate} 
                style={{ 
                  padding: '14px 24px', 
                  borderRadius: 16, 
                  border: 'none', 
                  background: '#000', 
                  color: LIME, 
                  fontWeight: 800, 
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                }}
              >
                Criar lead
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5000,
            backgroundColor: 'rgba(15,23,42,0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setDetail(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 1000,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
              ...panelCard(),
              color: palette.text,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{detail.clientName}</h2>
                <button
                  onClick={() => navigate(zaptroClientProfilePath(detail.id))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 10,
                    backgroundColor: 'rgba(217, 255, 0, 0.14)',
                    color: '#000',
                    border: '1px solid rgba(217, 255, 0, 1)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Ver perfil completo
                </button>
              </div>
              <button type="button" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => setDetail(null)} aria-label="Fechar">
                <X size={22} color={palette.textMuted} />
              </button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: palette.textMuted, fontWeight: 600 }}>{detail.phone}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="zaptro-detail-left-col">
            {(() => {
              const att = crmAttentionBadge(detail.stage);
              return (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    alignItems: 'center',
                    marginBottom: 14,
                    padding: '10px 14px',
                    borderRadius: 14,
                    border: `1px solid ${border}`,
                    backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f4f4f4',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '6px 12px',
                      borderRadius: 999,
                      backgroundColor: '#0a0a0a',
                      color: LIME,
                      border: '1px solid rgba(0,0,0,0.2)',
                    }}
                    title={att.hint}
                  >
                    {att.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: palette.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!detail.assigneeId ? (
                      <>Responsável: <strong style={{ color: palette.text }}>— (livre)</strong></>
                    ) : (
                      <>
                        {!detailCanAct && <Lock size={16} style={{ flexShrink: 0 }} />}
                        Responsável: <strong style={{ color: palette.text }}>{detail.assigneeName}</strong>
                      </>
                    )}
                  </span>
                </div>
              );
            })()}
            {!detailCanAct && detail.assigneeId && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '14px 16px',
                  borderRadius: 16,
                  border: `1px solid ${palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                  backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F8F9FA',
                }}
              >
                <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: palette.text, lineHeight: 1.45 }}>
                  Este cliente está a ser tratado por <strong>{detail.assigneeName}</strong>. Evita mensagens em duplicado no WhatsApp.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    type="button"
                    onClick={requestContactHandoff}
                    style={{
                      flex: '1 1 140px',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: `1px solid ${border}`,
                      background: palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#fff',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      color: palette.text,
                    }}
                  >
                    Solicitar contacto
                  </button>
                  <button
                    type="button"
                    onClick={claimLead}
                    style={{
                      flex: '1 1 140px',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#000',
                      color: LIME,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Assumir
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetail(null)}
                    style={{
                      flex: '1 1 100px',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: `1px solid ${border}`,
                      background: 'transparent',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      color: palette.textMuted,
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
            {detail.stage !== 'fechado' &&
              detail.stage !== 'perdido' &&
              daysSinceContact(detail.createdAt) >= 3 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 14,
                    padding: '10px 14px',
                    borderRadius: 14,
                    border: `1px solid ${palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(251, 191, 36, 0.45)'}`,
                    backgroundColor: palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(254, 243, 199, 0.6)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: palette.text,
                  }}
                >
                  <Timer size={18} color={palette.mode === 'dark' ? '#fbbf24' : '#d97706'} style={{ flexShrink: 0 }} />
                  <span>
                    Lead parado há <strong>{daysSinceContact(detail.createdAt)}</strong> dias nesta vista — sugere follow-up ou encaminhamento (SLA completo liga-se ao
                    backend).
                  </span>
                </div>
              )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, fontWeight: 600, color: palette.textMuted, marginBottom: 20 }}>
              <span>
                <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                {detail.origin} → {detail.destination}
              </span>
              <span>
                <Package size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                {detail.cargoType}
              </span>
              <span style={{ color: palette.text, fontWeight: 700 }}>{formatBrl(detail.estimatedValue)}</span>
            </div>

            <button
              type="button"
              onClick={() => navigate(ZAPTRO_ROUTES.ROUTES)}
              style={{
                width: '100%',
                padding: '12px 24px',
                borderRadius: 16,
                backgroundColor: 'rgba(217, 255, 0, 0.14)',
                color: '#000',
                border: `1px solid ${LIME}`,
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: 'pointer',
                marginBottom: 24,
                transition: 'all 0.2s'
              }}
            >
              <MapPin size={18} strokeWidth={2.5} /> Ver no Mapa
            </button>
            {detailCanAct &&
              (() => {
                const merged =
                  detail.assigneeId && !teamOptions.some((t) => t.id === detail.assigneeId)
                    ? [{ id: detail.assigneeId, full_name: detail.assigneeName, avatar_url: detail.assigneeAvatarUrl ?? null }, ...teamOptions]
                    : teamOptions;
                const opts =
                  merged.length > 0
                    ? merged
                    : isAdmin && profile?.id
                      ? [{ id: profile.id, full_name: profile.full_name || 'Eu', avatar_url: profile.avatar_url ?? null }]
                      : [];
                if (opts.length === 0) return null;
                return (
                  <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, display: 'block', marginBottom: 18 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ArrowRightLeft size={14} /> Encaminhar / transferir
                    </span>
                    <select
                      style={{
                        marginTop: 6,
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: `1px solid ${border}`,
                        backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#f4f4f4',
                        color: palette.text,
                        fontWeight: 700,
                      }}
                      value={detail.assigneeId || ''}
                      onChange={(e) => {
                        const id = e.target.value || null;
                        const opt = opts.find((t) => t.id === id);
                        const name = opt?.full_name?.trim() || profile?.full_name || '—';
                        saveDetailAssignee(id, name || '—', opt?.avatar_url ?? null);
                      }}
                    >
                      {opts.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name || t.id}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })()}
            {companyId ? (
              <div
                style={{
                  marginBottom: 16,
                  padding: 14,
                  borderRadius: 16,
                  border: `1px solid ${border}`,
                  backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#FAFAFA',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: palette.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarClock size={16} /> Tarefas e retornos
                  </p>
                  {detailCanAct ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setFuForm({
                            clientId: detail.id,
                            clientName: detail.clientName,
                            clientType: 'lead',
                            kind: 'lembrete',
                            channel: 'interno',
                            scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                            message: ''
                          });
                          setFollowUpModalOpen(true);
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 12,
                          border: `1px solid ${border}`,
                          background: palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff',
                          color: palette.text,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        + Follow-up
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMtForm({
                            clientId: detail.id,
                            clientName: detail.clientName,
                            title: 'Reunião Comercial',
                            description: '',
                            scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                            durationMinutes: 30
                          });
                          setMeetingModalOpen(true);
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 12,
                          border: `1px solid ${border}`,
                          background: palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff',
                          color: palette.text,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        + Reunião
                      </button>
                      <button
                        type="button"
                        onClick={() => openTaskScheduling(detail.id, detail.clientName)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 12,
                          border: 'none',
                          background: '#000',
                          color: LIME,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        + Tarefa
                      </button>
                    </div>
                  ) : null}
                </div>
                {tasksLoading ? (
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: palette.textMuted }}>A carregar…</p>
                ) : leadTasks.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: palette.textMuted, lineHeight: 1.45 }}>
                    Sem tarefas. Usa «+ Agendar» ou Follow-up no cartão. Correr o SQL em{' '}
                    <code style={{ fontSize: 11 }}>logta/supabase/migrations/20260418000000_zaptro_crm_tasks.sql</code> no Supabase.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {leadTasks.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          padding: 10,
                          ...rowCard(),
                          opacity: t.status === 'done' ? 0.65 : 1,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: palette.text }}>{t.title}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: palette.textMuted, marginTop: 4 }}>
                            {t.status === 'done' ? 'Concluída' : t.status === 'cancelled' ? 'Cancelada' : 'Aberta'}
                            {t.due_at ? ` · até ${new Date(t.due_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : ''}
                          </div>
                        </div>
                        {detailCanAct && t.status === 'open' ? (
                          <button
                            type="button"
                            onClick={() => void markCrmTaskDone(t)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: `1px solid ${border}`,
                              background: 'transparent',
                              fontWeight: 700,
                              fontSize: 11,
                              cursor: 'pointer',
                              color: palette.text,
                              fontFamily: 'inherit',
                            }}
                          >
                            <CheckCircle2 size={14} /> Feita
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 600, color: palette.textMuted }}>
                Tarefas no servidor: associa o perfil a uma empresa (company_id) para gravar follow-ups no Supabase.
              </p>
            )}
            <div
              style={{
                marginBottom: 16,
                padding: 14,
                borderRadius: 16,
                border: `1px solid ${border}`,
                backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#FAFAFA',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: palette.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileSpreadsheet size={16} /> Orçamentos (neste lead)
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 600, color: palette.textMuted, lineHeight: 1.45 }}>
                    Fluxo principal: criar e enviar daqui. O item «Orçamentos» no menu lateral é só visão geral da empresa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `${ZAPTRO_ROUTES.COMMERCIAL_QUOTES}?leadId=${encodeURIComponent(detail.id)}`
                    )
                  }
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    border: `1px solid ${border}`,
                    backgroundColor: palette.mode === 'dark' ? '#111' : '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    color: palette.text,
                    fontFamily: 'inherit',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ExternalLink size={14} />
                  Ver todos os orçamentos
                </button>
              </div>
              {quotesForDetail.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: palette.textMuted }}>
                  Ainda sem orçamentos. Usa o botão «Orçamento» em baixo ou «Novo passo a passo» para criar o primeiro.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {quotesForDetail.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        padding: 12,
                        ...rowCard(),
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: palette.text }}>
                          {formatBrl(q.freightValue)} · {q.origin} → {q.destination}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, marginTop: 4 }}>
                          {QUOTE_STATUS_LABEL[q.status]} · {new Date(q.updatedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => copyQuotePublicLink(q)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 10,
                            border: `1px solid ${border}`,
                            background: 'transparent',
                            fontWeight: 700,
                            fontSize: 11,
                            cursor: 'pointer',
                            color: palette.text,
                          }}
                        >
                          <Link2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                          Link
                        </button>
                        {detailCanAct && q.status === 'pendente' && (
                          <button
                            type="button"
                            title="Marca como Enviado, copia o link público para colares no WhatsApp (envio automático pela API em roadmap)."
                            onClick={() => markExistingQuoteSent(q)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: 'none',
                              background: '#000',
                              color: LIME,
                              fontWeight: 700,
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            <Send size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                            Marcar enviado
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {detailCanAct && (
                <button
                  type="button"
                  onClick={openQuoteWizard}
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: `1px solid ${border}`,
                    background: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    color: palette.text,
                    boxShadow: palette.mode === 'light' ? '0 1px 2px rgba(15,23,42,0.05)' : 'none',
                  }}
                >
                  + Novo orçamento (passo a passo)
                </button>
              )}
            </div>

              </div>
              <div className="zaptro-detail-right-col">
                <div style={{ padding: 14, borderRadius: 16, backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F4F4F5', marginBottom: 16 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: palette.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={16} /> HISTÓRICO COMPLETO (local + futuro WhatsApp)
              </p>
              {(() => {
                const timeline = [...(leadEvents[detail.id] || [])].sort(
                  (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
                );
                if (!timeline.length) {
                  return (
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: palette.textMuted, lineHeight: 1.5 }}>
                      Ainda sem eventos gravados para este lead. Cria propostas, negociações ou move o pipeline — tudo passa a aparecer aqui em ordem cronológica.
                    </p>
                  );
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                    {timeline.map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          borderLeft: `3px solid ${
                            ev.kind === 'quote'
                              ? LIME
                              : ev.kind === 'proposal'
                                ? '#3b82f6'
                                : ev.kind === 'stage'
                                  ? '#64748b'
                                  : ev.kind === 'assign'
                                    ? '#94a3b8'
                                    : border
                          }`,
                          paddingLeft: 12,
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: palette.textMuted, marginBottom: 2 }}>
                          {formatDateTime(ev.at)} · {timelineKindLabel(ev.kind)}
                          {ev.actor ? ` · ${ev.actor}` : ''}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>{ev.title}</div>
                        {ev.body ? (
                          <pre
                            style={{
                              margin: '6px 0 0',
                              fontSize: 12,
                              fontWeight: 600,
                              color: palette.textMuted,
                              lineHeight: 1.45,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'inherit',
                            }}
                          >
                            {ev.body}
                          </pre>
                        ) : null}
                      </div>
                    ))}
                  </div>
                );
              })()}
              <p style={{ margin: '12px 0 0', fontSize: 11, fontWeight: 700, color: palette.textMuted, lineHeight: 1.4 }}>
                Quando o WhatsApp e o backend estiverem ligados, mensagens, chamadas e rotas entram automaticamente nesta mesma linha do tempo.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button
                type="button"
                disabled={!detailCanAct}
                title={
                  detailCanAct
                    ? 'Abrir conversa no Zaptro com este contacto'
                    : 'Apenas o responsável ou admin abre a conversa — evita respostas em duplicado'
                }
                onClick={() => {
                  if (!detailCanAct || !detail) return;
                  const d = waDigits(detail.phone);
                  if (!d) {
                    notifyZaptro('warning', 'WhatsApp', 'Número inválido para abrir o inbox.');
                    return;
                  }
                  appendLeadEvent(detail.id, {
                    at: new Date().toISOString(),
                    kind: 'whatsapp',
                    title: 'Abriu o módulo de conversas (WhatsApp)',
                    body: 'Registo automático ao sair do CRM para o chat.',
                    actor: profile?.full_name || '—',
                  });
                  appendZaptroActivityLog(crmStorageId, {
                    type: 'atendimento',
                    actorName: profile?.full_name || '—',
                    clientLabel: detail.clientName,
                    action: 'Abriu conversas (WhatsApp) a partir do lead',
                    details: `Lead ${detail.id}`,
                  });
                  navigate(zaptroWhatsappInboxThreadPath(d));
                }}
                style={{
                  flex: '1 1 140px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: 'none',
                  background: LIME,
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: detailCanAct ? 'pointer' : 'not-allowed',
                  opacity: detailCanAct ? 1 : 0.48,
                }}
              >
                <MessageSquare size={16} /> Abrir conversa
              </button>
              <button
                type="button"
                disabled={!detailCanAct || !detailApprovedForCargo}
                title={
                  !detailCanAct
                    ? 'Apenas o responsável ou admin'
                    : !detailApprovedForCargo
                      ? 'Aprova um orçamento (link público) para desbloquear a operação de carga'
                      : 'Abrir fluxo de carga'
                }
                onClick={() => {
                  if (!detailCanAct || !detailApprovedForCargo) return;
                  notifyZaptro('success', 'Carga', 'Orçamento aprovado — em seguida liga a rota e ao motorista (integração operacional em desenvolvimento).');
                }}
                style={{
                  flex: '1 1 140px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${border}`,
                  background: detailApprovedForCargo ? 'rgba(34,197,94,0.12)' : 'transparent',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: detailCanAct && detailApprovedForCargo ? 'pointer' : 'not-allowed',
                  color: palette.text,
                  opacity: detailCanAct && detailApprovedForCargo ? 1 : 0.48,
                }}
              >
                <Truck size={16} /> Criar carga
              </button>
              <button
                type="button"
                disabled={!detailCanAct}
                onClick={() => {
                  if (!detailCanAct) return;
                  openQuoteWizard();
                }}
                style={{
                  flex: '1 1 140px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${border}`,
                  background: 'transparent',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: detailCanAct ? 'pointer' : 'not-allowed',
                  color: palette.text,
                  opacity: detailCanAct ? 1 : 0.48,
                }}
              >
                <FileSpreadsheet size={16} /> Orçamento
              </button>
            </div>
        </div>
      </div>
    </div>
  </div>
)}

      {taskModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5200,
            backgroundColor: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => !taskSaving && setTaskModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              borderRadius: 24,
              padding: 24,
              backgroundColor: palette.mode === 'dark' ? '#111' : '#fff',
              border: `1px solid ${palette.mode === 'dark' ? '#334155' : '#e4e4e7'}`,
              color: palette.text,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Agendar retorno</h2>
                <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 600, color: palette.textMuted }}>
                  Grava no Supabase (tabela <code style={{ fontSize: 11 }}>zaptro_crm_tasks</code>).
                </p>
              </div>
              <button
                type="button"
                disabled={taskSaving}
                style={{ border: 'none', background: 'transparent', cursor: taskSaving ? 'not-allowed' : 'pointer' }}
                onClick={() => setTaskModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={22} color={palette.textMuted} />
              </button>
            </div>
            <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, display: 'block', marginBottom: 12 }}>
              Título
              <input
                value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                style={{
                  marginTop: 6,
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${palette.mode === 'dark' ? '#334155' : '#e4e4e7'}`,
                  backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#f4f4f4',
                  color: palette.text,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                }}
              />
            </label>
            <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, display: 'block', marginBottom: 12 }}>
              Data e hora (opcional)
              <input
                type="datetime-local"
                value={taskForm.dueAt}
                onChange={(e) => setTaskForm((f) => ({ ...f, dueAt: e.target.value }))}
                style={{
                  marginTop: 6,
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${palette.mode === 'dark' ? '#334155' : '#e4e4e7'}`,
                  backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#f4f4f4',
                  color: palette.text,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                }}
              />
            </label>
            <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, display: 'block', marginBottom: 18 }}>
              Notas
              <textarea
                value={taskForm.notes}
                onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                style={{
                  marginTop: 6,
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${palette.mode === 'dark' ? '#334155' : '#e4e4e7'}`,
                  backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#f4f4f4',
                  color: palette.text,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                disabled={taskSaving}
                onClick={() => setTaskModalOpen(false)}
                style={{
                  padding: '12px 18px',
                  borderRadius: 14,
                  border: `1px solid ${palette.mode === 'dark' ? '#334155' : '#e4e4e7'}`,
                  background: 'transparent',
                  fontWeight: 700,
                  cursor: taskSaving ? 'not-allowed' : 'pointer',
                  color: palette.textMuted,
                  fontFamily: 'inherit',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={taskSaving}
                onClick={() => void submitTaskModal()}
                style={{
                  padding: '12px 18px',
                  borderRadius: 14,
                  border: 'none',
                  background: '#000',
                  color: LIME,
                  fontWeight: 700,
                  cursor: taskSaving ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {taskSaving ? 'A gravar…' : 'Gravar tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {quoteModalOpen && detail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5100,
            backgroundColor: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => {
            setQuoteModalOpen(false);
            setQuotesByLead(readQuotesMap(crmStorageId));
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 960,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 26,
              ...panelCard(),
              color: palette.text,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Orçamento de frete</h2>
                <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 600, color: palette.textMuted }}>
                  Cliente: <strong style={{ color: palette.text }}>{detail.clientName}</strong> · Passo {quoteWizardStep} de 3
                </p>
              </div>
              <button
                type="button"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                onClick={() => {
                  setQuoteModalOpen(false);
                  setQuotesByLead(readQuotesMap(crmStorageId));
                }}
                aria-label="Fechar"
              >
                <X size={22} color={palette.textMuted} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 999,
                    backgroundColor: quoteWizardStep >= s ? LIME : palette.mode === 'dark' ? '#334155' : '#E4E4E7',
                  }}
                />
              ))}
            </div>

            {quoteWizardStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['origin', 'Origem'],
                  ['destination', 'Destino'],
                  ['cargoType', 'Tipo de carga'],
                  ['weightQty', 'Peso / quantidade'],
                  ['freightValue', 'Valor do frete (R$)'],
                  ['deliveryDeadline', 'Prazo de entrega'],
                ].map(([key, lab]) => (
                  <label key={key} style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                    {lab}
                    <input
                      style={{
                        marginTop: 6,
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: `1px solid ${border}`,
                        backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#f4f4f4',
                        color: palette.text,
                        fontWeight: 700,
                      }}
                      value={(quoteForm as any)[key]}
                      onChange={(e) => setQuoteForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </label>
                ))}
                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                  Observações
                  <textarea
                    style={{
                      marginTop: 6,
                      width: '100%',
                      boxSizing: 'border-box',
                      minHeight: 72,
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: `1px solid ${border}`,
                      backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#f4f4f4',
                      color: palette.text,
                      fontWeight: 700,
                      resize: 'vertical',
                    }}
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(false)}
                    style={{ padding: '12px 18px', borderRadius: 14, border: `1px solid ${border}`, background: 'transparent', fontWeight: 700, cursor: 'pointer', color: palette.textMuted }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmQuoteStep2}
                    style={{ padding: '12px 18px', borderRadius: 14, border: 'none', background: '#000', color: LIME, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {quoteWizardStep === 2 && (
              <div style={{ fontSize: 14, fontWeight: 600, color: palette.textMuted, lineHeight: 1.55 }}>
                <p style={{ margin: '0 0 12px', color: palette.text, fontWeight: 700 }}>Confirma os dados antes de gerar o orçamento</p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    <strong style={{ color: palette.text }}>Rota:</strong> {quoteForm.origin} → {quoteForm.destination}
                  </li>
                  <li>
                    <strong style={{ color: palette.text }}>Carga:</strong> {quoteForm.cargoType || '—'} · {quoteForm.weightQty || '—'}
                  </li>
                  <li>
                    <strong style={{ color: palette.text }}>Frete:</strong> {formatBrl(Number(String(quoteForm.freightValue).replace(/\D/g, '')) || 0)}
                  </li>
                  <li>
                    <strong style={{ color: palette.text }}>Prazo:</strong> {quoteForm.deliveryDeadline || '—'}
                  </li>
                </ul>
                {quoteForm.notes.trim() ? (
                  <p style={{ margin: '12px 0 0' }}>
                    <strong style={{ color: palette.text }}>Notas:</strong> {quoteForm.notes}
                  </p>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                  <button
                    type="button"
                    onClick={() => setQuoteWizardStep(1)}
                    style={{ padding: '12px 18px', borderRadius: 14, border: `1px solid ${border}`, background: 'transparent', fontWeight: 700, cursor: 'pointer', color: palette.text }}
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    onClick={commitQuotePendente}
                    style={{ padding: '12px 18px', borderRadius: 14, border: 'none', background: '#000', color: LIME, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Gerar orçamento
                  </button>
                </div>
              </div>
            )}

            {quoteWizardStep === 3 && lastCreatedQuote && (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: palette.text }}>
                  Estado: <strong>{QUOTE_STATUS_LABEL[lastCreatedQuote.status]}</strong> — partilha o link com o cliente.
                </p>
                <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, color: palette.textMuted, lineHeight: 1.5 }}>
                  Envio automático real pelo WhatsApp (sem copiar/colar) fica para quando o gateway e o número estiverem ligados ao
                  backend partilhado. Até lá: copiar link ou «Simular envio» (mensagem modelo na área de transferência).
                </p>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#ebebeb',
                    fontSize: 12,
                    wordBreak: 'break-all',
                    marginBottom: 14,
                    fontWeight: 700,
                    color: palette.textMuted,
                  }}
                >
                  {`${window.location.origin}${quotePublicPath(lastCreatedQuote.token)}`}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => copyQuotePublicLink(lastCreatedQuote)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 16px',
                      borderRadius: 14,
                      border: `1px solid ${border}`,
                      background: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      color: palette.text,
                    }}
                  >
                    <Link2 size={16} /> Copiar link público
                  </button>
                  <button
                    type="button"
                    onClick={simulateSendQuoteWhatsApp}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 16px',
                      borderRadius: 14,
                      border: 'none',
                      background: '#000',
                      color: LIME,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={16} /> Simular envio WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteModalOpen(false);
                      setQuotesByLead(readQuotesMap(crmStorageId));
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 14,
                      border: `1px solid ${border}`,
                      background: 'transparent',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      color: palette.textMuted,
                    }}
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {proposalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5000,
            backgroundColor: 'rgba(15,23,42,0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setProposalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 960,
              padding: 28,
              ...panelCard(),
              color: palette.text,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Proposta ou oportunidade</h2>
              <button type="button" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => setProposalOpen(false)} aria-label="Fechar">
                <X size={22} color={palette.textMuted} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="zaptro-proposal-left">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                    Lead
                    <select
                      style={{
                        marginTop: 6,
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: `1px solid ${border}`,
                        backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#f4f4f4',
                        color: palette.text,
                        fontWeight: 700,
                      }}
                      value={proposalForm.leadId}
                      onChange={(e) => setProposalForm((f) => ({ ...f, leadId: e.target.value }))}
                    >
                      <option value="">— Escolher —</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.clientName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                    Título / Tema
                    <input
                      style={{
                        marginTop: 6,
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: `1px solid ${border}`,
                        backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#f4f4f4',
                        color: palette.text,
                        fontWeight: 700,
                        outline: 'none'
                      }}
                      value={proposalForm.title}
                      onChange={(e) => setProposalForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </label>
                  <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                    {proposalForm.kind === 'proposal' ? 'Valor (R$)' : 'Valor alvo (R$)'}
                    <input
                      style={{
                        marginTop: 6,
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: `1px solid ${border}`,
                        backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#f4f4f4',
                        color: palette.text,
                        fontWeight: 700,
                        outline: 'none'
                      }}
                      value={proposalForm.value}
                      onChange={(e) => setProposalForm((f) => ({ ...f, value: e.target.value }))}
                    />
                  </label>
                  <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                    {proposalForm.kind === 'proposal' ? 'Validade' : 'Prazo'}
                    <input
                      style={{
                        marginTop: 6,
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: `1px solid ${border}`,
                        backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#f4f4f4',
                        color: palette.text,
                        fontWeight: 700,
                        outline: 'none'
                      }}
                      value={proposalForm.schedule}
                      onChange={(e) => setProposalForm((f) => ({ ...f, schedule: e.target.value }))}
                    />
                  </label>
                  <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                    Notas internas
                    <textarea
                      style={{
                        marginTop: 6,
                        width: '100%',
                        boxSizing: 'border-box',
                        minHeight: 120,
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: `1px solid ${border}`,
                        backgroundColor: palette.mode === 'dark' ? '#0f172a' : '#f4f4f4',
                        color: palette.text,
                        fontWeight: 600,
                        fontSize: 13,
                        resize: 'none',
                        fontFamily: 'inherit',
                        outline: 'none'
                      }}
                      value={proposalForm.notes}
                      onChange={(e) => setProposalForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                  </label>
                </div>
              </div>

              <div className="zaptro-proposal-right" style={{ borderLeft: `1px solid ${border}`, paddingLeft: 24, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Histórico do Dia</h3>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['D', 'S', 'M'].map((t) => (
                      <button key={t} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: t === 'D' ? LIME : 'transparent', color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>{t}</button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 400 }}>
                  {Object.values(leadEvents).flat()
                    .filter(ev => ev.kind === 'proposal' || ev.kind === 'negotiation')
                    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                    .slice(0, 8)
                    .map((ev, idx) => (
                      <div key={idx} style={{ padding: 14, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: LIME, backgroundColor: '#000', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                            {ev.kind === 'proposal' ? 'PROPOSTA' : 'OPORTUNIDADE'}
                          </span>
                          <span style={{ fontSize: 10, color: palette.textMuted, fontWeight: 700 }}>{new Date(ev.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ margin: '4px 0', fontSize: 13, fontWeight: 700, color: palette.text }}>{ev.title}</p>
                        <p style={{ margin: 0, fontSize: 11, color: palette.textMuted, fontWeight: 600 }}>Responsável: {ev.actor}</p>
                      </div>
                    ))}
                  {Object.values(leadEvents).flat().filter(ev => ev.kind === 'proposal' || ev.kind === 'negotiation').length === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, opacity: 0.5 }}>
                      <CalendarClock size={32} />
                      <span style={{ fontSize: 12, fontWeight: 700 }}>Sem registos hoje</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button
                type="button"
                onClick={() => setProposalOpen(false)}
                style={{ padding: '12px 18px', borderRadius: 14, border: `1px solid ${border}`, background: 'transparent', fontWeight: 700, cursor: 'pointer', color: palette.textMuted }}
              >
                Cancelar
              </button>
              <button type="button" onClick={submitProposal} style={{ padding: '12px 18px', borderRadius: 14, border: 'none', background: '#000', color: LIME, fontWeight: 700, cursor: 'pointer' }}>
                Guardar no histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {meetingModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, padding: 32, ...panelCard(), color: palette.text }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 900 }}>Marcar Reunião</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                CLIENTE / LEAD
                <select
                  value={mtForm.clientId}
                  onChange={e => {
                    const l = leads.find(x => x.id === e.target.value);
                    setMtForm(prev => ({ ...prev, clientId: e.target.value, clientName: l?.clientName || '' }));
                  }}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${border}`, backgroundColor: isDark ? '#0f172a' : '#f4f4f4', color: palette.text, fontWeight: 700, marginTop: 6 }}
                >
                  <option value="">— Selecionar —</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.clientName}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                TÍTULO
                <input type="text" value={mtForm.title} onChange={e => setMtForm(prev => ({ ...prev, title: e.target.value }))} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${border}`, backgroundColor: isDark ? '#0f172a' : '#f4f4f4', color: palette.text, fontWeight: 700, marginTop: 6, boxSizing: 'border-box' }} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                  DATA E HORA
                  <input type="datetime-local" value={mtForm.scheduledAt} onChange={e => setMtForm(prev => ({ ...prev, scheduledAt: e.target.value }))} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${border}`, backgroundColor: isDark ? '#0f172a' : '#f4f4f4', color: palette.text, fontWeight: 700, marginTop: 6, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                  DURAÇÃO (MIN)
                  <input type="number" value={mtForm.durationMinutes} onChange={e => setMtForm(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${border}`, backgroundColor: isDark ? '#0f172a' : '#f4f4f4', color: palette.text, fontWeight: 700, marginTop: 6, boxSizing: 'border-box' }} />
                </label>
              </div>
              <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                DESCRIÇÃO / PAUTA
                <textarea value={mtForm.description} onChange={e => setMtForm(prev => ({ ...prev, description: e.target.value }))} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${border}`, backgroundColor: isDark ? '#0f172a' : '#f4f4f4', color: palette.text, fontWeight: 700, marginTop: 6, minHeight: 80, boxSizing: 'border-box' }} />
              </label>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button onClick={() => setMeetingModalOpen(false)} style={{ flex: 1, padding: 16, borderRadius: 14, border: `1px solid ${border}`, backgroundColor: 'transparent', color: palette.text, fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={() => createMeeting({
                  client_id: mtForm.clientId,
                  client_name: mtForm.clientName,
                  title: mtForm.title,
                  description: mtForm.description,
                  scheduled_at: new Date(mtForm.scheduledAt).toISOString(),
                  duration_minutes: mtForm.durationMinutes
                })} style={{ flex: 1, padding: 16, borderRadius: 14, border: 'none', backgroundColor: LIME, color: '#000', fontWeight: 800, cursor: 'pointer' }}>Marcar Reunião</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {followUpModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, padding: 32, ...panelCard(), color: palette.text }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 900 }}>Novo Follow-up</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                CLIENTE / LEAD
                <select
                  value={fuForm.clientId}
                  onChange={e => {
                    const l = leads.find(x => x.id === e.target.value);
                    setFuForm(prev => ({ ...prev, clientId: e.target.value, clientName: l?.clientName || '' }));
                  }}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${border}`, backgroundColor: isDark ? '#0f172a' : '#f4f4f4', color: palette.text, fontWeight: 700, marginTop: 6 }}
                >
                  <option value="">— Selecionar —</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.clientName}</option>)}
                </select>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                  TIPO
                  <select value={fuForm.kind} onChange={e => setFuForm(prev => ({ ...prev, kind: e.target.value as any }))} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${border}`, backgroundColor: isDark ? '#0f172a' : '#f4f4f4', color: palette.text, fontWeight: 700, marginTop: 6 }}>
                    <option value="lembrete">Lembrete</option>
                    <option value="whatsapp_auto">WhatsApp Auto</option>
                  </select>
                </label>
                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                  CANAL
                  <select value={fuForm.channel} onChange={e => setFuForm(prev => ({ ...prev, channel: e.target.value as any }))} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${border}`, backgroundColor: isDark ? '#0f172a' : '#f4f4f4', color: palette.text, fontWeight: 700, marginTop: 6 }}>
                    <option value="interno">Interno</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </label>
              </div>
              <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                DATA E HORA
                <input type="datetime-local" value={fuForm.scheduledAt} onChange={e => setFuForm(prev => ({ ...prev, scheduledAt: e.target.value }))} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${border}`, backgroundColor: isDark ? '#0f172a' : '#f4f4f4', color: palette.text, fontWeight: 700, marginTop: 6, boxSizing: 'border-box' }} />
              </label>
              <label style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>
                MENSAGEM / NOTA
                <textarea value={fuForm.message} onChange={e => setFuForm(prev => ({ ...prev, message: e.target.value }))} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${border}`, backgroundColor: isDark ? '#0f172a' : '#f4f4f4', color: palette.text, fontWeight: 700, marginTop: 6, minHeight: 80, boxSizing: 'border-box' }} />
              </label>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button onClick={() => setFollowUpModalOpen(false)} style={{ flex: 1, padding: 16, borderRadius: 14, border: `1px solid ${border}`, backgroundColor: 'transparent', color: palette.text, fontWeight: 800, cursor: 'pointer' }}>Cancelar</button>
                <button type="button" onClick={async () => {
                  if (!fuForm.scheduledAt) {
                    notifyZaptro('warning', 'Follow-up', 'Selecione uma data e hora.');
                    return;
                  }
                  try {
                    await createFollowUp({
                      ...fuForm,
                      scheduledAt: new Date(fuForm.scheduledAt).toISOString(),
                    });
                  } catch (err) {
                    notifyZaptro('error', 'Erro', 'Falha ao agendar follow-up.');
                  }
                }} style={{ flex: 1, padding: 16, borderRadius: 14, border: 'none', backgroundColor: LIME, color: '#000', fontWeight: 800, cursor: 'pointer' }}>Agendar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {callModalLead ? (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10050,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box',
          }}
          onClick={() => setCallModalLead(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="zaptro-crm-call-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 22,
              border: `1px solid ${border}`,
              backgroundColor: palette.mode === 'dark' ? '#111' : '#fff',
              color: palette.text,
              boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
              padding: '22px 22px 18px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: palette.textMuted }}>LIGAR AO CLIENTE</p>
                <h2 id="zaptro-crm-call-modal-title" style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.25 }}>
                  {callModalLead.clientName}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setCallModalLead(null)}
                style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: `1px solid ${border}`,
                  background: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f4f4f5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: palette.text,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: palette.textMuted, lineHeight: 1.5 }}>
              Utilize o número abaixo no <strong style={{ color: palette.text }}>telefone do seu dispositivo</strong>. O Zaptro mostra aqui o contacto apenas como referência.
            </p>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: 16,
                border: `1px solid ${border}`,
                backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f4f4f4',
                marginBottom: 14,
              }}
            >
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: palette.textMuted }}>TELEFONE</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {callModalLead.phone.trim() || waDigits(callModalLead.phone)}
              </p>
            </div>

            <p
              style={{
                margin: '0 0 16px',
                fontSize: 12,
                fontWeight: 700,
                color: palette.textMuted,
                lineHeight: 1.55,
                paddingTop: 4,
                borderTop: `1px dashed ${border}`,
              }}
            >
              O seu plano <strong style={{ color: palette.text }}>não inclui chamadas integradas</strong> no Zaptro. A ligação não passa pela aplicação e{' '}
              <strong style={{ color: palette.text }}>não é gravada</strong> pelo sistema — use o seu telemóvel ou fixo para falar com o cliente.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  const d = waDigits(callModalLead.phone);
                  void navigator.clipboard?.writeText(d || callModalLead.phone).catch(() => {});
                  notifyZaptro('success', 'Telefone', 'Número copiado.');
                }}
                style={{
                  flex: '1 1 140px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${border}`,
                  background: 'transparent',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  color: palette.text,
                  fontFamily: 'inherit',
                }}
              >
                <Copy size={16} /> Copiar número
              </button>
              {waDigits(callModalLead.phone).length >= 8 ? (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `tel:${waDigits(callModalLead.phone)}`;
                  }}
                  style={{
                    flex: '1 1 140px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: 'none',
                    background: '#000',
                    color: LIME,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Phone size={16} /> Abrir chamada no telefone
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setCallModalLead(null)}
                style={{
                  flex: '1 1 100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  color: palette.textMuted,
                  fontFamily: 'inherit',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

const ZaptroCrm: React.FC = () => {
  const { company } = useTenant();
  return (
    <HubGuard companyId={company?.id || ''}>
      <ZaptroLayout contentFullWidth breadcrumb="Pipeline Comercial">
        <ZaptroCrmContent />
      </ZaptroLayout>
    </HubGuard>
  );
};

export default ZaptroCrm;

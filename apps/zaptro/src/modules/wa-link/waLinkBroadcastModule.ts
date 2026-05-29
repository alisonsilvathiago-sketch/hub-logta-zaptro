/**
 * Lista de transmissão inteligente — tipos, store local e helpers.
 * Listas/contactos: Supabase. Metadados, campanhas e histórico: localStorage (v1).
 */

import { chatOllamaCopilot, isOllamaCopilotPreferred, ollamaModelPrimary } from '../../lib/ollamaCopilot';

export const BROADCAST_SEGMENT_KINDS = [
  'clientes',
  'leads',
  'motoristas',
  'transportadores',
  'funcionarios',
  'fornecedores',
] as const;

export type BroadcastSegmentKind = (typeof BROADCAST_SEGMENT_KINDS)[number];

export const BROADCAST_TAGS = [
  'VIP',
  'Financeiro',
  'Comercial',
  'Suporte',
  'Motorista',
  'Entrega',
  'Coleta',
  'Rastreamento',
] as const;

export type BroadcastTag = (typeof BROADCAST_TAGS)[number];

export type BroadcastSegmentFilters = {
  city?: string;
  state?: string;
  company?: string;
  carrier?: string;
  registeredAfter?: string;
  registeredBefore?: string;
  lastInteractionAfter?: string;
  activeOnly?: boolean;
  inactiveOnly?: boolean;
  paymentOk?: boolean;
  paymentLate?: boolean;
  plan?: string;
  tags?: string[];
};

export type BroadcastListMeta = {
  description?: string;
  segmentKind: BroadcastSegmentKind;
  segmentFilters: BroadcastSegmentFilters;
  dynamic: boolean;
  tags: string[];
};

export type BroadcastMessageType =
  | 'text'
  | 'image'
  | 'pdf'
  | 'document'
  | 'audio'
  | 'video'
  | 'link'
  | 'buttons';

export type BroadcastScheduleKind = 'immediate' | 'scheduled' | 'recurring';

export type BroadcastCampaignStatus =
  | 'draft'
  | 'queued'
  | 'sending'
  | 'done'
  | 'paused'
  | 'failed';

export type BroadcastCampaignStats = {
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
};

export type BroadcastCampaign = {
  id: string;
  companyId: string;
  name: string;
  description: string;
  listId: string;
  listName: string;
  messageType: BroadcastMessageType;
  body: string;
  schedule: BroadcastScheduleKind;
  scheduledAt?: string;
  status: BroadcastCampaignStatus;
  stats: BroadcastCampaignStats;
  createdAt: string;
  completedAt?: string;
};

export type BroadcastContactRow = {
  id: string;
  sender_number: string;
  sender_name: string | null;
  updated_at?: string;
  last_message_at?: string | null;
  crm_type?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type BroadcastDashboardStats = {
  totalContacts: number;
  activeContacts: number;
  interactedContacts: number;
  totalLists: number;
  totalCampaigns: number;
  deliveryRate: number;
  responseRate: number;
};

const META_KEY = 'zaptro_broadcast_list_meta_v1';
const CAMPAIGNS_KEY = 'zaptro_broadcast_campaigns_v1';

function storageKey(base: string, companyId: string): string {
  return `${base}_${companyId}`;
}

export function readBroadcastListMeta(companyId: string): Record<string, BroadcastListMeta> {
  try {
    const raw = localStorage.getItem(storageKey(META_KEY, companyId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, BroadcastListMeta>;
  } catch {
    return {};
  }
}

export function writeBroadcastListMeta(companyId: string, map: Record<string, BroadcastListMeta>): void {
  localStorage.setItem(storageKey(META_KEY, companyId), JSON.stringify(map));
}

export function upsertBroadcastListMeta(
  companyId: string,
  listId: string,
  meta: BroadcastListMeta,
): void {
  const all = readBroadcastListMeta(companyId);
  all[listId] = meta;
  writeBroadcastListMeta(companyId, all);
}

export function readBroadcastCampaigns(companyId: string): BroadcastCampaign[] {
  try {
    const raw = localStorage.getItem(storageKey(CAMPAIGNS_KEY, companyId));
    if (!raw) return [];
    return JSON.parse(raw) as BroadcastCampaign[];
  } catch {
    return [];
  }
}

export function writeBroadcastCampaigns(companyId: string, campaigns: BroadcastCampaign[]): void {
  localStorage.setItem(storageKey(CAMPAIGNS_KEY, companyId), JSON.stringify(campaigns));
}

export function upsertBroadcastCampaign(companyId: string, campaign: BroadcastCampaign): void {
  const all = readBroadcastCampaigns(companyId);
  const idx = all.findIndex((c) => c.id === campaign.id);
  if (idx >= 0) all[idx] = campaign;
  else all.unshift(campaign);
  writeBroadcastCampaigns(companyId, all);
}

function metaString(metadata: unknown, key: string): string {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return '';
  const v = (metadata as Record<string, unknown>)[key];
  return typeof v === 'string' ? v.trim() : '';
}

function metaTags(metadata: unknown): string[] {
  const raw = metaString(metadata, 'tags') || metaString(metadata, 'labels');
  if (!raw) {
    const m = metadata as Record<string, unknown> | null;
    const arr = m?.tags;
    if (Array.isArray(arr)) return arr.map(String);
  }
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}

function crmKindMatch(row: BroadcastContactRow, kind: BroadcastSegmentKind): boolean {
  const t = (row.crm_type || metaString(row.metadata, 'crm_type') || '').toLowerCase();
  const map: Record<BroadcastSegmentKind, string[]> = {
    clientes: ['client', 'cliente', 'customers'],
    leads: ['lead', 'leads', 'oportunidade'],
    motoristas: ['driver', 'motorista', 'motoristas'],
    transportadores: ['carrier', 'transportador', 'transportadora'],
    funcionarios: ['staff', 'funcionario', 'colaborador', 'team'],
    fornecedores: ['supplier', 'fornecedor', 'vendor'],
  };
  const allowed = map[kind];
  if (!t) return kind === 'clientes';
  return allowed.some((a) => t.includes(a));
}

export function filterBroadcastContacts(
  rows: BroadcastContactRow[],
  kind: BroadcastSegmentKind,
  filters: BroadcastSegmentFilters,
): BroadcastContactRow[] {
  const now = Date.now();
  const day = 86400000;

  return rows.filter((row) => {
    if (!crmKindMatch(row, kind)) return false;

    const city = metaString(row.metadata, 'city') || metaString(row.metadata, 'cidade');
    const state = metaString(row.metadata, 'state') || metaString(row.metadata, 'estado');
    const company = metaString(row.metadata, 'company_name') || metaString(row.metadata, 'empresa');
    const carrier = metaString(row.metadata, 'carrier') || metaString(row.metadata, 'transportadora');
    const plan = metaString(row.metadata, 'plan') || metaString(row.metadata, 'plano');
    const tags = metaTags(row.metadata);

    if (filters.city && !city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.state && !state.toLowerCase().includes(filters.state.toLowerCase())) return false;
    if (filters.company && !company.toLowerCase().includes(filters.company.toLowerCase())) return false;
    if (filters.carrier && !carrier.toLowerCase().includes(filters.carrier.toLowerCase())) return false;
    if (filters.plan && !plan.toLowerCase().includes(filters.plan.toLowerCase())) return false;

    const updated = new Date(row.last_message_at || row.updated_at || 0).getTime();
    if (filters.lastInteractionAfter) {
      const min = new Date(filters.lastInteractionAfter).getTime();
      if (updated < min) return false;
    }
    if (filters.activeOnly && now - updated > 30 * day) return false;
    if (filters.inactiveOnly && now - updated <= 30 * day) return false;

    const payment = metaString(row.metadata, 'payment_status').toLowerCase();
    if (filters.paymentOk && payment && !payment.includes('ok') && !payment.includes('dia')) return false;
    if (filters.paymentLate && payment && !payment.includes('atras') && !payment.includes('pend')) return false;

    if (filters.tags?.length) {
      const hasTag = filters.tags.some((t) => tags.some((x) => x.toLowerCase() === t.toLowerCase()));
      if (!hasTag) return false;
    }

    return true;
  });
}

export function personalizeBroadcastMessage(
  template: string,
  row: BroadcastContactRow,
): string {
  const meta = row.metadata || {};
  const vars: Record<string, string> = {
    nome: row.sender_name || metaString(meta, 'name') || row.sender_number,
    empresa: metaString(meta, 'company_name') || metaString(meta, 'empresa') || '—',
    telefone: row.sender_number,
    cidade: metaString(meta, 'city') || metaString(meta, 'cidade') || '—',
    status: metaString(meta, 'status') || '—',
    vencimento: metaString(meta, 'due_date') || metaString(meta, 'vencimento') || '—',
  };
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key.toLowerCase()] ?? `{${key}}`);
}

export function computeBroadcastDashboard(
  contacts: BroadcastContactRow[],
  listCount: number,
  campaigns: BroadcastCampaign[],
): BroadcastDashboardStats {
  const now = Date.now();
  const day = 86400000;
  const active = contacts.filter((c) => {
    const t = new Date(c.last_message_at || c.updated_at || 0).getTime();
    return now - t <= day;
  }).length;

  const totals = campaigns.reduce(
    (acc, c) => ({
      sent: acc.sent + c.stats.sent,
      delivered: acc.delivered + c.stats.delivered,
      replied: acc.replied + c.stats.replied,
    }),
    { sent: 0, delivered: 0, replied: 0 },
  );

  const deliveryRate = totals.sent > 0 ? Math.round((totals.delivered / totals.sent) * 100) : 0;
  const responseRate = totals.delivered > 0 ? Math.round((totals.replied / totals.delivered) * 100) : 0;

  return {
    totalContacts: contacts.length,
    activeContacts: active,
    interactedContacts: contacts.length,
    totalLists: listCount,
    totalCampaigns: campaigns.length,
    deliveryRate,
    responseRate,
  };
}

/** Fila com intervalo gradual (conformidade Meta). */
export async function runBroadcastSendQueue(opts: {
  targets: BroadcastContactRow[];
  bodyTemplate: string;
  sendOne: (phone: string, text: string) => Promise<void>;
  onProgress?: (done: number, total: number) => void;
  delayMs?: number;
}): Promise<BroadcastCampaignStats> {
  const stats: BroadcastCampaignStats = {
    sent: 0,
    delivered: 0,
    read: 0,
    replied: 0,
    failed: 0,
  };
  const delay = opts.delayMs ?? 650;
  const total = opts.targets.length;

  for (let i = 0; i < opts.targets.length; i++) {
    const row = opts.targets[i]!;
    const text = personalizeBroadcastMessage(opts.bodyTemplate, row);
    try {
      await opts.sendOne(row.sender_number, text);
      stats.sent++;
      stats.delivered++;
    } catch {
      stats.failed++;
    }
    opts.onProgress?.(i + 1, total);
    if (i < opts.targets.length - 1) {
      await new Promise((r) => setTimeout(r, delay + Math.floor(Math.random() * 200)));
    }
  }

  return stats;
}

export async function generateBroadcastCampaignAi(brief: string): Promise<string> {
  if (!isOllamaCopilotPreferred()) {
    return `Campanha: ${brief}\n\nOlá {nome},\n\nMensagem operacional da transportadora.\n\nQualquer dúvida, responda neste chat.`;
  }
  return chatOllamaCopilot({
    model: ollamaModelPrimary(),
    systemPrompt: `Assistente Zaptro — campanhas WhatsApp para transportadora.
Gere texto curto, profissional, conforme políticas Meta (só contactos com interação prévia).
Use variáveis: {nome}, {empresa}, {telefone}, {cidade}, {status}, {vencimento}.
Inclua título sugerido, público e corpo da mensagem.`,
    userMessage: brief,
  });
}

export function newCampaignId(): string {
  return `bc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const BROADCAST_COMPLIANCE_LINES = [
  'Enviar apenas para contactos que já interagiram com a empresa.',
  'Permitir opt-out a qualquer momento.',
  'Sem spam nem bases frias.',
  'Envios graduais com fila inteligente.',
  'Suspender campanhas com alto índice de falhas.',
] as const;

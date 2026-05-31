import { LOGSTOKA_AI_BRAND } from '@/modules/ai/constants';
import type { SystemActivityRow } from '@/lib/systemActivityFeed';
import { loadSystemActivities } from '@/lib/systemActivityFeed';

export type ActivityEventKind =
  | 'product_created'
  | 'product_updated'
  | 'product_removed'
  | 'entry'
  | 'exit'
  | 'return'
  | 'transfer'
  | 'inventory'
  | 'conference'
  | 'separation'
  | 'order_received'
  | 'order_shipped'
  | 'order_cancelled'
  | 'integration_connected'
  | 'integration_disconnected'
  | 'integration_sync'
  | 'import_report'
  | 'ocr_processed'
  | 'ai_action'
  | 'user_change'
  | 'flow_update'
  | 'print_document';

export type ActivityDomain =
  | 'operation'
  | 'sales'
  | 'integrations'
  | 'alerts'
  | 'inventory'
  | 'conference'
  | 'transfer'
  | 'production'
  | 'ai'
  | 'flow'
  | 'user';

export type ActivityResult = 'success' | 'warning' | 'error' | 'pending';

export type OperationalActivityEvent = {
  id: string;
  companyId: string;
  time: string;
  kind: ActivityEventKind;
  domain: ActivityDomain;
  actorName: string;
  actorId?: string;
  title: string;
  description: string;
  reference: string;
  status: string;
  result: ActivityResult;
  entityType?: string;
  entityId?: string;
  marketplace?: string;
  productSku?: string;
  orderRef?: string;
  href?: string;
  meta?: Record<string, unknown>;
};

export type ActivityPeriodPreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'month'
  | 'year'
  | 'custom'
  | 'all';

export type ActivityViewMode = 'timeline' | 'calendar';

export type ActivityCenterFilters = {
  period: ActivityPeriodPreset;
  customFrom?: string;
  customTo?: string;
  domains: ActivityDomain[] | 'all';
  actorQuery?: string;
  searchQuery?: string;
};

export type RecordActivityInput = Omit<
  OperationalActivityEvent,
  'id' | 'companyId' | 'time' | 'result'
> & {
  time?: string;
  result?: ActivityResult;
  companyId?: string;
};

const STORAGE_PREFIX = 'logstoka-activity-log:';

const DOMAIN_LABELS: Record<ActivityDomain, string> = {
  operation: 'Operação',
  sales: 'Vendas',
  integrations: 'Integrações',
  alerts: 'Alertas',
  inventory: 'Inventário',
  conference: 'Conferência',
  transfer: 'Transferência',
  production: 'Produção',
  ai: 'IA',
  flow: 'Fluxo',
  user: 'Usuário',
};

const KIND_LABELS: Partial<Record<ActivityEventKind, string>> = {
  entry: 'Entrada',
  exit: 'Saída',
  return: 'Devolução',
  transfer: 'Transferência',
  inventory: 'Inventário',
  conference: 'Conferência',
  separation: 'Separação',
  order_received: 'Pedido recebido',
  order_shipped: 'Pedido enviado',
  order_cancelled: 'Pedido cancelado',
  integration_sync: 'Sincronização',
  import_report: 'Importação',
  ai_action: 'Ação da IA',
  flow_update: 'Fluxo',
  print_document: 'Impressão',
};

export function activityDomainLabel(domain: ActivityDomain): string {
  return DOMAIN_LABELS[domain] ?? domain;
}

export function activityKindLabel(kind: ActivityEventKind): string {
  return KIND_LABELS[kind] ?? kind.replace(/_/g, ' ');
}

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}${companyId}`;
}

function newId(): string {
  return `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function resultTone(result: ActivityResult): string {
  if (result === 'success') return 'ls-activity-tone ls-activity-tone--brand';
  if (result === 'warning') return 'ls-activity-tone ls-activity-tone--warn';
  if (result === 'error') return 'ls-activity-tone ls-activity-tone--danger';
  return 'ls-activity-tone ls-activity-tone--neutral';
}

function mapDomainToCategory(domain: ActivityDomain): SystemActivityRow['category'] {
  if (domain === 'sales') return 'sales';
  if (domain === 'integrations') return 'integrations';
  if (domain === 'alerts') return 'alerts';
  return 'operation';
}

export function activityEventToFeedRow(event: OperationalActivityEvent): SystemActivityRow & {
  actorName: string;
  domain: ActivityDomain;
  kind: ActivityEventKind;
} {
  return {
    id: event.id,
    time: event.time,
    type: event.title || activityKindLabel(event.kind),
    category: mapDomainToCategory(event.domain),
    tone: resultTone(event.result),
    description: event.description,
    reference: event.reference,
    status: event.status,
    href: event.href,
    actorName: event.actorName,
    domain: event.domain,
    kind: event.kind,
  };
}

export function loadStoredActivities(companyId: string | null): OperationalActivityEvent[] {
  if (!companyId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    return JSON.parse(raw) as OperationalActivityEvent[];
  } catch {
    return [];
  }
}

function saveStoredActivities(companyId: string, events: OperationalActivityEvent[]): void {
  try {
    const trimmed = events.slice(0, 2000);
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(trimmed));
  } catch {
    /* ignore quota */
  }
}

export function recordActivity(companyId: string | null, input: RecordActivityInput): OperationalActivityEvent | null {
  if (!companyId) return null;
  const event: OperationalActivityEvent = {
    ...input,
    id: newId(),
    companyId,
    time: input.time ?? new Date().toISOString(),
    result: input.result ?? 'success',
  };
  const existing = loadStoredActivities(companyId);
  saveStoredActivities(companyId, [event, ...existing]);
  window.dispatchEvent(new CustomEvent('logstoka:activity-recorded', { detail: event }));
  return event;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function resolveActivityPeriodRange(filters: ActivityCenterFilters, now = new Date()): {
  from: Date | null;
  to: Date;
} {
  const to = endOfDay(now);
  switch (filters.period) {
    case 'today':
      return { from: startOfDay(now), to };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'last7': {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to };
    }
    case 'last30': {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to };
    }
    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to };
    }
    case 'year': {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from, to };
    }
    case 'custom': {
      const from = filters.customFrom ? startOfDay(new Date(filters.customFrom)) : null;
      const customTo = filters.customTo ? endOfDay(new Date(filters.customTo)) : to;
      return { from, to: customTo };
    }
    case 'all':
    default:
      return { from: null, to };
  }
}

export function filterActivityEvents(
  events: OperationalActivityEvent[],
  filters: ActivityCenterFilters,
  now = new Date(),
): OperationalActivityEvent[] {
  const { from, to } = resolveActivityPeriodRange(filters, now);
  const q = filters.searchQuery?.trim().toLowerCase();
  const actorQ = filters.actorQuery?.trim().toLowerCase();

  return events.filter((event) => {
    const t = new Date(event.time).getTime();
    if (from && t < from.getTime()) return false;
    if (t > to.getTime()) return false;
    if (filters.domains !== 'all' && !filters.domains.includes(event.domain)) return false;
    if (actorQ && !event.actorName.toLowerCase().includes(actorQ)) return false;
    if (!q) return true;
    const hay = `${event.title} ${event.description} ${event.reference} ${event.orderRef ?? ''} ${event.productSku ?? ''}`.toLowerCase();
    return hay.includes(q);
  });
}

export function groupActivitiesByDay(events: OperationalActivityEvent[]): Map<string, OperationalActivityEvent[]> {
  const map = new Map<string, OperationalActivityEvent[]>();
  for (const event of events) {
    const key = event.time.slice(0, 10);
    const list = map.get(key) ?? [];
    list.push(event);
    map.set(key, list);
  }
  return map;
}

function seedDemoActivities(companyId: string): OperationalActivityEvent[] {
  const now = new Date();
  const actors = ['João Silva', 'Maria Costa', 'Operador LogStoka'];
  const samples: Array<Omit<RecordActivityInput, 'actorName'> & { daysAgo: number; hour: number; actorIdx: number }> = [
    { daysAgo: 0, hour: 9, actorIdx: 0, kind: 'entry', domain: 'operation', title: 'Entrada', description: 'Entrada de 100 un. · Fralda Pluma Premium P', reference: 'MOV-8841', status: 'Concluído', href: '/app/movements' },
    { daysAgo: 0, hour: 9, actorIdx: 0, kind: 'conference', domain: 'conference', title: 'Conferência guiada', description: 'Conferência guiada concluída · 2 pedidos · 5 un.', reference: 'SHP-992000', status: 'Concluído', href: '/app/operacao' },
    { daysAgo: 0, hour: 10, actorIdx: 1, kind: 'exit', domain: 'operation', title: 'Saída', description: 'Saída de 3 un. · Fralda Pluma Premium P · pedido SHP-992000', reference: 'MOV-8842', status: 'Expedido', href: '/app/movements' },
    { daysAgo: 1, hour: 14, actorIdx: 1, kind: 'integration_sync', domain: 'integrations', title: 'Integração Shopee', description: 'Integração Shopee sincronizada · 12 pedidos', reference: 'Shopee API', status: 'Sucesso', href: '/app/integrations' },
    { daysAgo: 2, hour: 11, actorIdx: 0, kind: 'inventory', domain: 'inventory', title: 'Inventário', description: 'Inventário rotativo · CD Principal · 48 SKUs', reference: 'INV-2026-03', status: 'Em revisão', href: '/app/inventory' },
    { daysAgo: 7, hour: 16, actorIdx: 2, kind: 'order_shipped', domain: 'sales', title: 'Pedido enviado', description: 'Pedido #123 enviado para transportadora', reference: '#123', status: 'Enviado', href: '/app/vendas' },
    { daysAgo: 30, hour: 10, actorIdx: 0, kind: 'flow_update', domain: 'flow', title: 'Fluxo operacional', description: 'Fluxo de saída atualizado · sábado processa sábado', reference: 'Fluxo semanal', status: 'Salvo', href: '/app/operacao/fluxo' },
    { daysAgo: 120, hour: 9, actorIdx: 1, kind: 'ai_action', domain: 'ai', title: 'IA operacional', description: `${LOGSTOKA_AI_BRAND} sugeriu ajuste no corte de sexta-feira`, reference: 'Assistente IA', status: 'Sugestão', result: 'warning' },
    { daysAgo: 365, hour: 15, actorIdx: 0, kind: 'import_report', domain: 'operation', title: 'Importação', description: 'Relatório Excel importado · 240 linhas', reference: 'XLS', status: 'Concluído', href: '/app/imports' },
  ];

  return samples.map((sample, index) => {
    const d = new Date(now);
    d.setDate(d.getDate() - sample.daysAgo);
    d.setHours(sample.hour, 15 + index, 0, 0);
    return {
      id: `seed-${index}`,
      companyId,
      time: d.toISOString(),
      actorName: actors[sample.actorIdx]!,
      result: sample.result ?? 'success',
      kind: sample.kind,
      domain: sample.domain,
      title: sample.title,
      description: sample.description,
      reference: sample.reference,
      status: sample.status,
      href: sample.href,
    };
  });
}

export function ensureActivitySeed(companyId: string | null): void {
  if (!companyId) return;
  const existing = loadStoredActivities(companyId);
  if (existing.length > 0) return;
  saveStoredActivities(companyId, seedDemoActivities(companyId));
}

function mapSystemRowKind(
  type: string,
  category: 'operation' | 'sales' | 'integrations' | 'alerts',
): ActivityEventKind {
  const t = type.toLowerCase();
  if (t.includes('entrada')) return 'entry';
  if (t.includes('saída') || t.includes('saida')) return 'exit';
  if (t.includes('transfer')) return 'transfer';
  if (t.includes('devolu')) return 'return';
  if (t.includes('invent')) return 'inventory';
  if (t.includes('import')) return 'import_report';
  if (t.includes('integr')) return 'integration_sync';
  if (t.includes('alerta')) return 'user_change';
  if (t.includes('pedido')) return category === 'sales' ? 'order_shipped' : 'user_change';
  if (t.includes('avaria') || t.includes('damage')) return 'exit';
  return 'user_change';
}

export async function loadCentralActivities(companyId: string | null): Promise<OperationalActivityEvent[]> {
  if (!companyId) return [];
  ensureActivitySeed(companyId);
  const stored = loadStoredActivities(companyId);
  const systemRows = await loadSystemActivities(companyId);
  const fromSystem: OperationalActivityEvent[] = systemRows.map((row) => ({
    id: `sys-${row.id}`,
    companyId,
    time: row.time,
    kind: mapSystemRowKind(row.type, row.category),
    domain:
      row.category === 'sales'
        ? 'sales'
        : row.category === 'integrations'
          ? 'integrations'
          : row.category === 'alerts'
            ? 'alerts'
            : row.type === 'Transferência'
              ? 'transfer'
              : row.type === 'Devolução'
                ? 'operation'
                : row.type === 'Inventário'
                  ? 'inventory'
                  : 'operation',
    actorName: 'Sistema',
    title: row.type,
    description: row.description,
    reference: row.reference,
    status: row.status,
    result: row.tone.includes('danger') ? 'error' : row.tone.includes('warn') ? 'warning' : 'success',
    href: row.href,
    entityId: row.id,
    productSku: row.preview?.sku,
    meta: row.preview,
  }));

  const merged = [...stored, ...fromSystem];
  const seen = new Set<string>();
  const unique = merged.filter((event) => {
    const key = `${event.time}-${event.reference}-${event.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export const ACTIVITY_PERIOD_OPTIONS: { id: ActivityPeriodPreset; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: 'last7', label: '7 dias' },
  { id: 'last30', label: '30 dias' },
  { id: 'month', label: 'Mês atual' },
  { id: 'year', label: 'Ano atual' },
  { id: 'all', label: 'Tudo' },
  { id: 'custom', label: 'Período' },
];

export const ACTIVITY_DOMAIN_OPTIONS: { id: ActivityDomain; label: string }[] = [
  { id: 'operation', label: 'Operação' },
  { id: 'conference', label: 'Conferência' },
  { id: 'inventory', label: 'Inventário' },
  { id: 'transfer', label: 'Transferência' },
  { id: 'sales', label: 'Pedidos' },
  { id: 'integrations', label: 'Integrações' },
  { id: 'flow', label: 'Fluxo' },
  { id: 'ai', label: 'IA' },
  { id: 'user', label: 'Usuário' },
  { id: 'alerts', label: 'Alertas' },
];

export function formatActivityClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatActivityDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

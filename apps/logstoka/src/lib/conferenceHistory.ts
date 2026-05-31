import type { DivergenceReason } from '@/lib/conferenceDivergences';
import { DIVERGENCE_REASON_LABELS } from '@/lib/conferenceDivergences';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';

export type ConferenceHistorySource = 'picking_daily' | 'operation_sheet' | 'conference_hub';

export type ConferenceHistoryKind =
  | 'session_started'
  | 'item_confirmed'
  | 'item_divergence'
  | 'session_completed'
  | 'exit_registered'
  | 'separated_added';

export type ConferenceHistoryRecord = {
  id: string;
  companyId: string;
  sessionId: string;
  kind: ConferenceHistoryKind;
  at: string;
  dayKey: string;
  actorId?: string;
  actorName: string;
  actorEmail?: string;
  source: ConferenceHistorySource;
  sku?: string;
  productName?: string;
  quantityExpected?: number;
  quantityRegistered?: number;
  marketplace?: string | null;
  store?: string | null;
  orderRef?: string;
  divergenceReason?: DivergenceReason;
  divergenceNote?: string;
  note?: string;
};

export type ConferenceHistoryFilters = {
  period: 'today' | 'yesterday' | 'last7' | 'last30' | 'month' | 'year' | 'custom' | 'all';
  customFrom?: string;
  customTo?: string;
  actorName?: string;
  kind?: ConferenceHistoryKind | 'all';
  search?: string;
};

export type ConferenceHistorySessionSummary = {
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  actorName: string;
  actorId?: string;
  source: ConferenceHistorySource;
  confirmedCount: number;
  divergenceCount: number;
  unitsExpected: number;
  unitsRegistered: number;
  records: ConferenceHistoryRecord[];
};

const STORAGE_PREFIX = 'logstoka-conference-history:';
const MAX_RECORDS = 3000;

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}${companyId}`;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function dayKeyFromIso(iso: string): string {
  return iso.slice(0, 10);
}

export function createConferenceSessionId(): string {
  return newId('conf');
}

export function loadConferenceHistory(companyId: string | null): ConferenceHistoryRecord[] {
  if (!companyId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    return JSON.parse(raw) as ConferenceHistoryRecord[];
  } catch {
    return [];
  }
}

function saveConferenceHistory(companyId: string, records: ConferenceHistoryRecord[]): void {
  try {
    const trimmed = records.slice(0, MAX_RECORDS);
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent('logstoka:conference-history-updated'));
  } catch {
    /* quota */
  }
}

export function appendConferenceHistoryRecord(
  companyId: string,
  record: Omit<ConferenceHistoryRecord, 'id' | 'companyId' | 'dayKey' | 'at'> & { at?: string },
): ConferenceHistoryRecord {
  const at = record.at ?? new Date().toISOString();
  const entry: ConferenceHistoryRecord = {
    ...record,
    id: newId('chr'),
    companyId,
    at,
    dayKey: dayKeyFromIso(at),
  };
  const list = loadConferenceHistory(companyId);
  saveConferenceHistory(companyId, [entry, ...list]);
  return entry;
}

export function startConferenceHistorySession(input: {
  companyId: string;
  sessionId: string;
  actorName: string;
  actorId?: string;
  actorEmail?: string;
  source: ConferenceHistorySource;
  itemCount: number;
  unitsExpected: number;
}): void {
  appendConferenceHistoryRecord(input.companyId, {
    sessionId: input.sessionId,
    kind: 'session_started',
    actorName: input.actorName,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    source: input.source,
    quantityExpected: input.unitsExpected,
    note: `${input.itemCount} item(ns) na fila`,
  });
}

export function recordConferenceItemConfirmed(input: {
  companyId: string;
  sessionId: string;
  actorName: string;
  actorId?: string;
  source: ConferenceHistorySource;
  sku?: string;
  productName: string;
  quantityExpected: number;
  marketplace?: string | null;
  store?: string | null;
  orderRef?: string;
}): void {
  appendConferenceHistoryRecord(input.companyId, {
    sessionId: input.sessionId,
    kind: 'item_confirmed',
    actorName: input.actorName,
    actorId: input.actorId,
    source: input.source,
    sku: input.sku,
    productName: input.productName,
    quantityExpected: input.quantityExpected,
    quantityRegistered: input.quantityExpected,
    marketplace: input.marketplace,
    store: input.store,
    orderRef: input.orderRef,
  });
}

export function recordConferenceItemDivergence(input: {
  companyId: string;
  sessionId: string;
  actorName: string;
  actorId?: string;
  source: ConferenceHistorySource;
  sku?: string;
  productName: string;
  quantityExpected: number;
  quantityActual?: number;
  reason: DivergenceReason;
  note?: string;
  marketplace?: string | null;
  store?: string | null;
  orderRef?: string;
}): void {
  appendConferenceHistoryRecord(input.companyId, {
    sessionId: input.sessionId,
    kind: 'item_divergence',
    actorName: input.actorName,
    actorId: input.actorId,
    source: input.source,
    sku: input.sku,
    productName: input.productName,
    quantityExpected: input.quantityExpected,
    quantityRegistered: input.quantityActual,
    divergenceReason: input.reason,
    divergenceNote: input.note,
    marketplace: input.marketplace,
    store: input.store,
    orderRef: input.orderRef,
    note: input.quantityActual != null
      ? `Contado ${input.quantityActual} un. · sistema ${input.quantityExpected} un.`
      : undefined,
  });
}

export function completeConferenceHistorySession(input: {
  companyId: string;
  sessionId: string;
  actorName: string;
  actorId?: string;
  source: ConferenceHistorySource;
  confirmedCount: number;
  divergenceCount: number;
  unitsRegistered: number;
}): void {
  appendConferenceHistoryRecord(input.companyId, {
    sessionId: input.sessionId,
    kind: 'session_completed',
    actorName: input.actorName,
    actorId: input.actorId,
    source: input.source,
    quantityRegistered: input.unitsRegistered,
    note: `${input.confirmedCount} conferido(s) · ${input.divergenceCount} divergência(s)`,
  });
}

export function recordConferenceExitRegistered(input: {
  companyId: string;
  sessionId: string;
  actorName: string;
  actorId?: string;
  source: ConferenceHistorySource;
  sku?: string;
  productName: string;
  quantityRegistered: number;
  orderRef?: string;
}): void {
  appendConferenceHistoryRecord(input.companyId, {
    sessionId: input.sessionId,
    kind: 'exit_registered',
    actorName: input.actorName,
    actorId: input.actorId,
    source: input.source,
    sku: input.sku,
    productName: input.productName,
    quantityRegistered: input.quantityRegistered,
    orderRef: input.orderRef,
    note: 'Baixa no estoque após conferência',
  });
}

export function recordPickingSeparatedToQueue(input: {
  companyId: string;
  actorName: string;
  actorId?: string;
  sku: string;
  productName: string;
  quantity: number;
  marketplace?: string | null;
  store?: string | null;
}): void {
  appendConferenceHistoryRecord(input.companyId, {
    sessionId: `sep-${dayKeyFromIso(new Date().toISOString())}`,
    kind: 'separated_added',
    actorName: input.actorName,
    actorId: input.actorId,
    source: 'picking_daily',
    sku: input.sku,
    productName: input.productName,
    quantityExpected: input.quantity,
    quantityRegistered: input.quantity,
    marketplace: input.marketplace,
    store: input.store,
    note: 'Adicionado à fila de separados do dia',
  });
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

export function resolveConferenceHistoryPeriod(
  filters: ConferenceHistoryFilters,
  now = new Date(),
): { from: Date | null; to: Date } {
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
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1), to };
    case 'custom': {
      const from = filters.customFrom ? startOfDay(new Date(filters.customFrom)) : null;
      const customTo = filters.customTo ? endOfDay(new Date(filters.customTo)) : to;
      return { from, to: customTo };
    }
    default:
      return { from: null, to };
  }
}

export function filterConferenceHistory(
  records: ConferenceHistoryRecord[],
  filters: ConferenceHistoryFilters,
  now = new Date(),
): ConferenceHistoryRecord[] {
  const { from, to } = resolveConferenceHistoryPeriod(filters, now);
  const actorQ = filters.actorName?.trim().toLowerCase();
  const searchQ = filters.search?.trim().toLowerCase();

  return records.filter((row) => {
    const t = new Date(row.at).getTime();
    if (from && t < from.getTime()) return false;
    if (t > to.getTime()) return false;
    if (filters.kind && filters.kind !== 'all' && row.kind !== filters.kind) return false;
    if (actorQ && !row.actorName.toLowerCase().includes(actorQ)) return false;
    if (!searchQ) return true;
    const hay = `${row.productName ?? ''} ${row.sku ?? ''} ${row.orderRef ?? ''} ${row.note ?? ''} ${row.actorName}`.toLowerCase();
    return hay.includes(searchQ);
  });
}

export function listConferenceActors(records: ConferenceHistoryRecord[]): string[] {
  return [...new Set(records.map((r) => r.actorName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function listWorkersOnDay(records: ConferenceHistoryRecord[], dayKey: string): string[] {
  const names = new Set<string>();
  for (const row of records) {
    if (row.dayKey === dayKey) names.add(row.actorName);
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function groupConferenceHistoryBySession(
  records: ConferenceHistoryRecord[],
): ConferenceHistorySessionSummary[] {
  const map = new Map<string, ConferenceHistorySessionSummary>();

  for (const row of records) {
    if (row.kind === 'separated_added') continue;
    let session = map.get(row.sessionId);
    if (!session) {
      session = {
        sessionId: row.sessionId,
        startedAt: row.at,
        actorName: row.actorName,
        actorId: row.actorId,
        source: row.source,
        confirmedCount: 0,
        divergenceCount: 0,
        unitsExpected: 0,
        unitsRegistered: 0,
        records: [],
      };
      map.set(row.sessionId, session);
    }
    session.records.push(row);
    if (row.kind === 'session_started' && row.at < session.startedAt) session.startedAt = row.at;
    if (row.kind === 'session_completed') session.completedAt = row.at;
    if (row.kind === 'item_confirmed') {
      session.confirmedCount += 1;
      session.unitsExpected += row.quantityExpected ?? 0;
      session.unitsRegistered += row.quantityRegistered ?? row.quantityExpected ?? 0;
    }
    if (row.kind === 'item_divergence') {
      session.divergenceCount += 1;
    }
    if (row.kind === 'exit_registered') {
      session.unitsRegistered += row.quantityRegistered ?? 0;
    }
  }

  return [...map.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function conferenceHistoryKindLabel(kind: ConferenceHistoryKind): string {
  const labels: Record<ConferenceHistoryKind, string> = {
    session_started: 'Sessão iniciada',
    item_confirmed: 'Item conferido',
    item_divergence: 'Divergência',
    session_completed: 'Sessão concluída',
    exit_registered: 'Baixa no estoque',
    separated_added: 'Separado na fila',
  };
  return labels[kind];
}

export function formatConferenceHistoryDetail(row: ConferenceHistoryRecord): string {
  if (row.kind === 'item_divergence' && row.divergenceReason) {
    const reason = DIVERGENCE_REASON_LABELS[row.divergenceReason];
    const qty =
      row.quantityRegistered != null && row.quantityExpected != null
        ? ` · contado ${row.quantityRegistered} · sistema ${row.quantityExpected}`
        : '';
    return `${reason}${qty}${row.divergenceNote ? ` · ${row.divergenceNote}` : ''}`;
  }
  if (row.quantityExpected != null && row.quantityRegistered != null && row.quantityExpected !== row.quantityRegistered) {
    return `Sistema ${row.quantityExpected} un. · registrado ${row.quantityRegistered} un.`;
  }
  if (row.quantityExpected != null) return `${row.quantityExpected.toLocaleString('pt-BR')} un.`;
  return row.note ?? '—';
}

const SEED_FLAG = 'logstoka-conference-history-seeded';

export function ensureConferenceHistoryDemoSeed(companyId: string | null): void {
  if (!companyId || !isLogstokaDemoCompany(companyId) || typeof window === 'undefined') return;
  const flagKey = `${SEED_FLAG}:${companyId}`;
  if (window.localStorage.getItem(flagKey)) return;
  if (loadConferenceHistory(companyId).length > 0) {
    window.localStorage.setItem(flagKey, '1');
    return;
  }

  const daysAgo = (d: number, h = 10, m = 0) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    dt.setHours(h, m, 0, 0);
    return dt.toISOString();
  };

  const seed: Omit<ConferenceHistoryRecord, 'id' | 'companyId' | 'dayKey'>[] = [];

  const push = (row: Omit<ConferenceHistoryRecord, 'id' | 'companyId' | 'dayKey'>) => {
    seed.push(row);
  };

  const sessionYesterday = 'conf-demo-yesterday';
  const sessionToday = 'conf-demo-today';

  push({
    sessionId: sessionYesterday,
    kind: 'session_started',
    at: daysAgo(1, 14, 5),
    actorName: 'Rafael Mendes',
    actorId: '3',
    actorEmail: 'rafael@logstoka.com',
    source: 'picking_daily',
    quantityExpected: 86,
    note: '3 item(ns) na fila',
  });

  push({
    sessionId: sessionYesterday,
    kind: 'item_confirmed',
    at: daysAgo(1, 14, 8),
    actorName: 'Rafael Mendes',
    actorId: '3',
    source: 'picking_daily',
    sku: 'STK-ORG-12',
    productName: 'Organizador Modular',
    quantityExpected: 34,
    quantityRegistered: 34,
    marketplace: null,
    store: 'NF-45822',
    orderRef: 'NF-45822',
  });

  push({
    sessionId: sessionYesterday,
    kind: 'item_divergence',
    at: daysAgo(1, 14, 9),
    actorName: 'Rafael Mendes',
    actorId: '3',
    source: 'picking_daily',
    sku: 'STK-ORG-12',
    productName: 'Organizador Modular',
    quantityExpected: 34,
    quantityRegistered: 30,
    divergenceReason: 'wrong_qty',
    divergenceNote: 'Contagem física no pallet: 30 caixas',
    marketplace: null,
    store: 'NF-45822',
    orderRef: 'NF-45822',
    note: 'Contado 30 un. · sistema 34 un.',
  });

  push({
    sessionId: sessionYesterday,
    kind: 'item_confirmed',
    at: daysAgo(1, 14, 12),
    actorName: 'Rafael Mendes',
    actorId: '3',
    source: 'picking_daily',
    sku: 'PLM-FRD-P',
    productName: 'Fralda Pluma Premium P',
    quantityExpected: 24,
    quantityRegistered: 24,
    marketplace: 'shopee',
    store: 'Stock Express',
    orderRef: 'SHP-881200',
  });

  push({
    sessionId: sessionYesterday,
    kind: 'session_completed',
    at: daysAgo(1, 14, 20),
    actorName: 'Rafael Mendes',
    actorId: '3',
    source: 'picking_daily',
    quantityRegistered: 58,
    note: '2 conferido(s) · 1 divergência(s)',
  });

  push({
    sessionId: sessionYesterday,
    kind: 'exit_registered',
    at: daysAgo(1, 14, 21),
    actorName: 'Rafael Mendes',
    actorId: '3',
    source: 'picking_daily',
    sku: 'STK-ORG-12',
    productName: 'Organizador Modular',
    quantityRegistered: 34,
    orderRef: 'NF-45822',
  });

  push({
    sessionId: sessionToday,
    kind: 'session_started',
    at: daysAgo(0, 9, 10),
    actorName: 'Alison Thiago',
    actorId: '1',
    actorEmail: 'logstoka@teste.com',
    source: 'picking_daily',
    quantityExpected: 42,
    note: '2 item(ns) na fila',
  });

  push({
    sessionId: sessionToday,
    kind: 'separated_added',
    at: daysAgo(0, 8, 30),
    actorName: 'Marina Costa',
    actorId: '2',
    source: 'picking_daily',
    sku: 'TEC-CAB-2M',
    productName: 'Cabo USB-C 2m',
    quantityExpected: 24,
    quantityRegistered: 24,
    marketplace: 'shopee',
    store: 'Stock Express',
  });

  const built = seed.map((row) => {
    const at = row.at!;
    return {
      ...row,
      id: newId('chr'),
      companyId,
      at,
      dayKey: dayKeyFromIso(at),
    } satisfies ConferenceHistoryRecord;
  });

  saveConferenceHistory(companyId, built);
  window.localStorage.setItem(flagKey, '1');
}

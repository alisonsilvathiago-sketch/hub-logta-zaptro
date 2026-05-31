import type { OperationalOrder } from '@/lib/operationalFlow';
import { MARKETPLACE_LABELS, type Marketplace } from '@/types';

export type PickRow = {
  sku: string;
  name: string;
  marketplace?: string | null;
  store?: string | null;
  quantity: number;
};

export type PickingLineStatus = 'pending' | 'separated' | 'conferenced';

export type PickingLine = PickRow & {
  key: string;
  status: PickingLineStatus;
  separatedAt?: string;
  conferencedAt?: string;
};

const STORAGE_PREFIX = 'logstoka-picking-session';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}:${companyId}:${todayKey()}`;
}

export function pickingLineKey(row: PickRow): string {
  return `${row.sku}::${row.marketplace ?? ''}::${row.store ?? ''}`;
}

type StoredSession = Record<string, Omit<PickingLine, keyof PickRow | 'key'>>;

function loadStored(companyId: string | null): StoredSession {
  if (!companyId || typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    return raw ? (JSON.parse(raw) as StoredSession) : {};
  } catch {
    return {};
  }
}

function saveStored(companyId: string, data: StoredSession): void {
  try {
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('logstoka:picking-session-updated'));
  } catch {
    /* ignore */
  }
}

export function mergePickingLines(companyId: string | null, rows: PickRow[]): PickingLine[] {
  const stored = loadStored(companyId);
  return rows.map((row) => {
    const key = pickingLineKey(row);
    const saved = stored[key];
    return {
      ...row,
      key,
      status: saved?.status ?? 'pending',
      separatedAt: saved?.separatedAt,
      conferencedAt: saved?.conferencedAt,
    };
  });
}

export function markPickingSeparated(companyId: string, line: PickingLine): void {
  const stored = loadStored(companyId);
  stored[line.key] = {
    status: 'separated',
    separatedAt: new Date().toISOString(),
    conferencedAt: stored[line.key]?.conferencedAt,
  };
  saveStored(companyId, stored);
}

export function markPickingPending(companyId: string, key: string): void {
  const stored = loadStored(companyId);
  delete stored[key];
  saveStored(companyId, stored);
}

export function markPickingConferenced(companyId: string, keys: string[]): void {
  clearPickingLinesAfterConference(companyId, keys);
}

/** Remove itens da fila do dia após baixa na conferência — somem da lista. */
export function clearPickingLinesAfterConference(companyId: string, keys: string[]): void {
  const stored = loadStored(companyId);
  for (const key of keys) {
    delete stored[key];
  }
  saveStored(companyId, stored);
}

export function filterSeparatedLines(lines: PickingLine[]): PickingLine[] {
  return lines.filter((line) => line.status === 'separated');
}

export function filterPendingLines(lines: PickingLine[]): PickingLine[] {
  return lines.filter((line) => line.status === 'pending');
}

export function todaySessionLabel(date = new Date()): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export function separatedQueueStats(lines: PickingLine[]) {
  const queue = filterSeparatedLines(lines);
  const units = queue.reduce((sum, line) => sum + line.quantity, 0);
  const channels = new Set(queue.map((line) => line.marketplace).filter(Boolean)).size;
  return {
    skus: queue.length,
    units,
    channels,
    pendingToAdd: filterPendingLines(lines).length,
  };
}

export function pickingLinesToOperationalOrders(lines: PickingLine[]): OperationalOrder[] {
  const now = new Date();
  return lines.map((line) => {
    const marketplace = (line.marketplace ?? 'shopee') as Marketplace;
    return {
      id: `pick-${line.key}`,
      orderRef: line.store ?? line.sku,
      marketplace,
      marketplaceLabel: MARKETPLACE_LABELS[marketplace] ?? marketplace,
      productName: line.name,
      sku: line.sku,
      quantity: line.quantity,
      soldAt: now.toISOString(),
      saleWeekday: now.getDay(),
      saleDayLabel: 'Hoje',
      stage: 'conference',
      dueProcessWeekday: now.getDay(),
      dueDayLabel: 'Hoje',
      reportReceived: true,
      isLate: false,
      isBacklog: false,
      source: 'api',
    };
  });
}

export function pickingSessionStats(lines: PickingLine[]) {
  const pending = lines.filter((l) => l.status === 'pending').length;
  const separated = lines.filter((l) => l.status === 'separated').length;
  const conferenced = lines.filter((l) => l.status === 'conferenced').length;
  const unitsPending = lines.filter((l) => l.status === 'pending').reduce((s, l) => s + l.quantity, 0);
  const unitsToConference = lines.filter((l) => l.status === 'separated').reduce((s, l) => s + l.quantity, 0);
  return { pending, separated, conferenced, unitsPending, unitsToConference };
}

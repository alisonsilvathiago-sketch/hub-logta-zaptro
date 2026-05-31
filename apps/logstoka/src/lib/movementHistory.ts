import { computeMovementOverdue } from '@/lib/movementOverdue';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_MOVEMENTS, type DemoMovementRow } from '@/lib/logstokaDemoSeed';

export type MovementHistoryType = 'entry' | 'exit' | 'transfer' | 'damage' | 'return' | 'overdue';

export type MovementHistoryAction =
  | 'registered'
  | 'merged'
  | 'edited'
  | 'deleted'
  | 'imported'
  | 'overdue_flagged';

export type MovementHistorySource =
  | 'movements_page'
  | 'scanner'
  | 'guided_conference'
  | 'global_scanner'
  | 'import_api'
  | 'import_excel'
  | 'system';

export type MovementHistoryRecord = {
  id: string;
  companyId: string;
  at: string;
  dayKey: string;
  movementType: MovementHistoryType;
  actionKind: MovementHistoryAction;
  actorName: string;
  actorId?: string;
  actorEmail?: string;
  source: MovementHistorySource;
  movementId?: string;
  sku?: string;
  productName?: string;
  quantity?: number;
  warehouseName?: string;
  referenceCode?: string;
  marketplace?: string | null;
  note?: string;
  /** Atrasos — quem registrou a entrada original */
  registeredByActorName?: string;
  registeredAt?: string;
  overdueDays?: number;
  pendingQuantity?: number;
};

export type MovementHistoryFilters = {
  period:
    | 'today'
    | 'yesterday'
    | 'last7'
    | 'last30'
    | 'last60'
    | 'last90'
    | 'last120'
    | 'month'
    | 'year'
    | 'custom'
    | 'all';
  customFrom?: string;
  customTo?: string;
  movementType?: MovementHistoryType | 'all';
  actionKind?: MovementHistoryAction | 'all';
  actorName?: string;
  search?: string;
};

const STORAGE_PREFIX = 'logstoka-movement-history:';
const MAX_RECORDS = 4000;

const DEMO_ACTORS = ['João Silva', 'Maria Costa', 'Rafael Mendes', 'Operador LogStoka'];

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}${companyId}`;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function dayKeyFromIso(iso: string): string {
  return iso.slice(0, 10);
}

function movementTypeFromRow(row: DemoMovementRow): MovementHistoryType {
  if (row.movement_type === 'entry') return 'entry';
  if (row.movement_type === 'exit') return 'exit';
  if (row.movement_type === 'transfer') return 'transfer';
  if (row.movement_type === 'damage') return 'damage';
  if (row.movement_type === 'return') return 'return';
  return 'entry';
}

export function loadMovementHistory(companyId: string | null): MovementHistoryRecord[] {
  if (!companyId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    return JSON.parse(raw) as MovementHistoryRecord[];
  } catch {
    return [];
  }
}

function saveMovementHistory(companyId: string, records: MovementHistoryRecord[]): void {
  try {
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(records.slice(0, MAX_RECORDS)));
    window.dispatchEvent(new CustomEvent('logstoka:movement-history-updated'));
  } catch {
    /* quota */
  }
}

export function appendMovementHistoryRecord(
  companyId: string,
  record: Omit<MovementHistoryRecord, 'id' | 'companyId' | 'dayKey' | 'at'> & { at?: string },
): MovementHistoryRecord {
  const at = record.at ?? new Date().toISOString();
  const entry: MovementHistoryRecord = {
    ...record,
    id: newId('mvh'),
    companyId,
    at,
    dayKey: dayKeyFromIso(at),
  };
  saveMovementHistory(companyId, [entry, ...loadMovementHistory(companyId)]);
  return entry;
}

export function recordMovementRegistered(input: {
  companyId: string;
  movement: DemoMovementRow;
  actorName: string;
  actorId?: string;
  source?: MovementHistorySource;
  merged?: boolean;
}): void {
  appendMovementHistoryRecord(input.companyId, {
    movementType: movementTypeFromRow(input.movement),
    actionKind: input.merged ? 'merged' : 'registered',
    actorName: input.actorName,
    actorId: input.actorId,
    source: input.source ?? 'scanner',
    movementId: input.movement.id,
    sku: input.movement.sku,
    productName: input.movement.product_name,
    quantity: input.movement.total_quantity,
    warehouseName: input.movement.warehouse_name,
    referenceCode: input.movement.reference_code ?? undefined,
    marketplace: input.movement.marketplace,
    note: input.merged
      ? `Quantidade somada · total ${input.movement.total_quantity} un.`
      : `${movementTypeLabelShort(input.movement.movement_type)} registrada`,
    at: input.movement.created_at,
  });
}

export function recordMovementEdited(input: {
  companyId: string;
  movement: DemoMovementRow;
  actorName: string;
  note?: string;
}): void {
  appendMovementHistoryRecord(input.companyId, {
    movementType: movementTypeFromRow(input.movement),
    actionKind: 'edited',
    actorName: input.actorName,
    source: 'movements_page',
    movementId: input.movement.id,
    sku: input.movement.sku,
    productName: input.movement.product_name,
    quantity: input.movement.total_quantity,
    warehouseName: input.movement.warehouse_name,
    referenceCode: input.movement.reference_code ?? undefined,
    note: input.note ?? 'Campos da movimentação alterados',
  });
}

export function recordMovementDeleted(input: {
  companyId: string;
  movement: DemoMovementRow;
  actorName: string;
}): void {
  appendMovementHistoryRecord(input.companyId, {
    movementType: movementTypeFromRow(input.movement),
    actionKind: 'deleted',
    actorName: input.actorName,
    source: 'movements_page',
    movementId: input.movement.id,
    sku: input.movement.sku,
    productName: input.movement.product_name,
    quantity: input.movement.total_quantity,
    warehouseName: input.movement.warehouse_name,
    referenceCode: input.movement.reference_code ?? undefined,
    note: 'Registro removido da lista operacional',
  });
}

export function recordMovementImported(input: {
  companyId: string;
  actorName: string;
  movementType: MovementHistoryType;
  source: 'import_api' | 'import_excel';
  fileName?: string;
  rowsCount?: number;
}): void {
  appendMovementHistoryRecord(input.companyId, {
    movementType: input.movementType,
    actionKind: 'imported',
    actorName: input.actorName,
    source: input.source,
    note: input.fileName
      ? `Importação ${input.fileName}${input.rowsCount != null ? ` · ${input.rowsCount} linha(s)` : ''}`
      : 'Importação em lote',
  });
}

export function recordOverdueFlagged(input: {
  companyId: string;
  sku: string;
  productName: string;
  pendingQuantity: number;
  overdueDays: number;
  entryMovementId?: string;
  registeredByActorName?: string;
  registeredAt?: string;
  referenceCode?: string;
  warehouseName?: string;
}): void {
  appendMovementHistoryRecord(input.companyId, {
    movementType: 'overdue',
    actionKind: 'overdue_flagged',
    actorName: 'Sistema WMS',
    source: 'system',
    movementId: input.entryMovementId,
    sku: input.sku,
    productName: input.productName,
    pendingQuantity: input.pendingQuantity,
    overdueDays: input.overdueDays,
    quantity: input.pendingQuantity,
    registeredByActorName: input.registeredByActorName,
    registeredAt: input.registeredAt,
    referenceCode: input.referenceCode,
    warehouseName: input.warehouseName,
    note: input.registeredByActorName
      ? `Entrada registrada por ${input.registeredByActorName} · ${input.pendingQuantity} un. sem saída há ${input.overdueDays} dia(s)`
      : `${input.pendingQuantity} un. pendentes · ${input.overdueDays} dia(s) de atraso`,
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

export function resolveMovementHistoryPeriod(
  filters: MovementHistoryFilters,
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
    case 'last60': {
      const from = new Date(now);
      from.setDate(from.getDate() - 59);
      return { from: startOfDay(from), to };
    }
    case 'last90': {
      const from = new Date(now);
      from.setDate(from.getDate() - 89);
      return { from: startOfDay(from), to };
    }
    case 'last120': {
      const from = new Date(now);
      from.setDate(from.getDate() - 119);
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

export function filterMovementHistory(
  records: MovementHistoryRecord[],
  filters: MovementHistoryFilters,
  now = new Date(),
): MovementHistoryRecord[] {
  const { from, to } = resolveMovementHistoryPeriod(filters, now);
  const actorQ = filters.actorName?.trim().toLowerCase();
  const searchQ = filters.search?.trim().toLowerCase();

  return records.filter((row) => {
    const t = new Date(row.at).getTime();
    if (from && t < from.getTime()) return false;
    if (t > to.getTime()) return false;
    if (filters.movementType && filters.movementType !== 'all' && row.movementType !== filters.movementType) {
      return false;
    }
    if (filters.actionKind && filters.actionKind !== 'all' && row.actionKind !== filters.actionKind) {
      return false;
    }
    if (actorQ && !row.actorName.toLowerCase().includes(actorQ)) return false;
    if (!searchQ) return true;
    const hay = [
      row.productName,
      row.sku,
      row.referenceCode,
      row.note,
      row.actorName,
      row.registeredByActorName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(searchQ);
  });
}

export function listMovementHistoryActors(records: MovementHistoryRecord[]): string[] {
  const names = new Set<string>();
  for (const row of records) {
    if (row.actorName) names.add(row.actorName);
    if (row.registeredByActorName) names.add(row.registeredByActorName);
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function listWorkersOnDay(records: MovementHistoryRecord[], dayKey: string): string[] {
  const names = new Set<string>();
  for (const row of records) {
    if (row.dayKey === dayKey) names.add(row.actorName);
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function movementTypeLabelShort(type: string): string {
  if (type === 'entry') return 'Entrada';
  if (type === 'exit') return 'Saída';
  if (type === 'transfer') return 'Transferência';
  if (type === 'damage') return 'Avaria';
  if (type === 'return') return 'Devolução';
  return 'Movimentação';
}

export function movementHistoryTypeLabel(type: MovementHistoryType): string {
  if (type === 'overdue') return 'Atraso';
  return movementTypeLabelShort(type);
}

export function movementHistoryActionLabel(action: MovementHistoryAction): string {
  switch (action) {
    case 'registered':
      return 'Registrado';
    case 'merged':
      return 'Quantidade somada';
    case 'edited':
      return 'Editado';
    case 'deleted':
      return 'Excluído';
    case 'imported':
      return 'Importação';
    case 'overdue_flagged':
      return 'Atraso detectado';
    default:
      return action;
  }
}

export function formatMovementHistoryDetail(row: MovementHistoryRecord): string {
  if (row.actionKind === 'overdue_flagged') {
    const who = row.registeredByActorName ? ` · entrada por ${row.registeredByActorName}` : '';
    const when = row.registeredAt
      ? ` em ${new Date(row.registeredAt).toLocaleDateString('pt-BR')}`
      : '';
    return `${row.pendingQuantity ?? row.quantity ?? 0} un. pendentes · ${row.overdueDays ?? 0} dia(s)${who}${when}`;
  }
  const parts = [row.note, row.referenceCode ? `Ref. ${row.referenceCode}` : null].filter(Boolean);
  return parts.join(' · ') || '—';
}

export function movementHistoryDetailUrl(row: MovementHistoryRecord): string | null {
  if (row.movementId && row.actionKind !== 'deleted') {
    return `/app/movements/${row.movementId}`;
  }
  return null;
}

export function ensureMovementHistoryDemoSeed(companyId: string | null): void {
  if (!companyId || !isLogstokaDemoCompany(companyId)) return;
  if (loadMovementHistory(companyId).length > 0) return;

  const records: MovementHistoryRecord[] = [];

  DEMO_MOVEMENTS.forEach((mov, index) => {
    const actor = DEMO_ACTORS[index % DEMO_ACTORS.length]!;
    records.push({
      id: newId('mvh-seed'),
      companyId,
      at: mov.created_at,
      dayKey: dayKeyFromIso(mov.created_at),
      movementType: movementTypeFromRow(mov),
      actionKind: 'registered',
      actorName: actor,
      source: mov.sub_type === 'xml' ? 'import_api' : index % 5 === 0 ? 'import_excel' : 'movements_page',
      movementId: mov.id,
      sku: mov.sku,
      productName: mov.product_name,
      quantity: mov.total_quantity,
      warehouseName: mov.warehouse_name,
      referenceCode: mov.reference_code ?? undefined,
      marketplace: mov.marketplace,
      note:
        mov.sub_type === 'xml'
          ? 'Entrada via NF-e / XML'
          : `${movementTypeLabelShort(mov.movement_type)} · ${mov.reference_code ?? 'manual'}`,
    });
  });

  const entryActorByMovementId = new Map(records.filter((r) => r.movementType === 'entry').map((r) => [r.movementId!, r.actorName]));

  for (const item of computeMovementOverdue(DEMO_MOVEMENTS)) {
    const entryId = item.entryMovementIds[0];
    const registeredBy = entryId ? entryActorByMovementId.get(entryId) : undefined;
    const entryRecord = records.find((r) => r.movementId === entryId);
    records.push({
      id: newId('mvh-seed'),
      companyId,
      at: new Date().toISOString(),
      dayKey: dayKeyFromIso(new Date().toISOString()),
      movementType: 'overdue',
      actionKind: 'overdue_flagged',
      actorName: 'Sistema WMS',
      source: 'system',
      movementId: entryId,
      sku: item.sku,
      productName: item.productName,
      quantity: item.pendingQuantity,
      pendingQuantity: item.pendingQuantity,
      overdueDays: item.daysOverdue,
      warehouseName: item.warehouseName,
      referenceCode: item.referenceCode,
      registeredByActorName: registeredBy,
      registeredAt: entryRecord?.at,
      note: registeredBy
        ? `${item.productName}: registrado por ${registeredBy} · ${item.pendingQuantity} un. sem saída (${item.daysOverdue} dia(s))`
        : `${item.pendingQuantity} un. sem saída · ${item.daysOverdue} dia(s)`,
    });
  }

  records.push({
    id: newId('mvh-seed'),
    companyId,
    at: new Date(Date.now() - 86400000).toISOString(),
    dayKey: dayKeyFromIso(new Date(Date.now() - 86400000).toISOString()),
    movementType: 'entry',
    actionKind: 'imported',
    actorName: 'Maria Costa',
    source: 'import_excel',
    note: 'Planilha recebimento_fornecedor.xlsx · 24 linhas (modo Excel — sem API)',
  });

  saveMovementHistory(companyId, records.sort((a, b) => b.at.localeCompare(a.at)));
}

export const MOVEMENT_HISTORY_TAB_LABELS: Record<MovementHistoryType | 'all', string> = {
  all: 'Todas',
  entry: 'Entradas',
  exit: 'Saídas',
  overdue: 'Atrasos',
  transfer: 'Transferências',
  damage: 'Avarias',
  return: 'Devoluções',
};

import type { DemoMovementRow } from '@/lib/logstokaDemoSeed';

export type MovementOverdueItem = {
  sku: string;
  productName: string;
  entryDate: string;
  entryQuantity: number;
  exitedQuantity: number;
  pendingQuantity: number;
  daysOverdue: number;
  warehouseName?: string;
  referenceCode?: string;
  entryMovementIds: string[];
};

function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfLocalDay(ref = new Date()): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
}

function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetweenLocalDates(fromKey: string, toDate = new Date()): number {
  const from = parseLocalDateKey(fromKey);
  const to = startOfLocalDay(toDate);
  const diff = to.getTime() - from.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

export function isSameLocalDay(iso: string, ref = new Date()): boolean {
  return toLocalDateKey(iso) === toLocalDateKey(ref.toISOString());
}

/**
 * Entrada sem saída correspondente após o fim do dia da entrada → atraso.
 * Conta saídas do mesmo SKU na data da entrada ou depois (FIFO simplificado por SKU).
 */
export function computeMovementOverdue(movements: DemoMovementRow[], now = new Date()): MovementOverdueItem[] {
  const entries = movements.filter((m) => m.movement_type === 'entry' && m.sku);
  const exits = movements.filter((m) => m.movement_type === 'exit' && m.sku);

  const entryGroups = new Map<
    string,
    {
      sku: string;
      productName: string;
      entryDate: string;
      entryQuantity: number;
      warehouseName?: string;
      referenceCode?: string;
      entryMovementIds: string[];
    }
  >();

  for (const entry of entries) {
    const sku = entry.sku!;
    const entryDate = toLocalDateKey(entry.created_at);
    const key = `${sku}::${entryDate}`;
    const prev = entryGroups.get(key);
    if (prev) {
      prev.entryQuantity += entry.total_quantity;
      prev.entryMovementIds.push(entry.id);
      if (!prev.referenceCode && entry.reference_code) prev.referenceCode = entry.reference_code;
    } else {
      entryGroups.set(key, {
        sku,
        productName: entry.product_name ?? sku,
        entryDate,
        entryQuantity: entry.total_quantity,
        warehouseName: entry.warehouse_name,
        referenceCode: entry.reference_code ?? undefined,
        entryMovementIds: [entry.id],
      });
    }
  }

  const overdue: MovementOverdueItem[] = [];

  for (const group of entryGroups.values()) {
    const daysSinceEntry = daysBetweenLocalDates(group.entryDate, now);
    if (daysSinceEntry < 1) continue;

    const entryDayStart = parseLocalDateKey(group.entryDate).getTime();
    const exitedQuantity = exits
      .filter((ex) => {
        if (ex.sku !== group.sku) return false;
        return parseLocalDateKey(toLocalDateKey(ex.created_at)).getTime() >= entryDayStart;
      })
      .reduce((sum, ex) => sum + ex.total_quantity, 0);

    const pendingQuantity = Math.max(0, group.entryQuantity - exitedQuantity);
    if (pendingQuantity <= 0) continue;

    overdue.push({
      sku: group.sku,
      productName: group.productName,
      entryDate: group.entryDate,
      entryQuantity: group.entryQuantity,
      exitedQuantity,
      pendingQuantity,
      daysOverdue: daysSinceEntry,
      warehouseName: group.warehouseName,
      referenceCode: group.referenceCode,
      entryMovementIds: group.entryMovementIds,
    });
  }

  return overdue.sort((a, b) => b.daysOverdue - a.daysOverdue || a.sku.localeCompare(b.sku));
}

export function getMaxOverdueDaysBySku(movements: DemoMovementRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of computeMovementOverdue(movements)) {
    const prev = map.get(item.sku) ?? 0;
    if (item.daysOverdue > prev) map.set(item.sku, item.daysOverdue);
  }
  return map;
}

export function formatOverdueLabel(days: number): string {
  if (days <= 0) return '';
  if (days === 1) return 'Atrasado 1 dia';
  return `Atrasado ${days} dias`;
}

import type { OperationalOrder } from '@/lib/operationalFlow';
import type { GuidedOperationItem } from '@/lib/guidedOperationItem';

export type DivergenceReason =
  | 'not_found'
  | 'wrong_qty'
  | 'damaged'
  | 'swapped'
  | 'other';

export type ConferenceDivergence = {
  id: string;
  companyId: string;
  context: 'operation' | 'inventory';
  orderId: string;
  orderRef: string;
  productName: string;
  quantity: number;
  marketplaceLabel: string;
  sku?: string;
  inventoryId?: string;
  reason: DivergenceReason;
  note?: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
};

export const DIVERGENCE_REASON_LABELS: Record<DivergenceReason, string> = {
  not_found: 'Produto não encontrado',
  wrong_qty: 'Quantidade incorreta',
  damaged: 'Produto danificado',
  swapped: 'Produto trocado',
  other: 'Outro',
};

const STORAGE_PREFIX = 'logstoka-conference-divergences';

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}:${companyId}`;
}

export function loadConferenceDivergences(companyId: string | null): ConferenceDivergence[] {
  if (!companyId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    return JSON.parse(raw) as ConferenceDivergence[];
  } catch {
    return [];
  }
}

export function saveConferenceDivergences(companyId: string, items: ConferenceDivergence[]): void {
  try {
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function addConferenceDivergence(
  companyId: string,
  order: OperationalOrder,
  reason: DivergenceReason,
  note?: string,
): ConferenceDivergence {
  return addGuidedDivergence(
    companyId,
    {
      id: order.id,
      context: 'operation',
      productName: order.productName,
      quantity: order.quantity,
      quantityLabel: `${order.quantity} un.`,
      subtitle: `Pedido ${order.orderRef}`,
      locationLabel: '',
      voiceText: '',
      orderRef: order.orderRef,
      marketplaceLabel: order.marketplaceLabel,
    },
    reason,
    note,
  );
}

export function addGuidedDivergence(
  companyId: string,
  item: GuidedOperationItem,
  reason: DivergenceReason,
  note?: string,
): ConferenceDivergence {
  const entry: ConferenceDivergence = {
    id: `div-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    companyId,
    context: item.context,
    orderId: item.id,
    orderRef: item.orderRef ?? item.sku ?? item.subtitle,
    productName: item.productName,
    quantity: item.quantity,
    marketplaceLabel: item.marketplaceLabel ?? (item.context === 'inventory' ? 'Inventário' : '—'),
    sku: item.sku,
    inventoryId: item.inventoryId,
    reason,
    note,
    createdAt: new Date().toISOString(),
  };
  const list = loadConferenceDivergences(companyId);
  list.unshift(entry);
  saveConferenceDivergences(companyId, list);
  return entry;
}

export function resolveConferenceDivergence(companyId: string, id: string, resolutionNote?: string): void {
  const list = loadConferenceDivergences(companyId).map((item) =>
    item.id === id
      ? { ...item, resolvedAt: new Date().toISOString(), resolutionNote: resolutionNote?.trim() || item.resolutionNote }
      : item,
  );
  saveConferenceDivergences(companyId, list);
}

export function updateConferenceDivergence(
  companyId: string,
  id: string,
  patch: Partial<Pick<ConferenceDivergence, 'productName' | 'orderRef' | 'sku' | 'reason' | 'note' | 'marketplaceLabel'>>,
): void {
  const list = loadConferenceDivergences(companyId).map((item) =>
    item.id === id ? { ...item, ...patch } : item,
  );
  saveConferenceDivergences(companyId, list);
}

export function deleteConferenceDivergence(companyId: string, id: string): void {
  const list = loadConferenceDivergences(companyId).filter((item) => item.id !== id);
  saveConferenceDivergences(companyId, list);
}

export function countPendingDivergences(companyId: string | null): number {
  return loadConferenceDivergences(companyId).filter((d) => !d.resolvedAt).length;
}

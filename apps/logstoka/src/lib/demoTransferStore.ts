import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  DEMO_TRANSFERS,
  type DemoTransferRow,
  type TransferReceiveApproval,
  type TransferReleaseApproval,
} from '@/lib/logstokaDemoSeed';
import { loadMergedDemoWarehouses } from '@/lib/demoWarehouseStore';

const STORAGE_PREFIX = 'logstoka-demo-transfers:';

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}${companyId}`;
}

function readExtra(companyId: string): DemoTransferRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    return raw ? (JSON.parse(raw) as DemoTransferRow[]) : [];
  } catch {
    return [];
  }
}

function writeExtra(companyId: string, rows: DemoTransferRow[]): void {
  try {
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent('logstoka:demo-transfers-updated'));
    window.dispatchEvent(new CustomEvent('logstoka:system-pulse'));
  } catch {
    /* ignore */
  }
}

export function loadMergedDemoTransfers(companyId: string | null): DemoTransferRow[] {
  const base = companyId && isLogstokaDemoCompany(companyId) ? [...DEMO_TRANSFERS] : [];
  if (!companyId || typeof window === 'undefined') return base;
  const extra = readExtra(companyId);
  const byId = new Map<string, DemoTransferRow>();
  for (const row of base) byId.set(row.id, row);
  for (const row of extra) byId.set(row.id, row);
  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function getMergedDemoTransfer(companyId: string | null, transferId: string): DemoTransferRow | null {
  return loadMergedDemoTransfers(companyId).find((row) => row.id === transferId) ?? null;
}

export type DemoTransferDraft = {
  origin_warehouse_id: string;
  destination_warehouse_id: string;
  sku: string;
  product_name: string;
  quantity: number;
  notes?: string;
  release_approval: TransferReleaseApproval;
};

export function appendDemoTransfer(companyId: string, draft: DemoTransferDraft): DemoTransferRow {
  const warehouses = loadMergedDemoWarehouses(companyId);
  const origin = warehouses.find((w) => w.id === draft.origin_warehouse_id);
  const destination = warehouses.find((w) => w.id === draft.destination_warehouse_id);
  const row: DemoTransferRow = {
    id: `tr-demo-${Date.now()}`,
    status: 'pending',
    notes: draft.notes?.trim() || `Transferência ${origin?.name ?? 'origem'} → ${destination?.name ?? 'destino'}`,
    created_at: new Date().toISOString(),
    origin_warehouse_id: draft.origin_warehouse_id,
    destination_warehouse_id: draft.destination_warehouse_id,
    origin_name: origin?.name ?? 'Origem',
    destination_name: destination?.name ?? 'Destino',
    items: [{ sku: draft.sku, name: draft.product_name, quantity: draft.quantity }],
    release_approval: draft.release_approval,
  };
  writeExtra(companyId, [row, ...readExtra(companyId)]);
  return row;
}

function patchTransferInStorage(
  companyId: string,
  transferId: string,
  patch: Partial<DemoTransferRow>,
): DemoTransferRow | null {
  const extra = readExtra(companyId);
  const index = extra.findIndex((row) => row.id === transferId);
  if (index >= 0) {
    const updated = { ...extra[index], ...patch };
    extra[index] = updated;
    writeExtra(companyId, extra);
    return updated;
  }

  const base = DEMO_TRANSFERS.find((row) => row.id === transferId);
  if (!base) return null;
  const cloned: DemoTransferRow = { ...base, ...patch, id: transferId };
  writeExtra(companyId, [cloned, ...extra.filter((row) => row.id !== transferId)]);
  return cloned;
}

export function shipDemoTransfer(companyId: string, transferId: string): DemoTransferRow | null {
  return patchTransferInStorage(companyId, transferId, { status: 'in_transit' });
}

export function receiveDemoTransfer(
  companyId: string,
  transferId: string,
  receiveApproval: TransferReceiveApproval,
): DemoTransferRow | null {
  return patchTransferInStorage(companyId, transferId, {
    status: 'completed',
    receive_approval: receiveApproval,
  });
}

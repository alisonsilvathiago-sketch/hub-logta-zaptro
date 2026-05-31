import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_DRIVER_GATES, type DemoDriverGateRecord } from '@/lib/logstokaDemoSeed';
import { loadMergedDemoWarehouses } from '@/lib/demoWarehouseStore';

const STORAGE_PREFIX = 'logstoka-demo-driver-gates:';

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}${companyId}`;
}

function readExtra(companyId: string): DemoDriverGateRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    return raw ? (JSON.parse(raw) as DemoDriverGateRecord[]) : [];
  } catch {
    return [];
  }
}

function writeExtra(companyId: string, rows: DemoDriverGateRecord[]): void {
  try {
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent('logstoka:demo-driver-gates-updated'));
    window.dispatchEvent(new CustomEvent('logstoka:system-pulse'));
  } catch {
    /* ignore */
  }
}

export function loadMergedDriverGates(companyId: string | null): DemoDriverGateRecord[] {
  const base = companyId && isLogstokaDemoCompany(companyId) ? [...DEMO_DRIVER_GATES] : [];
  if (!companyId || typeof window === 'undefined') return base;
  const extra = readExtra(companyId);
  return [...extra, ...base].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function getDriverGateById(companyId: string | null, id: string): DemoDriverGateRecord | null {
  return loadMergedDriverGates(companyId).find((r) => r.id === id) ?? null;
}

export type DriverGateDraft = {
  direction: DemoDriverGateRecord['direction'];
  warehouse_id: string;
  driver_id: string;
  driver_name: string;
  driver_cpf: string;
  company_name: string;
  company_cnpj: string;
  vehicle_plate: string;
  product_description?: string;
  destination?: string;
  signature_data_url: string;
  signed_at: string;
  registered_by_name: string;
  notes?: string;
};

export function appendDriverGate(companyId: string, draft: DriverGateDraft): DemoDriverGateRecord {
  const warehouses = loadMergedDemoWarehouses(companyId);
  const wh = warehouses.find((w) => w.id === draft.warehouse_id);
  const row: DemoDriverGateRecord = {
    id: `gate-${Date.now()}`,
    direction: draft.direction,
    warehouse_id: draft.warehouse_id,
    warehouse_name: wh?.name ?? 'CD',
    driver_id: draft.driver_id,
    driver_name: draft.driver_name,
    driver_cpf: draft.driver_cpf,
    company_name: draft.company_name,
    company_cnpj: draft.company_cnpj,
    vehicle_plate: draft.vehicle_plate.toUpperCase(),
    product_description: draft.product_description?.trim() || null,
    destination: draft.destination?.trim() || null,
    signature_data_url: draft.signature_data_url,
    signed_at: draft.signed_at,
    registered_by_name: draft.registered_by_name,
    notes: draft.notes?.trim() || null,
    created_at: new Date().toISOString(),
  };
  writeExtra(companyId, [row, ...readExtra(companyId)]);
  return row;
}

export function filterDriverGates(
  rows: DemoDriverGateRecord[],
  opts: {
    direction?: DemoDriverGateRecord['direction'] | 'all';
    warehouseId?: string;
    query?: string;
    period?: DriverGatePeriod;
    customFrom?: string;
    customTo?: string;
  },
): DemoDriverGateRecord[] {
  const q = opts.query?.trim().toLowerCase() ?? '';
  const periodFiltered = filterDriverGatesByPeriod(rows, opts.period ?? 'all', opts.customFrom, opts.customTo);
  return periodFiltered.filter((row) => {
    if (opts.direction && opts.direction !== 'all' && row.direction !== opts.direction) return false;
    if (opts.warehouseId && row.warehouse_id !== opts.warehouseId) return false;
    if (!q) return true;
    return [
      row.driver_name,
      row.driver_cpf,
      row.company_name,
      row.company_cnpj,
      row.vehicle_plate,
      row.product_description,
      row.destination,
      row.warehouse_name,
    ]
      .filter(Boolean)
      .some((part) => String(part).toLowerCase().includes(q));
  });
}

export type DriverGatePeriod =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'month'
  | 'year'
  | 'all'
  | 'custom';

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function filterDriverGatesByPeriod(
  rows: DemoDriverGateRecord[],
  period: DriverGatePeriod,
  customFrom?: string,
  customTo?: string,
): DemoDriverGateRecord[] {
  if (period === 'all') return rows;
  const now = new Date();
  const todayStart = startOfDay(now);
  let from = todayStart;
  let to = new Date(todayStart);
  to.setDate(to.getDate() + 1);

  if (period === 'yesterday') {
    from = new Date(todayStart);
    from.setDate(from.getDate() - 1);
    to = todayStart;
  } else if (period === 'last7') {
    from = new Date(todayStart);
    from.setDate(from.getDate() - 6);
  } else if (period === 'last30') {
    from = new Date(todayStart);
    from.setDate(from.getDate() - 29);
  } else if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'year') {
    from = new Date(now.getFullYear(), 0, 1);
  } else if (period === 'custom' && customFrom) {
    from = startOfDay(new Date(customFrom));
    to = customTo ? startOfDay(new Date(customTo)) : to;
    to.setDate(to.getDate() + 1);
  }

  return rows.filter((row) => {
    const t = new Date(row.created_at).getTime();
    return t >= from.getTime() && t < to.getTime();
  });
}

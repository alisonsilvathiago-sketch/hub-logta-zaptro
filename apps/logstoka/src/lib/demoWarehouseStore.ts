import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_WAREHOUSES } from '@/lib/logstokaDemoSeed';
import type { LsWarehouse, WarehouseManagerRole } from '@/types';

const STORAGE_PREFIX = 'logstoka-demo-warehouses:';

export type WarehouseDraft = {
  name: string;
  code: string;
  type: LsWarehouse['type'];
  marketplace?: LsWarehouse['marketplace'];
  address_line?: string;
  city?: string;
  state?: string;
  manager_name?: string;
  manager_role?: WarehouseManagerRole;
  manager_email?: string;
  manager_phone?: string;
  is_active?: boolean;
};

type StoredPatch = Partial<LsWarehouse> & { id: string };

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}${companyId}`;
}

function readPatches(companyId: string): StoredPatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    return raw ? (JSON.parse(raw) as StoredPatch[]) : [];
  } catch {
    return [];
  }
}

function writePatches(companyId: string, rows: StoredPatch[]): void {
  try {
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent('logstoka:demo-warehouses-updated'));
    window.dispatchEvent(new CustomEvent('logstoka:system-pulse'));
  } catch {
    /* ignore */
  }
}

function mergeWarehouse(base: LsWarehouse, patches: StoredPatch[]): LsWarehouse {
  const patch = patches.find((row) => row.id === base.id);
  return patch ? { ...base, ...patch } : base;
}

export function loadMergedDemoWarehouses(companyId: string | null): LsWarehouse[] {
  const base = companyId && isLogstokaDemoCompany(companyId) ? [...DEMO_WAREHOUSES] : [];
  if (!companyId || typeof window === 'undefined') return base;
  const patches = readPatches(companyId);
  const merged = base.map((warehouse) => mergeWarehouse(warehouse, patches));
  const extra = patches
    .filter((patch) => !base.some((warehouse) => warehouse.id === patch.id))
    .map((patch) => ({
      company_id: companyId,
      code: patch.code ?? 'CD-NEW',
      name: patch.name ?? 'Novo CD',
      type: patch.type ?? 'physical',
      marketplace: patch.marketplace ?? null,
      is_active: patch.is_active ?? true,
      address_line: patch.address_line ?? null,
      city: patch.city ?? null,
      state: patch.state ?? null,
      manager_name: patch.manager_name ?? null,
      manager_role: patch.manager_role ?? null,
      manager_email: patch.manager_email ?? null,
      manager_phone: patch.manager_phone ?? null,
      ...patch,
    })) as LsWarehouse[];
  return [...extra, ...merged].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function getDemoWarehouseById(companyId: string | null, id: string): LsWarehouse | null {
  return loadMergedDemoWarehouses(companyId).find((warehouse) => warehouse.id === id) ?? null;
}

export function upsertDemoWarehouse(companyId: string, draft: WarehouseDraft, id?: string): LsWarehouse {
  const patches = readPatches(companyId);
  const warehouseId = id ?? `wh-custom-${Date.now()}`;
  const row: StoredPatch = {
    id: warehouseId,
    company_id: companyId,
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    type: draft.type,
    marketplace: draft.marketplace ?? null,
    is_active: draft.is_active ?? true,
    address_line: draft.address_line?.trim() || null,
    city: draft.city?.trim() || null,
    state: draft.state?.trim().toUpperCase() || null,
    manager_name: draft.manager_name?.trim() || null,
    manager_role: draft.manager_role ?? null,
    manager_email: draft.manager_email?.trim() || null,
    manager_phone: draft.manager_phone?.trim() || null,
  };
  const next = [row, ...patches.filter((patch) => patch.id !== warehouseId)];
  writePatches(companyId, next);
  return getDemoWarehouseById(companyId, warehouseId)!;
}

export function patchDemoWarehouse(companyId: string, id: string, patch: Partial<LsWarehouse>): LsWarehouse | null {
  const patches = readPatches(companyId);
  const existing = loadMergedDemoWarehouses(companyId).find((warehouse) => warehouse.id === id);
  if (!existing) return null;
  const row: StoredPatch = { id, ...patch };
  const next = [row, ...patches.filter((item) => item.id !== id)];
  writePatches(companyId, next);
  return getDemoWarehouseById(companyId, id);
}

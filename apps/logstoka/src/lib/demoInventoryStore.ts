import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_INVENTORIES, type DemoInventoryRow } from '@/lib/logstokaDemoSeed';

const STORAGE_PREFIX = 'logstoka-demo-inventory-patches:';

type InventoryItemPatch = {
  inventoryId: string;
  itemId: string;
  counted_quantity: number;
  difference: number;
  actor_name?: string;
  actor_id?: string;
  counted_at?: string;
};

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}${companyId}`;
}

function readPatches(companyId: string): InventoryItemPatch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    return raw ? (JSON.parse(raw) as InventoryItemPatch[]) : [];
  } catch {
    return [];
  }
}

function writePatches(companyId: string, patches: InventoryItemPatch[]): void {
  try {
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(patches));
    window.dispatchEvent(new CustomEvent('logstoka:demo-inventories-updated'));
  } catch {
    /* ignore */
  }
}

function applyPatches(inventories: DemoInventoryRow[], patches: InventoryItemPatch[]): DemoInventoryRow[] {
  if (patches.length === 0) return inventories;
  return inventories.map((inv) => {
    const invPatches = patches.filter((patch) => patch.inventoryId === inv.id);
    if (invPatches.length === 0) return inv;
    return {
      ...inv,
      ls_inventory_items: inv.ls_inventory_items.map((item) => {
        const patch = invPatches.find((row) => row.itemId === item.id);
        if (!patch) return item;
        return {
          ...item,
          counted_quantity: patch.counted_quantity,
          difference: patch.difference,
          last_actor_name: patch.actor_name ?? null,
          last_counted_at: patch.counted_at ?? null,
        };
      }),
    };
  });
}

export function loadMergedDemoInventories(companyId: string | null): DemoInventoryRow[] {
  const base = companyId && isLogstokaDemoCompany(companyId) ? [...DEMO_INVENTORIES] : [];
  if (!companyId || typeof window === 'undefined') return base;
  return applyPatches(base, readPatches(companyId));
}

export function getDemoInventoryById(companyId: string | null, id: string): DemoInventoryRow | null {
  return loadMergedDemoInventories(companyId).find((inv) => inv.id === id) ?? null;
}

export function updateDemoInventoryItemCount(
  companyId: string,
  inventoryId: string,
  itemId: string,
  counted: number,
  systemQuantity: number,
  actor?: { name: string; id?: string },
): void {
  const difference = counted - systemQuantity;
  const patches = readPatches(companyId).filter(
    (patch) => !(patch.inventoryId === inventoryId && patch.itemId === itemId),
  );
  writePatches(companyId, [
    ...patches,
    {
      inventoryId,
      itemId,
      counted_quantity: counted,
      difference,
      actor_name: actor?.name,
      actor_id: actor?.id,
      counted_at: new Date().toISOString(),
    },
  ]);
}

export function getInventoryItemPatch(
  companyId: string | null,
  inventoryId: string,
  itemId: string,
): InventoryItemPatch | null {
  if (!companyId) return null;
  return readPatches(companyId).find((patch) => patch.inventoryId === inventoryId && patch.itemId === itemId) ?? null;
}

export function mapSupabaseInventoryRow(raw: Record<string, unknown>): DemoInventoryRow {
  const warehouse = raw.ls_warehouses as { name?: string } | null | undefined;
  const items = (raw.ls_inventory_items as Array<Record<string, unknown>> | undefined) ?? [];
  return {
    id: String(raw.id),
    inventory_type: String(raw.inventory_type ?? 'rotating'),
    status: String(raw.status ?? 'open'),
    created_at: String(raw.created_at ?? new Date().toISOString()),
    warehouse_name: warehouse?.name ?? String(raw.warehouse_name ?? 'Depósito'),
    ls_inventory_items: items.map((item) => {
      const product = item.ls_products as { sku?: string; name?: string } | null | undefined;
      return {
        id: String(item.id),
        product_id: String(item.product_id ?? ''),
        system_quantity: Number(item.system_quantity ?? 0),
        counted_quantity: item.counted_quantity == null ? null : Number(item.counted_quantity),
        difference: item.difference == null ? null : Number(item.difference),
        ls_products: product?.sku
          ? { sku: product.sku, name: product.name ?? product.sku }
          : undefined,
      };
    }),
  };
}

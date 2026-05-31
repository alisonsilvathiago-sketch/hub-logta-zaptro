import { loadStoredActivities, type OperationalActivityEvent } from '@/lib/operationalActivityLog';
import type { DemoInventoryRow } from '@/lib/logstokaDemoSeed';
import type { InventoryConferenceItem } from '@/modules/inventory/InventoryItemConferenceModal';
import type { Profile } from '@/types';

export function getActivityActor(profile: Profile | null | undefined): { name: string; id?: string } {
  return {
    name: profile?.full_name?.trim() || profile?.email || 'Colaborador',
    id: profile?.id,
  };
}

export function buildInventoryConferenceItem(
  inventory: DemoInventoryRow,
  item: DemoInventoryRow['ls_inventory_items'][number],
): InventoryConferenceItem {
  return {
    itemId: item.id,
    sku: item.ls_products?.sku ?? '—',
    productName: item.ls_products?.name ?? 'Produto',
    productId: item.product_id,
    warehouseName: inventory.warehouse_name,
    inventoryId: inventory.id,
    systemQuantity: Number(item.system_quantity),
    countedQuantity: item.counted_quantity == null ? null : Number(item.counted_quantity),
    lastActorName: item.last_actor_name ?? null,
    lastCountedAt: item.last_counted_at ?? null,
  };
}

export function filterInventoryAuditEvents(
  companyId: string | null,
  inventoryId?: string,
  sku?: string,
): OperationalActivityEvent[] {
  return loadStoredActivities(companyId).filter((event) => {
    if (event.domain !== 'inventory') return false;
    if (inventoryId && event.entityId === inventoryId) return true;
    if (sku && event.productSku === sku) return true;
    return false;
  });
}

export function formatInventoryAuditRows(events: OperationalActivityEvent[]) {
  return events.slice(0, 12).map((event) => ({
    id: event.id,
    time: event.time,
    actorName: event.actorName,
    description: event.description,
    result: event.result,
    status: event.status,
  }));
}

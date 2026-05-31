import { DEMO_MOVEMENTS, DEMO_STOCK, DEMO_TRANSFERS } from '@/lib/logstokaDemoSeed';
import type { DemoMovementRow } from '@/lib/logstokaDemoSeed';
import type { LsWarehouse } from '@/types';

export function stockStatsForWarehouse(warehouseId: string): { units: number; skus: number; products: number } {
  const rows = DEMO_STOCK.filter((row) => row.warehouse_id === warehouseId);
  const skus = new Set(rows.map((row) => row.product_id)).size;
  const units = rows.reduce((sum, row) => sum + row.quantity, 0);
  return { units, skus, products: skus };
}

export function movementsForWarehouse(warehouseId: string): DemoMovementRow[] {
  return DEMO_MOVEMENTS.filter((movement) => movement.warehouse_id === warehouseId).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function transfersForWarehouse(warehouseId: string) {
  return DEMO_TRANSFERS.filter(
    (transfer) =>
      transfer.origin_warehouse_id === warehouseId || transfer.destination_warehouse_id === warehouseId,
  );
}

export function warehouseDayStats(warehouseId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const movements = movementsForWarehouse(warehouseId).filter(
    (movement) => new Date(movement.created_at) >= today,
  );
  const entries = movements.filter((movement) => movement.movement_type === 'entry').length;
  const exits = movements.filter((movement) => movement.movement_type === 'exit').length;
  const transfers = transfersForWarehouse(warehouseId).filter(
    (transfer) => new Date(transfer.created_at) >= today,
  ).length;
  return { entries, exits, transfers, movementCount: movements.length };
}

export function filterWarehouses(
  warehouses: LsWarehouse[],
  query: string,
  typeFilter: 'all' | LsWarehouse['type'],
): LsWarehouse[] {
  const q = query.trim().toLowerCase();
  return warehouses.filter((warehouse) => {
    if (typeFilter !== 'all' && warehouse.type !== typeFilter) return false;
    if (!q) return true;
    const haystack = [
      warehouse.name,
      warehouse.code,
      warehouse.city,
      warehouse.state,
      warehouse.manager_name,
      warehouse.manager_email,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function warehouseLocationLabel(warehouse: LsWarehouse): string {
  if (warehouse.city && warehouse.state) return `${warehouse.city} · ${warehouse.state}`;
  if (warehouse.city) return warehouse.city;
  return 'Local não informado';
}

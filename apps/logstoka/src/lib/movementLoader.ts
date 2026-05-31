import {
  appendDemoMovements,
  loadMergedDemoMovements,
} from '@/lib/demoMovementStore';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { logstokaApi } from '@/lib/logstokaApi';
import type { DemoMovementRow } from '@/lib/logstokaDemoSeed';
import { supabase } from '@/lib/supabase';
import type { MovementType } from '@/types';

export { loadMergedDemoMovements };

function sortMovements(rows: DemoMovementRow[]): DemoMovementRow[] {
  return [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function mergeById(primary: DemoMovementRow[], secondary: DemoMovementRow[]): DemoMovementRow[] {
  const map = new Map<string, DemoMovementRow>();
  for (const row of [...secondary, ...primary]) {
    map.set(row.id, row);
  }
  return sortMovements([...map.values()]);
}

export function mapMovementRecord(raw: Record<string, unknown>, companyId: string): DemoMovementRow | null {
  const id = raw.id;
  if (!id) return null;

  const items = (raw.ls_stock_movement_items as Array<Record<string, unknown>> | undefined) ?? [];
  const first = items[0];
  const sku =
    (first?.sku as string | undefined) ??
    ((first?.ls_products as { sku?: string } | null | undefined)?.sku);
  const productName =
    (first?.product_name as string | undefined) ??
    ((first?.ls_products as { name?: string } | null | undefined)?.name) ??
    sku;
  const unitsFromItems = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  const warehouse =
    (raw.ls_warehouses as { name?: string } | null | undefined)?.name ??
    (raw.warehouse_name as string | undefined);

  return {
    id: String(id),
    company_id: companyId,
    movement_type: (raw.movement_type as MovementType) ?? 'entry',
    sub_type: (raw.sub_type as string) ?? 'manual',
    status: (raw.status as string) ?? 'completed',
    warehouse_id: (raw.warehouse_id as string) ?? 'wh-1',
    marketplace: (raw.marketplace as DemoMovementRow['marketplace']) ?? null,
    reference_code: (raw.reference_code as string | null) ?? null,
    total_quantity: Number(raw.total_quantity ?? unitsFromItems) || unitsFromItems,
    created_at: (raw.created_at as string) ?? new Date().toISOString(),
    sku,
    product_name: productName,
    warehouse_name: warehouse ?? 'CD Principal',
  };
}

async function loadMovementsFromSupabase(companyId: string): Promise<DemoMovementRow[]> {
  const { data, error } = await supabase
    .from('ls_stock_movements')
    .select(
      'id, company_id, movement_type, sub_type, status, warehouse_id, marketplace, reference_code, total_quantity, created_at, ls_warehouses(name), ls_stock_movement_items(sku, quantity, ls_products(sku, name))',
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => mapMovementRecord(row as Record<string, unknown>, companyId))
    .filter((row): row is DemoMovementRow => row != null);
}

async function loadMovementsFromApi(companyId: string): Promise<DemoMovementRow[]> {
  const res = await logstokaApi.getMovements();
  const rows = (res.data ?? [])
    .map((row) => mapMovementRecord(row as Record<string, unknown>, companyId))
    .filter((row): row is DemoMovementRow => row != null);
  return rows;
}

/** Carrega movimentações: demo seed + localStorage no demo; API/Supabase + cache local em produção. */
export async function loadCompanyMovements(companyId: string | null): Promise<DemoMovementRow[]> {
  if (!companyId) return [];
  if (isLogstokaDemoCompany(companyId)) {
    return loadMergedDemoMovements(companyId);
  }

  const localOnly = loadMergedDemoMovements(companyId);

  try {
    const apiRows = await loadMovementsFromApi(companyId);
    return mergeById(apiRows, localOnly);
  } catch {
    try {
      const dbRows = await loadMovementsFromSupabase(companyId);
      return mergeById(dbRows, localOnly);
    } catch {
      return localOnly;
    }
  }
}

export async function findCompanyMovement(
  companyId: string | null,
  movementId: string,
): Promise<DemoMovementRow | null> {
  if (!companyId || !movementId) return null;
  const rows = await loadCompanyMovements(companyId);
  return rows.find((m) => m.id === movementId) ?? null;
}

/** Mantém UI responsiva após entrada/saída antes do próximo fetch. */
export function cacheMovementRow(companyId: string, row: DemoMovementRow): void {
  appendDemoMovements(companyId, [row]);
}

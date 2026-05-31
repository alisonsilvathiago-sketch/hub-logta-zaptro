import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_PICKING, getDemoPickingByKey } from '@/lib/logstokaDemoSeed';
import type { PickRow } from '@/lib/pickingSession';
import { supabase } from '@/lib/supabase';

/** Resolve linha de picking pelo segmento da rota `/app/picking/:key`. */
export async function resolvePickingRowByKey(
  companyId: string | null,
  key: string,
): Promise<PickRow | null> {
  if (!companyId || !key) return null;

  if (isLogstokaDemoCompany(companyId)) {
    return getDemoPickingByKey(key);
  }

  const decoded = decodeURIComponent(key);
  const [sku, marketplace, store] = decoded.split('|');
  if (!sku) return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const res = await supabase
    .from('ls_stock_movements')
    .select('marketplace, reference_code, ls_stock_movement_items(sku, quantity, ls_products(name))')
    .eq('company_id', companyId)
    .eq('movement_type', 'exit')
    .gte('created_at', start.toISOString());

  for (const mov of res.data ?? []) {
    const movement = mov as unknown as {
      marketplace?: string | null;
      reference_code?: string | null;
      ls_stock_movement_items?: Array<{ sku: string; quantity: number; ls_products?: { name?: string } | null }>;
    };
    const mp = movement.marketplace ?? '';
    const st = movement.reference_code ?? '';
    if (mp !== (marketplace ?? '') || st !== (store ?? '')) continue;

    for (const item of movement.ls_stock_movement_items ?? []) {
      if (item.sku !== sku) continue;
      return {
        sku: item.sku,
        name: item.ls_products?.name ?? item.sku,
        marketplace: movement.marketplace,
        store: movement.reference_code,
        quantity: Number(item.quantity),
      };
    }
  }

  return null;
}

export function listDemoPickingRows(companyId: string | null): PickRow[] {
  if (!companyId || !isLogstokaDemoCompany(companyId)) return [];
  return DEMO_PICKING;
}

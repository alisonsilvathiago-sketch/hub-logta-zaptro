import type { SupabaseClient } from '@supabase/supabase-js';
import type { AiIntent } from './intentRouter.js';

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export async function fetchDailySummary(admin: SupabaseClient, companyId: string) {
  const since = startOfToday();
  const { data: movements } = await admin
    .from('ls_stock_movements')
    .select('movement_type')
    .eq('company_id', companyId)
    .gte('created_at', since);

  const counts = { entries: 0, exits: 0, transfers: 0, returns: 0, damages: 0 };
  for (const row of movements ?? []) {
    const t = row.movement_type as keyof typeof counts;
    if (t in counts) counts[t] += 1;
  }

  const { count: returnsToday } = await admin
    .from('ls_returns')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('created_at', since);

  const { count: lowStock } = await admin
    .from('ls_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('alert_type', 'low_stock')
    .eq('status', 'open');

  return { period: 'hoje', ...counts, returns_registered: returnsToday ?? 0, low_stock_alerts: lowStock ?? 0 };
}

export async function fetchStockContext(
  admin: SupabaseClient,
  companyId: string,
  skuHint?: string | null,
) {
  let query = admin
    .from('ls_stock')
    .select('quantity, ls_products(sku, name, min_stock), ls_warehouses(name, code)')
    .eq('company_id', companyId)
    .limit(80);

  const { data: allStock } = await query;

  let rows = allStock ?? [];
  if (skuHint) {
    const hint = skuHint.toLowerCase();
    rows = rows.filter((r) => {
      const p = r.ls_products as { sku?: string; name?: string } | null;
      return p?.sku?.toLowerCase().includes(hint) || p?.name?.toLowerCase().includes(hint);
    });
  }

  const low = rows.filter((r) => {
    const p = r.ls_products as { min_stock?: number } | null;
    return Number(r.quantity ?? 0) <= Number(p?.min_stock ?? 0);
  });

  return {
    total_lines: rows.length,
    below_minimum: low.slice(0, 15).map((r) => {
      const p = r.ls_products as { sku?: string; name?: string; min_stock?: number } | null;
      const w = r.ls_warehouses as { name?: string; code?: string } | null;
      return {
        sku: p?.sku,
        name: p?.name,
        qty: r.quantity,
        min: p?.min_stock,
        warehouse: w?.name || w?.code,
      };
    }),
    sample: rows.slice(0, 20).map((r) => {
      const p = r.ls_products as { sku?: string; name?: string } | null;
      const w = r.ls_warehouses as { name?: string } | null;
      return { sku: p?.sku, name: p?.name, qty: r.quantity, warehouse: w?.name };
    }),
  };
}

export async function fetchMovementsContext(admin: SupabaseClient, companyId: string) {
  const { data } = await admin
    .from('ls_stock_movements')
    .select('movement_type, sub_type, marketplace, created_at, reference_code')
    .eq('company_id', companyId)
    .gte('created_at', daysAgo(7))
    .order('created_at', { ascending: false })
    .limit(25);

  return { last_7_days: data ?? [] };
}

export async function fetchReturnsContext(admin: SupabaseClient, companyId: string) {
  const since = startOfToday();
  const { data: today } = await admin
    .from('ls_returns')
    .select('status, reason, order_reference, created_at')
    .eq('company_id', companyId)
    .gte('created_at', since)
    .limit(20);

  const { data: byReason } = await admin
    .from('ls_returns')
    .select('reason')
    .eq('company_id', companyId)
    .gte('created_at', daysAgo(30))
    .limit(200);

  const reasonCount: Record<string, number> = {};
  for (const r of byReason ?? []) {
    const key = (r.reason as string) || 'sem motivo';
    reasonCount[key] = (reasonCount[key] ?? 0) + 1;
  }

  return { today: today ?? [], reasons_30d: reasonCount };
}

export async function fetchInventoryContext(admin: SupabaseClient, companyId: string) {
  const { data: inventories } = await admin
    .from('ls_inventories')
    .select('id, status, inventory_type, created_at, ls_inventory_items(system_quantity, counted_quantity, difference, ls_products(sku, name))')
    .eq('company_id', companyId)
    .in('status', ['counting', 'review'])
    .order('created_at', { ascending: false })
    .limit(3);

  const divergences: Array<{ sku: string; expected: number; counted: number; variance: number }> = [];
  for (const inv of inventories ?? []) {
    for (const c of (inv.ls_inventory_items as Array<Record<string, unknown>>) ?? []) {
      const variance = Number(c.difference ?? 0);
      if (variance !== 0) {
        const p = c.ls_products as { sku?: string } | null;
        divergences.push({
          sku: String(p?.sku ?? ''),
          expected: Number(c.system_quantity ?? 0),
          counted: Number(c.counted_quantity ?? 0),
          variance,
        });
      }
    }
  }

  return { open_inventories: inventories?.length ?? 0, divergences: divergences.slice(0, 20) };
}

export async function fetchReplenishmentContext(admin: SupabaseClient, companyId: string) {
  const since = daysAgo(30);
  const { data: products } = await admin
    .from('ls_products')
    .select('id, sku, name, min_stock')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .limit(100);

  const suggestions = [];
  for (const p of products ?? []) {
    const { data: exits } = await admin
      .from('ls_stock_movement_items')
      .select('quantity, ls_stock_movements!inner(movement_type, created_at, company_id)')
      .eq('product_id', p.id)
      .eq('ls_stock_movements.movement_type', 'exit')
      .eq('ls_stock_movements.company_id', companyId)
      .gte('ls_stock_movements.created_at', since);

    const sold30 = (exits ?? []).reduce((a, r) => a + Number(r.quantity ?? 0), 0);
    const avgDaily = sold30 / 30;
    const suggestedMin = Math.ceil(avgDaily * 14);

    const { data: stockRows } = await admin
      .from('ls_stock')
      .select('quantity')
      .eq('product_id', p.id)
      .eq('company_id', companyId);

    const current = (stockRows ?? []).reduce((a, r) => a + Number(r.quantity ?? 0), 0);
    const reorderPoint = Math.max(Number(p.min_stock ?? 0), suggestedMin);

    if (current <= reorderPoint) {
      suggestions.push({
        sku: p.sku,
        name: p.name,
        current,
        suggested_purchase: Math.max(reorderPoint - current, Math.ceil(avgDaily * 7)),
        avg_daily_sales: Number(avgDaily.toFixed(2)),
      });
    }
  }

  suggestions.sort((a, b) => b.avg_daily_sales - a.avg_daily_sales);
  return { suggestions: suggestions.slice(0, 15) };
}

export async function fetchAnalyticsContext(admin: SupabaseClient, companyId: string) {
  const since = daysAgo(30);
  const { data: exits } = await admin
    .from('ls_stock_movements')
    .select('marketplace, store_id, ls_stores(name)')
    .eq('company_id', companyId)
    .eq('movement_type', 'exit')
    .gte('created_at', since)
    .limit(500);

  const mpCount: Record<string, number> = {};
  const storeCount: Record<string, number> = {};
  for (const row of exits ?? []) {
    const mp = (row.marketplace as string) || 'direct';
    mpCount[mp] = (mpCount[mp] ?? 0) + 1;
    const store = (row.ls_stores as { name?: string } | null)?.name || 'sem loja';
    storeCount[store] = (storeCount[store] ?? 0) + 1;
  }

  const { data: topItems } = await admin
    .from('ls_stock_movement_items')
    .select('sku, quantity, ls_stock_movements!inner(movement_type, company_id, created_at)')
    .eq('ls_stock_movements.movement_type', 'exit')
    .eq('ls_stock_movements.company_id', companyId)
    .gte('ls_stock_movements.created_at', since)
    .limit(500);

  const skuQty: Record<string, number> = {};
  for (const item of topItems ?? []) {
    const sku = String(item.sku ?? '');
    skuQty[sku] = (skuQty[sku] ?? 0) + Number(item.quantity ?? 0);
  }

  const topSkus = Object.entries(skuQty)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sku, qty]) => ({ sku, quantity_30d: qty }));

  return { marketplaces_30d: mpCount, stores_30d: storeCount, top_skus_30d: topSkus };
}

export async function fetchStaleProductsContext(admin: SupabaseClient, companyId: string, days = 90) {
  const since = daysAgo(days);
  const { data: products } = await admin
    .from('ls_products')
    .select('id, sku, name')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .limit(80);

  const stale = [];
  for (const p of products ?? []) {
    const { data: lastExit } = await admin
      .from('ls_stock_movement_items')
      .select('ls_stock_movements!inner(created_at, movement_type, company_id)')
      .eq('product_id', p.id)
      .eq('ls_stock_movements.movement_type', 'exit')
      .eq('ls_stock_movements.company_id', companyId)
      .order('ls_stock_movements(created_at)', { ascending: false })
      .limit(1);

    const last = (lastExit?.[0]?.ls_stock_movements as { created_at?: string } | undefined)?.created_at;
    if (!last || last < since) {
      const { data: stockRows } = await admin
        .from('ls_stock')
        .select('quantity')
        .eq('product_id', p.id)
        .eq('company_id', companyId);
      const qty = (stockRows ?? []).reduce((a, r) => a + Number(r.quantity ?? 0), 0);
      if (qty > 0) stale.push({ sku: p.sku, name: p.name, qty, last_exit: last ?? 'nunca' });
    }
  }

  return { days_without_exit: days, products: stale.slice(0, 15) };
}

export async function fetchImportsContext(admin: SupabaseClient, companyId: string) {
  const { data } = await admin
    .from('ls_reports_imports')
    .select('file_name, file_type, status, rows_processed, rows_failed, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(10);

  return { recent_imports: data ?? [] };
}

export async function buildRagContext(
  admin: SupabaseClient,
  companyId: string,
  intents: AiIntent[],
  skuHint?: string | null,
): Promise<string> {
  const blocks: Record<string, unknown> = {};

  if (intents.includes('daily_summary') || intents.includes('general')) {
    blocks.daily_summary = await fetchDailySummary(admin, companyId);
  }
  if (intents.some((i) => ['stock', 'general', 'replenishment'].includes(i))) {
    blocks.stock = await fetchStockContext(admin, companyId, skuHint);
  }
  if (intents.includes('movements') || intents.includes('daily_summary')) {
    blocks.movements = await fetchMovementsContext(admin, companyId);
  }
  if (intents.includes('returns') || intents.includes('daily_summary')) {
    blocks.returns = await fetchReturnsContext(admin, companyId);
  }
  if (intents.includes('inventory')) {
    blocks.inventory = await fetchInventoryContext(admin, companyId);
  }
  if (intents.includes('replenishment') || intents.includes('stock')) {
    blocks.replenishment = await fetchReplenishmentContext(admin, companyId);
  }
  if (intents.includes('analytics') || intents.includes('general')) {
    blocks.analytics = await fetchAnalyticsContext(admin, companyId);
  }
  if (intents.includes('replenishment') || intents.includes('analytics')) {
    blocks.stale_90d = await fetchStaleProductsContext(admin, companyId, 90);
  }
  if (intents.includes('imports')) {
    blocks.imports = await fetchImportsContext(admin, companyId);
  }

  return JSON.stringify(blocks, null, 2);
}

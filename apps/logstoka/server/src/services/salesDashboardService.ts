import type { SupabaseClient } from '@supabase/supabase-js';

type MovementItem = {
  sku: string;
  quantity: number;
  unit_cost: number | null;
  ls_products?: { name?: string; sale_price?: number } | Array<{ name?: string; sale_price?: number }> | null;
};

type MovementRow = {
  id: string;
  marketplace: string | null;
  reference_code: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  ls_stock_movement_items?: MovementItem[] | null;
};

const STATE_NAMES: Record<string, string> = {
  SP: 'São Paulo',
  RJ: 'Rio de Janeiro',
  MG: 'Minas Gerais',
};

function resolveProduct(item: MovementItem) {
  const rel = item.ls_products;
  if (Array.isArray(rel)) return { name: rel[0]?.name ?? item.sku, salePrice: Number(rel[0]?.sale_price ?? 0) };
  return { name: rel?.name ?? item.sku, salePrice: Number(rel?.sale_price ?? 0) };
}

export async function fetchSalesDashboard(admin: SupabaseClient, companyId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await admin
    .from('ls_stock_movements')
    .select(
      'id, marketplace, reference_code, status, metadata, created_at, ls_stock_movement_items(sku, quantity, unit_cost, ls_products(name, sale_price))',
    )
    .eq('company_id', companyId)
    .eq('movement_type', 'exit')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw error;

  const movements = (data ?? []) as MovementRow[];
  const orders = movements.flatMap((movement) => {
    const meta = movement.metadata ?? {};
    const state = String(meta.shipping_state ?? meta.buyer_state ?? meta.state ?? '—').toUpperCase();
    const city = String(meta.shipping_city ?? meta.buyer_city ?? meta.city ?? '—');
    const freight = Number(meta.freight ?? meta.shipping_cost ?? 0);
    const marketplace = movement.marketplace ?? 'manual';
    const status =
      movement.status === 'cancelled' ? 'cancelled' : movement.status === 'completed' ? 'fulfilled' : 'open';

    return (movement.ls_stock_movement_items ?? []).map((item, index) => {
      const product = resolveProduct(item);
      const unitPrice = product.salePrice || Number(item.unit_cost ?? 0);
      const qty = Number(item.quantity ?? 0);
      const value = unitPrice * qty;
      return {
        id: `${movement.id}-${index}`,
        orderRef: movement.reference_code ?? movement.id.slice(0, 8),
        productName: product.name,
        sku: item.sku,
        quantity: qty,
        value,
        freight: index === 0 ? freight : 0,
        marketplace,
        marketplaceLabel: marketplace,
        storeName: String(meta.store_name ?? marketplace),
        state,
        city,
        soldAt: movement.created_at,
        status,
      };
    });
  });

  const summary = {
    orders: orders.length,
    quantity: orders.reduce((sum, row) => sum + row.quantity, 0),
    value: orders.reduce((sum, row) => sum + row.value, 0),
    freight: orders.reduce((sum, row) => sum + row.freight, 0),
    avgTicket: 0,
  };
  summary.avgTicket = summary.orders ? summary.value / summary.orders : 0;

  const byStateMap = new Map<
    string,
    { state: string; stateName: string; pieces: number; orders: number; value: number; freight: number }
  >();
  for (const row of orders) {
    const prev = byStateMap.get(row.state) ?? {
      state: row.state,
      stateName: STATE_NAMES[row.state] ?? row.state,
      pieces: 0,
      orders: 0,
      value: 0,
      freight: 0,
    };
    prev.pieces += row.quantity;
    prev.orders += 1;
    prev.value += row.value;
    prev.freight += row.freight;
    byStateMap.set(row.state, prev);
  }

  const byChannelMap = new Map<
    string,
    { channel: string; marketplace: string; storeName: string; orders: number; quantity: number; cost: number; value: number; freight: number }
  >();
  for (const row of orders) {
    const key = row.storeName;
    const prev = byChannelMap.get(key) ?? {
      channel: row.marketplaceLabel,
      marketplace: row.marketplace,
      storeName: row.storeName,
      orders: 0,
      quantity: 0,
      cost: 0,
      value: 0,
      freight: 0,
    };
    prev.orders += 1;
    prev.quantity += row.quantity;
    prev.value += row.value;
    prev.freight += row.freight;
    byChannelMap.set(key, prev);
  }

  const byProductMap = new Map<string, { sku: string; name: string; quantity: number; cost: number; value: number }>();
  for (const row of orders) {
    const prev = byProductMap.get(row.sku) ?? { sku: row.sku, name: row.productName, quantity: 0, cost: 0, value: 0 };
    prev.quantity += row.quantity;
    prev.value += row.value;
    byProductMap.set(row.sku, prev);
  }

  return {
    summary,
    statusBreakdown: [],
    byState: [...byStateMap.values()].map((row) => ({
      ...row,
      avgFreight: row.freight / Math.max(row.orders, 1),
      avgTicket: row.value / Math.max(row.orders, 1),
    })),
    byChannel: [...byChannelMap.values()].map((row) => ({
      ...row,
      avgTicket: row.value / Math.max(row.orders, 1),
      unitValue: row.quantity ? row.value / row.quantity : 0,
      markup: 0,
      taxes: row.value * 0.08,
      fees: row.value * 0.12,
      contributionPct: 0,
      contributionValue: row.value * 0.8,
    })),
    byProduct: [...byProductMap.values()].map((row) => ({
      ...row,
      markup: row.cost ? ((row.value - row.cost) / row.cost) * 100 : 0,
    })),
    orders,
    lastSyncAt: new Date().toISOString(),
  };
}

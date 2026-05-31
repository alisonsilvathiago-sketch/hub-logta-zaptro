import type { Marketplace } from '@/types';
import { MARKETPLACE_LABELS } from '@/types';
import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import { getAllMarketplaceSaleOrders } from '@/lib/marketplaceHub';

export type SalesOrderStatus = 'fulfilled' | 'open' | 'cancelled';

export type SalesDashboardSummary = {
  orders: number;
  quantity: number;
  value: number;
  freight: number;
  avgTicket: number;
};

export type SalesStatusBreakdown = {
  status: SalesOrderStatus;
  label: string;
  count: number;
  value: number;
  percent: number;
};

export type SalesByStateRow = {
  state: string;
  stateName: string;
  avgFreight: number;
  pieces: number;
  orders: number;
  avgTicket: number;
  value: number;
};

export type SalesByChannelRow = {
  channel: string;
  marketplace: Marketplace | 'manual';
  storeName: string;
  orders: number;
  avgTicket: number;
  quantity: number;
  cost: number;
  value: number;
  freight: number;
  unitValue: number;
  markup: number;
  taxes: number;
  fees: number;
  contributionPct: number;
  contributionValue: number;
};

export type SalesByProductRow = {
  sku: string;
  name: string;
  quantity: number;
  cost: number;
  value: number;
  markup: number;
};

export type SalesOrderRow = {
  id: string;
  orderRef: string;
  productName: string;
  sku: string;
  quantity: number;
  value: number;
  freight: number;
  marketplace: Marketplace | 'manual';
  marketplaceLabel: string;
  storeName: string;
  state: string;
  city: string;
  soldAt: string;
  status: SalesOrderStatus;
};

export type SalesDashboardData = {
  summary: SalesDashboardSummary;
  statusBreakdown: SalesStatusBreakdown[];
  byState: SalesByStateRow[];
  byChannel: SalesByChannelRow[];
  byProduct: SalesByProductRow[];
  orders: SalesOrderRow[];
  lastSyncAt: string;
};

const STATE_NAMES: Record<string, string> = {
  SP: 'São Paulo',
  RJ: 'Rio de Janeiro',
  MG: 'Minas Gerais',
  RS: 'Rio Grande do Sul',
  PR: 'Paraná',
  SC: 'Santa Catarina',
  BA: 'Bahia',
  GO: 'Goiás',
  PE: 'Pernambuco',
  CE: 'Ceará',
};

const fmtMoney = (n: number) => Math.round(n * 100) / 100;

export function getDemoSalesDashboard(_days = 30): SalesDashboardData {
  const hubOrders = getAllMarketplaceSaleOrders();
  const productBySku = new Map(DEMO_PRODUCTS.map((p) => [p.sku, p]));

  const statePool = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO'] as const;
  const cityByState: Record<string, string[]> = {
    SP: ['São Paulo', 'Campinas', 'Santos'],
    RJ: ['Rio de Janeiro', 'Niterói'],
    MG: ['Belo Horizonte', 'Uberlândia'],
    RS: ['Porto Alegre'],
    PR: ['Curitiba'],
    SC: ['Florianópolis'],
    BA: ['Salvador'],
    GO: ['Goiânia'],
  };

  const orders: SalesOrderRow[] = [];
  let idx = 0;

  for (const order of hubOrders) {
    const product = productBySku.get(order.sku);
    const unitPrice = product?.sale_price ?? 49.9;
    const value = fmtMoney(unitPrice * order.quantity);
    const freight = fmtMoney(12 + (idx % 5) * 3.5);
    const state = statePool[idx % statePool.length]!;
    const status: SalesOrderStatus =
      order.status === 'baixa_done' ? 'fulfilled' : order.status === 'error' ? 'cancelled' : 'open';

    orders.push({
      id: order.id,
      orderRef: order.orderRef,
      productName: order.productName,
      sku: order.sku,
      quantity: order.quantity,
      value,
      freight,
      marketplace: order.marketplace,
      marketplaceLabel: order.marketplaceLabel,
      storeName: order.marketplaceLabel,
      state,
      city: cityByState[state]?.[idx % (cityByState[state]?.length ?? 1)] ?? state,
      soldAt: order.soldAt,
      status,
    });
    idx += 1;
  }

  const manualOrders: SalesOrderRow[] = [
    {
      id: 'sale-manual-1',
      orderRef: 'MAN-88421',
      productName: 'Fralda Pluma Premium P 60un',
      sku: 'PLM-FRD-P',
      quantity: 2,
      value: 139.8,
      freight: 18,
      marketplace: 'manual',
      marketplaceLabel: 'Pedido Manual',
      storeName: 'Pedido Manual',
      state: 'SP',
      city: 'São Paulo',
      soldAt: new Date().toLocaleString('pt-BR'),
      status: 'fulfilled',
    },
    {
      id: 'sale-manual-2',
      orderRef: 'MAN-88422',
      productName: 'Organizador Modular 12 Gavetas',
      sku: 'STK-ORG-12',
      quantity: 1,
      value: 149.9,
      freight: 24.5,
      marketplace: 'manual',
      marketplaceLabel: 'Pedido Manual',
      storeName: 'Pedido Manual',
      state: 'RJ',
      city: 'Rio de Janeiro',
      soldAt: new Date(Date.now() - 86400000).toLocaleString('pt-BR'),
      status: 'open',
    },
  ];

  const allOrders = [...orders, ...manualOrders];

  const summary: SalesDashboardSummary = {
    orders: allOrders.length,
    quantity: allOrders.reduce((sum, row) => sum + row.quantity, 0),
    value: fmtMoney(allOrders.reduce((sum, row) => sum + row.value, 0)),
    freight: fmtMoney(allOrders.reduce((sum, row) => sum + row.freight, 0)),
    avgTicket: 0,
  };
  summary.avgTicket = summary.orders ? fmtMoney(summary.value / summary.orders) : 0;

  const statusCounts: Record<SalesOrderStatus, { count: number; value: number }> = {
    fulfilled: { count: 0, value: 0 },
    open: { count: 0, value: 0 },
    cancelled: { count: 0, value: 0 },
  };

  for (const row of allOrders) {
    statusCounts[row.status].count += 1;
    statusCounts[row.status].value += row.value;
  }

  const statusBreakdown: SalesStatusBreakdown[] = (
    [
      { status: 'fulfilled' as const, label: 'Atendido', ...statusCounts.fulfilled, percent: 0 },
      { status: 'cancelled' as const, label: 'Cancelado', ...statusCounts.cancelled, percent: 0 },
      { status: 'open' as const, label: 'Em aberto', ...statusCounts.open, percent: 0 },
    ] as SalesStatusBreakdown[]
  ).map((row) => ({
    ...row,
    percent: summary.orders ? Math.round((row.count / summary.orders) * 100) : 0,
  }));

  const byStateMap = new Map<string, SalesByStateRow>();
  for (const row of allOrders) {
    const prev = byStateMap.get(row.state) ?? {
      state: row.state,
      stateName: STATE_NAMES[row.state] ?? row.state,
      avgFreight: 0,
      pieces: 0,
      orders: 0,
      avgTicket: 0,
      value: 0,
    };
    prev.pieces += row.quantity;
    prev.orders += 1;
    prev.value += row.value;
    prev.avgFreight += row.freight;
    byStateMap.set(row.state, prev);
  }

  const byState = [...byStateMap.values()]
    .map((row) => ({
      ...row,
      value: fmtMoney(row.value),
      avgFreight: fmtMoney(row.avgFreight / Math.max(row.orders, 1)),
      avgTicket: fmtMoney(row.value / Math.max(row.orders, 1)),
    }))
    .sort((a, b) => b.value - a.value);

  const channelMap = new Map<string, SalesByChannelRow>();
  for (const row of allOrders) {
    const key = row.storeName;
    const product = productBySku.get(row.sku);
    const cost = fmtMoney((product?.cost ?? 20) * row.quantity);
    const prev = channelMap.get(key) ?? {
      channel: row.marketplaceLabel,
      marketplace: row.marketplace,
      storeName: row.storeName,
      orders: 0,
      avgTicket: 0,
      quantity: 0,
      cost: 0,
      value: 0,
      freight: 0,
      unitValue: 0,
      markup: 0,
      taxes: 0,
      fees: 0,
      contributionPct: 0,
      contributionValue: 0,
    };
    prev.orders += 1;
    prev.quantity += row.quantity;
    prev.cost += cost;
    prev.value += row.value;
    prev.freight += row.freight;
    prev.taxes += fmtMoney(row.value * 0.08);
    prev.fees += fmtMoney(row.value * 0.12);
    channelMap.set(key, prev);
  }

  const byChannel = [...channelMap.values()]
    .map((row) => {
      const contributionValue = fmtMoney(row.value - row.cost - row.taxes - row.fees);
      const markup = row.cost ? fmtMoney(((row.value - row.cost) / row.cost) * 100) : 0;
      return {
        ...row,
        value: fmtMoney(row.value),
        cost: fmtMoney(row.cost),
        freight: fmtMoney(row.freight),
        unitValue: row.quantity ? fmtMoney(row.value / row.quantity) : 0,
        avgTicket: row.orders ? fmtMoney(row.value / row.orders) : 0,
        markup,
        taxes: fmtMoney(row.taxes),
        fees: fmtMoney(row.fees),
        contributionValue,
        contributionPct: summary.value ? fmtMoney((contributionValue / summary.value) * 100) : 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  const productMap = new Map<string, SalesByProductRow>();
  for (const row of allOrders) {
    const product = productBySku.get(row.sku);
    const cost = fmtMoney((product?.cost ?? 20) * row.quantity);
    const prev = productMap.get(row.sku) ?? {
      sku: row.sku,
      name: row.productName,
      quantity: 0,
      cost: 0,
      value: 0,
      markup: 0,
    };
    prev.quantity += row.quantity;
    prev.cost += cost;
    prev.value += row.value;
    productMap.set(row.sku, prev);
  }

  const byProduct = [...productMap.values()]
    .map((row) => ({
      ...row,
      value: fmtMoney(row.value),
      cost: fmtMoney(row.cost),
      markup: row.cost ? fmtMoney(((row.value - row.cost) / row.cost) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    summary,
    statusBreakdown,
    byState,
    byChannel,
    byProduct,
    orders: allOrders.sort((a, b) => b.value - a.value),
    lastSyncAt: new Date().toISOString(),
  };
}

export function marketplaceLabel(mp: Marketplace | 'manual'): string {
  if (mp === 'manual') return 'Pedido Manual';
  return MARKETPLACE_LABELS[mp];
}

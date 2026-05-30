import type { LsProduct, Marketplace } from '@/types';
import { MARKETPLACE_LABELS } from '@/types';
import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import { getMarketplaceAggregateStats, getStoresByMarketplace } from '@/lib/marketplaceStores';

/** URL pública da interação: /app/mercadolivre */
export const MARKETPLACE_HUB_SLUGS: Record<string, Marketplace> = {
  shopee: 'shopee',
  mercadolivre: 'mercadolivre',
  marcadolivre: 'mercadolivre',
  amazon: 'amazon',
  tiktok: 'tiktok',
  magalu: 'magalu',
};

/** Marketplaces com integração ativa — página criada automaticamente */
export const INTEGRATED_MARKETPLACES: Marketplace[] = [
  'shopee',
  'mercadolivre',
  'amazon',
  'tiktok',
  'magalu',
];

export type MarketplaceListing = {
  productId: string;
  sku: string;
  name: string;
  externalId: string;
  price: number;
  stockListed: number;
  stockWms: number;
  syncStatus: 'ok' | 'warning' | 'error';
  syncMessage?: string;
};

export type MarketplaceSyncIssue = {
  id: string;
  severity: 'warning' | 'error';
  title: string;
  detail: string;
  sku?: string;
  suggestedFix?: string;
};

export type MarketplaceSaleOrder = {
  id: string;
  orderRef: string;
  productName: string;
  sku: string;
  quantity: number;
  soldAt: string;
  status: 'pending_baixa' | 'baixa_done' | 'error';
  buyer?: string;
};

export type MarketplaceSaleOrderWithSource = MarketplaceSaleOrder & {
  marketplace: Marketplace;
  marketplaceLabel: string;
  hubPath: string;
};

export function resolveMarketplaceHubSlug(slug: string): Marketplace | null {
  return MARKETPLACE_HUB_SLUGS[slug.toLowerCase()] ?? null;
}

export function marketplaceHubPath(marketplace: Marketplace): string {
  return `/app/${marketplace}`;
}

export function isIntegratedMarketplace(marketplace: Marketplace): boolean {
  return INTEGRATED_MARKETPLACES.includes(marketplace);
}

/** Produtos vinculados ao marketplace (cadastro automático na integração) */
export const MARKETPLACE_PRODUCT_MAP: Record<Marketplace, string[]> = {
  shopee: ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6', 'prod-7'],
  mercadolivre: ['prod-1', 'prod-2', 'prod-4', 'prod-5', 'prod-6', 'prod-7'],
  amazon: ['prod-7', 'prod-8'],
  tiktok: ['prod-10', 'prod-11'],
  magalu: ['prod-9'],
};

const LISTING_EXTERNAL_PREFIX: Record<Marketplace, string> = {
  shopee: 'SHP',
  mercadolivre: 'ML',
  amazon: 'AMZ',
  tiktok: 'TT',
  magalu: 'MGL',
};

function buildListings(marketplace: Marketplace): MarketplaceListing[] {
  const ids = MARKETPLACE_PRODUCT_MAP[marketplace] ?? [];
  return ids.map((id, i) => {
    const p = DEMO_PRODUCTS.find((x) => x.id === id)!;
    const stockWms = 100 + i * 47;
    let syncStatus: MarketplaceListing['syncStatus'] = 'ok';
    let syncMessage: string | undefined;

    if (marketplace === 'mercadolivre' && p.sku === 'PLM-LEN-80') {
      syncStatus = 'error';
      syncMessage = 'Código ML divergente do SKU WMS (ML-88421 ≠ PLM-LEN-80)';
    } else if (marketplace === 'shopee' && p.sku === 'TEC-CAB-2M') {
      syncStatus = 'warning';
      syncMessage = 'Estoque marketplace desatualizado há 2h — re-sync automático agendado';
    } else if (stockWms < p.min_stock) {
      syncStatus = 'warning';
      syncMessage = 'Abaixo do mínimo WMS';
    }

    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      externalId: `${LISTING_EXTERNAL_PREFIX[marketplace]}-${10000 + i}`,
      price: p.sale_price,
      stockListed: syncStatus === 'error' ? 0 : stockWms - 5,
      stockWms,
      syncStatus,
      syncMessage,
    };
  });
}

function buildSyncIssues(marketplace: Marketplace, listings: MarketplaceListing[]): MarketplaceSyncIssue[] {
  const issues: MarketplaceSyncIssue[] = listings
    .filter((l) => l.syncStatus !== 'ok')
    .map((l, i) => ({
      id: `issue-${marketplace}-${i}`,
      severity: l.syncStatus === 'error' ? 'error' as const : 'warning' as const,
      title: l.syncStatus === 'error' ? 'Código de integração inválido' : 'Divergência de estoque',
      detail: l.syncMessage ?? 'Revisar cadastro',
      sku: l.sku,
      suggestedFix:
        l.syncStatus === 'error'
          ? 'O sistema tentará remapear via webhook na próxima venda. Confira o SKU no anúncio ML.'
          : 'Sync bidirecional em andamento — sem ação manual necessária.',
    }));

  if (marketplace === 'mercadolivre') {
    issues.unshift({
      id: 'issue-ml-auth',
      severity: 'warning',
      title: 'Token OAuth renovado automaticamente',
      detail: 'Renovação concluída às 06:00 — integração continua ativa.',
      suggestedFix: 'Nenhuma ação necessária.',
    });
  }

  return issues;
}

function buildSaleOrders(marketplace: Marketplace): MarketplaceSaleOrder[] {
  const prefix = LISTING_EXTERNAL_PREFIX[marketplace];
  const samples: Array<[string, string, number]> =
    marketplace === 'mercadolivre'
      ? [
          ['BBR-MAM-300', 'Mamadeira Anti-Cólica 300ml', 2],
          ['PLM-FRD-M', 'Fralda Pluma Premium M 54un', 1],
          ['STK-ORG-12', 'Organizador Modular 12 Gavetas', 1],
          ['PLM-LEN-80', 'Lençol Berço Percale 180 fios', 2],
        ]
      : [
          ['PLM-FRD-P', 'Fralda Pluma Premium P 60un', 3],
          ['BBR-CHU-A1', 'Chupeta Silicone 0-6m', 2],
          ['BBR-MAM-300', 'Mamadeira Anti-Cólica 300ml', 1],
          ['STK-ORG-12', 'Organizador Modular 12 Gavetas', 1],
        ];

  return samples.map(([sku, productName, quantity], i) => ({
    id: `sale-${marketplace}-${i}`,
    orderRef: `${prefix}-${992000 + i}`,
    productName,
    sku,
    quantity,
    soldAt: new Date(Date.now() - i * 3600000).toLocaleString('pt-BR'),
    status: i < 2 ? 'pending_baixa' : 'baixa_done',
    buyer: i === 0 ? 'Cliente ML' : undefined,
  }));
}

export type MarketplaceHubData = {
  marketplace: Marketplace;
  label: string;
  hubPath: string;
  aggregate: ReturnType<typeof getMarketplaceAggregateStats>;
  stores: ReturnType<typeof getStoresByMarketplace>;
  listings: MarketplaceListing[];
  syncIssues: MarketplaceSyncIssue[];
  saleOrders: MarketplaceSaleOrder[];
  lastSyncAt: string;
};

export function getMarketplaceHubData(marketplace: Marketplace): MarketplaceHubData {
  const listings = buildListings(marketplace);
  return {
    marketplace,
    label: MARKETPLACE_LABELS[marketplace],
    hubPath: marketplaceHubPath(marketplace),
    aggregate: getMarketplaceAggregateStats(marketplace),
    stores: getStoresByMarketplace(marketplace),
    listings,
    syncIssues: buildSyncIssues(marketplace, listings),
    saleOrders: buildSaleOrders(marketplace),
    lastSyncAt: new Date().toLocaleString('pt-BR'),
  };
}

/** Pedidos pagos de todos os marketplaces integrados — ordenados por baixa pendente. */
export function getAllMarketplaceSaleOrders(): MarketplaceSaleOrderWithSource[] {
  return INTEGRATED_MARKETPLACES.flatMap((marketplace) => {
    const hub = getMarketplaceHubData(marketplace);
    return hub.saleOrders.map((order) => ({
      ...order,
      marketplace,
      marketplaceLabel: hub.label,
      hubPath: hub.hubPath,
    }));
  }).sort((a, b) => {
    if (a.status === 'pending_baixa' && b.status !== 'pending_baixa') return -1;
    if (b.status === 'pending_baixa' && a.status !== 'pending_baixa') return 1;
    return b.soldAt.localeCompare(a.soldAt);
  });
}

export function downloadBaixaDocument(
  marketplace: Marketplace,
  order: MarketplaceSaleOrder,
  product?: LsProduct | null,
): void {
  const label = MARKETPLACE_LABELS[marketplace];
  const lines = [
    'LOGSTOKA — DOCUMENTO DE BAIXA DE ESTOQUE',
    '========================================',
    `Marketplace: ${label}`,
    `Pedido: ${order.orderRef}`,
    `Data venda: ${order.soldAt}`,
    `SKU WMS: ${order.sku}`,
    `Produto: ${order.productName}`,
    `Quantidade: ${order.quantity} UN`,
    product ? `Custo unit.: R$ ${product.cost.toFixed(2)}` : '',
    '',
    'Movimentação sugerida: SAÍDA · Venda marketplace',
    'Status: Aguardando confirmação WMS',
    '',
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    'Este documento foi gerado automaticamente pela integração.',
  ].filter(Boolean);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `baixa-${order.orderRef}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function registerMarketplaceIntegration(marketplace: Marketplace): void {
  if (!INTEGRATED_MARKETPLACES.includes(marketplace)) {
    INTEGRATED_MARKETPLACES.push(marketplace);
  }
}

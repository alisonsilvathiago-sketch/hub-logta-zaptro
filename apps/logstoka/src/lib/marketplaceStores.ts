import type { Marketplace } from '@/types';
import { DEMO_STORES } from '@/lib/logstokaDemoSeed';

export type MarketplaceStoreStats = {
  id: string;
  marketplace: Marketplace;
  name: string;
  slug: string;
  logoUrl: string;
  is_active: boolean;
  stockUnits: number;
  stockValue: number;
  exitsToday: number;
  exitsMonth: number;
  exitsYear: number;
  entriesToday: number;
  entriesMonth: number;
  ordersToday: number;
  ordersMonth: number;
  syncPercent: number;
  status: 'connected' | 'syncing' | 'warning';
  recentEvents: Array<{ at: string; title: string; detail: string; type: 'order' | 'stock' | 'sync' }>;
};

/** Marca do produto → loja integrada (criada automaticamente na integração) */
const BRAND_TO_STORE: Record<string, { marketplace: Marketplace; storeName: string }> = {
  'Baby Bear': { marketplace: 'shopee', storeName: 'Baby Bear' },
  Pluma: { marketplace: 'shopee', storeName: 'Pluma Baby' },
  'Stock Express': { marketplace: 'shopee', storeName: 'Stock Express' },
  TechParts: { marketplace: 'amazon', storeName: 'Amazon Oficial' },
  ModaStock: { marketplace: 'magalu', storeName: 'Magalu Oficial' },
  PetMax: { marketplace: 'tiktok', storeName: 'TikTok Oficial' },
};

const STORE_STATS_SEED: Record<string, Omit<MarketplaceStoreStats, 'id' | 'marketplace' | 'name' | 'slug' | 'logoUrl' | 'is_active'>> = {
  'store-1': { stockUnits: 4280, stockValue: 186400, exitsToday: 142, exitsMonth: 3840, exitsYear: 42100, entriesToday: 88, entriesMonth: 2100, ordersToday: 156, ordersMonth: 4120, syncPercent: 98, status: 'connected', recentEvents: [] },
  'store-2': { stockUnits: 3150, stockValue: 142800, exitsToday: 98, exitsMonth: 2650, exitsYear: 29800, entriesToday: 45, entriesMonth: 1680, ordersToday: 112, ordersMonth: 2890, syncPercent: 96, status: 'connected', recentEvents: [] },
  'store-3': { stockUnits: 2890, stockValue: 95400, exitsToday: 76, exitsMonth: 1980, exitsYear: 22400, entriesToday: 32, entriesMonth: 920, ordersToday: 84, ordersMonth: 2100, syncPercent: 94, status: 'syncing', recentEvents: [] },
  'store-4': { stockUnits: 1920, stockValue: 67800, exitsToday: 54, exitsMonth: 1420, exitsYear: 15600, entriesToday: 28, entriesMonth: 780, ordersToday: 61, ordersMonth: 1580, syncPercent: 99, status: 'connected', recentEvents: [] },
  'store-5': { stockUnits: 5100, stockValue: 312000, exitsToday: 188, exitsMonth: 5200, exitsYear: 58400, entriesToday: 102, entriesMonth: 3400, ordersToday: 201, ordersMonth: 5480, syncPercent: 97, status: 'connected', recentEvents: [] },
  'store-6': { stockUnits: 2640, stockValue: 118500, exitsToday: 67, exitsMonth: 1890, exitsYear: 20100, entriesToday: 41, entriesMonth: 1120, ordersToday: 73, ordersMonth: 1920, syncPercent: 95, status: 'connected', recentEvents: [] },
  'store-7': { stockUnits: 6200, stockValue: 445000, exitsToday: 210, exitsMonth: 6100, exitsYear: 71200, entriesToday: 95, entriesMonth: 2800, ordersToday: 234, ordersMonth: 6200, syncPercent: 99, status: 'connected', recentEvents: [] },
  'store-8': { stockUnits: 890, stockValue: 52300, exitsToday: 42, exitsMonth: 980, exitsYear: 11200, entriesToday: 18, entriesMonth: 420, ordersToday: 48, ordersMonth: 1020, syncPercent: 91, status: 'warning', recentEvents: [] },
  'store-9': { stockUnits: 1340, stockValue: 88700, exitsToday: 38, exitsMonth: 860, exitsYear: 9400, entriesToday: 22, entriesMonth: 510, ordersToday: 44, ordersMonth: 890, syncPercent: 93, status: 'connected', recentEvents: [] },
};

const DEFAULT_EVENTS = (storeName: string, marketplace: Marketplace) => [
  { at: 'Hoje 14:32', title: 'Pedido pago sincronizado', detail: `${storeName} · ${marketplace} · 3 SKUs`, type: 'order' as const },
  { at: 'Hoje 11:05', title: 'Saída de estoque registrada', detail: 'Expedição automática · 24 un', type: 'stock' as const },
  { at: 'Ontem 18:40', title: 'Webhook de estoque OK', detail: 'Sync bidirecional concluído', type: 'sync' as const },
];

export function slugifyStoreName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function storeLogoUrl(name: string, marketplace: Marketplace): string {
  const colors: Record<Marketplace, string> = {
    shopee: 'EE4D2D',
    mercadolivre: '2D3277',
    amazon: '131921',
    tiktok: '010101',
    magalu: '0086FF',
  };
  const bg = colors[marketplace] ?? 'EA580C';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=128&bold=true&format=png`;
}

export function buildMarketplaceStoreStats(): MarketplaceStoreStats[] {
  return DEMO_STORES.map((store) => {
    const slug = slugifyStoreName(store.name);
    const seed = STORE_STATS_SEED[store.id] ?? STORE_STATS_SEED['store-1'];
    return {
      id: store.id,
      marketplace: store.marketplace,
      name: store.name,
      slug,
      logoUrl: storeLogoUrl(store.name, store.marketplace),
      is_active: store.is_active,
      ...seed,
      recentEvents: DEFAULT_EVENTS(store.name, store.marketplace),
    };
  });
}

export const MARKETPLACE_STORE_STATS = buildMarketplaceStoreStats();

export function getStoreStatsBySlug(marketplace: Marketplace, slug: string): MarketplaceStoreStats | null {
  return MARKETPLACE_STORE_STATS.find((s) => s.marketplace === marketplace && s.slug === slug) ?? null;
}

export function getStoresByMarketplace(marketplace: Marketplace): MarketplaceStoreStats[] {
  return MARKETPLACE_STORE_STATS.filter((s) => s.marketplace === marketplace);
}

export function resolveBrandToStore(brand?: string | null): MarketplaceStoreStats | null {
  if (!brand?.trim()) return null;
  const map = BRAND_TO_STORE[brand.trim()];
  if (!map) return null;
  return MARKETPLACE_STORE_STATS.find(
    (s) => s.marketplace === map.marketplace && s.name === map.storeName,
  ) ?? null;
}

export function marketplaceStorePath(marketplace: Marketplace, storeSlug?: string): string {
  const base = `/app/configuracoes/integracoes/${marketplace}`;
  return storeSlug ? `${base}/${storeSlug}` : base;
}

export function getMarketplaceAggregateStats(marketplace: Marketplace) {
  const stores = getStoresByMarketplace(marketplace);
  return {
    storeCount: stores.length,
    stockUnits: stores.reduce((a, s) => a + s.stockUnits, 0),
    stockValue: stores.reduce((a, s) => a + s.stockValue, 0),
    exitsToday: stores.reduce((a, s) => a + s.exitsToday, 0),
    exitsMonth: stores.reduce((a, s) => a + s.exitsMonth, 0),
    exitsYear: stores.reduce((a, s) => a + s.exitsYear, 0),
    entriesToday: stores.reduce((a, s) => a + s.entriesToday, 0),
    entriesMonth: stores.reduce((a, s) => a + s.entriesMonth, 0),
    ordersToday: stores.reduce((a, s) => a + s.ordersToday, 0),
    ordersMonth: stores.reduce((a, s) => a + s.ordersMonth, 0),
    syncPercent: Math.round(stores.reduce((a, s) => a + s.syncPercent, 0) / Math.max(stores.length, 1)),
  };
}

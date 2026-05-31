import type { LsStore, Marketplace } from '@/types';
import { MARKETPLACE_LABELS } from '@/types';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { slugifyStoreName } from '@/lib/marketplaceStores';

const OPERATIONAL_MARKETPLACES: Marketplace[] = ['shopee', 'mercadolivre', 'amazon', 'tiktok', 'magalu'];

export type ActiveStoreSelection = {
  storeId: string;
  marketplace: Marketplace;
  slug: string;
  name: string;
} | null;

export function storePagePath(store: Pick<LsStore, 'marketplace' | 'name'>): string {
  return LOGSTOKA_ROUTES.marketplaceStore(store.marketplace, slugifyStoreName(store.name));
}

export function allStoresPagePath(): string {
  return LOGSTOKA_ROUTES.PRODUCTS;
}

function resolveMarketplaceFromPathSegment(segment: string): Marketplace | null {
  const normalized = segment.toLowerCase();
  if (normalized === 'marcadolivre') return 'mercadolivre';
  if (OPERATIONAL_MARKETPLACES.includes(normalized as Marketplace)) return normalized as Marketplace;
  return null;
}

export function resolveActiveStoreFromPath(pathname: string, stores: LsStore[]): ActiveStoreSelection {
  const match = pathname.match(/^\/app\/([^/]+)\/([^/?#]+)/);
  if (!match) return null;

  const marketplace = resolveMarketplaceFromPathSegment(match[1] ?? '');
  if (!marketplace) return null;

  const slug = match[2] ?? '';
  const store = stores.find((item) => item.marketplace === marketplace && slugifyStoreName(item.name) === slug);
  if (!store) return null;

  return {
    storeId: store.id,
    marketplace: store.marketplace,
    slug,
    name: store.name,
  };
}

export function storeListLabel(store: LsStore): string {
  const marketplace = MARKETPLACE_LABELS[store.marketplace];
  return `${store.name} · ${marketplace}`;
}

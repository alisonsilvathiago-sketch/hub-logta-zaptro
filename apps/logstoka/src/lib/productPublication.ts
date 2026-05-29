/**
 * Central de Publicação — fluxo LogStoka (estoque + integração, não ERP-first)
 * Ver: .cursor/rules/logstoka-publication-flow.mdc
 */
import type { LsProduct, ProductPublicationStatus } from '@/types';
import { MARKETPLACE_STORE_STATS, type MarketplaceStoreStats } from '@/lib/marketplaceStores';

export const PUBLICATION_STATUS_LABELS: Record<ProductPublicationStatus, string> = {
  draft: 'Rascunho',
  review: 'Revisão',
  ready: 'Pronto para publicar',
  published: 'Publicado',
};

export type StorePublicationState = {
  storeId: string;
  status: 'published' | 'pending' | 'error';
  publishedAt?: string;
  listingId?: string;
};

export type StoreGroup = {
  id: string;
  name: string;
  description: string;
  storeIds: string[];
};

/** Grupos de lojas — mesmo segmento em vários marketplaces */
export const DEMO_STORE_GROUPS: StoreGroup[] = [
  {
    id: 'grp-bebe',
    name: 'Grupo Bebê',
    description: 'Pluma Baby, Baby Bear — segmento infantil',
    storeIds: ['store-2', 'store-4', 'store-6'],
  },
  {
    id: 'grp-stock',
    name: 'Grupo Stock',
    description: 'Stock Express, Stock 2.0 — utilidades e geral',
    storeIds: ['store-1', 'store-3', 'store-5'],
  },
  {
    id: 'grp-amazon',
    name: 'Grupo Amazon',
    description: 'Conta Amazon Oficial',
    storeIds: ['store-7'],
  },
];

const LS_PUBLISH_KEY = 'logstoka-store-publications';

type PublicationMap = Record<string, Record<string, StorePublicationState>>;

function readMap(companyId: string): PublicationMap {
  try {
    const raw = localStorage.getItem(`${LS_PUBLISH_KEY}:${companyId}`);
    return raw ? (JSON.parse(raw) as PublicationMap) : {};
  } catch {
    return {};
  }
}

function writeMap(companyId: string, map: PublicationMap): void {
  localStorage.setItem(`${LS_PUBLISH_KEY}:${companyId}`, JSON.stringify(map));
}

export function getAllConnectedStores(): MarketplaceStoreStats[] {
  return MARKETPLACE_STORE_STATS.filter((s) => s.is_active);
}

export function getStoreById(storeId: string): MarketplaceStoreStats | undefined {
  return MARKETPLACE_STORE_STATS.find((s) => s.id === storeId);
}

export function getStoreGroup(groupId: string): StoreGroup | undefined {
  return DEMO_STORE_GROUPS.find((g) => g.id === groupId);
}

export function getProductStorePublications(companyId: string, productId: string): StorePublicationState[] {
  const map = readMap(companyId);
  return Object.values(map[productId] ?? {});
}

export function isPublishedOnStore(companyId: string, productId: string, storeId: string): boolean {
  return readMap(companyId)[productId]?.[storeId]?.status === 'published';
}

export function validateProductForPublication(product: LsProduct): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!product.main_image_url) errors.push('Falta foto principal');
  if (!product.description?.trim()) errors.push('Falta descrição completa');
  if (!product.description_short?.trim()) errors.push('Falta descrição curta');
  if (!product.weight_kg || product.weight_kg <= 0) errors.push('Falta peso (kg)');
  if (!product.height_cm || !product.width_cm || !product.length_cm) errors.push('Faltam dimensões (cm)');
  if (!product.category_id) errors.push('Falta categoria');
  if (!product.barcode?.trim()) errors.push('Falta código de barras (EAN/GTIN)');
  if (!product.ncm?.trim()) errors.push('Falta NCM');
  return { ok: errors.length === 0, errors };
}

export function publishProductToStores(
  companyId: string,
  productId: string,
  storeIds: string[],
): { ok: string[]; failed: string[] } {
  const map = readMap(companyId);
  if (!map[productId]) map[productId] = {};
  const now = new Date().toISOString();
  const ok: string[] = [];
  const failed: string[] = [];

  for (const storeId of storeIds) {
    const store = getStoreById(storeId);
    if (!store) {
      failed.push(storeId);
      continue;
    }
    map[productId][storeId] = {
      storeId,
      status: 'published',
      publishedAt: now,
      listingId: `${store.marketplace.toUpperCase().slice(0, 2)}-${Date.now().toString(36)}`,
    };
    ok.push(storeId);
  }

  writeMap(companyId, map);
  return { ok, failed };
}

export function unpublishFromStore(companyId: string, productId: string, storeId: string): void {
  const map = readMap(companyId);
  if (map[productId]?.[storeId]) {
    delete map[productId][storeId];
    writeMap(companyId, map);
  }
}

export function countPublishedStores(companyId: string, productId: string): number {
  return getProductStorePublications(companyId, productId).filter((p) => p.status === 'published').length;
}

/** Produtos com ao menos uma loja publicada */
export function countPublishedProducts(companyId: string): number {
  const map = readMap(companyId);
  return Object.values(map).filter((stores) =>
    Object.values(stores).some((s) => s.status === 'published'),
  ).length;
}

/** Total de vínculos produto × loja publicados */
export function countAllPublicationLinks(companyId: string): number {
  const map = readMap(companyId);
  let n = 0;
  for (const stores of Object.values(map)) {
    n += Object.values(stores).filter((s) => s.status === 'published').length;
  }
  return n;
}

export function storesGroupedByMarketplace(): Record<string, MarketplaceStoreStats[]> {
  const grouped: Record<string, MarketplaceStoreStats[]> = {};
  for (const store of getAllConnectedStores()) {
    if (!grouped[store.marketplace]) grouped[store.marketplace] = [];
    grouped[store.marketplace].push(store);
  }
  return grouped;
}

export function storeLabel(store: MarketplaceStoreStats): string {
  return `${store.name}`;
}

export function storeFullLabel(store: MarketplaceStoreStats): string {
  const mp = store.marketplace.charAt(0).toUpperCase() + store.marketplace.slice(1);
  return `${store.name} · ${mp}`;
}

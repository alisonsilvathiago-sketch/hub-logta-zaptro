import { MARKETPLACE_PRODUCT_MAP } from '@/lib/marketplaceHub';
import type { Marketplace } from '@/types';

/** Marketplaces onde o produto demo já está vinculado (via mapa de integração) */
export function getLinkedMarketplaces(productId: string): Marketplace[] {
  const linked: Marketplace[] = [];
  for (const [mp, ids] of Object.entries(MARKETPLACE_PRODUCT_MAP) as [Marketplace, string[]][]) {
    if (ids.includes(productId)) linked.push(mp);
  }
  return linked;
}

/**
 * LogStoka — Marketplace Hub (arquitetura alvo)
 *
 * Fonte da verdade: cadastro mestre de produtos (SKU único).
 * Ver regra: .cursor/rules/logstoka-master-catalog-pim-hub.mdc
 *
 * Pipeline de eventos:
 *   Marketplace → Webhook → Fila → Processamento → DB → Estoque → Dashboard
 *
 * Direções de sync:
 *   - INBOUND: pedidos, estoque, entregas, cancelamentos, devoluções, updates de produto
 *   - OUTBOUND: produtos, estoque, preço, descrição, imagens, ativar/desativar anúncio
 */

export const MARKETPLACE_CHANNELS = ['shopee', 'mercadolivre', 'amazon', 'tiktok', 'magalu'] as const;

export type MarketplaceChannel = (typeof MARKETPLACE_CHANNELS)[number];

/** Eventos de webhook que o hub deve aceitar (implementação futura) */
export const MARKETPLACE_WEBHOOK_EVENTS = [
  'order.created',
  'order.paid',
  'order.shipped',
  'order.delivered',
  'order.cancelled',
  'order.returned',
  'inventory.updated',
  'product.updated',
] as const;

export type MarketplaceWebhookEvent = (typeof MARKETPLACE_WEBHOOK_EVENTS)[number];

/** Vínculo SKU mestre ↔ canal */
export type MarketplaceSkuLink = {
  marketplace: MarketplaceChannel;
  externalSku: string;
  listingId?: string;
  lastSyncAt?: string;
  syncStatus: 'linked' | 'divergent' | 'pending' | 'error';
};

export type MasterProductChannelMap = {
  masterSku: string;
  links: MarketplaceSkuLink[];
};

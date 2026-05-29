/**
 * Domínios e rotas públicas — espelho do frontend (logstokaApiDomains.ts).
 */

export const LOGSTOKA_DOMAINS = {
  landing: 'https://logstoka.com.br',
  app: 'https://app.logstoka.com.br',
  api: 'https://api.logstoka.com.br',
} as const;

export const MARKETPLACE_SLUGS = [
  'mercadolivre',
  'shopee',
  'tiktok',
  'amazon',
  'magalu',
] as const;

export type MarketplaceSlug = (typeof MARKETPLACE_SLUGS)[number];

export const OAUTH_CALLBACK_PATH = (slug: MarketplaceSlug) =>
  `/integrations/${slug}/callback` as const;

export const WEBHOOK_PATH = (slug: MarketplaceSlug) => `/webhooks/${slug}` as const;

export function getPublicApiBaseUrl(): string {
  const env = process.env.LOGSTOKA_API_PUBLIC_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production') return `http://localhost:${process.env.PORT || 8788}`;
  return LOGSTOKA_DOMAINS.api;
}

export function isValidMarketplaceSlug(value: string): value is MarketplaceSlug {
  return (MARKETPLACE_SLUGS as readonly string[]).includes(value);
}

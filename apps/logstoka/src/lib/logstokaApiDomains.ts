/**
 * Domínios e rotas públicas LogStoka — produção.
 * Ver: LOGSTOKA_API_DOMAINS.md · .cursor/rules/logstoka-api-domains-oauth.mdc
 */

export const LOGSTOKA_DOMAINS = {
  landing: 'https://logstoka.com.br',
  app: 'https://app.logstoka.com.br',
  api: 'https://api.logstoka.com.br',
} as const;

export const LOGSTOKA_MARKETPLACE_SLUGS = [
  'mercadolivre',
  'shopee',
  'tiktok',
  'amazon',
  'magalu',
] as const;

export type LogstokaMarketplaceSlug = (typeof LOGSTOKA_MARKETPLACE_SLUGS)[number];

export const LOGSTOKA_OAUTH_CALLBACK_PATHS: Record<LogstokaMarketplaceSlug, string> = {
  mercadolivre: '/integrations/mercadolivre/callback',
  shopee: '/integrations/shopee/callback',
  tiktok: '/integrations/tiktok/callback',
  amazon: '/integrations/amazon/callback',
  magalu: '/integrations/magalu/callback',
};

export const LOGSTOKA_WEBHOOK_PATHS: Record<LogstokaMarketplaceSlug, string> = {
  mercadolivre: '/webhooks/mercadolivre',
  shopee: '/webhooks/shopee',
  tiktok: '/webhooks/tiktok',
  amazon: '/webhooks/amazon',
  magalu: '/webhooks/magalu',
};

/** Mercado Livre Developers — usar Authorization Code + Refresh Token (não Client Credentials). */
export const MERCADOLIVRE_OAUTH_MODES = {
  authorizationCode: true,
  refreshToken: true,
  clientCredentials: false,
} as const;

export function getLogstokaApiBaseUrl(): string {
  const env = import.meta.env.VITE_LOGSTOKA_API_PUBLIC_URL as string | undefined;
  if (env?.trim()) return env.replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://localhost:8788';
  return LOGSTOKA_DOMAINS.api;
}

export function oauthCallbackUrl(marketplace: LogstokaMarketplaceSlug): string {
  return `${getLogstokaApiBaseUrl()}${LOGSTOKA_OAUTH_CALLBACK_PATHS[marketplace]}`;
}

export function webhookInboundUrl(marketplace: LogstokaMarketplaceSlug): string {
  return `${getLogstokaApiBaseUrl()}${LOGSTOKA_WEBHOOK_PATHS[marketplace]}`;
}

export function listMarketplaceIntegrationUrls() {
  return LOGSTOKA_MARKETPLACE_SLUGS.map((slug) => ({
    slug,
    oauthCallback: oauthCallbackUrl(slug),
    webhook: webhookInboundUrl(slug),
  }));
}

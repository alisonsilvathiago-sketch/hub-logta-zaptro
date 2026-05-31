import type { IntegrationProviderId } from '@/lib/integrationsCatalog';
import { marketplaceHubPath } from '@/lib/marketplaceHub';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import type { Marketplace } from '@/types';
import { MARKETPLACE_LABELS } from '@/types';

/**
 * Registro permanente de marcas LogStoka — assets em public/integrations/brands/.
 * Não remover entradas; novos canais apenas acrescentam chaves.
 */
export type BrandAssetKey = IntegrationProviderId | Marketplace | 'ifood' | 'nuvemshop' | 'tray' | 'bagy' | 'loja_integrada';

export type IntegrationBrandAsset = {
  label: string;
  /** SVG preferencial (vetor) */
  svg: string;
  /** PNG fallback oficial salvo no sistema */
  png: string;
  hubPath?: string;
  permanent: true;
};

const BRAND_BASE = '/integrations/brands';

function brand(id: string, label: string, hubPath?: string): IntegrationBrandAsset {
  return {
    label,
    svg: `${BRAND_BASE}/${id}.svg`,
    png: `${BRAND_BASE}/${id}.png`,
    hubPath,
    permanent: true,
  };
}

export const INTEGRATION_BRAND_ASSETS: Record<BrandAssetKey, IntegrationBrandAsset> = {
  shopee: brand('shopee', MARKETPLACE_LABELS.shopee, marketplaceHubPath('shopee')),
  mercadolivre: brand('mercadolivre', MARKETPLACE_LABELS.mercadolivre, marketplaceHubPath('mercadolivre')),
  amazon: brand('amazon', MARKETPLACE_LABELS.amazon, marketplaceHubPath('amazon')),
  tiktok: brand('tiktok', MARKETPLACE_LABELS.tiktok, marketplaceHubPath('tiktok')),
  magalu: brand('magalu', MARKETPLACE_LABELS.magalu, marketplaceHubPath('magalu')),
  shein: brand('shein', 'Shein'),
  bling: brand('bling', 'Bling', LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL),
  tiny: brand('tiny', 'Tiny', LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL),
  omie: brand('omie', 'Omie', LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL),
  contaazul: brand('contaazul', 'Conta Azul', LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL),
  asaas: brand('asaas', 'Asaas', LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL),
  mercadopago: brand('mercadopago', 'Mercado Pago', LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL),
  stripe: brand('stripe', 'Stripe', LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL),
  pagseguro: brand('pagseguro', 'PagSeguro', LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL),
  zaptro: brand('zaptro', 'Zaptro', `${LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL}?channel=whatsapp`),
  whatsapp: brand('whatsapp', 'WhatsApp', `${LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL}?channel=whatsapp`),
  n8n: brand('n8n', 'N8N', LOGSTOKA_ROUTES.SETTINGS_API),
  make: brand('make', 'Make', LOGSTOKA_ROUTES.SETTINGS_API),
  zapier: brand('zapier', 'Zapier', LOGSTOKA_ROUTES.SETTINGS_API),
  ifood: brand('ifood', 'iFood'),
  nuvemshop: brand('nuvemshop', 'Nuvemshop'),
  tray: brand('tray', 'Tray'),
  bagy: brand('bagy', 'Bagy'),
  loja_integrada: brand('loja-integrada', 'Loja Integrada'),
};

export function getIntegrationBrand(key: string): IntegrationBrandAsset | null {
  const normalized = key.toLowerCase().replace(/-/g, '_');
  if (normalized in INTEGRATION_BRAND_ASSETS) {
    return INTEGRATION_BRAND_ASSETS[normalized as BrandAssetKey];
  }
  if (key in INTEGRATION_BRAND_ASSETS) {
    return INTEGRATION_BRAND_ASSETS[key as BrandAssetKey];
  }
  return null;
}

export function getIntegrationBrandLabel(key: string): string {
  return getIntegrationBrand(key)?.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getIntegrationBrandHubPath(key: string): string | undefined {
  return getIntegrationBrand(key)?.hubPath;
}

/** Marketplaces com logo + página operacional */
export const MARKETPLACE_BRAND_KEYS: Marketplace[] = [
  'shopee',
  'mercadolivre',
  'amazon',
  'tiktok',
  'magalu',
];

/** Lojas virtuais / canais extras — assets permanentes em public/integrations/brands/ */
export const ECOMMERCE_BRAND_KEYS = [
  'ifood',
  'nuvemshop',
  'tray',
  'bagy',
  'loja_integrada',
] as const;

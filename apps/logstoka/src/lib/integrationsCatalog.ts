/** Catálogo de integrações — Central de Integrações LogStoka */

export type IntegrationCategory = 'marketplaces' | 'erp' | 'payments' | 'communication' | 'api';

export type IntegrationProviderId =
  | 'shopee'
  | 'mercadolivre'
  | 'amazon'
  | 'tiktok'
  | 'magalu'
  | 'shein'
  | 'bling'
  | 'tiny'
  | 'omie'
  | 'contaazul'
  | 'asaas'
  | 'mercadopago'
  | 'stripe'
  | 'pagseguro'
  | 'zaptro'
  | 'whatsapp'
  | 'n8n'
  | 'make'
  | 'zapier';

export type IntegrationProvider = {
  id: IntegrationProviderId;
  category: IntegrationCategory;
  name: string;
  description: string;
  logoColor: string;
  oauthSupported: boolean;
  marketplaceSlug?: string;
};

export const INTEGRATION_TABS: { id: IntegrationCategory | 'api'; label: string }[] = [
  { id: 'marketplaces', label: 'Marketplaces' },
  { id: 'erp', label: 'ERP' },
  { id: 'payments', label: 'Pagamentos' },
  { id: 'communication', label: 'Comunicação' },
  { id: 'api', label: 'APIs e Webhooks' },
];

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  { id: 'shopee', category: 'marketplaces', name: 'Shopee', description: 'Pedidos, estoque e devoluções', logoColor: 'EE4D2D', oauthSupported: true, marketplaceSlug: 'shopee' },
  { id: 'mercadolivre', category: 'marketplaces', name: 'Mercado Livre', description: 'OAuth oficial · multi-loja', logoColor: 'FFE600', oauthSupported: true, marketplaceSlug: 'mercadolivre' },
  { id: 'amazon', category: 'marketplaces', name: 'Amazon', description: 'Seller Central · FBA', logoColor: 'FF9900', oauthSupported: true, marketplaceSlug: 'amazon' },
  { id: 'tiktok', category: 'marketplaces', name: 'TikTok Shop', description: 'Live commerce e pedidos', logoColor: '010101', oauthSupported: true, marketplaceSlug: 'tiktok' },
  { id: 'magalu', category: 'marketplaces', name: 'Magalu', description: 'Marketplace e Magalu Entregas', logoColor: '0086FF', oauthSupported: true, marketplaceSlug: 'magalu' },
  { id: 'shein', category: 'marketplaces', name: 'Shein', description: 'Em breve', logoColor: '000000', oauthSupported: false },
  { id: 'bling', category: 'erp', name: 'Bling', description: 'ERP · NF-e e estoque', logoColor: '00A859', oauthSupported: true },
  { id: 'tiny', category: 'erp', name: 'Tiny', description: 'ERP cloud', logoColor: '0066CC', oauthSupported: true },
  { id: 'omie', category: 'erp', name: 'Omie', description: 'ERP financeiro', logoColor: '00B8D4', oauthSupported: true },
  { id: 'contaazul', category: 'erp', name: 'Conta Azul', description: 'Gestão empresarial', logoColor: '2687E9', oauthSupported: true },
  { id: 'asaas', category: 'payments', name: 'Asaas', description: 'Cobranças e PIX', logoColor: '0030B9', oauthSupported: true },
  { id: 'mercadopago', category: 'payments', name: 'Mercado Pago', description: 'Pagamentos ML', logoColor: '009EE3', oauthSupported: true },
  { id: 'stripe', category: 'payments', name: 'Stripe', description: 'Pagamentos globais', logoColor: '635BFF', oauthSupported: true },
  { id: 'pagseguro', category: 'payments', name: 'PagSeguro', description: 'Checkout e links', logoColor: 'FFC801', oauthSupported: true },
  { id: 'zaptro', category: 'communication', name: 'Zaptro', description: 'WhatsApp · automação', logoColor: 'EA580C', oauthSupported: true },
  { id: 'whatsapp', category: 'communication', name: 'WhatsApp', description: 'API Business Meta', logoColor: '25D366', oauthSupported: true },
  { id: 'n8n', category: 'communication', name: 'N8N', description: 'Workflows', logoColor: 'EA4B71', oauthSupported: false },
  { id: 'make', category: 'communication', name: 'Make', description: 'Automação visual', logoColor: '6D00CC', oauthSupported: false },
  { id: 'zapier', category: 'communication', name: 'Zapier', description: 'Integrações no-code', logoColor: 'FF4A00', oauthSupported: false },
];

export function providersByCategory(category: IntegrationCategory): IntegrationProvider[] {
  return INTEGRATION_PROVIDERS.filter((p) => p.category === category);
}

export function getProvider(id: IntegrationProviderId): IntegrationProvider | undefined {
  return INTEGRATION_PROVIDERS.find((p) => p.id === id);
}

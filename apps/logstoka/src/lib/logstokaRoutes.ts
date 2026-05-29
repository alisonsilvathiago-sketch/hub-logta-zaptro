export const LOGSTOKA_ROUTES = {
  HOME: '/app',
  PRODUCTS: '/app/products',
  PRODUCT_GROUPS: '/app/products/grupos',
  PRODUCT_PUBLICATION: '/app/products/publicacao',
  PRODUCT_SYNC: '/app/products/sincronizacao',
  DASHBOARD: '/app/dashboard',
  INTEGRATIONS_CENTRAL: '/app/integrations',
  SETTINGS: '/app/configuracoes',
  SETTINGS_PROFILE: '/app/configuracoes/meu-perfil',
  SETTINGS_COMPANY: '/app/configuracoes/empresa',
  SETTINGS_TEAM: '/app/configuracoes/equipe',
  SETTINGS_TEAM_RANKING: '/app/configuracoes/equipe/ranking',
  SETTINGS_API: '/app/configuracoes/api-webhooks',
  SETTINGS_INTEGRATIONS: '/app/integrations',
  marketplaceStore: (marketplace: string, storeSlug?: string) =>
    storeSlug
      ? `/app/configuracoes/integracoes/${marketplace}/${storeSlug}`
      : `/app/configuracoes/integracoes/${marketplace}`,
  SETTINGS_MARKETPLACES: '/app/configuracoes/integracoes/marketplaces',
  SETTINGS_NOTIFICATIONS: '/app/configuracoes/notificacoes',
  SETTINGS_AUDIT: '/app/configuracoes/auditoria',
  SETTINGS_SECURITY: '/app/configuracoes/seguranca',
  SETTINGS_WHITE_LABEL: '/app/configuracoes/white-label',
  /** @deprecated use SETTINGS_PROFILE */
  PROFILE: '/app/configuracoes/meu-perfil',
  /** @deprecated use SETTINGS_COMPANY */
  COMPANY: '/app/configuracoes/empresa',
  /** @deprecated use SETTINGS_TEAM */
  COLLABORATORS: '/app/configuracoes/equipe',
  /** @deprecated use SETTINGS_TEAM_RANKING */
  RANKING: '/app/configuracoes/equipe/ranking',
  /** @deprecated use SETTINGS_AUDIT */
  INTERACTIONS: '/app/configuracoes/auditoria',
  /** @deprecated use INTEGRATIONS_CENTRAL */
  INTEGRATIONS: '/app/integrations',
  /** @deprecated use SETTINGS_MARKETPLACES */
  MARKETPLACES: '/app/configuracoes/integracoes/marketplaces',
  ALERTS: '/app/configuracoes/notificacoes?tab=alertas',
  MERCADOLIVRE: '/app/mercadolivre',
  SHOPEE: '/app/shopee',
  AMAZON: '/app/amazon',
  TIKTOK: '/app/tiktok',
  MAGALU: '/app/magalu',
  marketplaceHub: (marketplace: string) => `/app/${marketplace}`,
} as const;

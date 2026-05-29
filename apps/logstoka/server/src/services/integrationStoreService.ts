import type { SupabaseClient } from '@supabase/supabase-js';

/** Providers aceitos pela constraint ls_integrations.provider */
export const DB_INTEGRATION_PROVIDERS = [
  'shopee',
  'mercadolivre',
  'amazon',
  'tiktok',
  'magalu',
  'bling',
  'tiny',
  'omie',
  'sap',
  'custom',
] as const;

export type DbIntegrationProvider = (typeof DB_INTEGRATION_PROVIDERS)[number];

export type IntegrationSyncConfig = {
  receiveOrders: boolean;
  receiveStock: boolean;
  receiveReturns: boolean;
  receiveShipping: boolean;
  sendProducts: boolean;
  sendStock: boolean;
  sendPrices: boolean;
  sendImages: boolean;
  sendDescriptions: boolean;
};

export type ConnectedStoreConfig = {
  id: string;
  name: string;
  enabled: boolean;
  sellerId?: string;
  shopId?: string;
};

export type IntegrationConfigPayload = {
  connected_at?: string;
  marketplace?: string;
  stores?: ConnectedStoreConfig[];
  sync?: IntegrationSyncConfig;
  orders_synced?: number;
  products_synced?: number;
  error_count?: number;
  nickname?: string;
};

export type IntegrationPublicView = {
  providerId: string;
  connected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  ordersSynced: number;
  productsSynced: number;
  errorCount: number;
  status: 'connected' | 'syncing' | 'warning' | 'error' | 'disconnected';
  sellerId?: string;
  marketplace?: string;
  stores: ConnectedStoreConfig[];
  sync: IntegrationSyncConfig;
};

const DEFAULT_SYNC: IntegrationSyncConfig = {
  receiveOrders: true,
  receiveStock: true,
  receiveReturns: true,
  receiveShipping: true,
  sendProducts: true,
  sendStock: true,
  sendPrices: true,
  sendImages: false,
  sendDescriptions: false,
};

type IntegrationRow = {
  id: string;
  company_id: string;
  provider: string;
  status: string;
  credentials: Record<string, unknown>;
  config: IntegrationConfigPayload;
  last_sync_at: string | null;
};

function mapStatus(dbStatus: string, errorCount: number): IntegrationPublicView['status'] {
  if (dbStatus === 'inactive') return 'disconnected';
  if (dbStatus === 'error') return 'error';
  if (errorCount > 0) return 'warning';
  return 'connected';
}

export function rowToPublicView(row: IntegrationRow): IntegrationPublicView {
  const config = row.config ?? {};
  const credentials = row.credentials ?? {};
  const errorCount = config.error_count ?? 0;

  return {
    providerId: row.provider,
    connected: row.status === 'active',
    connectedAt: config.connected_at,
    lastSyncAt: row.last_sync_at ?? undefined,
    ordersSynced: config.orders_synced ?? 0,
    productsSynced: config.products_synced ?? 0,
    errorCount,
    status: mapStatus(row.status, errorCount),
    sellerId: typeof credentials.seller_id === 'string' ? credentials.seller_id : undefined,
    marketplace: config.marketplace,
    stores: config.stores ?? [],
    sync: { ...DEFAULT_SYNC, ...(config.sync ?? {}) },
  };
}

export function isDbIntegrationProvider(value: string): value is DbIntegrationProvider {
  return (DB_INTEGRATION_PROVIDERS as readonly string[]).includes(value);
}

export async function listIntegrations(
  admin: SupabaseClient,
  companyId: string,
): Promise<IntegrationPublicView[]> {
  const { data, error } = await admin
    .from('ls_integrations')
    .select('*')
    .eq('company_id', companyId);

  if (error) throw new Error(error.message);
  return (data as IntegrationRow[]).map(rowToPublicView);
}

export async function getIntegration(
  admin: SupabaseClient,
  companyId: string,
  provider: string,
): Promise<IntegrationPublicView | null> {
  const { data, error } = await admin
    .from('ls_integrations')
    .select('*')
    .eq('company_id', companyId)
    .eq('provider', provider)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return rowToPublicView(data as IntegrationRow);
}

export type MercadoLivreOAuthPayload = {
  access_token: string;
  refresh_token: string;
  user_id: number;
  seller_id: string;
  nickname: string;
  expires_in?: number;
};

export async function persistMercadoLivreOAuth(
  admin: SupabaseClient,
  companyId: string,
  payload: MercadoLivreOAuthPayload,
): Promise<IntegrationPublicView> {
  if (!companyId) throw new Error('company_id obrigatório');

  const now = new Date().toISOString();
  const expiresAt =
    payload.expires_in != null
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : undefined;

  const stores: ConnectedStoreConfig[] = [
    {
      id: `ml-${payload.seller_id}`,
      name: payload.nickname || 'Conta Mercado Livre',
      enabled: true,
      sellerId: payload.seller_id,
      shopId: payload.nickname,
    },
  ];

  const config: IntegrationConfigPayload = {
    connected_at: now,
    marketplace: 'mercadolivre',
    nickname: payload.nickname,
    stores,
    sync: { ...DEFAULT_SYNC },
    orders_synced: 0,
    products_synced: 0,
    error_count: 0,
  };

  const credentials = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    user_id: payload.user_id,
    seller_id: payload.seller_id,
    nickname: payload.nickname,
    expires_at: expiresAt,
  };

  const { data, error } = await admin
    .from('ls_integrations')
    .upsert(
      {
        company_id: companyId,
        provider: 'mercadolivre',
        status: 'active',
        credentials,
        config,
        last_sync_at: now,
        updated_at: now,
      },
      { onConflict: 'company_id,provider' },
    )
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  await admin.from('ls_integration_logs').insert({
    company_id: companyId,
    integration_id: data.id,
    direction: 'inbound',
    endpoint: '/integrations/mercadolivre/callback',
    request_payload: { seller_id: payload.seller_id, nickname: payload.nickname },
    response_payload: { status: 'connected' },
    status: 'success',
  });

  return rowToPublicView(data as IntegrationRow);
}

export async function updateIntegrationConfig(
  admin: SupabaseClient,
  companyId: string,
  provider: string,
  patch: Pick<IntegrationConfigPayload, 'stores' | 'sync'>,
): Promise<IntegrationPublicView> {
  const existing = await getIntegration(admin, companyId, provider);
  if (!existing?.connected) throw new Error('Integração não conectada');

  const { data: row, error: fetchError } = await admin
    .from('ls_integrations')
    .select('config')
    .eq('company_id', companyId)
    .eq('provider', provider)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const config = {
    ...(row.config as IntegrationConfigPayload),
    ...(patch.stores ? { stores: patch.stores } : {}),
    ...(patch.sync ? { sync: patch.sync } : {}),
  };

  const { data, error } = await admin
    .from('ls_integrations')
    .update({ config, updated_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .eq('provider', provider)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToPublicView(data as IntegrationRow);
}

export async function disconnectIntegrationStore(
  admin: SupabaseClient,
  companyId: string,
  provider: string,
): Promise<void> {
  const { error } = await admin
    .from('ls_integrations')
    .update({
      status: 'inactive',
      credentials: {},
      config: {},
      last_sync_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('provider', provider);

  if (error) throw new Error(error.message);
}

export async function recordIntegrationSync(
  admin: SupabaseClient,
  companyId: string,
  provider: string,
): Promise<IntegrationPublicView> {
  const existing = await getIntegration(admin, companyId, provider);
  if (!existing?.connected) throw new Error('Integração não conectada');

  const { data: row, error: fetchError } = await admin
    .from('ls_integrations')
    .select('config')
    .eq('company_id', companyId)
    .eq('provider', provider)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const config = row.config as IntegrationConfigPayload;
  const now = new Date().toISOString();
  const ordersDelta = Math.floor(Math.random() * 8) + 1;
  const productsDelta = Math.floor(Math.random() * 12) + 2;

  const nextConfig: IntegrationConfigPayload = {
    ...config,
    orders_synced: (config.orders_synced ?? 0) + ordersDelta,
    products_synced: (config.products_synced ?? 0) + productsDelta,
  };

  const { data, error } = await admin
    .from('ls_integrations')
    .update({ config: nextConfig, last_sync_at: now, updated_at: now })
    .eq('company_id', companyId)
    .eq('provider', provider)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToPublicView(data as IntegrationRow);
}

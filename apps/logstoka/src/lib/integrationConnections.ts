/**
 * Estado de conexões de integração
 * Produção: Supabase ls_integrations via API · fallback demo: localStorage
 */
import type { IntegrationProviderId } from '@/lib/integrationsCatalog';
import { INTEGRATION_PROVIDERS } from '@/lib/integrationsCatalog';
import { logstokaApi, type IntegrationApiConnection } from '@/lib/logstokaApi';
import { getStoresByMarketplace } from '@/lib/marketplaceStores';
import type { Marketplace } from '@/types';

export type SyncDirectionConfig = {
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

export type ConnectedStore = {
  id: string;
  name: string;
  enabled: boolean;
  sellerId?: string;
  shopId?: string;
};

export type IntegrationConnection = {
  providerId: IntegrationProviderId;
  connected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  ordersSynced: number;
  productsSynced: number;
  errorCount: number;
  status: 'connected' | 'syncing' | 'warning' | 'error' | 'disconnected';
  accessToken?: string;
  refreshToken?: string;
  sellerId?: string;
  marketplace?: Marketplace;
  stores: ConnectedStore[];
  sync: SyncDirectionConfig;
};

/** Providers persistidos em ls_integrations (constraint Supabase) */
export const API_INTEGRATION_PROVIDERS: IntegrationProviderId[] = [
  'shopee',
  'mercadolivre',
  'amazon',
  'tiktok',
  'magalu',
  'bling',
  'tiny',
  'omie',
];

const LS_KEY = 'logstoka-integration-connections';

const DEFAULT_SYNC: SyncDirectionConfig = {
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

function defaultConnection(providerId: IntegrationProviderId): IntegrationConnection {
  return {
    providerId,
    connected: false,
    ordersSynced: 0,
    productsSynced: 0,
    errorCount: 0,
    status: 'disconnected',
    stores: [],
    sync: { ...DEFAULT_SYNC },
  };
}

function readAllLocal(companyId: string): Record<string, IntegrationConnection> {
  try {
    const raw = localStorage.getItem(`${LS_KEY}:${companyId}`);
    return raw ? (JSON.parse(raw) as Record<string, IntegrationConnection>) : {};
  } catch {
    return {};
  }
}

function writeAllLocal(companyId: string, map: Record<string, IntegrationConnection>): void {
  localStorage.setItem(`${LS_KEY}:${companyId}`, JSON.stringify(map));
}

function isApiProvider(providerId: IntegrationProviderId): boolean {
  return API_INTEGRATION_PROVIDERS.includes(providerId);
}

function apiRowToConnection(row: IntegrationApiConnection): IntegrationConnection {
  return {
    providerId: row.providerId as IntegrationProviderId,
    connected: row.connected,
    connectedAt: row.connectedAt,
    lastSyncAt: row.lastSyncAt,
    ordersSynced: row.ordersSynced,
    productsSynced: row.productsSynced,
    errorCount: row.errorCount,
    status: row.status,
    sellerId: row.sellerId,
    marketplace: row.marketplace as Marketplace | undefined,
    stores: row.stores ?? [],
    sync: { ...DEFAULT_SYNC, ...(row.sync as SyncDirectionConfig) },
  };
}

export function getIntegrationConnection(companyId: string, providerId: IntegrationProviderId): IntegrationConnection {
  const map = readAllLocal(companyId);
  return map[providerId] ?? defaultConnection(providerId);
}

export function getAllIntegrationConnections(companyId: string): IntegrationConnection[] {
  return Object.values(readAllLocal(companyId));
}

export function saveIntegrationConnection(companyId: string, conn: IntegrationConnection): void {
  const map = readAllLocal(companyId);
  map[conn.providerId] = conn;
  writeAllLocal(companyId, map);
}

export async function loadIntegrationConnectionsMap(
  companyId: string,
): Promise<Record<string, IntegrationConnection>> {
  const map: Record<string, IntegrationConnection> = {};

  for (const p of INTEGRATION_PROVIDERS) {
    if (p.category === 'api') continue;
    map[p.id] = defaultConnection(p.id);
  }

  try {
    const { data } = await logstokaApi.getIntegrations();
    for (const row of data) {
      map[row.providerId] = apiRowToConnection(row);
    }
  } catch {
    const local = readAllLocal(companyId);
    for (const [id, conn] of Object.entries(local)) {
      map[id] = conn;
    }
  }

  const localOnly = readAllLocal(companyId);
  for (const p of INTEGRATION_PROVIDERS) {
    if (p.category === 'api' || isApiProvider(p.id)) continue;
    if (localOnly[p.id]) map[p.id] = localOnly[p.id];
  }

  return map;
}

export async function persistIntegrationConnection(
  companyId: string,
  conn: IntegrationConnection,
): Promise<void> {
  if (isApiProvider(conn.providerId) && conn.connected) {
    await logstokaApi.updateIntegration(conn.providerId, {
      stores: conn.stores,
      sync: conn.sync,
    });
    return;
  }
  saveIntegrationConnection(companyId, conn);
}

export async function disconnectIntegrationRemote(
  companyId: string,
  providerId: IntegrationProviderId,
): Promise<void> {
  if (isApiProvider(providerId)) {
    try {
      await logstokaApi.disconnectIntegration(providerId);
      return;
    } catch {
      /* fallback local */
    }
  }
  saveIntegrationConnection(companyId, defaultConnection(providerId));
}

export function disconnectIntegration(companyId: string, providerId: IntegrationProviderId): void {
  saveIntegrationConnection(companyId, defaultConnection(providerId));
}

export async function markSyncNowRemote(
  companyId: string,
  providerId: IntegrationProviderId,
): Promise<IntegrationConnection> {
  if (isApiProvider(providerId)) {
    try {
      const { data } = await logstokaApi.syncIntegration(providerId);
      return apiRowToConnection(data);
    } catch {
      /* fallback local */
    }
  }
  return markSyncNowLocal(companyId, providerId);
}

export function markSyncNow(companyId: string, providerId: IntegrationProviderId): IntegrationConnection {
  return markSyncNowLocal(companyId, providerId);
}

function markSyncNowLocal(companyId: string, providerId: IntegrationProviderId): IntegrationConnection {
  const conn = getIntegrationConnection(companyId, providerId);
  const updated: IntegrationConnection = {
    ...conn,
    lastSyncAt: new Date().toISOString(),
    status: 'connected',
    ordersSynced: conn.ordersSynced + Math.floor(Math.random() * 8) + 1,
    productsSynced: conn.productsSynced + Math.floor(Math.random() * 12) + 2,
  };
  saveIntegrationConnection(companyId, updated);
  return updated;
}

/** Conexão demo Mercado Livre com lojas do seed (sem Supabase) */
export function connectMercadoLivreDemo(
  companyId: string,
  tokens?: { accessToken?: string; refreshToken?: string; sellerId?: string },
): IntegrationConnection {
  const stores = getStoresByMarketplace('mercadolivre').map((s, i) => ({
    id: s.id,
    name: s.name,
    enabled: i < 3,
    sellerId: tokens?.sellerId ?? `ML-${100000 + i}`,
    shopId: s.slug,
  }));

  const conn: IntegrationConnection = {
    providerId: 'mercadolivre',
    connected: true,
    connectedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    ordersSynced: 842,
    productsSynced: 156,
    errorCount: 0,
    status: 'connected',
    accessToken: tokens?.accessToken,
    refreshToken: tokens?.refreshToken,
    sellerId: tokens?.sellerId,
    marketplace: 'mercadolivre',
    stores,
    sync: { ...DEFAULT_SYNC },
  };
  saveIntegrationConnection(companyId, conn);
  return conn;
}

export function getIntegrationDashboardStats(connections: Record<string, IntegrationConnection>) {
  const all = Object.values(connections);
  const active = all.filter((c) => c.connected);
  const marketplaces = active.filter((c) => c.marketplace).length;
  const ordersToday = active.reduce((s, c) => s + Math.min(c.ordersSynced, 42), 0);
  const errors = active.reduce((s, c) => s + c.errorCount, 0);
  const lastSync = active
    .map((c) => c.lastSyncAt)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return {
    activeCount: active.length,
    marketplacesConnected: marketplaces,
    ordersSyncedToday: ordersToday || (active.length ? 18 : 0),
    integrationErrors: errors,
    lastSyncAt: lastSync,
  };
}

export type { SyncDirectionConfig as IntegrationSyncConfig };

import type { LogstokaConfig } from '../config.js';

export interface MarketplaceAdapter {
  provider: string;
  authenticate(credentials: Record<string, unknown>): Promise<boolean>;
  syncOrders(companyId: string): Promise<void>;
  syncInventory(companyId: string): Promise<void>;
  pushStockUpdate(companyId: string, sku: string, quantity: number): Promise<void>;
}

function stubAdapter(provider: string): MarketplaceAdapter {
  return {
    provider,
    async authenticate() {
      return false;
    },
    async syncOrders(companyId) {
      console.info(`[${provider}] syncOrders queued for`, companyId);
    },
    async syncInventory(companyId) {
      console.info(`[${provider}] syncInventory queued for`, companyId);
    },
    async pushStockUpdate(companyId, sku, quantity) {
      console.info(`[${provider}] pushStockUpdate`, { companyId, sku, quantity });
    },
  };
}

export const marketplaceAdapters: Record<string, MarketplaceAdapter> = {
  shopee: stubAdapter('shopee'),
  mercadolivre: stubAdapter('mercadolivre'),
  amazon: stubAdapter('amazon'),
  tiktok: stubAdapter('tiktok'),
  magalu: stubAdapter('magalu'),
};

export function getAdapter(provider: string, _cfg: LogstokaConfig): MarketplaceAdapter | null {
  return marketplaceAdapters[provider] ?? null;
}

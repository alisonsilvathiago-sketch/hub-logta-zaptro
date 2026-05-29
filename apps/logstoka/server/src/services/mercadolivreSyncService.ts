import type { SupabaseClient } from '@supabase/supabase-js';
import type { LogstokaConfig } from '../config.js';
import type { IntegrationConfigPayload, IntegrationSyncConfig } from './integrationStoreService.js';
import {
  extractSellerSku,
  fetchItemsBatch,
  getValidMercadoLivreAccessToken,
  itemStockQuantity,
  searchUserItemIds,
  updateItemPrice,
  updateItemStock,
  type MLItem,
} from './mercadolivreApiClient.js';

export type MercadoLivreSyncResult = {
  productsImported: number;
  productsUpdated: number;
  stockPulled: number;
  stockPushed: number;
  pricesUpdated: number;
  errors: string[];
};

type ProductRow = {
  id: string;
  sku: string;
  metadata: Record<string, unknown>;
  sale_price: number;
};

async function getOrCreateWarehouse(
  admin: SupabaseClient,
  companyId: string,
  marketplace: 'mercadolivre',
): Promise<string> {
  const { data: existing } = await admin
    .from('ls_warehouses')
    .select('id')
    .eq('company_id', companyId)
    .eq('marketplace', marketplace)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: anyWh } = await admin
    .from('ls_warehouses')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (anyWh?.id) return anyWh.id as string;

  const { data: created, error } = await admin
    .from('ls_warehouses')
    .insert({
      company_id: companyId,
      code: 'FULL-ML',
      name: 'Full Mercado Livre',
      type: 'full_marketplace',
      marketplace,
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !created) throw new Error(error?.message ?? 'Falha ao criar depósito ML');
  return created.id as string;
}

async function setStockAbsolute(
  admin: SupabaseClient,
  companyId: string,
  warehouseId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const { error } = await admin.from('ls_stock').upsert(
    {
      company_id: companyId,
      warehouse_id: warehouseId,
      product_id: productId,
      quantity: Math.max(0, quantity),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'warehouse_id,product_id' },
  );
  if (error) throw new Error(error.message);
}

async function getProductStockTotal(
  admin: SupabaseClient,
  companyId: string,
  productId: string,
): Promise<number> {
  const { data } = await admin
    .from('ls_stock')
    .select('quantity')
    .eq('company_id', companyId)
    .eq('product_id', productId);

  return (data ?? []).reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
}

function mlMetadata(item: MLItem) {
  return {
    mercadolivre: {
      item_id: item.id,
      permalink: item.permalink,
      status: item.status,
      last_synced_at: new Date().toISOString(),
    },
  };
}

async function findProductBySkuOrMlId(
  admin: SupabaseClient,
  companyId: string,
  sku: string,
  itemId: string,
): Promise<ProductRow | null> {
  const { data: bySku } = await admin
    .from('ls_products')
    .select('id, sku, metadata, sale_price')
    .eq('company_id', companyId)
    .eq('sku', sku)
    .maybeSingle();

  if (bySku) return bySku as ProductRow;

  const { data: byMeta } = await admin
    .from('ls_products')
    .select('id, sku, metadata, sale_price')
    .eq('company_id', companyId)
    .contains('metadata', { mercadolivre: { item_id: itemId } })
    .maybeSingle();

  return (byMeta as ProductRow | null) ?? null;
}

async function importItemAsProduct(
  admin: SupabaseClient,
  companyId: string,
  item: MLItem,
  warehouseId: string,
  sync: IntegrationSyncConfig,
  result: MercadoLivreSyncResult,
): Promise<ProductRow | null> {
  const sku = extractSellerSku(item);
  const existing = await findProductBySkuOrMlId(admin, companyId, sku, item.id);
  const imageUrl = item.pictures?.[0]?.url ?? item.thumbnail ?? null;
  const meta = {
    ...((existing?.metadata as Record<string, unknown>) ?? {}),
    ...mlMetadata(item),
  };

  if (existing) {
    const updates: Record<string, unknown> = {
      name: item.title,
      metadata: meta,
      updated_at: new Date().toISOString(),
    };
    if (sync.sendPrices) updates.sale_price = item.price;
    if (imageUrl && sync.sendImages) updates.main_image_url = imageUrl;

    const { data, error } = await admin
      .from('ls_products')
      .update(updates)
      .eq('id', existing.id)
      .select('id, sku, metadata, sale_price')
      .single();

    if (error) {
      result.errors.push(`${sku}: ${error.message}`);
      return null;
    }
    result.productsUpdated += 1;

    if (sync.receiveStock) {
      await setStockAbsolute(admin, companyId, warehouseId, data.id as string, itemStockQuantity(item));
      result.stockPulled += 1;
    }

    return data as ProductRow;
  }

  const { data, error } = await admin
    .from('ls_products')
    .insert({
      company_id: companyId,
      sku,
      name: item.title,
      sale_price: item.price,
      main_image_url: imageUrl,
      metadata: meta,
      status: item.status === 'active' ? 'active' : 'inactive',
    })
    .select('id, sku, metadata, sale_price')
    .single();

  if (error) {
    result.errors.push(`${sku}: ${error.message}`);
    return null;
  }

  result.productsImported += 1;

  if (sync.receiveStock) {
    await setStockAbsolute(admin, companyId, warehouseId, data.id as string, itemStockQuantity(item));
    result.stockPulled += 1;
  }

  return data as ProductRow;
}

async function pushStockToMercadoLivre(
  accessToken: string,
  product: ProductRow,
  itemId: string,
  quantity: number,
  result: MercadoLivreSyncResult,
): Promise<void> {
  try {
    const mlMeta = (product.metadata?.mercadolivre ?? {}) as { variation_id?: number };
    await updateItemStock(accessToken, itemId, quantity, mlMeta.variation_id);
    result.stockPushed += 1;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao enviar estoque';
    result.errors.push(`${product.sku} → ML: ${msg}`);
  }
}

async function pushPriceToMercadoLivre(
  accessToken: string,
  product: ProductRow,
  itemId: string,
  result: MercadoLivreSyncResult,
): Promise<void> {
  try {
    await updateItemPrice(accessToken, itemId, Number(product.sale_price ?? 0));
    result.pricesUpdated += 1;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao enviar preço';
    result.errors.push(`${product.sku} preço → ML: ${msg}`);
  }
}

export async function syncMercadoLivreProductsAndStock(
  cfg: LogstokaConfig,
  admin: SupabaseClient,
  companyId: string,
  integrationId: string,
  sync: IntegrationSyncConfig,
): Promise<MercadoLivreSyncResult> {
  const result: MercadoLivreSyncResult = {
    productsImported: 0,
    productsUpdated: 0,
    stockPulled: 0,
    stockPushed: 0,
    pricesUpdated: 0,
    errors: [],
  };

  const { accessToken, userId } = await getValidMercadoLivreAccessToken(cfg, admin, companyId);
  const warehouseId = await getOrCreateWarehouse(admin, companyId, 'mercadolivre');

  const shouldPull = sync.receiveStock || sync.receiveOrders;
  const shouldImportProducts = shouldPull || sync.sendProducts;

  let mlItems: MLItem[] = [];

  if (shouldImportProducts) {
    const itemIds = await searchUserItemIds(accessToken, userId);
    mlItems = await fetchItemsBatch(accessToken, itemIds);

    for (const item of mlItems) {
      if (item.status !== 'active' && item.status !== 'paused') continue;
      await importItemAsProduct(admin, companyId, item, warehouseId, sync, result);
    }
  }

  if (sync.sendStock || sync.sendPrices) {
    const { data: linkedProducts } = await admin
      .from('ls_products')
      .select('id, sku, metadata, sale_price')
      .eq('company_id', companyId)
      .not('metadata->mercadolivre->item_id', 'is', null);

    const products = (linkedProducts ?? []) as ProductRow[];

    for (const product of products) {
      const ml = (product.metadata?.mercadolivre ?? {}) as { item_id?: string };
      if (!ml.item_id) continue;

      if (sync.sendStock) {
        const qty = await getProductStockTotal(admin, companyId, product.id);
        await pushStockToMercadoLivre(accessToken, product, ml.item_id, qty, result);
      }

      if (sync.sendPrices) {
        await pushPriceToMercadoLivre(accessToken, product, ml.item_id, result);
      }
    }
  }

  await admin.from('ls_integration_logs').insert({
    company_id: companyId,
    integration_id: integrationId,
    direction: 'outbound',
    endpoint: '/v1/integrations/mercadolivre/sync',
    request_payload: { sync },
    response_payload: result,
    status: result.errors.length ? 'warning' : 'success',
  });

  return result;
}

export function applySyncResultToConfig(
  config: IntegrationConfigPayload,
  result: MercadoLivreSyncResult,
): IntegrationConfigPayload {
  const productsDelta = result.productsImported + result.productsUpdated;
  return {
    ...config,
    products_synced: (config.products_synced ?? 0) + productsDelta,
    error_count: (config.error_count ?? 0) + result.errors.length,
  };
}

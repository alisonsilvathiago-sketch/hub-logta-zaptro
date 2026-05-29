/**
 * Fluxo assíncrono de publicação — validação, sync e erros inteligentes.
 */
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { getStoreById, publishProductToStores, validateProductForPublication } from '@/lib/productPublication';
import { marketplaceStorePath } from '@/lib/marketplaceStores';
import type { LsProduct } from '@/types';

export type PublishErrorCode =
  | 'product_incomplete'
  | 'store_syncing'
  | 'store_warning'
  | 'store_inactive'
  | 'sync_interaction'
  | 'unknown';

export type PublishFlowError = {
  code: PublishErrorCode;
  title: string;
  message: string;
  fixPath: string;
  fixLabel: string;
  productId?: string;
  storeId?: string;
};

export type PublishFlowResult =
  | { ok: true; publishedCount: number; storeCount: number; productCount: number }
  | { ok: false; error: PublishFlowError };

const MIN_PUBLISH_MS = 2200;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapValidationToError(product: LsProduct): PublishFlowError {
  const validation = validateProductForPublication(product);
  const first = validation.errors[0] ?? 'Dados incompletos';

  let fixPath = `${LOGSTOKA_ROUTES.PRODUCTS}/${product.id}`;
  let fixLabel = 'Corrigir cadastro do produto';

  if (first.includes('foto')) {
    fixLabel = 'Adicionar foto do produto';
  } else if (first.includes('descrição')) {
    fixLabel = 'Completar descrição';
  } else if (first.includes('peso') || first.includes('dimensões')) {
    fixLabel = 'Preencher dados de logística';
  } else if (first.includes('categoria')) {
    fixPath = LOGSTOKA_ROUTES.PRODUCTS;
    fixLabel = 'Definir categoria no cadastro';
  } else if (first.includes('barras') || first.includes('NCM')) {
    fixLabel = 'Completar dados fiscais';
  }

  return {
    code: 'product_incomplete',
    title: 'Cadastro incompleto',
    message: `${product.sku}: ${first}. Corrija antes de publicar nos marketplaces.`,
    fixPath,
    fixLabel,
    productId: product.id,
  };
}

function mapStoreError(storeId: string): PublishFlowError {
  const store = getStoreById(storeId);
  if (!store) {
    return {
      code: 'unknown',
      title: 'Erro de publicação',
      message: 'Loja não encontrada. Verifique as integrações.',
      fixPath: LOGSTOKA_ROUTES.SETTINGS_INTEGRATIONS,
      fixLabel: 'Abrir integrações',
      storeId,
    };
  }

  if (!store.is_active) {
    return {
      code: 'store_inactive',
      title: 'Loja desconectada',
      message: `${store.name} está inativa. Reconecte a conta antes de publicar.`,
      fixPath: marketplaceStorePath(store.marketplace, store.slug),
      fixLabel: `Reconectar ${store.name}`,
      storeId,
    };
  }

  if (store.status === 'syncing') {
    return {
      code: 'store_syncing',
      title: 'Erro de sincronização',
      message: `${store.name} ainda está sincronizando. Aguarde a conclusão ou verifique a integração.`,
      fixPath: marketplaceStorePath(store.marketplace, store.slug),
      fixLabel: 'Verificar sincronização',
      storeId,
    };
  }

  if (store.status === 'warning') {
    return {
      code: 'store_warning',
      title: 'Erro de interação com marketplace',
      message: `Falha ao publicar em ${store.name}. A API do marketplace não respondeu — verifique credenciais e webhooks.`,
      fixPath: LOGSTOKA_ROUTES.SETTINGS_API,
      fixLabel: 'Corrigir API e webhooks',
      storeId,
    };
  }

  return {
    code: 'sync_interaction',
    title: 'Erro de sincronização',
    message: `Não foi possível publicar em ${store.name}. Verifique logs de interação.`,
    fixPath: `${LOGSTOKA_ROUTES.SETTINGS_AUDIT}?tab=interacoes`,
    fixLabel: 'Ver logs de interação',
    storeId,
  };
}

export async function runPublishFlow(
  companyId: string,
  productIds: string[],
  storeIds: string[],
  products: LsProduct[],
): Promise<PublishFlowResult> {
  const started = Date.now();

  for (const productId of productIds) {
    const product = products.find((p) => p.id === productId);
    if (!product) continue;
    const validation = validateProductForPublication(product);
    if (!validation.ok) {
      await delay(Math.max(0, MIN_PUBLISH_MS - (Date.now() - started)));
      return { ok: false, error: mapValidationToError(product) };
    }
  }

  for (const storeId of storeIds) {
    const store = getStoreById(storeId);
    if (!store || !store.is_active || store.status === 'syncing' || store.status === 'warning') {
      await delay(Math.max(0, MIN_PUBLISH_MS - (Date.now() - started)));
      return { ok: false, error: mapStoreError(storeId) };
    }
  }

  await delay(Math.max(0, MIN_PUBLISH_MS - (Date.now() - started)));

  let publishedCount = 0;
  for (const productId of productIds) {
    const result = publishProductToStores(companyId, productId, storeIds);
    publishedCount += result.ok.length;
    if (result.failed.length > 0) {
      return { ok: false, error: mapStoreError(result.failed[0]) };
    }
  }

  return {
    ok: true,
    publishedCount,
    storeCount: storeIds.length,
    productCount: productIds.length,
  };
}

import type { LogstokaConfig } from '../config.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getMercadoLivreCredentials } from './mercadolivreOAuth.js';

const ML_API = 'https://api.mercadolibre.com';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';

export type MercadoLivreCredentials = {
  access_token: string;
  refresh_token: string;
  user_id: number | string;
  seller_id: string;
  expires_at?: string;
};

type IntegrationCredentialsRow = Record<string, unknown>;

export async function loadMercadoLivreCredentials(
  admin: SupabaseClient,
  companyId: string,
): Promise<{ integrationId: string; credentials: MercadoLivreCredentials } | null> {
  const { data, error } = await admin
    .from('ls_integrations')
    .select('id, credentials, status')
    .eq('company_id', companyId)
    .eq('provider', 'mercadolivre')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || data.status !== 'active') return null;

  const creds = data.credentials as IntegrationCredentialsRow;
  const accessToken = String(creds.access_token ?? '');
  const refreshToken = String(creds.refresh_token ?? '');
  if (!accessToken || !refreshToken) return null;

  return {
    integrationId: data.id as string,
    credentials: {
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: creds.user_id as number | string,
      seller_id: String(creds.seller_id ?? creds.user_id ?? ''),
      expires_at: typeof creds.expires_at === 'string' ? creds.expires_at : undefined,
    },
  };
}

async function persistRefreshedTokens(
  admin: SupabaseClient,
  integrationId: string,
  tokens: { access_token: string; refresh_token: string; expires_in?: number },
  existing: MercadoLivreCredentials,
): Promise<MercadoLivreCredentials> {
  const expiresAt =
    tokens.expires_in != null
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : existing.expires_at;

  const next: MercadoLivreCredentials = {
    ...existing,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
  };

  const { error } = await admin
    .from('ls_integrations')
    .update({
      credentials: {
        access_token: next.access_token,
        refresh_token: next.refresh_token,
        user_id: next.user_id,
        seller_id: next.seller_id,
        expires_at: next.expires_at,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId);

  if (error) throw new Error(error.message);
  return next;
}

export async function refreshMercadoLivreTokenIfNeeded(
  cfg: LogstokaConfig,
  admin: SupabaseClient,
  integrationId: string,
  credentials: MercadoLivreCredentials,
): Promise<MercadoLivreCredentials> {
  const expiresAt = credentials.expires_at ? new Date(credentials.expires_at).getTime() : 0;
  const shouldRefresh = !expiresAt || expiresAt - Date.now() < 5 * 60 * 1000;

  if (!shouldRefresh) return credentials;

  const appCreds = getMercadoLivreCredentials(cfg);
  if (!appCreds) throw new Error('Credenciais ML do app não configuradas');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: appCreds.clientId,
    client_secret: appCreds.clientSecret,
    refresh_token: credentials.refresh_token,
  });

  const res = await fetch(ML_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  });

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    message?: string;
    error?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.message || data.error || `ML refresh error ${res.status}`);
  }

  return persistRefreshedTokens(
    admin,
    integrationId,
    {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? credentials.refresh_token,
      expires_in: data.expires_in,
    },
    credentials,
  );
}

export async function getValidMercadoLivreAccessToken(
  cfg: LogstokaConfig,
  admin: SupabaseClient,
  companyId: string,
): Promise<{ integrationId: string; accessToken: string; userId: string }> {
  const loaded = await loadMercadoLivreCredentials(admin, companyId);
  if (!loaded) throw new Error('Mercado Livre não conectado');

  const refreshed = await refreshMercadoLivreTokenIfNeeded(
    cfg,
    admin,
    loaded.integrationId,
    loaded.credentials,
  );

  return {
    integrationId: loaded.integrationId,
    accessToken: refreshed.access_token,
    userId: String(refreshed.user_id ?? refreshed.seller_id),
  };
}

export async function mlApiFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith('http') ? path : `${ML_API}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const data = (await res.json()) as T & { message?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.message || data.error || `ML API ${res.status}: ${path}`);
  }
  return data;
}

export type MLItem = {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  sold_quantity: number;
  status: string;
  permalink?: string;
  thumbnail?: string;
  seller_custom_field?: string | null;
  attributes?: Array<{ id: string; value_name?: string }>;
  pictures?: Array<{ url: string }>;
  variations?: Array<{
    id: number;
    available_quantity: number;
    seller_custom_field?: string | null;
    attribute_combinations?: Array<{ name: string; value_name: string }>;
  }>;
};

export async function searchUserItemIds(accessToken: string, userId: string): Promise<string[]> {
  const ids: string[] = [];
  let offset = 0;
  const limit = 50;
  const maxItems = 500;

  while (ids.length < maxItems) {
    const data = await mlApiFetch<{ results?: string[]; paging?: { total: number } }>(
      accessToken,
      `/users/${userId}/items/search?status=active&limit=${limit}&offset=${offset}`,
    );

    const batch = data.results ?? [];
    if (batch.length === 0) break;
    ids.push(...batch);

    const total = data.paging?.total ?? ids.length;
    offset += limit;
    if (offset >= total) break;
  }

  return ids.slice(0, maxItems);
}

export async function fetchItemsBatch(accessToken: string, itemIds: string[]): Promise<MLItem[]> {
  const items: MLItem[] = [];
  for (let i = 0; i < itemIds.length; i += 20) {
    const chunk = itemIds.slice(i, i + 20);
    const data = await mlApiFetch<MLItem[]>(
      accessToken,
      `/items?ids=${chunk.join(',')}&attributes=id,title,price,currency_id,available_quantity,sold_quantity,status,permalink,thumbnail,seller_custom_field,attributes,pictures,variations`,
    );
    items.push(...(Array.isArray(data) ? data : []));
  }
  return items;
}

export async function updateItemStock(
  accessToken: string,
  itemId: string,
  quantity: number,
  variationId?: number,
): Promise<void> {
  const body =
    variationId != null
      ? { variations: [{ id: variationId, available_quantity: Math.max(0, Math.floor(quantity)) }] }
      : { available_quantity: Math.max(0, Math.floor(quantity)) };

  await mlApiFetch(accessToken, `/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateItemPrice(accessToken: string, itemId: string, price: number): Promise<void> {
  await mlApiFetch(accessToken, `/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price: Math.max(0, price) }),
  });
}

export function extractSellerSku(item: MLItem): string {
  if (item.seller_custom_field?.trim()) return item.seller_custom_field.trim();
  const attr = item.attributes?.find((a) => a.id === 'SELLER_SKU');
  if (attr?.value_name?.trim()) return attr.value_name.trim();
  if (item.variations?.[0]?.seller_custom_field?.trim()) return item.variations[0].seller_custom_field.trim();
  return `ML-${item.id.replace(/^MLB/i, '')}`;
}

export function itemStockQuantity(item: MLItem): number {
  if (item.variations?.length) {
    return item.variations.reduce((sum, v) => sum + (v.available_quantity ?? 0), 0);
  }
  return item.available_quantity ?? 0;
}

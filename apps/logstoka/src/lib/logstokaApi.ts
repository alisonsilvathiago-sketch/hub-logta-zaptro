import { supabase } from './supabase.js';
import { hasLogstokaMockSession } from '@/lib/logstokaAuthSession';
import { LOGSTOKA_DEMO_BEARER } from '@/lib/logstokaDemoAuth';
import { formatLogstokaApiError, resolveLogstokaApiBase } from '@/lib/logstokaApiBase';

const API_BASE = resolveLogstokaApiBase();

export type IntegrationApiConnection = {
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
  stores: Array<{ id: string; name: string; enabled: boolean; sellerId?: string; shopId?: string }>;
  sync: Record<string, boolean>;
};

async function resolveAuthHeader(): Promise<Record<string, string>> {
  if (hasLogstokaMockSession()) {
    return { Authorization: `Bearer ${LOGSTOKA_DEMO_BEARER}` };
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeader = await resolveAuthHeader();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    throw new Error(formatLogstokaApiError(err));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const logstokaApi = {
  getProducts: (page = 1, limit = 25) =>
    apiFetch<{ data: unknown[]; total: number }>(`/v1/products?page=${page}&limit=${limit}`),
  getStock: () => apiFetch<{ data: unknown[] }>('/v1/stock'),
  getMovements: () => apiFetch<{ data: unknown[] }>('/v1/movements'),
  getSalesDashboard: (days = 30) => apiFetch<unknown>(`/v1/sales/dashboard?days=${days}`),
  getImports: () => apiFetch<{ data: unknown[] }>('/v1/imports'),
  getReplenishment: () => apiFetch<{ data: unknown[] }>('/v1/replenishment'),
  getProductTimeline: (productId: string) =>
    apiFetch<{ data: unknown[] }>(`/v1/products/${productId}/timeline`),
  createEntry: (payload: Record<string, unknown>) =>
    apiFetch('/v1/entries', { method: 'POST', body: JSON.stringify(payload) }),
  createOutput: (payload: Record<string, unknown>) =>
    apiFetch('/v1/outputs', { method: 'POST', body: JSON.stringify(payload) }),
  createTransfer: (payload: Record<string, unknown>) =>
    apiFetch('/v1/transfers', { method: 'POST', body: JSON.stringify(payload) }),
  createReturn: (payload: Record<string, unknown>) =>
    apiFetch('/v1/returns', { method: 'POST', body: JSON.stringify(payload) }),
  createDamage: (payload: Record<string, unknown>) =>
    apiFetch('/v1/damages', { method: 'POST', body: JSON.stringify(payload) }),
  importXml: (xml: string, warehouseId?: string) =>
    apiFetch<{ movementId: string; items: number; invoiceNumber?: string }>('/v1/imports/xml', {
      method: 'POST',
      body: JSON.stringify({ xml, warehouse_id: warehouseId }),
    }),
  importReport: (content: string, fileName: string, warehouseId?: string) =>
    apiFetch<{ rowsProcessed: number; movements: number }>('/v1/imports/report', {
      method: 'POST',
      body: JSON.stringify({ content, file_name: fileName, warehouse_id: warehouseId }),
    }),
  importExcel: (base64: string, fileName: string, warehouseId?: string) =>
    apiFetch<{ rowsProcessed: number; movements: number }>('/v1/imports/excel', {
      method: 'POST',
      body: JSON.stringify({ base64, file_name: fileName, warehouse_id: warehouseId }),
    }),
  importPdf: (base64: string, fileName: string, warehouseId?: string) =>
    apiFetch<{ rowsProcessed: number; movements: number }>('/v1/imports/pdf', {
      method: 'POST',
      body: JSON.stringify({ base64, file_name: fileName, warehouse_id: warehouseId }),
    }),
  importOcr: (payload: { base64?: string; mime_type?: string; text?: string; file_name?: string; warehouse_id?: string }) =>
    apiFetch<{ rowsProcessed: number; movements: number }>('/v1/imports/ocr', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  triageReturn: (id: string) =>
    apiFetch(`/v1/returns/${id}/triage`, { method: 'POST', body: '{}' }),
  approveReturn: (id: string, warehouseId?: string) =>
    apiFetch(`/v1/returns/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ warehouse_id: warehouseId }),
    }),
  rejectReturn: (id: string, reason: string, warehouseId?: string) =>
    apiFetch(`/v1/returns/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, warehouse_id: warehouseId }),
    }),
  createInventory: (payload: Record<string, unknown>) =>
    apiFetch('/v1/inventories', { method: 'POST', body: JSON.stringify(payload) }),
  countInventory: (id: string, payload: Record<string, unknown>) =>
    apiFetch(`/v1/inventories/${id}/count`, { method: 'POST', body: JSON.stringify(payload) }),
  approveInventory: (id: string) =>
    apiFetch(`/v1/inventories/${id}/approve`, { method: 'POST', body: '{}' }),
  shipTransfer: (id: string) =>
    apiFetch(`/v1/transfers/${id}/ship`, { method: 'PATCH', body: '{}' }),
  receiveTransfer: (id: string) =>
    apiFetch(`/v1/transfers/${id}/receive`, { method: 'PATCH', body: '{}' }),
  aiHealth: () => apiFetch<{ ollama: { online: boolean; model: string } }>('/v1/ai/health'),
  aiAnalyzeAttachment: (payload: {
    file_name: string;
    mime_type: string;
    base64: string;
    message?: string;
    screen?: string;
    user_name?: string;
    company_name?: string;
  }) =>
    apiFetch<{
      reply: string;
      links: Array<{ label: string; path: string }>;
      agents?: string[];
      file_kind?: string;
    }>('/v1/ai/analyze-attachment', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  aiChat: (payload: {
    message: string;
    history?: Array<{ role: string; content: string }>;
    screen?: string;
    user_name?: string;
    company_name?: string;
  }) =>
    apiFetch<{ reply: string; intents?: string[]; agents?: string[]; model?: string }>('/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  aiDailyBriefing: () => apiFetch<{ briefing: string }>('/v1/ai/daily-briefing'),
  aiValidateImport: (payload: { file_type: string; content?: string; base64?: string }) =>
    apiFetch<{ valid: boolean; rows_total: number; issues: unknown[]; summary: string }>(
      '/v1/ai/validate-import',
      { method: 'POST', body: JSON.stringify(payload) },
    ),
  aiProductSuggest: (query: string, imageVariant = 0) =>
    apiFetch<{
      local_matches: Array<{
        id: string;
        sku: string;
        name: string;
        barcode?: string | null;
        internal_code?: string | null;
        brand?: string | null;
        main_image_url?: string | null;
      }>;
      ai_suggestion: {
        name: string;
        brand?: string;
        category_hint?: string;
        image_url?: string | null;
        source: string;
      } | null;
    }>('/v1/ai/product-suggest', {
      method: 'POST',
      body: JSON.stringify({ query, image_variant: imageVariant }),
    }),
  aiScanInterpret: (payload: {
    raw: string;
    format?: string;
    extracted?: Record<string, unknown>;
    movement_type?: string;
  }) =>
    apiFetch<{
      local_format: string;
      ai: {
        name?: string;
        brand?: string;
        category_hint?: string;
        barcode?: string;
        internal_code?: string;
        sku?: string;
        weight?: string;
        description?: string;
        image_url?: string | null;
        confidence: 'high' | 'medium' | 'low';
        summary: string;
        suggested_action: string;
        url_fetch_recommended?: boolean;
      } | null;
      product_suggestion: unknown;
    }>('/v1/ai/scan-interpret', { method: 'POST', body: JSON.stringify(payload) }),
  getIntegrations: () => apiFetch<{ data: IntegrationApiConnection[] }>('/v1/integrations'),
  updateIntegration: (provider: string, payload: { stores?: unknown; sync?: unknown }) =>
    apiFetch<{ data: IntegrationApiConnection }>(`/v1/integrations/${provider}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  disconnectIntegration: (provider: string) =>
    apiFetch<{ ok: boolean }>(`/v1/integrations/${provider}`, { method: 'DELETE' }),
  syncIntegration: (provider: string) =>
    apiFetch<{ data: IntegrationApiConnection }>(`/v1/integrations/${provider}/sync`, {
      method: 'POST',
      body: '{}',
    }),
};

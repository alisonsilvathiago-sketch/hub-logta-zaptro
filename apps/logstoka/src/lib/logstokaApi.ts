import { supabase } from './supabase.js';

const API_BASE =
  import.meta.env.VITE_LOGSTOKA_API_URL?.replace(/\/$/, '') || '/logstoka-api';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

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
};

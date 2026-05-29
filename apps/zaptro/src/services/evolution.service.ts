/**
 * Serviço WhatsApp Zaptro → Supabase Edge Function `evolution-api`.
 * Nunca chama Evolution direto no browser (API key fica nos Secrets do Supabase).
 *
 * Rotas (Edge):
 *   GET  /instance/connectionState/{instance?}
 *   GET  /instance/connect/{instance?}
 *   POST /message/sendText/{instance?}
 *   DELETE /instance/logout/{instance?}
 *   POST /instance/create  (criar instância + QR)
 *   POST /instance/activateInbox/{instance?}  (webhook + inbox activo)
 */

import { supabaseZaptro } from '../lib/supabase-zaptro';
import { extractQrBase64, toQrDataUrl } from '../lib/whatsapp';
import { logWaFlow, logWaFlowError, updateWaFlowSnapshot } from '../lib/whatsappFlowDiagnostic';

const EDGE_FN = 'evolution-api';
const PROJECT_REF = 'rrjnkmgkhbtapumgmhhr';

export function buildZaptroInstanceName(userId: string, companyId?: string | null): string {
  const sharedInstance = (import.meta.env.VITE_EVOLUTION_INSTANCE as string | undefined)?.trim();
  if (sharedInstance) return sharedInstance;

  if (userId === 'hub-dev-local-user' && companyId) {
    const short = companyId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    return `zaptro-${short || 'dev'}`;
  }
  const safe = userId.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40);
  return `zaptro-${safe || 'user'}`;
}

export function evolutionEdgeBaseUrl(): string {
  const env = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  if (env) return `${env.replace(/\/$/, '')}/functions/v1/${EDGE_FN}`;
  return `https://${PROJECT_REF}.supabase.co/functions/v1/${EDGE_FN}`;
}

function anonKey(): string {
  return (
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
    ''
  );
}

export type EvolutionEdgeResponse = {
  instance?: string;
  state?: string;
  status?: string;
  connected?: boolean;
  phone?: string | null;
  raw?: unknown;
  success?: boolean;
  error?: string;
  details?: unknown;
};

async function getUserJwt(): Promise<string> {
  const { data, error } = await supabaseZaptro.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Faça login em /login para ligar o WhatsApp (JWT obrigatório para a Edge Function).');
  }
  return token;
}

async function edgeRequest(
  path: string,
  method: 'GET' | 'POST' | 'DELETE',
  body?: Record<string, unknown>,
): Promise<EvolutionEdgeResponse> {
  const token = await getUserJwt();
  const url = `${evolutionEdgeBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey(),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed: EvolutionEdgeResponse = {};
  try {
    parsed = text ? (JSON.parse(text) as EvolutionEdgeResponse) : {};
  } catch {
    parsed = { error: text.slice(0, 300) };
  }

  if (!res.ok) {
    const msg =
      parsed.error ||
      (typeof parsed.details === 'string' ? parsed.details : JSON.stringify(parsed.details ?? '')).slice(
        0,
        200,
      );
    logWaFlowError(`Edge ${method} ${path} HTTP ${res.status}: ${msg}`, { path, method });
    throw new Error(`Evolution API (Edge) HTTP ${res.status}: ${msg || 'erro desconhecido'}`);
  }

  if (parsed.error) {
    throw new Error(String(parsed.error));
  }

  return parsed;
}

function qrDataUrlFromResponse(res: EvolutionEdgeResponse): string | null {
  return toQrDataUrl(extractQrBase64(res.raw ?? res));
}

function enc(instance?: string): string {
  const name = instance?.trim() || 'zaptro';
  return encodeURIComponent(name);
}

/** Estado da ligação (atualiza `whatsapp_connections` na Edge). */
export async function getConnectionState(instance?: string): Promise<{
  instance: string;
  state: string;
  connected: boolean;
  phone: string | null;
  raw: unknown;
}> {
  const data = await edgeRequest(`/instance/connectionState/${enc(instance)}`, 'GET');
  const state = String(data.state ?? data.status ?? 'unknown');
  const connected =
    data.connected === true || ['open', 'connected', 'online'].includes(state.toLowerCase());
  const result = {
    instance: data.instance ?? instance ?? 'zaptro',
    state,
    connected,
    phone: data.phone ?? null,
    raw: data.raw,
  };
  updateWaFlowSnapshot({
    connection: { connected: result.connected, phone: result.phone, state: result.state },
  });
  return result;
}

/** POST /instance/create — devolve QR ou null se instância já existir. */
export async function createInstanceForQr(instanceName: string): Promise<string | null> {
  try {
    const data = await edgeRequest('/instance/create', 'POST', {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });
    return qrDataUrlFromResponse(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/already exists|duplicate|403|409/i.test(msg)) return null;
    throw e;
  }
}

/** Obtém QR via connect; só cria instância se connect falhar por inexistência. */
export async function connectWhatsapp(instance?: string): Promise<{
  instance: string;
  qrDataUrl: string | null;
  status: string;
}> {
  const name = instance?.trim() || 'zaptro';

  try {
    const live = await getConnectionState(name);
    if (live.connected) {
      return { instance: name, qrDataUrl: null, status: 'open' };
    }
  } catch {
    /* segue para connect */
  }

  let qr: string | null = null;
  let lastError: string | null = null;

  for (let i = 0; i < 10 && !qr; i += 1) {
    try {
      const data = await edgeRequest(`/instance/connect/${enc(name)}`, 'GET');
      qr = qrDataUrlFromResponse(data);
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
    if (!qr) {
      await new Promise((r) => window.setTimeout(r, i < 2 ? 700 : 1200));
    }
  }

  if (!qr) {
    try {
      qr = await createInstanceForQr(name);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/Invalid URL/i.test(msg)) {
        throw new Error(
          'URL da Evolution inválida nos Secrets do Supabase. EVOLUTION_API_URL deve ser https://evolution.zaptro.com.br (sem espaço no fim).',
        );
      }
      throw e;
    }
  }

  if (!qr && lastError) {
    throw new Error(lastError);
  }

  return { instance: name, qrDataUrl: qr, status: 'connecting' };
}

/** Envia mensagem de texto. */
export async function sendMessage(
  number: string,
  text: string,
  instance?: string,
): Promise<{ success: boolean; instance: string; raw: unknown }> {
  const digits = number.replace(/\D/g, '');
  if (!digits || !text.trim()) {
    throw new Error('Número e texto são obrigatórios.');
  }
  const data = await edgeRequest(`/message/sendText/${enc(instance)}`, 'POST', {
    number: digits,
    text: text.trim(),
  });
  return {
    success: data.success === true,
    instance: data.instance ?? instance ?? 'zaptro',
    raw: data.raw,
  };
}

/** Envia mídia (documento/áudio/imagem/vídeo). `media` pode ser URL pública ou data-uri base64. */
export async function sendMedia(params: {
  number: string;
  mediatype: 'document' | 'audio' | 'image' | 'video';
  mimetype: string;
  media: string;
  fileName?: string;
  instance?: string;
}): Promise<{ success: boolean; instance: string; raw: unknown }> {
  const digits = params.number.replace(/\D/g, '');
  if (!digits || !params.media?.trim()) throw new Error('Número e media são obrigatórios.');
  const data = await edgeRequest(`/message/sendMedia/${enc(params.instance)}`, 'POST', {
    number: digits,
    mediatype: params.mediatype,
    mimetype: params.mimetype,
    media: params.media,
    ...(params.fileName ? { fileName: params.fileName } : {}),
  });
  return {
    success: data.success === true,
    instance: data.instance ?? params.instance ?? 'zaptro',
    raw: data.raw,
  };
}

/** Envia figurinha (URL ou base64 webp). */
export async function sendSticker(params: {
  number: string;
  sticker: string;
  instance?: string;
}): Promise<{ success: boolean; instance: string; raw: unknown }> {
  const digits = params.number.replace(/\D/g, '');
  const target = params.number.includes('@g.us') ? params.number : digits;
  if (!target || !params.sticker?.trim()) throw new Error('Número e figurinha são obrigatórios.');
  const data = await edgeRequest(`/message/sendSticker/${enc(params.instance)}`, 'POST', {
    number: target,
    sticker: params.sticker.trim(),
  });
  return {
    success: data.success === true,
    instance: data.instance ?? params.instance ?? 'zaptro',
    raw: data.raw,
  };
}

export type CreateWaGroupParticipant = {
  key: string;
  name: string;
  phone: string;
  role: 'driver' | 'helper' | 'collaborator';
};

/** Cria grupo WhatsApp real via Evolution GO. */
export async function createWaGroup(params: {
  subject: string;
  participants: string[];
  description?: string;
  instance?: string;
}): Promise<{ success: boolean; instance: string; groupJid?: string; raw: unknown }> {
  const phones = params.participants.map((p) => p.replace(/\D/g, '')).filter(Boolean);
  if (!params.subject.trim() || phones.length === 0) {
    throw new Error('Nome e participantes são obrigatórios.');
  }
  const data = await edgeRequest(`/group/create/${enc(params.instance)}`, 'POST', {
    subject: params.subject.trim(),
    description: params.description?.trim() || undefined,
    participants: phones,
  }) as EvolutionEdgeResponse & { groupJid?: string; raw?: unknown };
  const raw = data.raw as Record<string, unknown> | undefined;
  const groupJid =
    data.groupJid ||
    (typeof raw?.id === 'string' ? raw.id : undefined) ||
    (typeof raw?.gid === 'string' ? raw.gid : undefined) ||
    (typeof (raw?.group as Record<string, unknown> | undefined)?.id === 'string'
      ? String((raw?.group as Record<string, unknown>).id)
      : undefined);
  return {
    success: data.success !== false,
    instance: data.instance ?? params.instance ?? 'zaptro',
    groupJid,
    raw: data.raw,
  };
}

/** Apaga conversa no WhatsApp (Evolution GO) + preparação para remoção local. */
export async function deleteWaChat(
  number: string,
  instance?: string,
): Promise<{ success: boolean; raw: unknown }> {
  const target = number.includes('@g.us') ? number : number.replace(/\D/g, '');
  if (!target) throw new Error('Número inválido.');
  const data = await edgeRequest(`/chat/delete/${enc(instance)}`, 'POST', { number: target });
  return { success: data.success !== false, raw: data.raw };
}

/** Arquiva ou desarquiva conversa no WhatsApp. */
export async function archiveWaChat(
  number: string,
  archive = true,
  instance?: string,
): Promise<{ success: boolean; raw: unknown }> {
  const target = number.includes('@g.us') ? number : number.replace(/\D/g, '');
  if (!target) throw new Error('Número inválido.');
  const data = await edgeRequest(`/chat/archive/${enc(instance)}`, 'POST', { number: target, archive });
  return { success: data.success !== false, raw: data.raw };
}

/**
 * Activa recepção de mensagens: regista webhook na Evolution e grava `whatsapp_instances`.
 * Chamar ao ligar o QR ou quando o estado passa a «conectado».
 */
export async function activateWhatsappInbox(
  companyId: string,
  instance?: string,
): Promise<{ success: boolean; instance: string; webhookUrl?: string }> {
  const name = instance?.trim() || 'zaptro';
  const data = await edgeRequest(`/instance/activateInbox/${enc(name)}`, 'POST', {
    companyId: companyId.trim(),
  });
  const webhookUrl = typeof (data as { webhookUrl?: string }).webhookUrl === 'string'
    ? (data as { webhookUrl?: string }).webhookUrl
    : undefined;
  if (webhookUrl) {
    updateWaFlowSnapshot({ webhook: { url: webhookUrl, lastReceivedAt: null, processedHint: 0 } });
    logWaFlow('SESSION_PERSISTED', { step: 'activateInbox', instance: name, webhookUrl });
  }
  return {
    success: data.success !== false,
    instance: data.instance ?? name,
    webhookUrl,
  };
}

/** Desliga a instância (atualiza `whatsapp_connections`). */
export async function disconnect(instance?: string): Promise<{ success: boolean; instance: string }> {
  const data = await edgeRequest(`/instance/logout/${enc(instance)}`, 'DELETE');
  return {
    success: data.success !== false,
    instance: data.instance ?? instance ?? 'zaptro',
  };
}

/** Lê estado persistido em `whatsapp_connections` (RLS: só o próprio user). */
export async function loadWhatsappConnection(userId: string, instanceName: string) {
  const { data, error } = await supabaseZaptro
    .from('whatsapp_connections')
    .select('id, user_id, instance_name, phone, status, connected, updated_at')
    .eq('user_id', userId)
    .eq('instance_name', instanceName)
    .maybeSingle();

  if (error) {
    console.warn('[whatsapp_connections]', error.message);
    return null;
  }
  return data;
}

/** Subscrição em tempo real na linha do utilizador. */
export function subscribeWhatsappConnection(
  userId: string,
  instanceName: string,
  onChange: (row: {
    status: string;
    connected: boolean;
    phone: string | null;
    updated_at: string;
  } | null) => void,
) {
  const channel = supabaseZaptro
    .channel(`wa-conn-${userId}-${instanceName}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'whatsapp_connections',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as {
          instance_name?: string;
          status?: string;
          connected?: boolean;
          phone?: string | null;
          updated_at?: string;
        } | null;
        if (!row || row.instance_name !== instanceName) return;
        onChange({
          status: row.status ?? 'disconnected',
          connected: Boolean(row.connected),
          phone: row.phone ?? null,
          updated_at: row.updated_at ?? new Date().toISOString(),
        });
      },
    )
    .subscribe();

  return () => {
    void supabaseZaptro.removeChannel(channel);
  };
}

export function shouldUseEvolutionEdge(): boolean {
  if (import.meta.env.VITE_EVOLUTION_USE_EDGE === 'false') return false;
  return Boolean(anonKey() && import.meta.env.VITE_SUPABASE_URL);
}

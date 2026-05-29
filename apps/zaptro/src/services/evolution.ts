/**
 * Cliente Evolution GO / Evolution API — WhatsApp dentro do Zaptro.
 * Browser em dev: `/evolution-api` (proxy Vite → VITE_EVOLUTION_API_URL).
 *
 * Evolution GO usa duas chaves:
 *   - GLOBAL_API_KEY → VITE_EVOLUTION_API_KEY (admin: /instance/create)
 *   - Token da instância → VITE_EVOLUTION_INSTANCE_API_KEY (QR, status, mensagens)
 */

import { extractQrBase64, toQrDataUrl } from '../lib/whatsapp';

export { buildZaptroInstanceName } from './evolution.service';

const DEV_PROXY = '/evolution-api';
const INSTANCE_TOKEN_STORAGE_PREFIX = 'evolution-go-instance-token:';

function isGoMode(): boolean {
  const mode = (import.meta.env.VITE_EVOLUTION_API_MODE as string | undefined)?.toLowerCase();
  return mode !== 'legacy' && mode !== 'evolution-api';
}

function globalApiKey(): string {
  const raw = (import.meta.env.VITE_EVOLUTION_API_KEY as string | undefined)?.trim() || '';
  if (!raw) {
    throw new Error(
      'VITE_EVOLUTION_API_KEY não está definida. Copie a GLOBAL_API_KEY do VPS (/opt/evolution-go/.env).',
    );
  }
  if (raw.includes('?')) {
    console.warn(
      '[evolution] VITE_EVOLUTION_API_KEY contém "?" — copie a GLOBAL_API_KEY exacta do VPS.',
    );
  }
  return raw;
}

function configuredInstanceToken(): string | null {
  const raw =
    (import.meta.env.VITE_EVOLUTION_INSTANCE_API_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_EVOLUTION_INSTANCE_TOKEN as string | undefined)?.trim() ||
    '';
  return raw && !raw.includes('?') ? raw : null;
}

function readStoredInstanceToken(instanceName: string): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(`${INSTANCE_TOKEN_STORAGE_PREFIX}${instanceName}`)?.trim() || null;
}

function storeInstanceToken(instanceName: string, token: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(`${INSTANCE_TOKEN_STORAGE_PREFIX}${instanceName}`, token.trim());
}

export function clearEvolutionInstanceTokenCache(instanceName?: string): void {
  if (typeof sessionStorage === 'undefined') return;
  const inst = instanceName?.trim();
  if (inst) {
    sessionStorage.removeItem(`${INSTANCE_TOKEN_STORAGE_PREFIX}${inst}`);
    return;
  }
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const k = sessionStorage.key(i);
    if (k?.startsWith(INSTANCE_TOKEN_STORAGE_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => sessionStorage.removeItem(k));
}

function authErrorMessage(instanceName?: string): string {
  const inst = instanceName || (import.meta.env.VITE_EVOLUTION_INSTANCE as string) || 'zaptro';
  return isGoMode()
    ? `Evolution GO: token da instância «${inst}» inválido ou header instance em falta. No manager Evolution → Instâncias → ${inst}, copie o Token para VITE_EVOLUTION_INSTANCE_API_KEY no .env.local e reinicie npm run dev.`
    : 'Evolution: API key inválida. Atualize VITE_EVOLUTION_API_KEY.';
}

export function evolutionBrowserBase(): string {
  if (import.meta.env.DEV) {
    const devBase = (import.meta.env.VITE_EVOLUTION_BASE_URL as string | undefined)?.trim();
    if (devBase?.startsWith('/')) return devBase.replace(/\/$/, '');
    return DEV_PROXY;
  }
  const fromEnv = (import.meta.env.VITE_EVOLUTION_BASE_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const direct = (import.meta.env.VITE_EVOLUTION_API_URL as string | undefined)?.trim();
  return direct ? direct.replace(/\/$/, '') : DEV_PROXY;
}

function authHeaders(key: string, extra?: HeadersInit): HeadersInit {
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

async function evolutionFetchWithKey(
  path: string,
  key: string,
  init?: RequestInit,
): Promise<Response> {
  const base = evolutionBrowserBase();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: authHeaders(key, init?.headers as HeadersInit),
  });
}

async function evolutionFetchGlobal(path: string, init?: RequestInit): Promise<Response> {
  return evolutionFetchWithKey(path, globalApiKey(), init);
}

async function ensureGoInstanceRegistered(instanceName: string, token: string): Promise<string> {
  const res = await evolutionFetchGlobal('/instance/create', {
    method: 'POST',
    body: JSON.stringify({ name: instanceName, token, qrcode: true }),
  });

  if (res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      data?: { token?: string };
    };
    const returned = data?.data?.token?.trim();
    const finalToken = returned || token;
    storeInstanceToken(instanceName, finalToken);
    return finalToken;
  }

  const errText = await res.text().catch(() => '');
  const exists = res.status === 403 || /already exists|duplicate/i.test(errText);
  if (exists) {
    storeInstanceToken(instanceName, token);
    return token;
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      'Evolution GO recusou a GLOBAL_API_KEY (401/403). Confira VITE_EVOLUTION_API_KEY no .env.local.',
    );
  }
  throw new Error(`Evolution create: HTTP ${res.status} — ${errText.slice(0, 200)}`);
}

/** Token da instância (GO) ou global key (legacy). */
async function fetchGoInstanceTokenFromServer(instanceName: string): Promise<string | null> {
  try {
    const res = await evolutionFetchGlobal('/instance/all', { method: 'GET' });
    if (!res.ok) return null;
    const raw = (await res.json()) as unknown;
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { data?: unknown[] })?.data)
        ? (raw as { data: unknown[] }).data
        : [];
    const clean = instanceName.replace(/[^a-zA-Z0-9-_]/g, '').trim() || 'zaptro';
    const row = list.find((item) => {
      if (!item || typeof item !== 'object') return false;
      const name = String((item as { name?: string; instanceName?: string }).name ?? (item as { instanceName?: string }).instanceName ?? '').trim();
      return name === clean;
    }) as { token?: string } | undefined;
    const token = row?.token?.trim();
    if (token) storeInstanceToken(instanceName, token);
    return token || null;
  } catch {
    return null;
  }
}

/** Token da instância (GO) ou global key (legacy). */
async function resolveInstanceToken(instanceName: string): Promise<string> {
  if (!isGoMode()) return globalApiKey();

  const fromServer = await fetchGoInstanceTokenFromServer(instanceName);
  if (fromServer) return fromServer;

  const fromEnv = configuredInstanceToken();
  if (fromEnv) return fromEnv;

  const stored = readStoredInstanceToken(instanceName);
  if (stored) return stored;

  const bootstrapToken =
    (import.meta.env.VITE_EVOLUTION_INSTANCE as string | undefined)?.trim() === instanceName
      ? `${instanceName}-zaptro-dev`
      : `${instanceName}-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

  return ensureGoInstanceRegistered(instanceName, bootstrapToken);
}

async function evolutionFetchInstance(
  path: string,
  instanceName: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await resolveInstanceToken(instanceName);
  const clean = instanceName.replace(/[^a-zA-Z0-9-_]/g, '').trim() || 'zaptro';
  return evolutionFetchWithKey(path, token, {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string> | undefined),
      instance: clean,
      instanceName: clean,
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export type EvolutionConnectionState = 'open' | 'close' | 'connecting' | string;

function parseQrFromResponse(data: unknown): string | null {
  const b64 = extractQrBase64(data);
  return toQrDataUrl(b64);
}

async function primeGoQr(instanceName: string, webhookUrl?: string): Promise<void> {
  const body: Record<string, unknown> = { number: '' };
  if (webhookUrl?.trim()) {
    body.webhookUrl = webhookUrl.trim();
    body.subscribe = ['ALL'];
  }
  await evolutionFetchInstance('/instance/connect', instanceName, {
    method: 'POST',
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

/** Regista webhook Supabase na instância GO (mensagens → whatsapp_conversations). */
export async function activateGoInboxWebhook(
  instanceName: string,
  webhookUrl: string,
): Promise<void> {
  if (!isGoMode()) return;
  await primeGoQr(instanceName, webhookUrl);
}

export async function createEvolutionInstance(
  instanceName: string,
): Promise<{ qrFromCreate: string | null }> {
  if (isGoMode()) {
    await resolveInstanceToken(instanceName);
    await primeGoQr(instanceName);
    const qr = await fetchEvolutionQrCode(instanceName);
    return { qrFromCreate: qr };
  }

  const token = globalApiKey();
  const body = { name: instanceName, instanceName, token, qrcode: true };
  let res = await evolutionFetchGlobal('/instance/create', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const exists = res.status === 403 || /already exists|duplicate/i.test(errText);
    if (!exists) {
      res = await evolutionFetchGlobal('/instance/create', {
        method: 'POST',
        body: JSON.stringify({ ...body, integration: 'WHATSAPP-BAILEYS' }),
      });
      if (!res.ok) {
        const retryText = await res.text().catch(() => '');
        if (res.status === 401 || res.status === 403) {
          throw new Error(
            'Evolution recusou a API key (401/403). Confira VITE_EVOLUTION_API_KEY no .env.local.',
          );
        }
        throw new Error(`Evolution create: HTTP ${res.status} — ${retryText.slice(0, 200)}`);
      }
    }
  }

  const qr = await fetchEvolutionQrCode(instanceName);
  return { qrFromCreate: qr };
}

async function fetchConnectOnce(instanceName: string): Promise<string | null> {
  if (isGoMode()) {
    if (configuredInstanceToken() || readStoredInstanceToken(instanceName)) {
      await primeGoQr(instanceName);
    }
    const res = await evolutionFetchInstance('/instance/qr', instanceName, { method: 'GET' });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      if (res.status === 401 || res.status === 403) {
        clearEvolutionInstanceTokenCache(instanceName);
        throw new Error(authErrorMessage(instanceName));
      }
      if (res.status === 400 && t.toLowerCase().includes('already logged in')) {
        return 'ALREADY_LOGGED_IN';
      }
      throw new Error(`Evolution QR: HTTP ${res.status} — ${t.slice(0, 180)}`);
    }
    const data = (await res.json()) as unknown;
    return parseQrFromResponse(data);
  }

  const res = await evolutionFetchGlobal(
    `/instance/connect/${encodeURIComponent(instanceName)}`,
    { method: 'GET' },
  );
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
      throw new Error(authErrorMessage(instanceName));
    }
    if (res.status === 400 && t.toLowerCase().includes('already logged in')) {
      return 'ALREADY_LOGGED_IN';
    }
    throw new Error(`Evolution connect: HTTP ${res.status} — ${t.slice(0, 180)}`);
  }
  const data = (await res.json()) as unknown;
  return parseQrFromResponse(data);
}

/** Evolution GO pode demorar 1–3s a gerar o base64 após connect. */
export async function fetchEvolutionQrCode(instanceName: string): Promise<string | null> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const qr = await fetchConnectOnce(instanceName);
    if (qr) return qr;
    await sleep(attempt < 2 ? 800 : 1500);
  }
  return null;
}

function phoneFromEvolutionJid(jid: unknown): string | null {
  if (typeof jid !== 'string' || !jid.trim()) return null;
  let local = jid.split('@')[0] ?? '';
  if (local.includes(':')) local = local.split(':')[0] ?? local;
  const digits = local.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

/** Estado + telefone da instância (localhost: proxy /evolution-api). */
export async function getEvolutionLiveStatus(instanceName: string): Promise<{
  state: EvolutionConnectionState;
  connected: boolean;
  phone: string | null;
}> {
  if (isGoMode()) {
    try {
      const res = await evolutionFetchInstance('/instance/status', instanceName, { method: 'GET' });
      if (!res.ok) return { state: 'close', connected: false, phone: null };
      const data = (await res.json()) as Record<string, unknown>;
      const inner = (data.data ?? data) as Record<string, unknown>;
      const connected = Boolean(inner.Connected ?? inner.connected);
      const loggedInRaw = inner.LoggedIn ?? inner.loggedIn;
      const loggedIn = loggedInRaw === undefined ? null : Boolean(loggedInRaw);
      const isOpen = connected && (loggedIn === null ? true : loggedIn);
      const phone =
        phoneFromEvolutionJid(inner.myJid ?? inner.jid ?? inner.Jid) ??
        phoneFromEvolutionJid((inner as { phone?: string }).phone);
      const state: EvolutionConnectionState = isOpen
        ? 'open'
        : connected && loggedIn === false
          ? 'connecting'
          : 'close';
      return { state, connected: isOpen, phone: isOpen ? phone : null };
    } catch {
      return { state: 'close', connected: false, phone: null };
    }
  }

  const state = await getEvolutionConnectionState(instanceName);
  const connected = state === 'open';
  return { state, connected, phone: null };
}

export async function getEvolutionConnectionState(instanceName: string): Promise<EvolutionConnectionState> {
  if (isGoMode()) {
    const live = await getEvolutionLiveStatus(instanceName);
    return live.state;
  }

  const res = await evolutionFetchGlobal(
    `/instance/connectionState/${encodeURIComponent(instanceName)}`,
    { method: 'GET' },
  );
  if (!res.ok) return 'close';
  const data = (await res.json()) as Record<string, unknown>;
  const state =
    (data.instance as { state?: string } | undefined)?.state ??
    (data.state as string | undefined) ??
    'close';
  return state;
}

export async function sendEvolutionText(
  instanceName: string,
  number: string,
  text: string,
): Promise<void> {
  const digits = number.replace(/\D/g, '');
  if (!digits || !text.trim()) throw new Error('Número e texto são obrigatórios.');

  const path = isGoMode() ? '/send/text' : `/message/sendText/${encodeURIComponent(instanceName)}`;
  const body = { number: digits, text: text.trim() };
  const res = isGoMode()
    ? await evolutionFetchInstance(path, instanceName, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    : await evolutionFetchGlobal(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Evolution send: HTTP ${res.status} — ${errText.slice(0, 200)}`);
  }
}

/** Chamada genérica à Evolution (GO via proxy localhost ou VPS). */
export async function evolutionApiRequest(
  instanceName: string,
  path: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
): Promise<{ ok: boolean; data: unknown }> {
  const res = await evolutionFetchInstance(path, instanceName, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text().catch(() => '');
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, data };
}

function extractProfilePictureUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  const layers: Record<string, unknown>[] = [root];
  if (root.data && typeof root.data === 'object') layers.push(root.data as Record<string, unknown>);
  if (root.result && typeof root.result === 'object') layers.push(root.result as Record<string, unknown>);

  for (const layer of layers) {
    for (const key of ['pictureUrl', 'profilePictureUrl', 'profilePicUrl', 'url', 'picture', 'imgUrl']) {
      const v = layer[key];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return null;
}

export async function fetchContactProfilePic(instanceName: string, number: string): Promise<string | null> {
  const digits = number.replace(/\D/g, '');
  if (!digits) return null;

  const numberVariants = [digits, `${digits}@s.whatsapp.net`, `${digits}@c.us`];

  for (const path of ['/chat/fetchProfilePictureUrl', '/chat/profilePictureUrl', '/chat/profilePicUrl']) {
    for (const num of numberVariants) {
      try {
        const res = isGoMode()
          ? await evolutionFetchInstance(path, instanceName, {
              method: 'POST',
              body: JSON.stringify({ number: num }),
            })
          : await evolutionFetchGlobal(`${path}/${instanceName}`, {
              method: 'POST',
              body: JSON.stringify({ number: num }),
            });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const url = extractProfilePictureUrl(data);
          if (url) return url;
        }
      } catch {
        /* próxima variante */
      }
    }
  }
  return null;
}

export type EvolutionBusinessProfileInput = {
  name?: string;
  description?: string;
  address?: string;
  email?: string;
  website?: string;
  category?: string;
  openingHours?: string;
  pictureUrl?: string | null;
};

async function evolutionPostJson(
  instanceName: string,
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; detail: string }> {
  const res = isGoMode()
    ? await evolutionFetchInstance(path, instanceName, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    : await evolutionFetchGlobal(
        path.includes('{instance}')
          ? path.replace('{instance}', encodeURIComponent(instanceName))
          : `${path}/${encodeURIComponent(instanceName)}`,
        { method: 'POST', body: JSON.stringify(body) },
      );
  const detail = (await res.text().catch(() => '')).slice(0, 240);
  return { ok: res.ok, status: res.status, detail };
}

/**
 * Envia perfil comercial para o WhatsApp (Evolution GO / legacy).
 * Em dev localhost: proxy Vite `/evolution-api` → VITE_EVOLUTION_API_URL.
 */
export async function syncEvolutionBusinessProfile(
  instanceName: string,
  input: EvolutionBusinessProfileInput,
): Promise<{ synced: boolean; messages: string[] }> {
  const messages: string[] = [];
  let synced = false;

  const name = input.name?.trim();
  const about = input.description?.trim();
  const address = input.address?.trim();
  const email = input.email?.trim();
  const website = input.website?.trim();
  const category = input.category?.trim();
  const hours = input.openingHours?.trim();

  if (name) {
    for (const path of ['/chat/updateProfileName', '/profile/name']) {
      const r = await evolutionPostJson(instanceName, path, { name });
      if (r.ok) {
        synced = true;
        messages.push('Nome sincronizado no WhatsApp');
        break;
      }
    }
  }

  if (about) {
    for (const path of ['/chat/updateProfileStatus', '/profile/status']) {
      const r = await evolutionPostJson(instanceName, path, { status: about });
      if (r.ok) {
        synced = true;
        messages.push('Descrição sincronizada no WhatsApp');
        break;
      }
    }
  }

  const businessBody: Record<string, unknown> = {};
  if (about) businessBody.description = about;
  if (address) businessBody.address = address;
  if (email) businessBody.email = email;
  if (website) businessBody.website = website;
  if (category) {
    businessBody.categories = category;
    businessBody.category = category;
  }
  if (hours) businessBody.openingHours = hours;

  if (Object.keys(businessBody).length > 0) {
    for (const path of ['/business/updateProfile', '/business/setProfile', '/chat/updateBusinessProfile']) {
      const r = await evolutionPostJson(instanceName, path, businessBody);
      if (r.ok) {
        synced = true;
        messages.push('Dados comerciais sincronizados no WhatsApp');
        break;
      }
    }
  }

  const pic = input.pictureUrl?.trim();
  if (pic) {
    for (const path of ['/chat/updateProfilePicture', '/chat/updateProfilePictureUrl']) {
      const r = await evolutionPostJson(instanceName, path, { picture: pic, url: pic });
      if (r.ok) {
        synced = true;
        messages.push('Foto sincronizada no WhatsApp');
        break;
      }
    }
  }

  if (!synced) {
    messages.push(
      'Não foi possível sincronizar com o WhatsApp agora. Verifique se está ligado em Configurações e se a Evolution suporta perfil comercial nesta instância.',
    );
  }

  return { synced, messages };
}

export async function logoutEvolutionInstance(instanceName: string): Promise<void> {
  if (isGoMode()) {
    await evolutionFetchInstance('/instance/logout', instanceName, {
      method: 'DELETE',
    }).catch(() => undefined);
    return;
  }
  await evolutionFetchGlobal(`/instance/logout/${encodeURIComponent(instanceName)}`, {
    method: 'DELETE',
  }).catch(() => undefined);
}

export async function testEvolutionConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (isGoMode()) {
      const instance =
        (import.meta.env.VITE_EVOLUTION_INSTANCE as string | undefined)?.trim() || 'zaptro';
      const res = await evolutionFetchInstance('/instance/status', instance, { method: 'GET' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
      return { ok: true };
    }
    const res = await evolutionFetchGlobal('/instance/fetchInstances', { method: 'GET' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export const evolutionApi = {
  async getConnectionStatus(instanceName: string) {
    const state = await getEvolutionConnectionState(instanceName);
    if (state === 'open') return { instance: { state: 'open' as const } };
    const qr = await fetchEvolutionQrCode(instanceName).catch(() => null);
    return {
      instance: { state },
      qrcode: qr ? { base64: qr.replace(/^data:image\/\w+;base64,/, '') } : undefined,
    };
  },

  async createInstance(_companyId: string, instanceName: string) {
    const { qrFromCreate } = await createEvolutionInstance(instanceName);
    if (!qrFromCreate) await fetchEvolutionQrCode(instanceName);
    return { hash: undefined };
  },

  testConnection: testEvolutionConnection,
};

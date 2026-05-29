/**
 * Edge Function evolution-api — Proxy Zaptro → Evolution API / Evolution GO (Multi-Tenant)
 *
 * Secrets no Supabase:
 *   EVOLUTION_API_URL=https://evolution.zaptro.com.br   (sem barra no final)
 *   EVOLUTION_API_KEY=GLOBAL_API_KEY           (chave mestre da VPS)
 *   EVOLUTION_API_MODE=go                      (go ou legacy)
 *   EVOLUTION_TLS_CA_PEM=                      (certificado real da VPS se autoassinado)
 */
import { createClient } from 'npm:@supabase/supabase-js@2.49.8';

type ConnectionUpdate = {
  status: string;
  connected: boolean;
  phone?: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function secretsSnapshot() {
  return {
    EVOLUTION_API_URL: Boolean(Deno.env.get('EVOLUTION_API_URL')?.trim()),
    EVOLUTION_API_KEY: Boolean(Deno.env.get('EVOLUTION_API_KEY')?.trim()),
    EVOLUTION_INSTANCE_API_KEY: Boolean(Deno.env.get('EVOLUTION_INSTANCE_API_KEY')?.trim()),
    EVOLUTION_INSTANCE: Deno.env.get('EVOLUTION_INSTANCE')?.trim() || null,
    EVOLUTION_API_MODE: Deno.env.get('EVOLUTION_API_MODE')?.trim() || 'go',
    SUPABASE_URL: Boolean(Deno.env.get('SUPABASE_URL')?.trim()),
    SUPABASE_ANON_KEY: Boolean(Deno.env.get('SUPABASE_ANON_KEY')?.trim()),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()),
  };
}

function diagnosticError(err: unknown, route: string[], extra?: Record<string, unknown>) {
  const message = err instanceof Error ? err.message : String(err);
  const missing: string[] = [];
  if (!Deno.env.get('EVOLUTION_API_URL')?.trim()) missing.push('EVOLUTION_API_URL');
  if (!Deno.env.get('EVOLUTION_API_KEY')?.trim() && !Deno.env.get('EVOLUTION_INSTANCE_API_KEY')?.trim()) {
    missing.push('EVOLUTION_API_KEY ou EVOLUTION_INSTANCE_API_KEY');
  }
  return {
    error: message,
    route: `/${route.join('/')}`,
    mode: isGoMode() ? 'evolution-go' : 'legacy',
    secrets: secretsSnapshot(),
    missingSecrets: missing,
    hint: missing.length
      ? 'No painel Supabase: Project Settings → Edge Functions → Secrets, ou: supabase secrets set --env-file apps/zaptro/supabase/secrets.evolution.env'
      : undefined,
    ...extra,
  };
}

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value?.trim()) {
    console.error(`[evolution-api] Falta a variável de ambiente: ${name}`);
    throw new Error(`Secret em falta: ${name}`);
  }
  return value.trim();
}

function evolutionBaseUrl(): string {
  return getEnv('EVOLUTION_API_URL').replace(/\s/g, '').replace(/\/+$/, '');
}

function apiKey(): string {
  const instanceKey = Deno.env.get('EVOLUTION_INSTANCE_API_KEY')?.replace(/\s/g, '');
  if (instanceKey) return instanceKey;
  return getEnv('EVOLUTION_API_KEY').replace(/\s/g, '');
}

function isGoMode(): boolean {
  const mode = (Deno.env.get('EVOLUTION_API_MODE') ?? 'go').toLowerCase();
  return mode !== 'legacy' && mode !== 'evolution-api';
}

function httpClient(): Deno.HttpClient | undefined {
  const ca = Deno.env.get('EVOLUTION_TLS_CA_PEM')?.replace(/\\n/g, '\n').trim();
  if (!ca) return undefined;
  try {
    if (typeof Deno.createHttpClient === 'function') {
      console.log('[evolution-api] Custom CA TLS PEM carregado com sucesso.');
      return Deno.createHttpClient({ caCerts: [ca] });
    }
  } catch (e) {
    console.error('[evolution-api] Erro ao carregar Custom CA TLS:', e);
  }
  return undefined;
}

/**
 * Validação forte de nome de instância
 */
function sanitizeInstanceName(name: string): string {
  const sanitized = name.replace(/[^a-zA-Z0-9-_]/g, '').trim();
  if (!sanitized) {
    throw new Error('Nome de instância inválido ou vazio.');
  }
  return sanitized;
}

/**
 * Executa chamadas HTTP para a VPS da Evolution
 */
async function callEvolution(path: string, method: string, body?: unknown, instanceName?: string) {
  const baseUrl = evolutionBaseUrl();
  const safePath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${safePath}`;
  const client = httpClient();
  const key = apiKey();

  // Cabeçalhos com fallback duplo para apikey e Authorization Bearer
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  };

  // Se for passado o nome da instância no modo Go, injeta no cabeçalho 'instance'
  if (instanceName) {
    const cleanName = sanitizeInstanceName(instanceName);
    headers['instance'] = cleanName;
    headers['instanceName'] = cleanName;
  }

  console.log(`[evolution-api] >>> CHAMADA: ${method} ${url} | Instância: ${instanceName || 'N/A'}`);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      client,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[evolution-api] Erro de rede ou TLS ao chamar Evolution: ${msg}`);
    if (/certificate|UnknownIssuer|tls/i.test(msg)) {
      throw new Error(
        'TLS da Evolution inválido. Use certificado válido no VPS ou adicione o secret EVOLUTION_TLS_CA_PEM com o PEM do certificado.',
      );
    }
    throw err;
  }

  const text = await res.text();
  console.log(`[evolution-api] <<< RESPOSTA: Status ${res.status} | Body: ${text.slice(0, 300)}`);

  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    return { ok: false, status: res.status, data: parsed };
  }
  return { ok: true, status: res.status, data: parsed };
}

function parseGoStatus(data: unknown): { state: string; connected: boolean; phone: string | null } {
  const root = (data ?? {}) as Record<string, unknown>;
  const inner = (root.data ?? root) as Record<string, unknown>;
  const connected = Boolean(inner.Connected ?? inner.connected);
  const loggedInRaw = inner.LoggedIn ?? inner.loggedIn;
  const loggedInExplicit = loggedInRaw !== undefined;
  const loggedIn = loggedInExplicit ? Boolean(loggedInRaw) : null;
  const myJid = inner.myJid ?? inner.jid ?? inner.Jid;
  const phone =
    typeof myJid === 'string' ? myJid.replace(/@.*/, '').replace(/\D/g, '') || null : null;
  const isPairing = connected && loggedInExplicit && !loggedIn;
  // Alguns builds GO omitem LoggedIn com sessão estável — exige LoggedIn=false explícito para «pairing»
  const isOpen =
    connected && Boolean(phone) && (loggedIn === null ? true : loggedIn) && !isPairing;
  const state = isOpen ? 'open' : isPairing ? 'pairing' : 'close';
  return {
    state,
    connected: isOpen,
    phone: isOpen ? phone : null,
  };
}

async function getAuthedClient(req: Request) {
  const supabaseUrl = getEnv('SUPABASE_URL');
  const supabaseAnon = getEnv('SUPABASE_ANON_KEY');
  const authHeader = req.headers.get('Authorization') ?? '';

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { supabase, userId: null };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    console.warn('[evolution-api] Falha ao autenticar JWT do usuário:', error?.message);
    return { supabase, userId: null };
  }

  return { supabase, userId: data.user.id };
}

async function saveConnectionState(
  req: Request,
  update: ConnectionUpdate,
  instanceFromPath?: string,
) {
  try {
    const { supabase, userId } = await getAuthedClient(req);
    if (!userId) return;

    const instance = sanitizeInstanceName(
      instanceFromPath?.trim() || Deno.env.get('EVOLUTION_INSTANCE')?.trim() || 'zaptro'
    );

    console.log(`[evolution-api] Gravando status da conexão no banco de dados para a instância: ${instance}`);

    await supabase.from('whatsapp_connections').upsert(
      {
        user_id: userId,
        instance_name: instance,
        phone: update.phone ?? null,
        status: update.status,
        connected: update.connected,
      },
      { onConflict: 'user_id,instance_name' },
    );
  } catch (e) {
    console.error('[evolution-api] Erro ao gravar status no banco:', e);
  }
}

function parseRoute(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname.replace(/^\/+|\/+$/g, '');
  const parts = pathname.split('/');
  const idx = parts.findIndex((p) => p === 'evolution-api');
  return idx >= 0 ? parts.slice(idx + 1) : [];
}

function serviceSupabase() {
  const url = getEnv('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

function evolutionWebhookPublicUrl(): string {
  const explicit = Deno.env.get('EVOLUTION_WEBHOOK_URL')?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  return `${getEnv('SUPABASE_URL').replace(/\/+$/, '')}/functions/v1/evolution-api/webhook`;
}

function jidToPhone(jid: unknown): string | null {
  if (typeof jid !== 'string' || !jid.trim()) return null;
  let local = jid.split('@')[0] ?? '';
  // Baileys/GO multi-device: 557499879409:38 → número antes do :
  if (local.includes(':')) local = local.split(':')[0] ?? local;
  const digits = local.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

function extractMessageText(msg: unknown): string {
  if (!msg || typeof msg !== 'object') return '';
  const m = msg as Record<string, unknown>;
  if (typeof m.conversation === 'string') return m.conversation;
  if (typeof m.text === 'string') return m.text;
  if (typeof m.Text === 'string') return m.Text;
  if (typeof m.body === 'string') return m.body;
  const ext = m.extendedTextMessage ?? m.ExtendedTextMessage;
  if (ext && typeof ext === 'object') {
    const e = ext as Record<string, unknown>;
    if (typeof e.text === 'string') return e.text;
    if (typeof e.Text === 'string') return e.Text;
  }
  const img = m.imageMessage ?? m.ImageMessage;
  if (img && typeof img === 'object') {
    const i = img as Record<string, unknown>;
    if (typeof i.caption === 'string') return i.caption;
    if (typeof i.Caption === 'string') return i.Caption;
  }
  return '';
}

type InboundMsg = {
  instance: string;
  phone: string;
  text: string;
  fromMe: boolean;
  pushName: string;
  messageId: string;
};

function parseMessageItem(item: unknown, event: string, instance: string): InboundMsg | null {
  if (!item || typeof item !== 'object') return null;
  const row = item as Record<string, unknown>;
  const ev = event.toUpperCase();

  const info = (row.Info ?? row.info) as Record<string, unknown> | undefined;
  if (info) {
    const phone =
      jidToPhone(info.Chat ?? info.chat) ??
      jidToPhone(info.Sender ?? info.sender ?? info.SenderAlt ?? info.senderAlt) ??
      null;
    if (!phone) return null;
    const fromMe = Boolean(info.IsFromMe ?? info.isFromMe ?? ev.includes('SEND'));
    const messageObj = (row.Message ?? row.message ?? row) as Record<string, unknown>;
    const text =
      extractMessageText(messageObj) ||
      extractMessageText(row) ||
      String(row.body ?? row.content ?? '').trim();
    if (!text && !fromMe) return null;
    return {
      instance,
      phone,
      text: text || '(mensagem)',
      fromMe,
      pushName: String(info.PushName ?? info.pushName ?? row.pushName ?? '').trim(),
      messageId: String(info.ID ?? info.id ?? row.id ?? crypto.randomUUID()),
    };
  }

  const key = (row.key ?? {}) as Record<string, unknown>;
  const phone = (
    jidToPhone(key.remoteJid) ??
    jidToPhone(row.remoteJid) ??
    jidToPhone(row.from) ??
    jidToPhone(row.chat) ??
    String(row.number ?? '').replace(/\D/g, '')
  ) || null;
  if (!phone) return null;

  const fromMe = Boolean(key.fromMe ?? row.fromMe ?? ev.includes('SEND'));
  const text =
    extractMessageText(row.message) ||
    extractMessageText(row) ||
    String(row.body ?? row.content ?? '').trim();
  if (!text && !fromMe) return null;

  return {
    instance,
    phone,
    text: text || '(mensagem)',
    fromMe,
    pushName: String(row.pushName ?? '').trim(),
    messageId: String(key.id ?? row.id ?? crypto.randomUUID()),
  };
}

function collectInboundMessages(body: unknown, fallbackInstance: string): InboundMsg[] {
  const out: InboundMsg[] = [];
  if (!body || typeof body !== 'object') return out;
  const root = body as Record<string, unknown>;
  const defaultInstance = Deno.env.get('EVOLUTION_INSTANCE')?.trim() || fallbackInstance || 'zaptro';
  const instance =
    String(root.instance ?? root.instanceName ?? root.name ?? defaultInstance).trim() || defaultInstance;

  const event = String(root.event ?? root.type ?? '');
  const eventUp = event.toUpperCase();
  const skipEvents = ['CONNECTION', 'QRCODE', 'QR', 'PRESENCE', 'CALL', 'READ_RECEIPT', 'HISTORY'];
  if (skipEvents.some((s) => eventUp.includes(s))) return out;

  const isMessageEvent =
    !event ||
    eventUp.includes('MESSAGE') ||
    eventUp === 'MESSAGE' ||
    eventUp.includes('SEND');
  if (event && !isMessageEvent) return out;

  const data = root.data;
  const candidates: unknown[] = [];
  if (Array.isArray(data)) candidates.push(...data);
  else if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.messages)) candidates.push(...d.messages);
    else candidates.push(data);
  }

  if (candidates.length === 0 && (root.key || root.Info || root.info || root.message || root.Message)) {
    candidates.push(root);
  }

  for (const item of candidates) {
    const parsed = parseMessageItem(item, event, instance);
    if (parsed) out.push(parsed);
  }
  return out;
}

async function resolveCompanyIdForInstance(db: ReturnType<typeof serviceSupabase>, instance: string) {
  const { data } = await db
    .from('whatsapp_instances')
    .select('company_id')
    .eq('instance_id', instance)
    .maybeSingle();
  if (data?.company_id) return String(data.company_id);

  const defaultInst = Deno.env.get('EVOLUTION_INSTANCE')?.trim();
  if (defaultInst && defaultInst !== instance) {
    const { data: byDefault } = await db
      .from('whatsapp_instances')
      .select('company_id')
      .eq('instance_id', defaultInst)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byDefault?.company_id) return String(byDefault.company_id);
  }

  const defaultCompany = Deno.env.get('WA_LINK_DEFAULT_COMPANY_ID')?.trim();
  if (defaultCompany) return defaultCompany;

  const { data: latestConnected } = await db
    .from('whatsapp_instances')
    .select('company_id')
    .eq('status', 'connected')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return latestConnected?.company_id ? String(latestConnected.company_id) : null;
}

async function persistInboundMessage(
  db: ReturnType<typeof serviceSupabase>,
  companyId: string,
  instance: string,
  msg: InboundMsg,
) {
  const now = new Date().toISOString();
  const phone = msg.phone.replace(/\D/g, '');
  const preview = msg.text.slice(0, 500);
  const senderName = msg.pushName || phone;

  const { data: existing } = await db
    .from('whatsapp_conversations')
    .select('id')
    .eq('company_id', companyId)
    .eq('sender_number', phone)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;

  if (!conversationId) {
    const { data: created, error: insErr } = await db
      .from('whatsapp_conversations')
      .insert({
        company_id: companyId,
        sender_number: phone,
        sender_name: senderName,
        status: 'open',
        instance_id: instance,
        last_message_at: now,
        attendance_status: 'awaiting',
        updated_at: now,
      })
      .select('id')
      .single();
    if (insErr || !created?.id) {
      console.error('[evolution-api] insert conversation:', insErr?.message);
      return;
    }
    conversationId = created.id as string;
    console.log('[WA-FLOW] CHAT_CREATED', { conversationId, companyId, phone, instance });
  } else {
    await db
      .from('whatsapp_conversations')
      .update({
        sender_name: senderName,
        instance_id: instance,
        status: 'open',
        last_message_at: now,
        updated_at: now,
      })
      .eq('id', conversationId);
  }

  const { error: msgErr } = await db.from('whatsapp_messages').insert({
    conversation_id: conversationId,
    content: msg.text,
    direction: msg.fromMe ? 'out' : 'in',
    from_number: msg.fromMe ? null : phone,
    to_number: msg.fromMe ? phone : null,
    role: msg.fromMe ? 'assistant' : 'user',
    message_id: msg.messageId,
    created_at: now,
  });
  if (msgErr) {
    console.error('[evolution-api] insert message:', msgErr.message);
    return;
  }
  console.log('[WA-FLOW] MESSAGE_SAVED', {
    conversationId,
    companyId,
    direction: msg.fromMe ? 'out' : 'in',
    phone,
  });
}

function isWebhookRoute(method: string, route: string[]): boolean {
  return method === 'POST' && route[0] === 'webhook';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const defaultInstance = Deno.env.get('EVOLUTION_INSTANCE')?.trim() || 'zaptro';
    const route = parseRoute(req);
    const go = isGoMode();
    const publicWebhook = isWebhookRoute(req.method, route);

    if (!publicWebhook) {
      const { userId } = await getAuthedClient(req);
      if (!userId) {
        return json({ error: 'JWT obrigatório' }, 401);
      }
    }

    console.log(`[evolution-api] Requisição recebida: ${req.method} /${route.join('/')}`);

    if (req.method === 'GET' && (route[0] === 'health' || route[0] === 'diagnostic')) {
      const snap = secretsSnapshot();
      let webhookUrl: string | null = null;
      let evolutionReachable: boolean | null = null;
      let evolutionStatus: number | null = null;
      let evolutionError: string | null = null;
      try {
        webhookUrl = evolutionWebhookPublicUrl();
      } catch (e) {
        evolutionError = e instanceof Error ? e.message : String(e);
      }
      if (snap.EVOLUTION_API_URL && snap.EVOLUTION_API_KEY) {
        try {
          const evo = await callEvolution('/instance/status', 'GET', undefined, defaultInstance);
          evolutionReachable = evo.ok;
          evolutionStatus = evo.status;
          if (!evo.ok) evolutionError = JSON.stringify(evo.data).slice(0, 200);
        } catch (e) {
          evolutionReachable = false;
          evolutionError = e instanceof Error ? e.message : String(e);
        }
      }
      const ready = snap.EVOLUTION_API_URL && snap.EVOLUTION_API_KEY && snap.SUPABASE_URL;
      return json({
        ok: ready,
        service: 'evolution-api',
        mode: go ? 'evolution-go' : 'legacy',
        defaultInstance,
        webhookUrl,
        secrets: snap,
        evolutionReachable,
        evolutionHttpStatus: evolutionStatus,
        evolutionError,
      }, ready ? 200 : 503);
    }

    // ROTA: Criar Instância
    if (req.method === 'POST' && route[0] === 'instance' && route[1] === 'create') {
      const body = await req.json().catch(() => ({}));
      const instance = sanitizeInstanceName(String(body?.instanceName || defaultInstance).trim());
      const token = String(body?.token || crypto.randomUUID().replace(/-/g, '')).trim();

      const payload = {
        name: instance,
        instanceName: instance,
        token: token,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        ...body
      };

      const evo = await callEvolution('/instance/create', 'POST', payload);
      if (!evo.ok) {
        return json({ error: 'Evolution create failed', details: evo.data }, evo.status);
      }

      await saveConnectionState(req, { status: 'connecting', connected: false }, instance);
      return json({ instance, status: 'connecting', raw: evo.data });
    }

    // ROTA: Obter Status da Conexão
    if (req.method === 'GET' && route[0] === 'instance' && route[1] === 'connectionState') {
      const instance = sanitizeInstanceName(route[2] || defaultInstance);
      if (go) {
        const evo = await callEvolution('/instance/status', 'GET', undefined, instance);
        if (!evo.ok) {
          return json(
            diagnosticError(new Error('Evolution GO status failed'), route, { evolution: evo.data, httpStatus: evo.status }),
            evo.status >= 400 && evo.status < 600 ? evo.status : 502,
          );
        }
        const parsed = parseGoStatus(evo.data);
        await saveConnectionState(
          req,
          { status: parsed.state, connected: parsed.connected, phone: parsed.phone },
          instance,
        );
        return json({ instance, ...parsed, raw: evo.data });
      }

      const evo = await callEvolution(`/instance/connectionState/${instance}`, 'GET');
      if (!evo.ok) {
        return json({ error: 'Evolution error', details: evo.data }, evo.status);
      }
      const payload = (evo.data ?? {}) as Record<string, unknown>;
      const instObj = payload.instance as Record<string, unknown> | undefined;
      const state = String(instObj?.state ?? payload.state ?? 'unknown');
      const phone = (payload.phone as string | undefined) ?? null;
      const connected = ['open', 'connected', 'online'].includes(state.toLowerCase());

      await saveConnectionState(req, { status: state, connected, phone }, instance);
      return json({ instance, state, connected, phone, raw: evo.data });
    }

    // ROTA: Conectar / Gerar QR Code
    if (req.method === 'GET' && route[0] === 'instance' && route[1] === 'connect') {
      const instance = sanitizeInstanceName(route[2] || defaultInstance);
      if (go) {
        // Evolution GO: QR em GET /instance/qr + header instance (não /instance/connect/{name})
        let evo = await callEvolution('/instance/qr', 'GET', undefined, instance);
        if (!evo.ok && evo.status === 401) {
          return json(
            {
              error: 'API key ou Token inválido na VPS para a instância ' + instance,
              details: evo.data,
            },
            401,
          );
        }
        if (!evo.ok) {
          const token = crypto.randomUUID().replace(/-/g, '');
          await callEvolution(
            '/instance/create',
            'POST',
            { name: instance, instanceName: instance, token, qrcode: true },
            instance,
          );
          evo = await callEvolution('/instance/qr', 'GET', undefined, instance);
        }
        if (!evo.ok) {
          return json({ error: 'Evolution GO QR failed', details: evo.data }, evo.status);
        }
        await saveConnectionState(req, { status: 'connecting', connected: false }, instance);
        return json({ instance, status: 'connecting', raw: evo.data });
      }

      const evo = await callEvolution(`/instance/connect/${instance}`, 'GET');
      if (!evo.ok) {
        return json({ error: 'Evolution error', details: evo.data }, evo.status);
      }
      await saveConnectionState(req, { status: 'connecting', connected: false }, instance);
      return json({ instance, status: 'connecting', raw: evo.data });
    }

    // ROTA: Enviar Mensagem de Texto
    if (req.method === 'POST' && route[0] === 'message' && route[1] === 'sendText') {
      const instance = sanitizeInstanceName(route[2] || defaultInstance);
      const body = await req.json().catch(() => ({}));
      const number = body?.number;
      const text = body?.text;
      if (!number || !text) {
        return json({ error: 'Campos obrigatórios: number, text' }, 400);
      }
      const path = go ? '/send/text' : `/message/sendText/${instance}`;
      const payload = { number, text };
      const evo = await callEvolution(path, 'POST', payload, go ? instance : undefined);
      if (!evo.ok) {
        return json({ error: 'Evolution error', details: evo.data }, evo.status);
      }
      return json({ success: true, instance, raw: evo.data });
    }

    // ROTA: Enviar Mídia (documento/áudio/imagem/vídeo)
    if (req.method === 'POST' && route[0] === 'message' && route[1] === 'sendMedia') {
      const instance = sanitizeInstanceName(route[2] || defaultInstance);
      const body = await req.json().catch(() => ({}));
      const number = body?.number;
      const mediatype = body?.mediatype;
      const mimetype = body?.mimetype;
      const media = body?.media;
      const fileName = body?.fileName;
      if (!number || !mediatype || !mimetype || !media) {
        return json(
          { error: 'Campos obrigatórios: number, mediatype, mimetype, media (e fileName para documento)' },
          400,
        );
      }
      const path = go ? '/send/media' : `/message/sendMedia/${instance}`;
      const payload = { number, mediatype, mimetype, media, ...(fileName ? { fileName } : {}) };
      const evo = await callEvolution(path, 'POST', payload, go ? instance : undefined);
      if (!evo.ok) {
        return json({ error: 'Evolution error', details: evo.data }, evo.status);
      }
      return json({ success: true, instance, raw: evo.data });
    }

    // ROTA: Enviar Figurinha
    if (req.method === 'POST' && route[0] === 'message' && route[1] === 'sendSticker') {
      const instance = sanitizeInstanceName(route[2] || defaultInstance);
      const body = await req.json().catch(() => ({}));
      const number = body?.number;
      const sticker = body?.sticker;
      if (!number || !sticker) {
        return json({ error: 'Campos obrigatórios: number, sticker' }, 400);
      }
      const path = go ? '/send/sticker' : `/message/sendSticker/${instance}`;
      const payload = { number, sticker };
      const evo = await callEvolution(path, 'POST', payload, go ? instance : undefined);
      if (!evo.ok) {
        return json({ error: 'Evolution error', details: evo.data }, evo.status);
      }
      return json({ success: true, instance, raw: evo.data });
    }

    // ROTA: Criar grupo WhatsApp
    if (req.method === 'POST' && route[0] === 'group' && route[1] === 'create') {
      const instance = sanitizeInstanceName(route[2] || defaultInstance);
      const body = await req.json().catch(() => ({}));
      const subject = body?.subject;
      const participants = body?.participants;
      if (!subject || !Array.isArray(participants) || participants.length === 0) {
        return json({ error: 'Campos obrigatórios: subject, participants[]' }, 400);
      }
      const path = go ? '/group/create' : `/group/create/${instance}`;
      const payload = {
        subject,
        description: body?.description,
        participants: participants.map((p: unknown) => String(p).replace(/\D/g, '')).filter(Boolean),
      };
      const evo = await callEvolution(path, 'POST', payload, go ? instance : undefined);
      if (!evo.ok) {
        return json({ error: 'Evolution error', details: evo.data }, evo.status);
      }
      const raw = evo.data as Record<string, unknown> | undefined;
      const groupJid =
        (typeof raw?.id === 'string' && raw.id) ||
        (typeof raw?.gid === 'string' && raw.gid) ||
        undefined;
      return json({ success: true, instance, groupJid, raw: evo.data });
    }

    // ROTA: Apagar conversa no WhatsApp
    if (req.method === 'POST' && route[0] === 'chat' && route[1] === 'delete') {
      const instance = sanitizeInstanceName(route[2] || defaultInstance);
      const body = await req.json().catch(() => ({}));
      const number = String(body?.number ?? '').trim();
      if (!number) return json({ error: 'Campo number é obrigatório' }, 400);
      const paths = go
        ? ['/chat/delete', '/delete/chat', '/chat/remove']
        : [`/chat/delete/${instance}`, `/chat/deleteChat/${instance}`];
      let last: { ok: boolean; status: number; data: unknown } = { ok: false, status: 502, data: null };
      for (const path of paths) {
        last = await callEvolution(path, 'POST', { number }, go ? instance : undefined);
        if (last.ok) break;
      }
      if (!last.ok) {
        return json({ error: 'Evolution error', details: last.data }, last.status >= 400 ? last.status : 502);
      }
      return json({ success: true, instance, raw: last.data });
    }

    // ROTA: Arquivar conversa no WhatsApp
    if (req.method === 'POST' && route[0] === 'chat' && route[1] === 'archive') {
      const instance = sanitizeInstanceName(route[2] || defaultInstance);
      const body = await req.json().catch(() => ({}));
      const number = String(body?.number ?? '').trim();
      const archive = body?.archive !== false;
      if (!number) return json({ error: 'Campo number é obrigatório' }, 400);
      const paths = go
        ? ['/chat/archive', '/archive/chat']
        : [`/chat/archive/${instance}`, `/chat/archiveChat/${instance}`];
      let last: { ok: boolean; status: number; data: unknown } = { ok: false, status: 502, data: null };
      for (const path of paths) {
        last = await callEvolution(path, 'POST', { number, archive }, go ? instance : undefined);
        if (last.ok) break;
      }
      if (!last.ok) {
        return json({ error: 'Evolution error', details: last.data }, last.status >= 400 ? last.status : 502);
      }
      return json({ success: true, instance, raw: last.data });
    }

    // ROTA: Webhook Evolution → grava conversas/mensagens (sem JWT; opcional secret)
    if (req.method === 'POST' && route[0] === 'webhook') {
      const expectedSecret = Deno.env.get('EVOLUTION_WEBHOOK_SECRET')?.trim();
      if (expectedSecret) {
        const got =
          req.headers.get('x-zaptro-webhook-secret') ??
          req.headers.get('x-webhook-secret') ??
          '';
        if (got !== expectedSecret) {
          return json({ error: 'Webhook não autorizado' }, 401);
        }
      }

      const body = await req.json().catch(() => ({}));
      const instanceHint = String(
        (body as Record<string, unknown>)?.instance ??
          (body as Record<string, unknown>)?.instanceName ??
          '',
      ).trim();

      const inbound = collectInboundMessages(body, instanceHint);
      const eventName = (body as Record<string, unknown>)?.event ?? (body as Record<string, unknown>)?.type;
      console.log('[WA-FLOW] MESSAGE_EVENT_RECEIVED', {
        instanceHint,
        event: eventName,
        inboundCount: inbound.length,
      });
      console.log('[WA-FLOW] WEBHOOK_RECEIVED', {
        instanceHint,
        inboundCount: inbound.length,
        event: eventName,
      });
      if (inbound.length === 0) {
        const preview = JSON.stringify(body).slice(0, 400);
        console.log('[WA-FLOW] WEBHOOK_PARSE_MISS', { event: eventName, preview });
        return json({ ok: true, processed: 0, note: 'event ignored or parse miss', event: eventName });
      }

      const db = serviceSupabase();
      let processed = 0;
      for (const msg of inbound) {
        const inst = sanitizeInstanceName(msg.instance || instanceHint || defaultInstance);
        const companyId = await resolveCompanyIdForInstance(db, inst);
        if (!companyId) {
          console.warn(`[evolution-api] webhook: empresa não mapeada para instância ${inst}`);
          continue;
        }
        await persistInboundMessage(db, companyId, inst, msg);
        processed += 1;
      }
      console.log('[WA-FLOW] SESSION_PERSISTED', { processed, instanceHint, table: 'whatsapp_messages' });
      return json({ ok: true, processed });
    }

    // ROTA: Activar inbox (webhook + whatsapp_instances)
    if (req.method === 'POST' && route[0] === 'instance' && route[1] === 'activateInbox') {
      const { supabase, userId } = await getAuthedClient(req);
      if (!userId) return json({ error: 'JWT obrigatório' }, 401);

      const body = await req.json().catch(() => ({}));
      const companyId = String(body?.companyId ?? '').trim();
      if (!companyId) return json({ error: 'companyId obrigatório' }, 400);

      const instance = sanitizeInstanceName(String(route[2] || body?.instanceName || defaultInstance));
      const webhookUrl = evolutionWebhookPublicUrl();

      if (go) {
        const webhookPayload = {
          webhookUrl,
          subscribe: ['ALL'],
        };
        const reg = await callEvolution('/instance/connect', 'POST', webhookPayload, instance);
        console.log('[WA-FLOW] WEBHOOK_REGISTERED', {
          instance,
          webhookUrl,
          ok: reg.ok,
          status: reg.status,
        });
      }

      await supabase.from('whatsapp_instances').upsert(
        {
          company_id: companyId,
          instance_id: instance,
          provider: 'evolution',
          status: 'connected',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id' },
      );

      return json({ success: true, instance, companyId, webhookUrl });
    }

    // ROTA: Importar perfil WhatsApp → Zaptro (pós-QR / polling)
    if (req.method === 'GET' && route[0] === 'business' && route[1] === 'importProfile') {
      const instance = sanitizeInstanceName(route[2] || defaultInstance);
      const url = new URL(req.url);
      const phone = (url.searchParams.get('phone') || '').replace(/\D/g, '');
      if (!phone) return json({ error: 'phone é obrigatório' }, 400);

      const jid = `${phone}@s.whatsapp.net`;
      const profile: Record<string, unknown> = {
        name: '',
        segment: '',
        description: '',
        phone,
        email: '',
        website: '',
        address: '',
        city: '',
        state: '',
        openingHours: '',
        logoUrl: null,
        accountType: 'unknown',
      };

      const pick = (...vals: unknown[]) => {
        for (const v of vals) {
          if (typeof v === 'string' && v.trim()) return v.trim();
        }
        return '';
      };

      const applyBlocks = (payload: unknown) => {
        if (!payload || typeof payload !== 'object') return;
        const root = payload as Record<string, unknown>;
        const candidates: unknown[] = [root, root.data, root.result, root.profile, root.business];
        if (Array.isArray(root.data)) candidates.push(...root.data);
        for (const c of candidates) {
          if (!c || typeof c !== 'object') continue;
          const b = c as Record<string, unknown>;
          const biz = (b.business ?? b.Business) as Record<string, unknown> | undefined;
          const row = biz && typeof biz === 'object' ? biz : b;
          const name = pick(row.name, row.profileName, row.pushname, row.businessName, row.verifiedName);
          if (name) profile.name = name;
          const desc = pick(row.description, row.about, row.status, row.bio);
          if (desc) profile.description = desc;
          const email = pick(row.email, row.businessEmail);
          if (email) profile.email = email;
          const website = pick(row.website, row.businessWebsite);
          if (website) profile.website = website;
          const address = pick(row.address, row.businessAddress);
          if (address) profile.address = address;
          const segment = pick(row.category, row.categories, row.businessCategory);
          if (segment) {
            profile.segment = segment;
            profile.accountType = 'business';
          }
          const hours = pick(row.openingHours, row.businessHours, row.hours);
          if (hours) profile.openingHours = hours;
          const pic = pick(row.pictureUrl, row.profilePictureUrl, row.picture, row.imgUrl);
          if (pic) profile.logoUrl = pic;
        }
      };

      for (const num of [phone, jid]) {
        for (const path of ['/chat/fetchProfilePictureUrl', '/chat/profilePictureUrl']) {
          const evo = await callEvolution(path, 'POST', { number: num }, go ? instance : undefined);
          if (evo.ok) applyBlocks(evo.data);
        }
      }

      for (const num of [phone, jid]) {
        for (const path of ['/chat/fetchBusinessProfile', '/chat/fetchProfile', '/business/fetchProfile']) {
          const evo = await callEvolution(path, 'POST', { number: num }, go ? instance : undefined);
          if (evo.ok) applyBlocks(evo.data);
        }
      }

      if (!profile.name && !profile.logoUrl) {
        const statusEvo = await callEvolution('/instance/status', 'GET', undefined, go ? instance : undefined);
        if (statusEvo.ok) applyBlocks(statusEvo.data);
      }

      if (profile.segment || profile.email || profile.website) {
        profile.accountType = 'business';
      } else if (profile.name) {
        profile.accountType = 'personal';
      }

      return json({ imported: true, profile, instance });
    }

    // ROTA: Sincronizar perfil comercial (WhatsApp Business)
    if (req.method === 'POST' && route[0] === 'business' && route[1] === 'syncProfile') {
      const instance = sanitizeInstanceName(route[2] || defaultInstance);
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const messages: string[] = [];
      let synced = false;

      const tryPost = async (path: string, payload: Record<string, unknown>) => {
        const evo = await callEvolution(path, 'POST', payload, go ? instance : undefined);
        return evo.ok;
      };

      const name = String(body.name ?? '').trim();
      const about = String(body.description ?? '').trim();
      if (name) {
        const ok =
          (await tryPost('/chat/updateProfileName', { name })) ||
          (await tryPost(`/chat/updateProfileName/${instance}`, { name }));
        if (ok) {
          synced = true;
          messages.push('Nome sincronizado no WhatsApp');
        }
      }
      if (about) {
        const ok =
          (await tryPost('/chat/updateProfileStatus', { status: about })) ||
          (await tryPost(`/chat/updateProfileStatus/${instance}`, { status: about }));
        if (ok) {
          synced = true;
          messages.push('Descrição sincronizada no WhatsApp');
        }
      }

      const businessPayload: Record<string, unknown> = {};
      if (about) businessPayload.description = about;
      const address = String(body.address ?? '').trim();
      if (address) businessPayload.address = address;
      const email = String(body.email ?? '').trim();
      if (email) businessPayload.email = email;
      const website = String(body.website ?? '').trim();
      if (website) businessPayload.website = website;
      const category = String(body.category ?? '').trim();
      if (category) {
        businessPayload.categories = category;
        businessPayload.category = category;
      }
      const openingHours = String(body.openingHours ?? '').trim();
      if (openingHours) businessPayload.openingHours = openingHours;

      if (Object.keys(businessPayload).length > 0) {
        const ok =
          (await tryPost('/business/updateProfile', businessPayload)) ||
          (await tryPost(`/business/updateProfile/${instance}`, businessPayload));
        if (ok) {
          synced = true;
          messages.push('Dados comerciais sincronizados no WhatsApp');
        }
      }

      const pictureUrl = String(body.pictureUrl ?? '').trim();
      if (pictureUrl) {
        const ok =
          (await tryPost('/chat/updateProfilePicture', { picture: pictureUrl, url: pictureUrl })) ||
          (await tryPost(`/chat/updateProfilePicture/${instance}`, { picture: pictureUrl, url: pictureUrl }));
        if (ok) {
          synced = true;
          messages.push('Foto sincronizada no WhatsApp');
        }
      }

      if (!synced) {
        messages.push(
          'Evolution não confirmou a atualização do perfil. Confirme que o WhatsApp está ligado e que a API suporta perfil comercial.',
        );
      }

      return json({ synced, messages, instance });
    }

    // ROTA: Desconectar / Deslogar Instância
    if (req.method === 'DELETE' && route[0] === 'instance' && route[1] === 'logout') {
      const instance = sanitizeInstanceName(route[2] || defaultInstance);
      const path = go ? '/instance/logout' : `/instance/logout/${instance}`;
      const method = go ? 'POST' : 'DELETE';

      const evo = await callEvolution(path, method, undefined, go ? instance : undefined);
      if (!evo.ok) {
        return json({ error: 'Evolution error', details: evo.data }, evo.status);
      }
      await saveConnectionState(req, { status: 'disconnected', connected: false, phone: null }, instance);
      return json({ success: true, instance, status: 'disconnected', raw: evo.data });
    }

    return json(
      {
        error: 'Rota não encontrada',
        mode: go ? 'evolution-go' : 'legacy',
      },
      404,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error(`[evolution-api] CRASH FATAL: ${message}`, err);
    let route: string[] = [];
    try {
      route = parseRoute(req);
    } catch {
      /* ignore */
    }
    return json(diagnosticError(err, route), 500);
  }
});

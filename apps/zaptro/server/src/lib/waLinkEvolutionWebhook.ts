import type { SupabaseClient } from '@supabase/supabase-js';

export type InboundMsg = {
  instance: string;
  phone: string;
  text: string;
  fromMe: boolean;
  pushName: string;
  messageId: string;
};

function jidToPhone(jid: unknown): string | null {
  if (typeof jid !== 'string' || !jid.trim()) return null;
  let local = jid.split('@')[0] ?? '';
  if (local.includes(':')) local = local.split(':')[0] ?? local;
  const digits = local.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

function extractMessageText(msg: unknown): string {
  if (!msg || typeof msg !== 'object') return '';
  const m = msg as Record<string, unknown>;
  if (typeof m.conversation === 'string') return m.conversation;
  if (typeof m.text === 'string') return m.text;
  const ext = m.extendedTextMessage;
  if (ext && typeof ext === 'object') {
    const e = ext as Record<string, unknown>;
    if (typeof e.text === 'string') return e.text;
  }
  return '';
}

export function parseEvolutionWebhookBody(body: unknown, fallbackInstance: string): InboundMsg[] {
  const out: InboundMsg[] = [];
  if (!body || typeof body !== 'object') return out;
  const root = body as Record<string, unknown>;
  const instance =
    String(root.instance ?? root.instanceName ?? root.name ?? fallbackInstance).trim() ||
    fallbackInstance;

  const event = String(root.event ?? root.type ?? '');
  const eventUp = event.toUpperCase();
  const skipEvents = ['CONNECTION', 'QRCODE', 'QR', 'PRESENCE', 'CALL', 'READ_RECEIPT', 'HISTORY'];
  if (skipEvents.some((s) => eventUp.includes(s))) return out;

  const isMessageEvent =
    !event || eventUp.includes('MESSAGE') || eventUp === 'MESSAGE' || eventUp.includes('SEND');
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
  const phone =
    jidToPhone(key.remoteJid) ??
    jidToPhone(row.remoteJid) ??
    jidToPhone(row.from) ??
    jidToPhone(row.chat) ??
    (String(row.number ?? '').replace(/\D/g, '') || null);
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

async function resolveCompanyId(
  db: SupabaseClient,
  instance: string,
  defaultCompanyId: string | null,
): Promise<string | null> {
  const { data } = await db
    .from('whatsapp_instances')
    .select('company_id')
    .eq('instance_id', instance)
    .maybeSingle();
  if (data?.company_id) return String(data.company_id);
  if (defaultCompanyId) return defaultCompanyId;

  const { data: latest } = await db
    .from('whatsapp_instances')
    .select('company_id')
    .eq('status', 'connected')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return latest?.company_id ? String(latest.company_id) : null;
}

async function insertConversation(
  db: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<{ id: string } | null> {
  const { data, error } = await db.from('whatsapp_conversations').insert(payload).select('id').single();
  if (!error && data?.id) return { id: String(data.id) };

  const msg = String(error?.message ?? '').toLowerCase();
  if (!msg.includes('does not exist') && !msg.includes('42703')) {
    console.error('[wa-webhook] insert conversation:', error?.message);
    return null;
  }

  const minimal: Record<string, unknown> = {
    company_id: payload.company_id,
    sender_number: payload.sender_number,
    sender_name: payload.sender_name,
    status: payload.status ?? 'open',
  };
  const retry = await db.from('whatsapp_conversations').insert(minimal).select('id').single();
  if (retry.error) {
    console.error('[wa-webhook] insert conversation (minimal):', retry.error.message);
    return null;
  }
  return retry.data?.id ? { id: String(retry.data.id) } : null;
}

async function updateConversation(
  db: SupabaseClient,
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { error } = await db.from('whatsapp_conversations').update(payload).eq('id', id);
  if (!error) return;

  const msg = String(error.message ?? '').toLowerCase();
  if (!msg.includes('does not exist') && !msg.includes('42703')) {
    console.error('[wa-webhook] update conversation:', error.message);
    return;
  }

  const minimal: Record<string, unknown> = { status: 'open' };
  if (payload.sender_name) minimal.sender_name = payload.sender_name;
  await db.from('whatsapp_conversations').update(minimal).eq('id', id);
}

async function insertMessage(
  db: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const { error } = await db.from('whatsapp_messages').insert(payload);
  if (!error) return true;

  const msg = String(error.message ?? '').toLowerCase();
  if (!msg.includes('does not exist') && !msg.includes('42703')) {
    console.error('[wa-webhook] insert message:', error.message);
    return false;
  }

  const minimal: Record<string, unknown> = {
    conversation_id: payload.conversation_id,
    created_at: payload.created_at,
  };
  if (payload.content) minimal.content = payload.content;
  if (payload.direction) minimal.direction = payload.direction;
  const retry = await db.from('whatsapp_messages').insert(minimal);
  if (retry.error) {
    console.error('[wa-webhook] insert message (minimal):', retry.error.message);
    return false;
  }
  return true;
}

export async function persistWaLinkInboundMessage(
  db: SupabaseClient,
  companyId: string,
  instance: string,
  msg: InboundMsg,
): Promise<boolean> {
  const now = new Date().toISOString();
  const phone = msg.phone.replace(/\D/g, '');
  const senderName = msg.pushName || phone;

  const { data: existing } = await db
    .from('whatsapp_conversations')
    .select('id')
    .eq('company_id', companyId)
    .eq('sender_number', phone)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;

  if (!conversationId) {
    const created = await insertConversation(db, {
      company_id: companyId,
      sender_number: phone,
      sender_name: senderName,
      status: 'open',
      instance_id: instance,
      last_message_at: now,
      attendance_status: 'awaiting',
      updated_at: now,
    });
    if (!created) return false;
    conversationId = created.id;
  } else {
    await updateConversation(db, conversationId, {
      sender_name: senderName,
      instance_id: instance,
      status: 'open',
      last_message_at: now,
      updated_at: now,
    });
  }

  return insertMessage(db, {
    conversation_id: conversationId,
    content: msg.text,
    direction: msg.fromMe ? 'out' : 'in',
    from_number: msg.fromMe ? null : phone,
    to_number: msg.fromMe ? phone : null,
    role: msg.fromMe ? 'assistant' : 'user',
    message_id: msg.messageId,
    created_at: now,
  });
}

export async function processEvolutionWebhookPayload(
  db: SupabaseClient,
  body: unknown,
  opts: { defaultInstance: string; defaultCompanyId: string | null },
): Promise<{ processed: number; skipped: number; errors: string[] }> {
  const inbound = parseEvolutionWebhookBody(body, opts.defaultInstance);
  if (inbound.length === 0) {
    return { processed: 0, skipped: 0, errors: [] };
  }

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const msg of inbound) {
    const inst = msg.instance.trim() || opts.defaultInstance;
    const companyId = await resolveCompanyId(db, inst, opts.defaultCompanyId);
    if (!companyId) {
      skipped += 1;
      errors.push(`sem empresa para instância ${inst}`);
      continue;
    }
    const ok = await persistWaLinkInboundMessage(db, companyId, inst, msg);
    if (ok) processed += 1;
    else errors.push(`falha ao gravar ${msg.phone}`);
  }

  return { processed, skipped, errors };
}

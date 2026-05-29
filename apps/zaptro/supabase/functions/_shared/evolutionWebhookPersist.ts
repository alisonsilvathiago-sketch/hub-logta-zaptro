import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.49.8';
import {
  type NormalizedWaMessage,
  type ParsedEvolutionWebhook,
  hashEventPayload,
  previewContent,
} from './evolutionGoParser.ts';

const MEDIA_BUCKET = 'wa-link-media';
const RETRY_BASE_MS = 60_000;
const RETRY_MAX = 5;

function mediaMirrorEnabled(): boolean {
  const v = Deno.env.get('MEDIA_MIRROR_ENABLED')?.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

export type InstanceRecord = { id: string; companyId: string };

export type PersistOutcome =
  | { ok: true; conversationId: string; isInbound: boolean; externalId: string }
  | { ok: false; error: string; externalId?: string };

function zapto(db: SupabaseClient) {
  return db.schema('zapto');
}

function logStructured(fields: Record<string, unknown>) {
  console.log(JSON.stringify({ service: 'evolution-webhook', ts: new Date().toISOString(), ...fields }));
}

function logError(fields: Record<string, unknown>) {
  console.error(JSON.stringify({ service: 'evolution-webhook', level: 'error', ts: new Date().toISOString(), ...fields }));
}

export async function resolveInstanceRecord(
  db: SupabaseClient,
  instanceName: string,
): Promise<InstanceRecord | null> {
  const name = instanceName.trim();
  if (!name) return null;

  const { data: existing } = await db
    .from('whatsapp_instances')
    .select('id, company_id')
    .or(`instance_id.eq.${name},instance_name.eq.${name}`)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id && existing.company_id) {
    return { id: String(existing.id), companyId: String(existing.company_id) };
  }

  const defaultCompany = Deno.env.get('WA_LINK_DEFAULT_COMPANY_ID')?.trim();
  if (!defaultCompany) return null;

  const { data: upserted, error } = await db
    .from('whatsapp_instances')
    .upsert(
      {
        instance_id: name,
        instance_name: name,
        company_id: defaultCompany,
        status: 'connected',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'instance_id' },
    )
    .select('id, company_id')
    .maybeSingle();

  if (error) {
    logError({ step: 'resolve_instance', instance: name, error: error.message });
    return null;
  }
  if (upserted?.id && upserted.company_id) {
    return { id: String(upserted.id), companyId: String(upserted.company_id) };
  }
  return null;
}

export async function saveRawEvent(
  db: SupabaseClient,
  parsed: ParsedEvolutionWebhook,
  processingStatus: 'pending' | 'processed' | 'skipped' | 'failed',
  errorMessage?: string,
): Promise<{ rawId: string | null; duplicate: boolean }> {
  const eventHash = await hashEventPayload(parsed.instance, parsed.eventType, parsed.rawPayload);

  const { data: existing } = await zapto(db)
    .from('evolution_events_raw')
    .select('id')
    .eq('event_hash', eventHash)
    .maybeSingle();

  if (existing?.id) {
    return { rawId: String(existing.id), duplicate: true };
  }

  const { data, error } = await zapto(db)
    .from('evolution_events_raw')
    .insert({
      instance_name: parsed.instance,
      event_type: parsed.eventType,
      event_hash: eventHash,
      processing_status: processingStatus,
      error_message: errorMessage ?? null,
      payload: parsed.rawPayload as Record<string, unknown>,
      processed_at: processingStatus === 'processed' || processingStatus === 'skipped' ? new Date().toISOString() : null,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') return { rawId: null, duplicate: true };
    logError({ step: 'save_raw_event', event_type: parsed.eventType, error: error.message });
    return { rawId: null, duplicate: false };
  }

  return { rawId: data?.id ? String(data.id) : null, duplicate: false };
}

export async function markRawEventStatus(
  db: SupabaseClient,
  rawId: string | null,
  status: 'processed' | 'skipped' | 'failed',
  errorMessage?: string,
  retryCount?: number,
): Promise<void> {
  if (!rawId) return;
  const patch: Record<string, unknown> = {
    processing_status: status,
    processed_at: new Date().toISOString(),
    error_message: errorMessage ?? null,
  };
  if (typeof retryCount === 'number') {
    patch.retry_count = retryCount;
    if (status === 'failed' && retryCount < RETRY_MAX) {
      patch.next_retry_at = new Date(Date.now() + RETRY_BASE_MS * Math.pow(2, retryCount)).toISOString();
    }
  }
  await zapto(db).from('evolution_events_raw').update(patch).eq('id', rawId);
}

function decodeBase64(input: string): Uint8Array {
  const normalized = input.replace(/^data:[^;]+;base64,/, '');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function downloadMediaBytes(media: NonNullable<NormalizedWaMessage['media']>): Promise<Uint8Array | null> {
  if (media.base64) {
    try {
      return decodeBase64(media.base64);
    } catch {
      return null;
    }
  }
  if (media.sourceUrl && (media.sourceUrl.startsWith('http://') || media.sourceUrl.startsWith('https://'))) {
    try {
      const res = await fetch(media.sourceUrl, { signal: AbortSignal.timeout(25_000) });
      if (!res.ok) return null;
      return new Uint8Array(await res.arrayBuffer());
    } catch {
      return null;
    }
  }
  return null;
}

async function uploadMediaToStorage(
  db: SupabaseClient,
  companyId: string,
  instanceName: string,
  externalId: string,
  media: NonNullable<NormalizedWaMessage['media']>,
): Promise<{ storagePath: string | null; publicUrl: string | null }> {
  if (!mediaMirrorEnabled()) return { storagePath: null, publicUrl: null };

  const bytes = await downloadMediaBytes(media);
  if (!bytes?.length) return { storagePath: null, publicUrl: null };

  const ext = media.fileExt || 'bin';
  const storagePath = `${companyId}/${instanceName}/${externalId}.${ext}`;
  const contentType = media.mimeType || 'application/octet-stream';

  const { error } = await db.storage.from(MEDIA_BUCKET).upload(storagePath, bytes, {
    upsert: true,
    contentType,
  });

  if (error) {
    logError({ step: 'upload_media', external_id: externalId, error: error.message });
    return { storagePath: null, publicUrl: null };
  }

  const { data: signed } = await db.storage.from(MEDIA_BUCKET).createSignedUrl(storagePath, 60 * 60 * 24 * 7);
  return { storagePath, publicUrl: signed?.signedUrl ?? null };
}

async function upsertMessageMedia(
  db: SupabaseClient,
  msg: NormalizedWaMessage,
  storagePath: string | null,
  resolvedUrl: string | null,
): Promise<void> {
  if (!msg.media) return;
  const media = msg.media;
  await zapto(db).from('whatsapp_message_media').upsert(
    {
      message_external_id: msg.externalId,
      media_kind: media.kind,
      mime_type: media.mimeType,
      file_name: media.fileName,
      file_ext: media.fileExt,
      file_size_bytes: media.fileSizeBytes,
      duration_seconds: media.durationSeconds,
      thumbnail_url: media.thumbnailUrl,
      source_url: media.sourceUrl,
      storage_path: storagePath,
      metadata: media.metadata,
    },
    { onConflict: 'message_external_id,media_kind', ignoreDuplicates: false },
  );

  if (!resolvedUrl && storagePath) {
    const { data: signed } = await db.storage.from(MEDIA_BUCKET).createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    if (signed?.signedUrl && msg.externalId) {
      await db.from('whatsapp_messages').update({ media_url: signed.signedUrl }).eq('external_id', msg.externalId);
    }
  }
}

async function resolveConversationId(
  db: SupabaseClient,
  companyId: string,
  instanceUuid: string,
  instanceName: string,
  msg: NormalizedWaMessage,
): Promise<string | null> {
  const now = new Date().toISOString();
  const phone = msg.isGroup ? (msg.groupId || msg.senderNumber) : msg.senderNumber.replace(/\D/g, '');
  const senderName = msg.isGroup
    ? (msg.senderName || `Grupo ${phone}`)
    : (msg.senderName || phone);

  const { data: existing } = await db
    .from('whatsapp_conversations')
    .select('id')
    .eq('instance_id', instanceUuid)
    .eq('sender_number', phone)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;

  if (!conversationId) {
    const { data: byCompany } = await db
      .from('whatsapp_conversations')
      .select('id')
      .eq('company_id', companyId)
      .eq('sender_number', phone)
      .maybeSingle();
    conversationId = byCompany?.id as string | undefined;
  }

  if (!conversationId) {
    const { data: created, error: insErr } = await db
      .from('whatsapp_conversations')
      .insert({
        company_id: companyId,
        sender_number: phone,
        sender_name: senderName,
        status: 'open',
        instance_id: instanceUuid,
        connection_id: instanceName,
        last_message_at: now,
        attendance_status: 'awaiting',
        updated_at: now,
        metadata: msg.isGroup ? { is_group: true, group_id: msg.groupId } : {},
      })
      .select('id')
      .single();
    if (insErr || !created?.id) {
      logError({ step: 'insert_conversation', phone, error: insErr?.message });
      return null;
    }
    conversationId = created.id as string;
  } else {
    await db
      .from('whatsapp_conversations')
      .update({
        sender_name: senderName,
        instance_id: instanceUuid,
        connection_id: instanceName,
        status: 'open',
        last_message_at: now,
        updated_at: now,
        last_message: previewContent(msg),
      })
      .eq('id', conversationId);
  }

  return conversationId;
}

async function applyReaction(db: SupabaseClient, msg: NormalizedWaMessage): Promise<PersistOutcome> {
  const targetId = msg.reactionTargetId;
  if (!targetId) return { ok: false, error: 'reaction without target id', externalId: msg.externalId };

  const { error } = await db
    .from('whatsapp_messages')
    .update({
      reaction: msg.reaction,
      event_type: msg.eventType,
    })
    .eq('external_id', targetId);

  if (error) return { ok: false, error: error.message, externalId: msg.externalId };
  return { ok: true, conversationId: '', isInbound: !msg.fromMe, externalId: msg.externalId };
}

async function applyEditOrDelete(db: SupabaseClient, msg: NormalizedWaMessage): Promise<boolean> {
  const targetId = msg.quotedMessageId;
  if (!targetId) return false;

  const patch: Record<string, unknown> = {
    event_type: msg.eventType,
    is_edited: msg.isEdited,
    is_deleted: msg.isDeleted,
    raw_payload: msg.rawPayload,
  };
  if (msg.isEdited && msg.content) {
    patch.content = msg.content;
    patch.is_edited = true;
  }
  if (msg.isDeleted) {
    patch.content = '(mensagem apagada)';
    patch.is_deleted = true;
  }

  const { data } = await db
    .from('whatsapp_messages')
    .update(patch)
    .eq('external_id', targetId)
    .select('id, conversation_id')
    .maybeSingle();

  return Boolean(data?.id);
}

export async function persistNormalizedMessage(
  db: SupabaseClient,
  companyId: string,
  instanceUuid: string,
  instanceName: string,
  msg: NormalizedWaMessage,
): Promise<PersistOutcome> {
  const now = new Date().toISOString();

  if (msg.messageType === 'reaction') {
    return applyReaction(db, msg);
  }

  if ((msg.isEdited || msg.isDeleted) && msg.quotedMessageId) {
    const updated = await applyEditOrDelete(db, msg);
    if (updated) {
      return { ok: true, conversationId: '', isInbound: !msg.fromMe, externalId: msg.externalId };
    }
  }

  const conversationId = await resolveConversationId(db, companyId, instanceUuid, instanceName, msg);
  if (!conversationId) return { ok: false, error: 'conversation unresolved', externalId: msg.externalId };

  const phone = msg.isGroup ? (msg.groupId || msg.senderNumber) : msg.senderNumber.replace(/\D/g, '');
  const preview = previewContent(msg);

  let mediaUrl: string | null = msg.media?.sourceUrl ?? null;
  let storagePath: string | null = null;

  if (msg.media) {
    const uploaded = await uploadMediaToStorage(db, companyId, instanceName, msg.externalId, msg.media);
    storagePath = uploaded.storagePath;
    if (uploaded.publicUrl) mediaUrl = uploaded.publicUrl;
  }

  const messageType = msg.messageType === 'ptt' ? 'audio' : msg.messageType;
  const mimeType = msg.media?.mimeType ?? null;
  const fileName = msg.media?.fileName ?? null;

  const row: Record<string, unknown> = {
    conversation_id: conversationId,
    instance_id: instanceUuid,
    direction: msg.direction,
    message_type: messageType,
    content: msg.content ?? preview,
    media_url: mediaUrl,
    media_mime_type: mimeType,
    media_file_name: fileName,
    media_file_size_bytes: msg.media?.fileSizeBytes ?? null,
    media_duration_seconds: msg.media?.durationSeconds ?? null,
    media_thumbnail_url: msg.media?.thumbnailUrl ?? null,
    sender_name: msg.senderName,
    sender_number: phone,
    remote_jid: msg.remoteJid,
    is_group: msg.isGroup,
    group_id: msg.groupId,
    participant_jid: msg.participantJid,
    participant_name: msg.participantName,
    quoted_message_id: msg.quotedMessageId,
    quoted_message_payload: msg.quotedPayload ?? null,
    is_forwarded: msg.isForwarded,
    is_edited: msg.isEdited,
    is_deleted: msg.isDeleted,
    reaction: msg.reaction,
    event_type: msg.eventType,
    raw_payload: msg.rawPayload,
    location_lat: msg.locationLat,
    location_lng: msg.locationLng,
    contact_vcard: msg.contactVcard,
    sent_at: msg.sentAt,
    from_number: msg.fromMe ? null : phone,
    to_number: msg.fromMe ? phone : null,
    role: msg.fromMe ? 'assistant' : 'user',
    external_id: msg.externalId,
    created_at: msg.sentAt || now,
  };

  const { error: msgErr } = await db.from('whatsapp_messages').upsert(row, { onConflict: 'external_id' });
  if (msgErr) {
    logError({
      step: 'upsert_message',
      event_type: msg.eventType,
      message_id: msg.externalId,
      processing_status: 'failed',
      error: msgErr.message,
    });
    return { ok: false, error: msgErr.message, externalId: msg.externalId };
  }

  if (msg.media) {
    await upsertMessageMedia(db, msg, storagePath, mediaUrl);
  }

  await db
    .from('whatsapp_conversations')
    .update({ last_message: preview, last_message_at: msg.sentAt || now, updated_at: now })
    .eq('id', conversationId);

  logStructured({
    step: 'message_saved',
    event_type: msg.eventType,
    message_id: msg.externalId,
    message_type: msg.messageType,
    processing_status: 'processed',
    conversation_id: conversationId,
    is_group: msg.isGroup,
  });

  return {
    ok: true,
    conversationId,
    isInbound: !msg.fromMe,
    externalId: msg.externalId,
  };
}

export async function processWebhookPayload(
  db: SupabaseClient,
  parsed: ParsedEvolutionWebhook,
): Promise<{
  processed: number;
  skipped: number;
  errors: string[];
  autoReplyJobs: Array<{
    companyId: string;
    conversationId: string;
    phone: string;
    instanceName: string;
    pushName: string;
  }>;
}> {
  const errors: string[] = [];
  const autoReplyJobs: Array<{
    companyId: string;
    conversationId: string;
    phone: string;
    instanceName: string;
    pushName: string;
  }> = [];

  const raw = await saveRawEvent(
    db,
    parsed,
    parsed.skipProcessing ? 'skipped' : 'pending',
  );

  if (parsed.skipProcessing) {
    await markRawEventStatus(db, raw.rawId, 'skipped');
    return { processed: 0, skipped: 1, errors, autoReplyJobs };
  }

  if (raw.duplicate && parsed.messages.length === 0) {
    await markRawEventStatus(db, raw.rawId, 'processed');
    return { processed: 0, skipped: 1, errors, autoReplyJobs };
  }

  const instanceRecords = new Map<string, InstanceRecord>();
  let processed = 0;

  for (const msg of parsed.messages) {
    const instanceName = msg.instance?.trim() || parsed.instance;
    let record = instanceRecords.get(instanceName);
    if (!record) {
      const resolved = await resolveInstanceRecord(db, instanceName);
      if (!resolved) {
        errors.push(`sem empresa/instância para ${instanceName}`);
        continue;
      }
      record = resolved;
      instanceRecords.set(instanceName, record);
    }

    const result = await persistNormalizedMessage(
      db,
      record.companyId,
      record.id,
      instanceName,
      msg,
    );

    if (result.ok) {
      processed += 1;
      if (
        result.isInbound &&
        result.conversationId &&
        msg.messageType === 'text' &&
        msg.content?.trim() &&
        msg.content !== '(mensagem)'
      ) {
        autoReplyJobs.push({
          companyId: record.companyId,
          conversationId: result.conversationId,
          phone: msg.senderNumber,
          instanceName,
          pushName: msg.senderName,
        });
      }
    } else {
      errors.push(`falha ${msg.externalId}: ${result.error}`);
    }
  }

  if (parsed.messages.length === 0) {
    logStructured({
      step: 'unknown_event_stored',
      event_type: parsed.eventType,
      processing_status: 'processed',
    });
  }

  await markRawEventStatus(
    db,
    raw.rawId,
    errors.length && processed === 0 ? 'failed' : 'processed',
    errors.length ? errors.join('; ') : undefined,
    errors.length && processed === 0 ? 1 : 0,
  );

  return { processed, skipped: 0, errors, autoReplyJobs };
}

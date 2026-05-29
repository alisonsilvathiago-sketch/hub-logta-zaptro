/**
 * Parser compatível Evolution GO / Baileys — extrai mensagens normalizadas de qualquer payload webhook.
 */

export type WaMessageKind =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'ptt'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'reaction'
  | 'edited'
  | 'deleted'
  | 'unknown';

export type ParsedWaMedia = {
  kind: WaMessageKind;
  mimeType: string | null;
  fileName: string | null;
  fileExt: string | null;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  sourceUrl: string | null;
  base64: string | null;
  metadata: Record<string, unknown>;
};

export type NormalizedWaMessage = {
  externalId: string;
  instance: string;
  eventType: string;
  direction: 'in' | 'out';
  messageType: WaMessageKind;
  content: string | null;
  remoteJid: string | null;
  isGroup: boolean;
  groupId: string | null;
  participantJid: string | null;
  participantName: string | null;
  senderNumber: string;
  senderName: string;
  fromMe: boolean;
  quotedMessageId: string | null;
  quotedPayload: unknown | null;
  isForwarded: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  reaction: string | null;
  reactionTargetId: string | null;
  locationLat: number | null;
  locationLng: number | null;
  contactVcard: string | null;
  sentAt: string;
  media: ParsedWaMedia | null;
  rawPayload: unknown;
};

export type ParsedEvolutionWebhook = {
  instance: string;
  eventType: string;
  skipProcessing: boolean;
  messages: NormalizedWaMessage[];
  rawPayload: unknown;
};

const CONNECTION_SKIP = ['CONNECTION', 'QRCODE', 'QR', 'PRESENCE', 'CALL', 'READ_RECEIPT', 'HISTORY'];

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickFirst(...values: unknown[]): string {
  for (const v of values) {
    const s = str(v);
    if (s) return s;
  }
  return '';
}

export function jidToPhone(jid: unknown): string | null {
  const raw = str(jid);
  if (!raw) return null;
  let local = raw.split('@')[0] ?? '';
  if (local.includes(':')) local = local.split(':')[0] ?? local;
  const digits = local.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

export function isGroupJid(jid: unknown): boolean {
  return typeof jid === 'string' && jid.includes('@g.us');
}

function extFromMime(mime: string | null): string | null {
  if (!mime) return null;
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'application/pdf': 'pdf',
  };
  return map[mime.toLowerCase()] ?? mime.split('/')[1]?.split(';')[0] ?? null;
}

function mediaFromPayload(
  kind: WaMessageKind,
  block: Record<string, unknown>,
): ParsedWaMedia {
  const mimeType = pickFirst(block.mimetype, block.Mimetype, block.mimeType) || null;
  const fileName = pickFirst(block.fileName, block.FileName, block.title, block.Title) || null;
  const fileExt =
    (fileName?.includes('.') ? fileName.split('.').pop()?.toLowerCase() : null) ||
    extFromMime(mimeType);
  return {
    kind,
    mimeType,
    fileName,
    fileExt: fileExt || null,
    fileSizeBytes: num(block.fileLength ?? block.FileLength ?? block.fileSize ?? block.FileSize),
    durationSeconds: num(block.seconds ?? block.Seconds ?? block.duration ?? block.Duration),
    thumbnailUrl: pickFirst(block.jpegThumbnail, block.JpegThumbnail, block.thumbnailUrl) || null,
    sourceUrl: pickFirst(block.url, block.URL, block.directPath, block.DirectPath) || null,
    base64: pickFirst(block.base64, block.Base64) || null,
    metadata: { ...block },
  };
}

function extractTextFromMessage(msg: Record<string, unknown>): string {
  if (typeof msg.conversation === 'string') return msg.conversation;
  if (typeof msg.text === 'string') return msg.text;
  if (typeof msg.Text === 'string') return msg.Text;
  if (typeof msg.body === 'string') return msg.body;

  const ext = asRecord(msg.extendedTextMessage ?? msg.ExtendedTextMessage);
  if (ext) {
    const t = pickFirst(ext.text, ext.Text, ext.description, ext.Description);
    if (t) return t;
  }

  for (const key of ['imageMessage', 'ImageMessage', 'videoMessage', 'VideoMessage', 'documentMessage', 'DocumentMessage']) {
    const block = asRecord(msg[key]);
    if (block) {
      const cap = pickFirst(block.caption, block.Caption);
      if (cap) return cap;
    }
  }
  return '';
}

type ParsedContent = {
  messageType: WaMessageKind;
  content: string | null;
  media: ParsedWaMedia | null;
  quotedMessageId: string | null;
  quotedPayload: unknown | null;
  isForwarded: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  reaction: string | null;
  reactionTargetId: string | null;
  locationLat: number | null;
  locationLng: number | null;
  contactVcard: string | null;
};

function parseMessageContent(msg: Record<string, unknown>, eventUp: string): ParsedContent {
  const base: ParsedContent = {
    messageType: 'unknown',
    content: null,
    media: null,
    quotedMessageId: null,
    quotedPayload: null,
    isForwarded: false,
    isEdited: false,
    isDeleted: false,
    reaction: null,
    reactionTargetId: null,
    locationLat: null,
    locationLng: null,
    contactVcard: null,
  };

  const protocol = asRecord(msg.protocolMessage ?? msg.ProtocolMessage);
  if (protocol) {
    const protoType = pickFirst(protocol.type, protocol.Type).toUpperCase();
    const key = asRecord(protocol.key ?? protocol.Key);
    const targetId = pickFirst(key?.id, key?.ID);
    if (protoType.includes('REVOKE') || protoType === '0') {
      return { ...base, messageType: 'deleted', isDeleted: true, content: '(mensagem apagada)', quotedMessageId: targetId || null };
    }
    const edited = asRecord(protocol.editedMessage ?? protocol.EditedMessage);
    if (edited || protoType.includes('EDIT')) {
      const inner = edited ?? protocol;
      const text = extractTextFromMessage(inner as Record<string, unknown>) || '(mensagem editada)';
      return { ...base, messageType: 'edited', isEdited: true, content: text, quotedMessageId: targetId || null, quotedPayload: edited ?? protocol };
    }
  }

  const reaction = asRecord(msg.reactionMessage ?? msg.ReactionMessage);
  if (reaction) {
    const key = asRecord(reaction.key ?? reaction.Key);
    return {
      ...base,
      messageType: 'reaction',
      reaction: pickFirst(reaction.text, reaction.Text) || '👍',
      reactionTargetId: pickFirst(key?.id, key?.ID) || null,
      content: pickFirst(reaction.text, reaction.Text) || null,
    };
  }

  const loc = asRecord(msg.locationMessage ?? msg.LocationMessage ?? msg.liveLocationMessage ?? msg.LiveLocationMessage);
  if (loc) {
    return {
      ...base,
      messageType: 'location',
      locationLat: num(loc.degreesLatitude ?? loc.DegreesLatitude),
      locationLng: num(loc.degreesLongitude ?? loc.DegreesLongitude),
      content: pickFirst(loc.name, loc.Name, loc.address, loc.Address) || '📍 Localização',
    };
  }

  const contact = asRecord(msg.contactMessage ?? msg.ContactMessage ?? msg.contactsArrayMessage ?? msg.ContactsArrayMessage);
  if (contact) {
    const vcard = pickFirst(contact.vcard, contact.Vcard, contact.displayName, contact.DisplayName);
    return {
      ...base,
      messageType: 'contact',
      contactVcard: vcard || JSON.stringify(contact),
      content: pickFirst(contact.displayName, contact.DisplayName) || '👤 Contato',
    };
  }

  const sticker = asRecord(msg.stickerMessage ?? msg.StickerMessage);
  if (sticker) {
    return { ...base, messageType: 'sticker', content: '(figurinha)', media: mediaFromPayload('sticker', sticker) };
  }

  const image = asRecord(msg.imageMessage ?? msg.ImageMessage);
  if (image) {
    const cap = pickFirst(image.caption, image.Caption);
    return { ...base, messageType: 'image', content: cap || '(imagem)', media: mediaFromPayload('image', image) };
  }

  const video = asRecord(msg.videoMessage ?? msg.VideoMessage);
  if (video) {
    const cap = pickFirst(video.caption, video.Caption);
    return { ...base, messageType: 'video', content: cap || '(vídeo)', media: mediaFromPayload('video', video) };
  }

  const audio = asRecord(msg.audioMessage ?? msg.AudioMessage);
  if (audio) {
    const ptt = Boolean(audio.ptt ?? audio.PTT ?? audio.pttMessage);
    const kind: WaMessageKind = ptt ? 'ptt' : 'audio';
    return { ...base, messageType: kind, content: ptt ? '🎤 Áudio' : '(áudio)', media: mediaFromPayload(kind, audio) };
  }

  const doc = asRecord(msg.documentMessage ?? msg.DocumentMessage);
  if (doc) {
    const name = pickFirst(doc.fileName, doc.FileName, doc.title, doc.Title);
    return {
      ...base,
      messageType: 'document',
      content: name || '(documento)',
      media: mediaFromPayload('document', doc),
    };
  }

  const text = extractTextFromMessage(msg);
  if (text) {
    const ext = asRecord(msg.extendedTextMessage ?? msg.ExtendedTextMessage);
    const ctx = ext ? asRecord(ext.contextInfo ?? ext.ContextInfo) : null;
    const quoted = ctx ? asRecord(ctx.quotedMessage ?? ctx.QuotedMessage) : null;
    const stanzaId = ctx ? pickFirst(ctx.stanzaId, ctx.StanzaID) : '';
    return {
      ...base,
      messageType: 'text',
      content: text,
      quotedMessageId: stanzaId || null,
      quotedPayload: quoted ?? null,
      isForwarded: Boolean(ctx?.isForwarded ?? ctx?.IsForwarded ?? ctx?.forwardingScore),
    };
  }

  if (eventUp.includes('EDIT')) {
    return { ...base, messageType: 'edited', isEdited: true, content: '(mensagem editada)' };
  }
  if (eventUp.includes('DELETE') || eventUp.includes('REVOKE')) {
    return { ...base, messageType: 'deleted', isDeleted: true, content: '(mensagem apagada)' };
  }

  return base;
}

function parseEvolutionGoItem(
  item: Record<string, unknown>,
  eventType: string,
  instance: string,
): NormalizedWaMessage | null {
  const eventUp = eventType.toUpperCase();
  const info = asRecord(item.Info ?? item.info);
  const key = asRecord(item.key ?? item.Key);
  const messageObj = asRecord(item.Message ?? item.message ?? item);

  let remoteJid = pickFirst(
    info?.Chat,
    info?.chat,
    key?.remoteJid,
    key?.RemoteJid,
    item.remoteJid,
    item.RemoteJid,
  ) || null;

  const participantJid = pickFirst(
    info?.Sender,
    info?.sender,
    info?.Participant,
    info?.participant,
    key?.participant,
    key?.Participant,
    item.participant,
  ) || null;

  const isGroup = isGroupJid(remoteJid);
  const groupId = isGroup ? jidToPhone(remoteJid) : null;

  const phone =
    (isGroup ? jidToPhone(participantJid) : null) ??
    jidToPhone(remoteJid) ??
    jidToPhone(participantJid) ??
    jidToPhone(item.from ?? item.chat) ??
    (str(item.number).replace(/\D/g, '') || null);

  if (!phone && !isGroup) return null;

  const senderNumber = isGroup ? (groupId || phone || 'group') : (phone || 'unknown');
  const fromMe = Boolean(
    info?.IsFromMe ??
      info?.isFromMe ??
      key?.fromMe ??
      key?.FromMe ??
      item.fromMe ??
      eventUp.includes('SEND'),
  );

  const externalId = pickFirst(
    info?.ID,
    info?.id,
    key?.id,
    key?.ID,
    item.id,
    item.messageId,
  ) || crypto.randomUUID();

  const pushName = pickFirst(info?.PushName, info?.pushName, item.pushName, item.notifyName);
  const participantName = pickFirst(item.participantName, item.pushName);

  const msgBody = messageObj ?? item;
  const parsed = parseMessageContent(msgBody as Record<string, unknown>, eventUp);

  const timestamp =
    num(info?.Timestamp ?? info?.timestamp ?? item.messageTimestamp ?? item.MessageTimestamp) ??
    Math.floor(Date.now() / 1000);
  const sentAt = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000).toISOString();

  return {
    externalId,
    instance,
    eventType,
    direction: fromMe ? 'out' : 'in',
    messageType: parsed.messageType,
    content: parsed.content,
    remoteJid,
    isGroup,
    groupId,
    participantJid,
    participantName: participantName || pushName || null,
    senderNumber,
    senderName: pushName || participantName || senderNumber,
    fromMe,
    quotedMessageId: parsed.quotedMessageId,
    quotedPayload: parsed.quotedPayload,
    isForwarded: parsed.isForwarded,
    isEdited: parsed.isEdited,
    isDeleted: parsed.isDeleted,
    reaction: parsed.reaction,
    reactionTargetId: parsed.reactionTargetId,
    locationLat: parsed.locationLat,
    locationLng: parsed.locationLng,
    contactVcard: parsed.contactVcard,
    sentAt,
    media: parsed.media,
    rawPayload: item,
  };
}

function parseBaileysItem(
  item: Record<string, unknown>,
  eventType: string,
  instance: string,
): NormalizedWaMessage | null {
  return parseEvolutionGoItem(item, eventType, instance);
}

export function collectWebhookMessages(body: unknown, fallbackInstance: string): ParsedEvolutionWebhook {
  const empty: ParsedEvolutionWebhook = {
    instance: fallbackInstance,
    eventType: 'unknown',
    skipProcessing: false,
    messages: [],
    rawPayload: body,
  };

  if (!body || typeof body !== 'object') return empty;
  const root = body as Record<string, unknown>;
  const defaultInstance =
    pickFirst(root.instance, root.instanceName, root.name) ||
    fallbackInstance ||
    'zaptro';
  const eventType = pickFirst(root.event, root.type, root.action) || 'unknown';
  const eventUp = eventType.toUpperCase();

  const skipProcessing = CONNECTION_SKIP.some((s) => eventUp.includes(s));

  const candidates: unknown[] = [];
  const data = root.data;
  if (Array.isArray(data)) candidates.push(...data);
  else if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.messages)) candidates.push(...d.messages);
    else candidates.push(data);
  }
  if (candidates.length === 0 && (root.key || root.Info || root.info || root.message || root.Message)) {
    candidates.push(root);
  }

  const messages: NormalizedWaMessage[] = [];
  for (const item of candidates) {
    const row = asRecord(item);
    if (!row) continue;
    const parsed = parseEvolutionGoItem(row, eventType, defaultInstance) ?? parseBaileysItem(row, eventType, defaultInstance);
    if (parsed) messages.push(parsed);
  }

  return {
    instance: defaultInstance,
    eventType,
    skipProcessing,
    messages,
    rawPayload: body,
  };
}

export async function hashEventPayload(instance: string, eventType: string, payload: unknown): Promise<string> {
  const raw = JSON.stringify({ instance, eventType, payload });
  const buf = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function previewContent(msg: NormalizedWaMessage): string {
  if (msg.isDeleted) return '(mensagem apagada)';
  if (msg.messageType === 'reaction') return msg.reaction ? `Reação ${msg.reaction}` : '(reação)';
  if (msg.content?.trim()) return msg.content.trim().slice(0, 500);
  const labels: Record<WaMessageKind, string> = {
    text: '(texto)',
    image: '(imagem)',
    video: '(vídeo)',
    audio: '(áudio)',
    ptt: '🎤 Áudio',
    document: '(documento)',
    sticker: '(figurinha)',
    location: '📍 Localização',
    contact: '👤 Contato',
    reaction: '(reação)',
    edited: '(editada)',
    deleted: '(apagada)',
    unknown: '(mensagem)',
  };
  return labels[msg.messageType] || '(mensagem)';
}

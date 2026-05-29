import { evolutionApiRequest, getEvolutionConnectionState } from '../services/evolution';
import { resolveCompanyWhatsappInstance } from './whatsappInbox';
import { formatWaPhoneLine } from '../modules/wa-link/waLinkConfig';
import type { WaLinkConversation } from '../modules/wa-link/waLinkInboxDb';

export type WhatsappMirrorContact = {
  /** Identificador volátil (não é UUID do Supabase). */
  id: string;
  phone: string;
  name: string;
  profilePicUrl: string | null;
};

export function isWhatsappMirrorContactId(id: string): boolean {
  return String(id).startsWith('wa-mirror-');
}

export function mirrorContactIdFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `wa-mirror-${digits}`;
}

export function mirrorContactToConversation(contact: WhatsappMirrorContact): WaLinkConversation {
  return {
    id: contact.id,
    sender_number: contact.phone,
    sender_name: contact.name,
    last_message: null,
    updated_at: new Date(0).toISOString(),
    customer_avatar: contact.profilePicUrl,
  };
}

export function dispatchWhatsappContactsSynced(detail: {
  count: number;
  source: LoadMirrorContactsSource;
  companyId?: string;
}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('zaptro:wa-contacts-synced', { detail }));
}

export type LoadMirrorContactsSource = 'evolution' | 'demo' | 'none';

function pickStr(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function jidToPhone(jid: unknown): string | null {
  if (typeof jid !== 'string' || !jid.trim()) return null;
  if (jid.includes('@g.us') || jid.includes('broadcast') || jid.includes('@lid')) return null;
  let local = jid.split('@')[0] ?? '';
  if (local.includes(':')) local = local.split(':')[0] ?? local;
  const digits = local.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

function unwrapContactRows(payload: unknown): Record<string, unknown>[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.filter((x) => x && typeof x === 'object') as Record<string, unknown>[];
  }
  const root = payload as Record<string, unknown>;
  const candidates: unknown[] = [
    root.data,
    root.contacts,
    root.result,
    root.response,
    root.records,
    root.items,
  ];
  if (Array.isArray(root.data)) return root.data as Record<string, unknown>[];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as Record<string, unknown>[];
    if (c && typeof c === 'object') {
      const inner = c as Record<string, unknown>;
      for (const key of ['contacts', 'data', 'records', 'items']) {
        if (Array.isArray(inner[key])) return inner[key] as Record<string, unknown>[];
      }
    }
  }
  return [];
}

function flattenContactRow(row: Record<string, unknown>): Record<string, unknown> {
  const nested = row.contact;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return { ...(nested as Record<string, unknown>), ...row };
  }
  return row;
}

function rowToMirrorContact(raw: Record<string, unknown>): WhatsappMirrorContact | null {
  const row = flattenContactRow(raw);
  const jid = pickStr(row.remoteJid, row.jid, row.id, row.wuid, row.key);
  if (row.isGroup === true) return null;
  if (jid.includes('@g.us') || jid.includes('broadcast')) return null;

  const phone =
    jidToPhone(jid) ||
    jidToPhone(row.number) ||
    jidToPhone(row.phone) ||
    (typeof row.number === 'string' ? row.number.replace(/\D/g, '') : '') ||
    (typeof row.phone === 'string' ? row.phone.replace(/\D/g, '') : '');
  if (!phone || phone.length < 8) return null;

  const pushName = pickStr(
    row.pushName,
    row.name,
    row.notify,
    row.verifiedName,
    row.shortName,
    row.contactName,
    row.displayName,
  );
  const name =
    pushName && pushName.replace(/\D/g, '') !== phone
      ? pushName
      : formatWaPhoneLine(phone);

  const profilePicUrl =
    pickStr(row.profilePicUrl, row.profilePictureUrl, row.picture, row.imgUrl, row.pictureUrl) ||
    null;

  return {
    id: mirrorContactIdFromPhone(phone),
    phone,
    name,
    profilePicUrl,
  };
}

/** Lista contactos guardados no WhatsApp ligado (só memória — não grava no Supabase). */
export async function fetchWhatsappMirrorContacts(options: {
  companyId: string;
  userId?: string | null;
}): Promise<WhatsappMirrorContact[]> {
  const instance = await resolveCompanyWhatsappInstance(options.companyId, options.userId);
  const state = await getEvolutionConnectionState(instance);
  if (state !== 'open') return [];

  const attempts: Array<{ path: string; method?: 'GET' | 'POST'; body?: Record<string, unknown> }> = [
    { path: '/chat/findContacts', body: { where: {} } },
    { path: '/chat/findContacts', body: {} },
    { path: '/chat/findContacts', body: { limit: 1000 } },
    { path: '/contact/findContacts', body: { where: {} } },
    { path: '/contact/findContacts', body: {} },
    { path: '/contact/fetchAll', method: 'GET' },
    { path: '/contact/fetchContacts', body: {} },
  ];

  const chatFallbackAttempts: Array<{ path: string; body?: Record<string, unknown> }> = [
    { path: '/chat/findChats', body: {} },
    { path: '/chat/findChats', body: { limit: 500 } },
    { path: '/chat/findChats', body: { limit: 1000 } },
  ];

  const byPhone = new Map<string, WhatsappMirrorContact>();

  const ingestRows = (rows: Record<string, unknown>[]) => {
    for (const row of rows) {
      const contact = rowToMirrorContact(row);
      if (!contact) continue;
      const prev = byPhone.get(contact.phone);
      if (!prev || contact.name.length > prev.name.length) {
        byPhone.set(contact.phone, contact);
      }
    }
  };

  for (const att of attempts) {
    const method = att.method ?? (att.body ? 'POST' : 'GET');
    const res = await evolutionApiRequest(instance, att.path, method, att.body);
    if (!res.ok) continue;
    ingestRows(unwrapContactRows(res.data));
  }

  if (byPhone.size === 0) {
    for (const att of chatFallbackAttempts) {
      const res = await evolutionApiRequest(instance, att.path, 'POST', att.body);
      if (!res.ok) continue;
      ingestRows(unwrapContactRows(res.data));
    }
  }

  return Array.from(byPhone.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
  );
}

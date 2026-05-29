import type { WhatsappMirrorContact } from '../../lib/zaptroWhatsappMirrorContacts';
import { mirrorContactToConversation } from '../../lib/zaptroWhatsappMirrorContacts';
import type { WaLinkConversation } from './waLinkInboxDb';
import { isWaLinkOpaqueNumber, waLinkListPrimaryLabel } from './waLinkConfig';

export type WaUnifiedContact = {
  id: string;
  phone: string;
  name: string;
  profilePicUrl: string | null;
  conversationId?: string;
  crmType?: string | null;
  fromInbox: boolean;
};

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function waUnifiedContactLabel(c: WaLinkConversation): string {
  const name = c.sender_name?.trim();
  if (name && !isWaLinkOpaqueNumber(c.sender_number)) {
    const nameDigits = name.replace(/\D/g, '');
    const phoneDigits = c.sender_number.replace(/\D/g, '');
    if (!nameDigits || nameDigits !== phoneDigits) return name;
  }
  return waLinkListPrimaryLabel(c.sender_name, c.sender_number);
}

function dedupeConversations(items: WaLinkConversation[]): WaLinkConversation[] {
  const byPhone = new Map<string, WaLinkConversation>();
  for (const c of items) {
    const key = normalizePhoneDigits(c.sender_number) || c.id;
    const prev = byPhone.get(key);
    if (!prev || new Date(c.updated_at).getTime() > new Date(prev.updated_at).getTime()) {
      byPhone.set(key, c);
    }
  }
  return Array.from(byPhone.values());
}

/** Conversas do inbox têm prioridade sobre espelho da agenda WhatsApp. */
export function mergeWaUnifiedContacts(
  mirrorRows: WhatsappMirrorContact[],
  conversations: WaLinkConversation[],
): WaUnifiedContact[] {
  const convByPhone = dedupeConversations(conversations);
  const byPhone = new Map<string, WaUnifiedContact>();

  for (const c of convByPhone) {
    const key = normalizePhoneDigits(c.sender_number) || c.id;
    byPhone.set(key, {
      id: c.id,
      phone: c.sender_number,
      name: waUnifiedContactLabel(c),
      profilePicUrl: c.customer_avatar ?? null,
      conversationId: c.id,
      crmType: c.crm_type ?? null,
      fromInbox: true,
    });
  }

  for (const m of mirrorRows) {
    const key = normalizePhoneDigits(m.phone);
    if (!key || byPhone.has(key)) continue;
    byPhone.set(key, {
      id: m.id,
      phone: m.phone,
      name: m.name,
      profilePicUrl: m.profilePicUrl,
      fromInbox: false,
    });
  }

  return Array.from(byPhone.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
  );
}

/** Compatível com componentes que ainda usam `WaLinkConversation[]`. */
export function mergeMirrorWithConversations(
  mirrorRows: WhatsappMirrorContact[],
  conversations: WaLinkConversation[],
): WaLinkConversation[] {
  const unified = mergeWaUnifiedContacts(mirrorRows, conversations);
  const mirrorById = new Map(mirrorRows.map((m) => [m.id, m]));
  const convById = new Map(conversations.map((c) => [c.id, c]));

  return unified.map((u) => {
    if (u.conversationId && convById.has(u.conversationId)) {
      return convById.get(u.conversationId)!;
    }
    const mirror = mirrorById.get(u.id);
    if (mirror) return mirrorContactToConversation(mirror);
    return {
      id: u.id,
      sender_number: u.phone,
      sender_name: u.name,
      last_message: null,
      updated_at: new Date(0).toISOString(),
      customer_avatar: u.profilePicUrl,
      crm_type: u.crmType ?? null,
    };
  });
}

export function waUnifiedContactRowKey(c: WaUnifiedContact): string {
  return normalizePhoneDigits(c.phone) || c.id;
}

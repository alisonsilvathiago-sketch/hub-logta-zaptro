import { supabaseZaptro } from '../../lib/supabase-zaptro';
import { deleteWaChat, archiveWaChat } from '../../services/evolution.service';
import type { WaLinkConversation } from './waLinkInboxDb';
import {
  markConversationArchived,
  markConversationCleared,
} from './waLinkThreadPrefs';
import { markWaLinkConversationUnread } from './waLinkUnread';

function phoneJid(conversation: WaLinkConversation): string {
  const raw = conversation.sender_number || '';
  if (raw.includes('@')) return raw;
  const digits = raw.replace(/\D/g, '');
  return digits ? `${digits}@s.whatsapp.net` : raw;
}

export async function archiveWaLinkConversations(
  ids: string[],
  onLocalUpdate: (next: Set<string>) => void,
): Promise<void> {
  let next = new Set<string>();
  for (const id of ids) {
    next = markConversationArchived(id);
  }
  onLocalUpdate(next);
}

export async function archiveWaLinkOnWhatsapp(
  conversations: WaLinkConversation[],
  ids: string[],
  instanceName?: string | null,
): Promise<void> {
  const byId = new Map(conversations.map((c) => [c.id, c]));
  for (const id of ids) {
    const c = byId.get(id);
    if (!c) continue;
    try {
      await archiveWaChat(c.sender_number, true, instanceName || undefined);
    } catch {
      /* best-effort — arquivo local mesmo se Evolution falhar */
    }
  }
}

export async function markWaLinkConversationsUnread(ids: string[]): Promise<void> {
  for (const id of ids) markWaLinkConversationUnread(id);
  if (ids.length === 0) return;
  await supabaseZaptro
    .from('whatsapp_conversations')
    .update({ unread_count: 1, updated_at: new Date().toISOString() })
    .in('id', ids);
}

export async function deleteWaLinkConversations(params: {
  ids: string[];
  conversations: WaLinkConversation[];
  instanceName?: string | null;
  companyId?: string | null;
}): Promise<{ deleted: number; waErrors: number }> {
  const { ids, conversations, instanceName, companyId } = params;
  const byId = new Map(conversations.map((c) => [c.id, c]));
  let waErrors = 0;

  for (const id of ids) {
    const c = byId.get(id);
    if (!c) continue;
    try {
      await deleteWaChat(c.sender_number, instanceName || undefined);
    } catch {
      waErrors += 1;
    }
  }

  if (ids.length > 0) {
    await supabaseZaptro.from('whatsapp_messages').delete().in('conversation_id', ids);
    let q = supabaseZaptro.from('whatsapp_conversations').delete().in('id', ids);
    if (companyId) q = q.eq('company_id', companyId);
    const { error } = await q;
    if (error) throw error;
  }

  return { deleted: ids.length, waErrors };
}

export function clearWaLinkConversationLocal(id: string): {
  archived: Set<string>;
  cleared: Set<string>;
} {
  return {
    archived: markConversationArchived(id),
    cleared: markConversationCleared(id),
  };
}

export { phoneJid };

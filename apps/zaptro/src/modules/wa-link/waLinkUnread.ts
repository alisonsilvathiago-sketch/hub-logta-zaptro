import { supabaseZaptro } from '../../lib/supabase-zaptro';

const READ_AT_KEY = 'zaptro-wa-link-read-at';

export function readWaLinkReadAtMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(READ_AT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function markWaLinkConversationRead(conversationId: string, readAt?: string) {
  if (typeof window === 'undefined' || !conversationId) return;
  const map = readWaLinkReadAtMap();
  map[conversationId] = readAt ?? new Date().toISOString();
  sessionStorage.setItem(READ_AT_KEY, JSON.stringify(map));
}

/** Marca como não lida (remove timestamp de leitura local). */
export function markWaLinkConversationUnread(conversationId: string) {
  if (typeof window === 'undefined' || !conversationId) return;
  const map = readWaLinkReadAtMap();
  delete map[conversationId];
  sessionStorage.setItem(READ_AT_KEY, JSON.stringify(map));
}

export function markAllWaLinkConversationsRead(conversationIds: string[]) {
  if (typeof window === 'undefined' || conversationIds.length === 0) return;
  const map = readWaLinkReadAtMap();
  const now = new Date().toISOString();
  for (const id of conversationIds) {
    if (id) map[id] = now;
  }
  sessionStorage.setItem(READ_AT_KEY, JSON.stringify(map));
}

/** Conta mensagens recebidas (in) após a última vez que o utilizador abriu a conversa. */
export async function fetchWaLinkUnreadByConversation(
  conversationIds: string[],
  readAtMap: Record<string, string>,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const id of conversationIds) counts.set(id, 0);
  if (conversationIds.length === 0) return counts;

  const { data, error } = await supabaseZaptro
    .from('whatsapp_messages')
    .select('conversation_id,created_at,direction')
    .in('conversation_id', conversationIds);

  if (error || !data) return counts;

  for (const row of data as { conversation_id: string; created_at: string; direction?: string }[]) {
    if (String(row.direction ?? '').toLowerCase() !== 'in') continue;
    const cid = row.conversation_id;
    const readAt = readAtMap[cid];
    if (!readAt || row.created_at > readAt) {
      counts.set(cid, (counts.get(cid) ?? 0) + 1);
    }
  }

  return counts;
}

export function applyWaLinkUnreadCounts(
  rows: { id: string; unread_count?: number | null }[],
  unreadMap: Map<string, number>,
  activeConversationId: string | null,
): void {
  for (const row of rows) {
    const computed = unreadMap.get(row.id) ?? 0;
    const fromDb = row.unread_count ?? 0;
    let n = Math.max(computed, fromDb);
    if (activeConversationId && row.id === activeConversationId) n = 0;
    row.unread_count = n;
  }
}

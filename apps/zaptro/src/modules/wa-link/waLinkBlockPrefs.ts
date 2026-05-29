const BLOCKED_KEY = 'zaptro-wa-link-blocked-convs';

function readSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function writeSet(key: string, ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function readBlockedConversations(): Set<string> {
  return readSet(BLOCKED_KEY);
}

export function isConversationBlocked(conversationId: string): boolean {
  return readBlockedConversations().has(conversationId);
}

export function blockConversation(conversationId: string): Set<string> {
  const next = readBlockedConversations();
  next.add(conversationId);
  writeSet(BLOCKED_KEY, next);
  return next;
}

export function unblockConversation(conversationId: string): Set<string> {
  const next = readBlockedConversations();
  next.delete(conversationId);
  writeSet(BLOCKED_KEY, next);
  return next;
}


const CLEARED_KEY = 'zaptro-wa-link-cleared-convs';
const ARCHIVED_KEY = 'zaptro-wa-link-archived-convs';

function readSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x: unknown) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function writeSet(key: string, ids: Set<string>) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(key, JSON.stringify([...ids]));
}

export function readClearedConversations(): Set<string> {
  return readSet(CLEARED_KEY);
}

export function markConversationCleared(conversationId: string): Set<string> {
  const next = readClearedConversations();
  next.add(conversationId);
  writeSet(CLEARED_KEY, next);
  return next;
}

export function unmarkConversationCleared(conversationId: string): Set<string> {
  const next = readClearedConversations();
  next.delete(conversationId);
  writeSet(CLEARED_KEY, next);
  return next;
}

export function readArchivedConversations(): Set<string> {
  return readSet(ARCHIVED_KEY);
}

export function markConversationArchived(conversationId: string): Set<string> {
  const next = readArchivedConversations();
  next.add(conversationId);
  writeSet(ARCHIVED_KEY, next);
  return next;
}

const HIDDEN_MSG_KEY = 'zaptro-wa-link-hidden-msgs';

function readHiddenMap(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(HIDDEN_MSG_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function writeHiddenMap(map: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(HIDDEN_MSG_KEY, JSON.stringify(map));
}

export function readHiddenMessageIds(conversationId: string): Set<string> {
  const map = readHiddenMap();
  const list = map[conversationId];
  return new Set(Array.isArray(list) ? list : []);
}

export function hideMessages(conversationId: string, messageIds: string[]): Set<string> {
  const map = readHiddenMap();
  const prev = new Set(map[conversationId] ?? []);
  for (const id of messageIds) prev.add(id);
  map[conversationId] = [...prev];
  writeHiddenMap(map);
  return prev;
}

const STARRED_MSG_KEY = 'zaptro-wa-link-starred-msgs';

export function readStarredMessageIds(): Set<string> {
  return readSet(STARRED_MSG_KEY);
}

export function addStarredMessages(messageIds: string[]): Set<string> {
  const next = readStarredMessageIds();
  for (const id of messageIds) next.add(id);
  writeSet(STARRED_MSG_KEY, next);
  return next;
}

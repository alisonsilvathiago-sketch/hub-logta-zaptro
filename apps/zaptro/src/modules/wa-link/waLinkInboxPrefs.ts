/** Mesma chave do WhatsApp Premium — favoritos partilhados no browser. */
const STARRED_KEY = 'zaptro_wa_inbox_starred_v1';
const LOCK_PIN_KEY = 'zaptro-wa-link-lock-pin';
const LOCK_STATE_KEY = 'zaptro-wa-link-locked';

export function readWaLinkStarredIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x: unknown) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function writeWaLinkStarredIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function toggleWaLinkStarred(conversationId: string): Set<string> {
  const next = readWaLinkStarredIds();
  if (next.has(conversationId)) next.delete(conversationId);
  else next.add(conversationId);
  writeWaLinkStarredIds(next);
  return next;
}

export function addWaLinkStarred(ids: string[]): Set<string> {
  const next = readWaLinkStarredIds();
  for (const id of ids) next.add(id);
  writeWaLinkStarredIds(next);
  return next;
}

export function getWaLinkLockPin(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const pin = localStorage.getItem(LOCK_PIN_KEY);
    return pin && /^\d{4}$/.test(pin) ? pin : null;
  } catch {
    return null;
  }
}

export function setWaLinkLockPin(pin: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCK_PIN_KEY, pin);
}

export function isWaLinkAppLocked(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(LOCK_STATE_KEY) === '1';
}

export function setWaLinkAppLocked(locked: boolean) {
  if (typeof window === 'undefined') return;
  if (locked) sessionStorage.setItem(LOCK_STATE_KEY, '1');
  else sessionStorage.removeItem(LOCK_STATE_KEY);
}

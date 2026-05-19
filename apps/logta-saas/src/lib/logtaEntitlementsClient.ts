import {
  LOGTA_ENTITLEMENTS_EVENT,
  LOGTA_ENTITLEMENTS_STORAGE_KEY,
  type LogtaHubEntitlementsV1,
} from '@shared/lib/logtaEntitlementsContract';

export function saveLogtaEntitlementsToStorage(e: LogtaHubEntitlementsV1): void {
  try {
    localStorage.setItem(LOGTA_ENTITLEMENTS_STORAGE_KEY, JSON.stringify(e));
    window.dispatchEvent(new CustomEvent(LOGTA_ENTITLEMENTS_EVENT, { detail: e }));
  } catch {
    /* ignore */
  }
}

export function loadLogtaEntitlementsFromStorage(): LogtaHubEntitlementsV1 | null {
  try {
    const raw = localStorage.getItem(LOGTA_ENTITLEMENTS_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as LogtaHubEntitlementsV1;
    if (!p || p.version !== 1 || typeof p.tenantKey !== 'string') return null;
    return p;
  } catch {
    return null;
  }
}

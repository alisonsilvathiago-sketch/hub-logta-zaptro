/**
 * Auditoria de acções na app Zaptro (localStorage + evento para UI em tempo real).
 * Chave por `company_id` (ou `local-demo`) — calendário global da empresa.
 */

export const ZAPTRO_ACTIVITY_LOG_EVENT = 'zaptro-activity-log';

export type ZaptroActivityLogType = 'atendimento' | 'config' | 'rota' | 'login' | 'motorista' | 'sistema';

export type ZaptroActivityStatus = 'open' | 'done';

export type ZaptroActivityEntry = {
  id: string;
  at: string;
  endAt?: string;
  type: ZaptroActivityLogType;
  actorName: string;
  /** Quem criou — para cor e filtro individual */
  actorUserId?: string;
  actorColor?: string;
  clientLabel: string;
  action: string;
  details?: string;
  mentionedUserIds?: string[];
  mentionedNames?: string[];
  status?: ZaptroActivityStatus;
};

export type ZaptroActivityEntryInput = Omit<ZaptroActivityEntry, 'id' | 'at'> & { at?: string; id?: string };

const MAX = 500;

export function zaptroActivityLogStorageKey(tenantId: string) {
  return `zaptro_activity_log_v1_${tenantId.trim() || 'local-demo'}`;
}

function key(tenantId: string) {
  return zaptroActivityLogStorageKey(tenantId);
}

function normalizeEntry(raw: unknown): ZaptroActivityEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.at !== 'string') return null;
  return {
    id: o.id,
    at: o.at,
    endAt: typeof o.endAt === 'string' ? o.endAt : undefined,
    type: (o.type as ZaptroActivityLogType) || 'atendimento',
    actorName: String(o.actorName ?? ''),
    actorUserId: typeof o.actorUserId === 'string' ? o.actorUserId : undefined,
    actorColor: typeof o.actorColor === 'string' ? o.actorColor : undefined,
    clientLabel: String(o.clientLabel ?? ''),
    action: String(o.action ?? ''),
    details: typeof o.details === 'string' ? o.details : undefined,
    mentionedUserIds: Array.isArray(o.mentionedUserIds)
      ? o.mentionedUserIds.map(String)
      : undefined,
    mentionedNames: Array.isArray(o.mentionedNames)
      ? o.mentionedNames.map(String)
      : undefined,
    status: o.status === 'done' ? 'done' : o.status === 'open' ? 'open' : undefined,
  };
}

export function readZaptroActivityLog(tenantId: string): ZaptroActivityEntry[] {
  const tid = tenantId.trim() || 'local-demo';
  try {
    const raw = localStorage.getItem(key(tid));
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown[];
    if (!Array.isArray(p)) return [];
    return p.map(normalizeEntry).filter(Boolean) as ZaptroActivityEntry[];
  } catch {
    return [];
  }
}

function writeLog(tenantId: string, list: ZaptroActivityEntry[]) {
  try {
    localStorage.setItem(key(tenantId), JSON.stringify(list));
  } catch {
    /* quota ou bloqueio */
  }
}

function emitLogChange(tenantId: string) {
  try {
    window.dispatchEvent(new CustomEvent(ZAPTRO_ACTIVITY_LOG_EVENT, { detail: { tenantId } }));
  } catch {
    /* ignore */
  }
}

export function appendZaptroActivityLog(tenantId: string, partial: ZaptroActivityEntryInput): ZaptroActivityEntry {
  const tid = tenantId.trim() || 'local-demo';
  const id = partial.id ?? `act-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const at = partial.at ?? new Date().toISOString();
  const entry: ZaptroActivityEntry = {
    id,
    at,
    type: partial.type,
    actorName: partial.actorName,
    clientLabel: partial.clientLabel,
    action: partial.action,
    ...(partial.endAt ? { endAt: partial.endAt } : {}),
    ...(partial.details ? { details: partial.details } : {}),
    ...(partial.actorUserId ? { actorUserId: partial.actorUserId } : {}),
    ...(partial.actorColor ? { actorColor: partial.actorColor } : {}),
    ...(partial.mentionedUserIds?.length ? { mentionedUserIds: partial.mentionedUserIds } : {}),
    ...(partial.mentionedNames?.length ? { mentionedNames: partial.mentionedNames } : {}),
    ...(partial.status ? { status: partial.status } : {}),
  };
  const prev = readZaptroActivityLog(tid);
  const next = [entry, ...prev].slice(0, MAX);
  writeLog(tid, next);
  emitLogChange(tid);
  return entry;
}

export function updateZaptroActivityLog(
  tenantId: string,
  id: string,
  patch: Partial<Omit<ZaptroActivityEntry, 'id'>>,
): ZaptroActivityEntry | null {
  const tid = tenantId.trim() || 'local-demo';
  const prev = readZaptroActivityLog(tid);
  let updated: ZaptroActivityEntry | null = null;
  const next = prev.map((e) => {
    if (e.id !== id) return e;
    updated = { ...e, ...patch, id: e.id };
    return updated;
  });
  if (!updated) return null;
  writeLog(tid, next);
  emitLogChange(tid);
  return updated;
}

export function deleteZaptroActivityLog(tenantId: string, id: string): boolean {
  const tid = tenantId.trim() || 'local-demo';
  const prev = readZaptroActivityLog(tid);
  const next = prev.filter((e) => e.id !== id);
  if (next.length === prev.length) return false;
  writeLog(tid, next);
  emitLogChange(tid);
  return true;
}

export function duplicateZaptroActivityLog(tenantId: string, id: string): ZaptroActivityEntry | null {
  const source = readZaptroActivityLog(tenantId).find((e) => e.id === id);
  if (!source) return null;
  const offset = 24 * 60 * 60 * 1000;
  const newAt = new Date(new Date(source.at).getTime() + offset).toISOString();
  const newEnd = source.endAt
    ? new Date(new Date(source.endAt).getTime() + offset).toISOString()
    : undefined;
  return appendZaptroActivityLog(tenantId, {
    ...source,
    at: newAt,
    endAt: newEnd,
    action: `${source.action} (cópia)`,
    status: 'open',
  });
}

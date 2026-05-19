export type FreteAuditCategory =
  | 'visualizacao'
  | 'simulacao'
  | 'ocorrencia'
  | 'fiscal'
  | 'status'
  | 'rastreamento'
  | 'seguranca';

export type FreteAuditEntry = {
  id: string;
  companyId: string;
  freteId: string;
  numeroFrete?: string;
  action: string;
  category: FreteAuditCategory;
  detail: string;
  actorId?: string;
  actorName: string;
  actorRole?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type FreteAuditActor = {
  actorId?: string;
  actorName: string;
  actorRole?: string;
};

export type AppendFreteAuditInput = {
  companyId: string;
  freteId: string;
  numeroFrete?: string;
  action: string;
  category: FreteAuditCategory;
  detail: string;
  actor: FreteAuditActor;
  metadata?: Record<string, unknown>;
};

export type FreteAuditDisplayLog = {
  id: string;
  time: string;
  status: string;
  text: string;
  actor: string;
  action: string;
  category: FreteAuditCategory;
  security: true;
};

const MAX_ENTRIES = 250;

export const FRETE_AUDIT_CATEGORY_LABEL: Record<FreteAuditCategory, string> = {
  visualizacao: 'Visualização',
  simulacao: 'Simulação',
  ocorrencia: 'Ocorrência',
  fiscal: 'Fiscal',
  status: 'Status',
  rastreamento: 'Rastreamento',
  seguranca: 'Segurança',
};

function storageKey(companyId: string, freteId: string) {
  return `logta-frete-audit:${companyId}:${freteId}`;
}

export function loadFreteAuditHistory(companyId: string, freteId: string): FreteAuditEntry[] {
  if (typeof window === 'undefined' || !companyId || !freteId) return [];
  try {
    const raw = localStorage.getItem(storageKey(companyId, freteId));
    const list = raw ? (JSON.parse(raw) as FreteAuditEntry[]) : [];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export function appendFreteAuditEntry(input: AppendFreteAuditInput): FreteAuditEntry {
  const entry: FreteAuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    companyId: input.companyId,
    freteId: input.freteId,
    numeroFrete: input.numeroFrete,
    action: input.action,
    category: input.category,
    detail: input.detail,
    actorId: input.actor.actorId,
    actorName: input.actor.actorName,
    actorRole: input.actor.actorRole,
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  };

  if (typeof window === 'undefined') return entry;

  const prev = loadFreteAuditHistory(input.companyId, input.freteId);
  const next = [entry, ...prev].slice(0, MAX_ENTRIES);
  localStorage.setItem(storageKey(input.companyId, input.freteId), JSON.stringify(next));
  return entry;
}

export function auditEntryToDisplayLog(entry: FreteAuditEntry): FreteAuditDisplayLog {
  const at = new Date(entry.createdAt);
  return {
    id: entry.id,
    time: at.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    status: FRETE_AUDIT_CATEGORY_LABEL[entry.category],
    text: entry.detail,
    actor: entry.actorName,
    action: entry.action,
    category: entry.category,
    security: true,
  };
}

export function mergeAuditIntoLogs(
  history: FreteAuditEntry[],
  ephemeral: Array<{ time: string; status: string; text: string }>,
): FreteAuditDisplayLog[] {
  const fromAudit = history.map(auditEntryToDisplayLog);
  const ephemeralMapped: FreteAuditDisplayLog[] = ephemeral.map((e, i) => ({
    id: `ephemeral-${i}`,
    time: e.time,
    status: e.status,
    text: e.text,
    actor: '—',
    action: 'ephemeral',
    category: 'rastreamento' as FreteAuditCategory,
    security: true,
  }));
  return [...fromAudit, ...ephemeralMapped.filter((e) => !fromAudit.some((a) => a.text === e.text))];
}

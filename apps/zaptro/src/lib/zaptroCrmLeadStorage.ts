/** Leitura do Kanban CRM em localStorage (mesmas chaves que `ZaptroCrm.tsx`). */

export type ZaptroCrmKanbanLead = {
  id: string;
  clientName: string;
  clientLogoUrl?: string | null;
  phone: string;
  origin: string;
  destination: string;
  cargoType: string;
  estimatedValue: number;
  assigneeId: string | null;
  assigneeName: string;
  assigneeAvatarUrl?: string | null;
  createdAt: string;
  tag: 'urgente' | 'vip' | 'retorno' | null;
  progress: number;
  stage: string;
  approvedQuoteId?: string | null;
  /** Quando preenchido, o lead deixou de ser oportunidade comercial em aberto. */
  paymentReceivedAt?: string | null;
  /** ID usado no perfil de cliente (`/app/clientes/perfil/...`), em geral conversa WA. */
  convertedClientId?: string | null;
};

export type ZaptroCrmTimelineEvent = {
  id: string;
  at: string;
  kind: string;
  title: string;
  body?: string;
  actor?: string;
};

export function zaptroCrmKanbanStorageKey(companyId: string): string {
  return `zaptro_crm_kanban_v3_${companyId}`;
}

export function zaptroCrmTimelineStorageKey(companyId: string): string {
  return `zaptro_crm_timeline_v1_${companyId}`;
}

export function readCrmKanbanLeads(companyId: string): ZaptroCrmKanbanLead[] {
  try {
    const raw = localStorage.getItem(zaptroCrmKanbanStorageKey(companyId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ZaptroCrmKanbanLead[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readCrmKanbanLead(companyId: string, leadId: string): ZaptroCrmKanbanLead | null {
  const id = leadId.trim();
  if (!id) return null;
  return readCrmKanbanLeads(companyId).find((l) => l.id === id) ?? null;
}

/** Remove entradas duplicadas (ex.: mesmo clique registado duas vezes). */
export function dedupeCrmLeadTimeline(events: ZaptroCrmTimelineEvent[]): ZaptroCrmTimelineEvent[] {
  const seen = new Set<string>();
  const out: ZaptroCrmTimelineEvent[] = [];
  for (const ev of events) {
    const key = `${ev.at.slice(0, 16)}|${ev.title}|${ev.body ?? ''}|${ev.actor ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ev);
  }
  return out;
}

export function readCrmLeadTimeline(
  companyId: string,
  leadId: string,
): ZaptroCrmTimelineEvent[] {
  try {
    const raw = localStorage.getItem(zaptroCrmTimelineStorageKey(companyId));
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, ZaptroCrmTimelineEvent[]>;
    const rows = map[leadId];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function writeCrmKanbanLeads(companyId: string, leads: ZaptroCrmKanbanLead[]): void {
  try {
    localStorage.setItem(zaptroCrmKanbanStorageKey(companyId), JSON.stringify(leads));
    try {
      window.dispatchEvent(new Event('zaptro-crm-kanban-updated'));
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
}

export function appendCrmLeadTimelineEvent(
  companyId: string,
  leadId: string,
  event: Omit<ZaptroCrmTimelineEvent, 'id'>,
): void {
  try {
    const key = zaptroCrmTimelineStorageKey(companyId);
    const raw = localStorage.getItem(key);
    const map = (raw ? JSON.parse(raw) : {}) as Record<string, ZaptroCrmTimelineEvent[]>;
    const prev = Array.isArray(map[leadId]) ? map[leadId] : [];
    map[leadId] = [{ ...event, id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...prev];
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

const WA_LEAD_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCrmLeadWaConversationId(leadId: string): boolean {
  return WA_LEAD_UUID_RE.test(leadId.trim());
}

export function markCrmLeadPaymentReceived(
  companyId: string,
  leadId: string,
  actorName?: string,
): ZaptroCrmKanbanLead | null {
  const leads = readCrmKanbanLeads(companyId);
  const idx = leads.findIndex((l) => l.id === leadId);
  if (idx === -1) return null;
  const prev = leads[idx];
  const now = new Date().toISOString();
  const clientId = prev.convertedClientId || (isCrmLeadWaConversationId(prev.id) ? prev.id : null);
  const next: ZaptroCrmKanbanLead = {
    ...prev,
    stage: 'fechado',
    paymentReceivedAt: now,
    convertedClientId: clientId,
  };
  const updated = [...leads];
  updated[idx] = next;
  writeCrmKanbanLeads(companyId, updated);
  appendCrmLeadTimelineEvent(companyId, leadId, {
    at: now,
    kind: 'payment',
    title: 'Pagamento confirmado',
    body: clientId
      ? 'Lead convertido em cliente. Perfil de cliente disponível na lista de clientes.'
      : 'Negócio fechado no CRM. Cadastro de cliente pode ser criado na área Clientes.',
    actor: actorName,
  });
  return next;
}

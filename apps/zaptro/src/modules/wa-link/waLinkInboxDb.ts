import { getZaptroDbErrorRawText } from '../../utils/zaptroSchemaErrors';

export type WaLinkConversation = {
  id: string;
  sender_name: string | null;
  sender_number: string;
  last_message: string | null;
  updated_at: string;
  unread_count?: number | null;
  company_id?: string | null;
  connection_id?: string | null;
  customer_avatar?: string | null;
  attendance_status?: 'awaiting' | 'in_service' | 'finished' | null;
  assigned_to?: string | null;
  department?: string | null;
  crm_type?: string | null;
  metadata?: Record<string, unknown> | null;
  assigned_at?: string | null;
};

/** Tentativas do mais completo ao mínimo — só colunas que existem no teu Supabase. */
const SELECT_ATTEMPTS = [
  'id,sender_number,sender_name,updated_at,company_id,status,last_message_at,instance_id,attendance_status,assigned_to,department,crm_type,metadata,customer_avatar',
  'id,sender_number,sender_name,updated_at,company_id,status,last_message_at,instance_id,attendance_status,assigned_to',
  'id,sender_number,sender_name,updated_at,company_id,status,last_message_at,instance_id,attendance_status',
  'id,sender_number,sender_name,updated_at,company_id,status,last_message_at',
  'id,sender_number,sender_name,updated_at,company_id,status',
  'id,sender_number,sender_name,company_id',
  'id,sender_number,company_id',
] as const;

export function formatWaLinkInboxError(err: unknown): string {
  const raw = getZaptroDbErrorRawText(err).trim();
  const lower = raw.toLowerCase();

  if (lower.includes('permission denied') || lower.includes('42501')) {
    return 'Sem permissão para ler conversas. Faça login (/registre) e rode a migration wa_link_inbox no Supabase SQL Editor.';
  }
  if (lower.includes('does not exist') || lower.includes('42703')) {
    return `Schema incompleto (${raw}). Execute apps/zaptro/supabase/migrations/20260525140000_wa_link_inbox.sql no Supabase.`;
  }
  if (lower.includes('whatsapp_conversations') && lower.includes('schema cache')) {
    return 'Tabela whatsapp_conversations não existe neste projeto Supabase.';
  }

  return raw || 'Erro ao carregar conversas.';
}

function isMissingColumnError(err: unknown): boolean {
  const msg = getZaptroDbErrorRawText(err).toLowerCase();
  return msg.includes('does not exist') || msg.includes('42703');
}

function normalizeRow(row: Record<string, unknown>): WaLinkConversation {
  const preview =
    (typeof row.last_message === 'string' && row.last_message.trim()) ||
    (typeof row.last_message_preview === 'string' && row.last_message_preview.trim()) ||
    (typeof row.metadata === 'object' &&
      row.metadata &&
      typeof (row.metadata as Record<string, unknown>).last_preview === 'string'
      ? String((row.metadata as Record<string, unknown>).last_preview)
      : null) ||
    null;

  return {
    id: String(row.id),
    sender_number: String(row.sender_number ?? ''),
    sender_name: (row.sender_name as string | null) ?? null,
    last_message: preview,
    updated_at: String(row.updated_at ?? row.last_message_at ?? row.created_at ?? new Date().toISOString()),
    unread_count: typeof row.unread_count === 'number' ? row.unread_count : null,
    company_id: (row.company_id as string | null) ?? null,
    connection_id: (row.connection_id as string | null) ?? (row.instance_id as string | null) ?? null,
    customer_avatar: (row.customer_avatar as string | null) ?? null,
    attendance_status:
      row.attendance_status === 'awaiting' ||
      row.attendance_status === 'in_service' ||
      row.attendance_status === 'finished'
        ? row.attendance_status
        : null,
    assigned_to: typeof row.assigned_to === 'string' ? row.assigned_to : null,
    department: typeof row.department === 'string' ? row.department : null,
    crm_type: typeof row.crm_type === 'string' ? row.crm_type : null,
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null,
    assigned_at: typeof row.assigned_at === 'string' ? row.assigned_at : null,
  };
}

export function mapWaLinkConversationRows(data: unknown): WaLinkConversation[] {
  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeRow(row as Record<string, unknown>));
}

export function mergeWaLinkConversations(
  primary: WaLinkConversation[],
  extra: WaLinkConversation[],
): WaLinkConversation[] {
  const byId = new Map<string, WaLinkConversation>();
  for (const row of [...primary, ...extra]) {
    byId.set(row.id, row);
  }
  return Array.from(byId.values()).sort((a, b) => {
    const ta = new Date(a.updated_at).getTime();
    const tb = new Date(b.updated_at).getTime();
    return tb - ta;
  });
}

export async function enrichWaLinkConversationPreviews(
  rows: WaLinkConversation[],
  queryMessages: (conversationIds: string[]) => Promise<Map<string, string>>,
): Promise<WaLinkConversation[]> {
  const needPreview = rows.filter((r) => !r.last_message?.trim()).map((r) => r.id);
  if (needPreview.length === 0) return rows;
  const previews = await queryMessages(needPreview);
  return rows.map((r) => {
    const fromMsg = previews.get(r.id);
    if (!fromMsg || r.last_message?.trim()) return r;
    return { ...r, last_message: fromMsg };
  });
}

export async function fetchWaLinkConversations(
  queryFn: (select: string, filterByCompany: boolean) => Promise<{ data: unknown; error: unknown }>,
  companyId: string | null,
): Promise<WaLinkConversation[]> {
  let lastError: unknown = null;

  for (const select of SELECT_ATTEMPTS) {
    try {
      const { data, error } = await queryFn(select, true);
      if (error) throw error;
      let rows = mapWaLinkConversationRows(data);
      if (rows.length === 0 && companyId) {
        const { data: allData, error: allErr } = await queryFn(select, false);
        if (allErr) throw allErr;
        rows = mapWaLinkConversationRows(allData);
      }
      rows.sort((a, b) => {
        const ta = new Date(a.updated_at).getTime();
        const tb = new Date(b.updated_at).getTime();
        return tb - ta;
      });
      return rows;
    } catch (e) {
      lastError = e;
      if (!isMissingColumnError(e)) throw e;
    }
  }

  throw lastError ?? new Error('Não foi possível ler whatsapp_conversations.');
}

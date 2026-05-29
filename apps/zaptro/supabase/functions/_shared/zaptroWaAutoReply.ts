import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.49.8';
import { chatOllamaWithHistory, isOllamaConfigured, type OllamaChatMessage } from './zaptroOllamaEdge.ts';
import { sendEvolutionText } from './zaptroEvolutionSendEdge.ts';
import { formatWaCrmContextForPrompt } from './zaptroWaCrmContextEdge.ts';
import {
  buildWaAutoReplySystemPrompt,
  readPromptMestreFromCompany,
  type CompanyRow,
} from './zaptroPromptMestreEdge.ts';

const MAX_REPLY_CHARS = 3800;
const HISTORY_LIMIT = 14;
const HANDOFF_MARKER = '[[TRANSFERIR_HUMANO]]';

type ConversationRow = {
  id: string;
  assigned_to?: string | null;
  attendance_status?: string | null;
  sender_name?: string | null;
  metadata?: unknown;
  department?: string | null;
};

function trimReply(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_REPLY_CHARS) return t;
  return `${t.slice(0, MAX_REPLY_CHARS - 1)}…`;
}

function shouldReplyToConversation(conv: ConversationRow): boolean {
  if (conv.assigned_to?.trim()) return false;
  const status = conv.attendance_status?.trim();
  if (status === 'in_service' || status === 'finished') return false;
  return true;
}

function mergeMetadata(
  existing: unknown,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  return { ...base, ...patch };
}

function stripHandoffMarker(text: string): { clean: string; handoff: boolean } {
  const handoff =
    text.includes(HANDOFF_MARKER) ||
    /\b(transferir|encaminhar).{0,40}(humano|atendente|equipa|colaborador)\b/i.test(text);
  const clean = text.replace(HANDOFF_MARKER, '').replace(/\s+\n/g, '\n').trim();
  return { clean, handoff };
}

async function escalateConversation(
  db: SupabaseClient,
  conv: ConversationRow,
  reason: 'ollama_error' | 'handoff_requested',
  note?: string,
): Promise<void> {
  const now = new Date().toISOString();
  const metadata = mergeMetadata(conv.metadata, {
    ai_escalated_at: now,
    ai_escalation_reason: reason,
    ai_escalation_note: note?.slice(0, 280) || null,
  });

  const { error } = await db
    .from('whatsapp_conversations')
    .update({
      assigned_to: null,
      attendance_status: 'awaiting',
      assigned_at: null,
      metadata,
      updated_at: now,
    })
    .eq('id', conv.id);

  if (error) console.error('[wa-auto-reply] escalate:', error.message);
}

async function loadMessageHistory(
  db: SupabaseClient,
  conversationId: string,
): Promise<OllamaChatMessage[]> {
  const { data, error } = await db
    .from('whatsapp_messages')
    .select('content, direction, role, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error || !data?.length) return [];

  const chronological = [...data].reverse();
  const out: OllamaChatMessage[] = [];
  for (const row of chronological) {
    const content = String(row.content ?? '').trim();
    if (!content) continue;
    const direction = String(row.direction ?? '').toLowerCase();
    const role = String(row.role ?? '').toLowerCase();
    const isAssistant = direction === 'out' || role === 'assistant';
    out.push({ role: isAssistant ? 'assistant' : 'user', content });
  }
  return out;
}

/** Resposta automática WhatsApp via Ollama + Evolution (fase 2/3). */
export async function runWaAutoReply(opts: {
  db: SupabaseClient;
  companyId: string;
  conversationId: string;
  phone: string;
  instanceName: string;
  pushName?: string | null;
}): Promise<{ ok: boolean; reason?: string; reply?: string; escalated?: boolean }> {
  if (!isOllamaConfigured()) {
    return { ok: false, reason: 'ZAPTRO_WA_AUTO_REPLY=false' };
  }

  const { data: conv, error: convErr } = await opts.db
    .from('whatsapp_conversations')
    .select('id, assigned_to, attendance_status, sender_name, metadata, department')
    .eq('id', opts.conversationId)
    .maybeSingle();

  if (convErr || !conv?.id) {
    return { ok: false, reason: convErr?.message || 'conversa não encontrada' };
  }

  const convRow = conv as ConversationRow;

  if (!shouldReplyToConversation(convRow)) {
    return { ok: false, reason: 'atendimento humano activo' };
  }

  const { data: company, error: coErr } = await opts.db
    .from('companies')
    .select('name, phone, email, website, opening_hours, description, settings')
    .eq('id', opts.companyId)
    .maybeSingle();

  if (coErr) {
    console.warn('[wa-auto-reply] company load:', coErr.message);
  }

  const companyRow = (company ?? null) as CompanyRow | null;
  const prefs = readPromptMestreFromCompany(companyRow);
  if (!prefs.autoReplyWhatsapp) {
    return { ok: false, reason: 'auto-reply desactivado nas configurações' };
  }

  const history = await loadMessageHistory(opts.db, opts.conversationId);
  if (history.length === 0) {
    return { ok: false, reason: 'sem histórico de mensagens' };
  }

  const clientName = opts.pushName?.trim() || convRow.sender_name?.trim() || null;
  const crmBlock = formatWaCrmContextForPrompt(convRow.metadata);
  const systemPrompt = buildWaAutoReplySystemPrompt(companyRow, prefs, clientName, crmBlock);

  let reply: string;
  try {
    reply = await chatOllamaWithHistory({ systemPrompt, history });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[wa-auto-reply] ollama:', msg);
    await escalateConversation(opts.db, convRow, 'ollama_error', msg);
    return { ok: false, reason: `ollama: ${msg}`, escalated: true };
  }

  const parsed = stripHandoffMarker(trimReply(reply));
  reply = parsed.clean;
  if (!reply && parsed.handoff) {
    reply = 'Vou encaminhar o seu pedido para a nossa equipa. Aguarde um momento, por favor.';
  }
  if (!reply) return { ok: false, reason: 'resposta vazia' };

  const send = await sendEvolutionText({
    instanceName: opts.instanceName,
    number: opts.phone,
    text: reply,
  });

  if (!send.ok) {
    console.error('[wa-auto-reply] evolution send:', send.status, send.data);
    await escalateConversation(opts.db, convRow, 'ollama_error', `evolution HTTP ${send.status}`);
    return { ok: false, reason: `evolution HTTP ${send.status}`, escalated: true };
  }

  if (parsed.handoff) {
    await escalateConversation(opts.db, convRow, 'handoff_requested');
    console.log('[wa-auto-reply] handoff', opts.conversationId);
    return { ok: true, reply, escalated: true };
  }

  console.log('[wa-auto-reply] ok', opts.conversationId, reply.slice(0, 80));
  return { ok: true, reply };
}

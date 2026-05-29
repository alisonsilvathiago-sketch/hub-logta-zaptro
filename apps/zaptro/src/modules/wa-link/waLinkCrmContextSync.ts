import { supabaseZaptro } from '../../lib/supabase-zaptro';
import type { WaLinkCustomerContextSnapshot } from './waLinkCustomerContext';

export type WaLinkCrmContextPayload = {
  synced_at: string;
  company_name?: string;
  products_label?: string;
  quotes?: Array<{
    label: string;
    status: string;
    origin?: string;
    destination?: string;
    value?: number;
  }>;
  routes?: Array<{
    label: string;
    status_label: string;
    origin?: string | null;
    dest?: string | null;
    track_token?: string;
  }>;
};

export function buildWaLinkCrmContextPayload(
  snapshot: WaLinkCustomerContextSnapshot | null,
): WaLinkCrmContextPayload | null {
  if (!snapshot) return null;
  const hasData =
    Boolean(snapshot.companyName?.trim()) ||
    snapshot.quotes.length > 0 ||
    snapshot.routes.length > 0;
  if (!hasData) return null;

  return {
    synced_at: new Date().toISOString(),
    company_name: snapshot.companyName?.trim() || undefined,
    products_label: snapshot.productsLabel || undefined,
    quotes: snapshot.quotes.slice(0, 6).map((q) => ({
      label: q.label,
      status: q.status,
      origin: q.origin,
      destination: q.destination,
      value: q.value,
    })),
    routes: snapshot.routes.slice(0, 4).map((r) => ({
      label: r.label,
      status_label: r.statusLabel,
      origin: r.origin ?? null,
      dest: r.dest ?? null,
      track_token: r.token,
    })),
  };
}

/** Grava snapshot CRM em `whatsapp_conversations.metadata.crm_context` para o Ollama (edge). */
export async function syncWaLinkCrmContextToConversation(
  conversationId: string,
  snapshot: WaLinkCustomerContextSnapshot | null,
  existingMetadata?: Record<string, unknown> | null,
): Promise<void> {
  if (!conversationId || conversationId.startsWith('wa-mirror-')) return;
  const payload = buildWaLinkCrmContextPayload(snapshot);
  if (!payload) return;

  const prev =
    existingMetadata && typeof existingMetadata === 'object' && !Array.isArray(existingMetadata)
      ? existingMetadata
      : {};
  const prevCtx = prev.crm_context as WaLinkCrmContextPayload | undefined;
  if (prevCtx?.synced_at && JSON.stringify(prevCtx) === JSON.stringify(payload)) return;

  const merged = {
    ...prev,
    crm_context: payload,
  };

  const { error } = await supabaseZaptro
    .from('whatsapp_conversations')
    .update({ metadata: merged })
    .eq('id', conversationId);

  if (error) {
    console.warn('[wa-link] crm context sync:', error.message);
  }
}

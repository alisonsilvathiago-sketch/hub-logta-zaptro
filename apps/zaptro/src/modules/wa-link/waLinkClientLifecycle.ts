/**
 * Ciclo lead → cliente → contacto (WhatsApp inbox + CRM).
 * Contacto = registo em whatsapp_conversations (visível em Clientes, Contatos e Nova conversa).
 */
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import { appendZaptroActivityLog } from '../../constants/zaptroActivityLogStore';
import { normalizeWaPhoneDigits, registerWaLinkClient } from './waLinkRegisterClient';

export type PromoteWaLinkClientInput = {
  companyId: string;
  conversationId?: string;
  phone?: string;
  name?: string;
  companyName?: string;
  paymentRef?: string;
  source?: string;
};

function dispatchContactSync(): void {
  window.dispatchEvent(new CustomEvent('zaptro:wa-contacts-synced'));
  window.dispatchEvent(new CustomEvent('zaptro:wa-profile-synced'));
}

function readMetaString(metadata: unknown, key: string): string {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return '';
  const v = (metadata as Record<string, unknown>)[key];
  return typeof v === 'string' ? v.trim() : '';
}

export function shouldAutoPromoteWaLinkPayment(row: {
  crm_type?: string | null;
  metadata?: unknown;
}): boolean {
  if ((row.crm_type || '').toLowerCase() === 'client') return false;
  const payment = readMetaString(row.metadata, 'payment_status').toLowerCase();
  return payment === 'ok' || payment.includes('confirm') || payment.includes('pago');
}

export function notifyWaLinkPaymentConfirmed(input: PromoteWaLinkClientInput): void {
  window.dispatchEvent(new CustomEvent('zaptro:wa-payment-confirmed', { detail: input }));
}

/** Marca conversa existente como lead (primeira interacção). */
export async function ensureWaLinkLeadConversation(
  companyId: string,
  conversationId: string,
): Promise<void> {
  const { data } = await supabaseZaptro
    .from('whatsapp_conversations')
    .select('id, crm_type, metadata')
    .eq('id', conversationId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (!data?.id) throw new Error('Conversa não encontrada.');
  if (data.crm_type === 'client') throw new Error('Este contacto já é cliente.');

  const meta =
    data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
      ? { ...(data.metadata as Record<string, unknown>) }
      : {};

  if (data.crm_type === 'lead') return;

  await supabaseZaptro
    .from('whatsapp_conversations')
    .update({
      crm_type: 'lead',
      metadata: { ...meta, lead_since: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  dispatchContactSync();
}

function logClientPromotion(
  companyId: string,
  input: PromoteWaLinkClientInput,
  label: string,
  at: string,
): void {
  appendZaptroActivityLog(companyId, {
    type: 'sistema',
    actorName:
      input.source === 'crm_fechado'
        ? 'CRM · Fechado'
        : input.source === 'wa_payment'
          ? 'Pagamento'
          : 'Sistema',
    clientLabel: label,
    action: 'Pagamento confirmado',
    at,
    actorColor: '#f6bf26',
    details: 'Cliente promovido automaticamente após confirmação de pagamento.',
  });
}

/** Lead pago / fechado → cliente + contacto activo (Clientes + Contatos + inbox). */
export async function promoteWaLinkToClient(input: PromoteWaLinkClientInput): Promise<string | null> {
  const companyId = input.companyId.trim();
  if (!companyId) return null;
  const now = new Date().toISOString();

  let row: { id: string; sender_name?: string | null; sender_number?: string | null; metadata?: unknown } | null =
    null;

  if (input.conversationId) {
    const { data } = await supabaseZaptro
      .from('whatsapp_conversations')
      .select('id, sender_name, sender_number, metadata')
      .eq('id', input.conversationId)
      .eq('company_id', companyId)
      .maybeSingle();
    row = data;
  } else if (input.phone) {
    const phone = normalizeWaPhoneDigits(input.phone);
    const { data } = await supabaseZaptro
      .from('whatsapp_conversations')
      .select('id, sender_name, sender_number, metadata')
      .eq('company_id', companyId)
      .eq('sender_number', phone)
      .maybeSingle();
    row = data;
  }

  if (!row?.id) {
    if (!input.phone && !input.name) return null;
    const reg = await registerWaLinkClient({
      companyId,
      name: input.name?.trim() || 'Cliente',
      phone: input.phone || '',
      companyName: input.companyName,
      source: input.source || 'wa_payment',
    });
    dispatchContactSync();
    logClientPromotion(companyId, input, input.name?.trim() || input.phone || 'Cliente', now);
    return reg.id;
  }

  const meta =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? { ...(row.metadata as Record<string, unknown>) }
      : {};

  await supabaseZaptro
    .from('whatsapp_conversations')
    .update({
      crm_type: 'client',
      status: 'open',
      sender_name: input.name?.trim() || row.sender_name,
      metadata: {
        ...meta,
        promoted_to_client_at: now,
        payment_ref: input.paymentRef?.trim() || meta.payment_ref || null,
        payment_status: 'ok',
        source: input.source || meta.source || 'wa_payment',
      },
      updated_at: now,
    })
    .eq('id', row.id);

  dispatchContactSync();
  logClientPromotion(
    companyId,
    input,
    input.name?.trim() || row.sender_name || row.sender_number || 'Cliente',
    now,
  );
  return row.id;
}

export function listenWaLinkPaymentPromotions(
  companyId: string | null,
  onDone: () => void,
): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<PromoteWaLinkClientInput>).detail;
    if (!companyId || detail?.companyId !== companyId) return;
    void promoteWaLinkToClient(detail).then(() => onDone());
  };
  window.addEventListener('zaptro:wa-payment-confirmed', handler);
  return () => window.removeEventListener('zaptro:wa-payment-confirmed', handler);
}

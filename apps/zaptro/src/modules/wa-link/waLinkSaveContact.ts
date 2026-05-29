/**
 * Marca conversa como contacto (página Contatos) — sem promover a cliente.
 */
import { supabaseZaptro } from '../../lib/supabase-zaptro';

function dispatchContactSync(): void {
  window.dispatchEvent(new CustomEvent('zaptro:wa-contacts-synced'));
}

export async function saveWaLinkAsContact(
  companyId: string,
  conversationId: string,
  name?: string,
): Promise<void> {
  const { data } = await supabaseZaptro
    .from('whatsapp_conversations')
    .select('id, sender_name, metadata, crm_type')
    .eq('id', conversationId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (!data?.id) throw new Error('Conversa não encontrada.');

  const crm = (data.crm_type || '').toLowerCase();
  if (crm === 'client') {
    throw new Error('Este contacto já é cliente. Veja em Clientes.');
  }

  const meta =
    data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
      ? { ...(data.metadata as Record<string, unknown>) }
      : {};

  const now = new Date().toISOString();
  await supabaseZaptro
    .from('whatsapp_conversations')
    .update({
      crm_type: 'contact',
      sender_name: name?.trim() || data.sender_name,
      metadata: { ...meta, saved_as_contact_at: now, source: 'wa_inbox' },
      updated_at: now,
    })
    .eq('id', conversationId);

  dispatchContactSync();
}

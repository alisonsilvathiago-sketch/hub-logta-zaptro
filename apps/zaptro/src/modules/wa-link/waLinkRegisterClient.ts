import { supabaseZaptro } from '../../lib/supabase-zaptro';

export type WaLinkDocType = 'cpf' | 'cnpj';

export type RegisterWaLinkClientInput = {
  companyId: string;
  name: string;
  phone: string;
  companyName?: string;
  documentType?: WaLinkDocType;
  document?: string;
  email?: string;
  notes?: string;
  source?: string;
};

export function normalizeWaPhoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith('55')) {
    digits = `55${digits}`;
  }
  return digits;
}

export function validateWaDocument(type: WaLinkDocType, raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return type === 'cpf' ? digits.length === 11 : digits.length === 14;
}

function buildClientMetadata(input: RegisterWaLinkClientInput): Record<string, unknown> {
  const docDigits = input.document?.replace(/\D/g, '') ?? '';
  const meta: Record<string, unknown> = {
    company_name: input.companyName?.trim() || null,
    created_manually: true,
    source: input.source?.trim() || 'wa_link_drawer',
    registered_at: new Date().toISOString(),
  };
  if (input.email?.trim()) meta.email = input.email.trim();
  if (input.notes?.trim()) meta.notes = input.notes.trim();
  if (docDigits && input.documentType) {
    meta.document_type = input.documentType;
    if (input.documentType === 'cpf') {
      meta.cpf = docDigits;
      meta.cnpj = null;
    } else {
      meta.cnpj = docDigits;
      meta.cpf = null;
    }
  }
  return meta;
}

async function findConversationByPhone(companyId: string, phone: string) {
  const { data, error } = await supabaseZaptro
    .from('whatsapp_conversations')
    .select('id, metadata')
    .eq('company_id', companyId)
    .eq('sender_number', phone)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; metadata?: Record<string, unknown> | null } | null;
}

/** Cadastra ou actualiza cliente em `whatsapp_conversations` com `crm_type: client`. */
export async function registerWaLinkClient(
  input: RegisterWaLinkClientInput,
): Promise<{ id: string; created: boolean }> {
  const name = input.name.trim();
  const phone = normalizeWaPhoneDigits(input.phone);
  if (!name) throw new Error('Informe o nome do contacto.');
  if (phone.length < 12) throw new Error('Informe um telefone válido com DDD.');

  if (input.document?.trim() && input.documentType) {
    if (!validateWaDocument(input.documentType, input.document)) {
      throw new Error(
        input.documentType === 'cpf'
          ? 'CPF inválido (11 dígitos).'
          : 'CNPJ inválido (14 dígitos).',
      );
    }
  }

  const now = new Date().toISOString();
  const newMeta = buildClientMetadata(input);
  const existing = await findConversationByPhone(input.companyId, phone);

  if (existing?.id) {
    const mergedMeta = {
      ...(typeof existing.metadata === 'object' && existing.metadata ? existing.metadata : {}),
      ...newMeta,
    };
    const { data, error } = await supabaseZaptro
      .from('whatsapp_conversations')
      .update({
        sender_name: name,
        crm_type: 'client',
        status: 'open',
        metadata: mergedMeta,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error) throw error;
    window.dispatchEvent(new CustomEvent('zaptro:wa-contacts-synced'));
    return { id: String(data.id), created: false };
  }

  const { data, error } = await supabaseZaptro
    .from('whatsapp_conversations')
    .insert({
      company_id: input.companyId,
      sender_name: name,
      sender_number: phone,
      status: 'open',
      crm_type: 'client',
      metadata: newMeta,
      updated_at: now,
    })
    .select('id')
    .single();

  if (error) throw error;
  window.dispatchEvent(new CustomEvent('zaptro:wa-contacts-synced'));
  return { id: String(data.id), created: true };
}

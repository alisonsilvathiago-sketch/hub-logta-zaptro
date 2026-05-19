import { supabase } from '../../lib/supabase';
import type { OrcamentoProposal } from './types';

/** Garante cliente no CRM quando orçamento é aprovado ou pago. */
export async function ensureClientFromOrcamento(companyId: string, orc: OrcamentoProposal) {
  const name = orc.clientName?.trim();
  if (!name) return;

  const doc = orc.clientDocument?.trim() || '';
  const email = orc.clientEmail?.trim() || '';

  try {
    let existingId: string | null = null;
    if (doc) {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', companyId)
        .eq('cnpj', doc)
        .maybeSingle();
      existingId = data?.id ?? null;
    }
    if (!existingId && email) {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', companyId)
        .ilike('email', email)
        .maybeSingle();
      existingId = data?.id ?? null;
    }

    if (existingId) {
      await supabase
        .from('clients')
        .update({
          status: 'ativo',
          name,
          metadata: {
            origem: 'orcamento_online',
            orcamento_id: orc.id,
            orcamento_numero: orc.number,
          },
        })
        .eq('id', existingId);
      return;
    }

    await supabase.from('clients').insert({
      company_id: companyId,
      name,
      cnpj: doc || null,
      email: email || null,
      status: 'ativo',
      metadata: {
        origem: 'orcamento_online',
        orcamento_id: orc.id,
        orcamento_numero: orc.number,
        segmento: 'Orçamento online',
      },
    });
  } catch {
    /* sandbox / offline */
  }
}

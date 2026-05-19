import { supabase } from '../../lib/supabase';
import { appendLocalFinanceTransaction } from '../../lib/financeLocalStorage';
import type { OrcamentoProposal } from './types';

export function buildOrcamentoReceitaDescription(orc: OrcamentoProposal) {
  return `Orçamento ${orc.number} — ${orc.clientName} [orc:${orc.id}]`;
}

/** Cria receita em Contas a receber / Fluxo ao confirmar pagamento do orçamento. */
export async function createReceitaFromOrcamentoPayment(
  companyId: string,
  orc: OrcamentoProposal,
  receivedByName: string,
): Promise<string> {
  if (orc.financeTransactionId) return orc.financeTransactionId;

  const now = new Date().toISOString();
  const txId = `orc-tx-${orc.id}-${Date.now()}`;
  const description = buildOrcamentoReceitaDescription(orc);

  appendLocalFinanceTransaction(companyId, {
    id: txId,
    type: 'income',
    amount: orc.total,
    description,
    category: 'orcamento_online',
    paid_at: now,
    created_at: now,
    company_id: companyId,
  });

  if (companyId) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            type: 'income',
            description: `${description} · Registrado por ${receivedByName}`,
            amount: orc.total,
            paid_at: now,
            category: 'orcamento_online',
            company_id: companyId,
          },
        ])
        .select('id')
        .single();

      if (!error && data?.id) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('logta-operational-sync'));
        }
        return String(data.id);
      }
    } catch {
      /* fallback local */
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('logta-operational-sync'));
  }

  return txId;
}

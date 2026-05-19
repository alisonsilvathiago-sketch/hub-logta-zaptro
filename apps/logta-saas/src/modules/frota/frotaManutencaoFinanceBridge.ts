import { supabase } from '../../lib/supabase';
import { appendLocalFinanceTransaction } from '../../lib/financeLocalStorage';
import type { FrotaManutencaoRecord } from './frotaManutencaoStorage';
import { financeCategoryForTipo, tipoManutencaoLabel } from './frotaManutencaoStorage';

export function buildManutencaoFinanceDescription(record: FrotaManutencaoRecord) {
  const motivo = record.motivo ? ` · ${record.motivo}` : '';
  return `Manutenção ${tipoManutencaoLabel(record.tipo)} — ${record.placa} (${record.modelo}) · ${record.responsavel}${motivo} [frota:${record.id}]`;
}

/** Lança despesa no financeiro (local + Supabase quando disponível). */
export async function createDespesaFromManutencao(
  companyId: string,
  record: FrotaManutencaoRecord,
): Promise<string> {
  const now = record.realizadoEm || new Date().toISOString();
  const txId = `frota-manut-${record.id}`;
  const description = buildManutencaoFinanceDescription(record);
  const category = financeCategoryForTipo(record.tipo);

  appendLocalFinanceTransaction(companyId, {
    id: txId,
    type: 'expense',
    amount: record.valor,
    description,
    category,
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
            type: 'expense',
            description,
            amount: record.valor,
            paid_at: now,
            category,
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

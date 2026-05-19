/** Lançamentos financeiros locais (sandbox / fallback quando Supabase não grava). */
export type LocalFinanceTransaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  paid_at: string;
  created_at: string;
  company_id: string;
};

const PREFIX = 'logta-finance-local';

function key(companyId: string) {
  return `${PREFIX}:${companyId}`;
}

export function loadLocalFinanceTransactions(companyId: string): LocalFinanceTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key(companyId)) ?? '[]') as LocalFinanceTransaction[];
  } catch {
    return [];
  }
}

export function appendLocalFinanceTransaction(companyId: string, row: LocalFinanceTransaction) {
  if (typeof window === 'undefined') return;
  const list = loadLocalFinanceTransactions(companyId);
  if (list.some((t) => t.id === row.id)) return;
  list.unshift(row);
  localStorage.setItem(key(companyId), JSON.stringify(list));
}

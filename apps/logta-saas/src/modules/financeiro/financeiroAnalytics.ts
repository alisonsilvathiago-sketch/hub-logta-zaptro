export type TransactionRow = {
  id?: string;
  tipo?: string;
  type?: string;
  valor?: number;
  amount?: number;
  descricao?: string;
  description?: string;
  categoria?: string;
  category?: string;
  data_vencimento?: string;
  paid_at?: string;
  created_at?: string;
};

function tipo(t: TransactionRow) {
  return t.tipo ?? t.type ?? '';
}

function valor(t: TransactionRow) {
  return Number(t.valor ?? t.amount ?? 0);
}

function categoria(t: TransactionRow) {
  return (t.categoria ?? t.category ?? 'Outros').trim() || 'Outros';
}

function dataRef(t: TransactionRow) {
  const raw = t.data_vencimento ?? t.paid_at ?? t.created_at;
  return raw ? new Date(raw) : new Date();
}

export function computeFinanceiroAnalytics(transactions: TransactionRow[]) {
  let receita = 0;
  let despesas = 0;
  const byCategory: Record<string, number> = {};
  const monthly: Record<string, { in: number; out: number }> = {};

  const now = Date.now();
  let alertasVencimento = 0;

  for (const t of transactions) {
    const v = valor(t);
    const cat = categoria(t);
    const kind = tipo(t);
    const isReceita = kind === 'receita' || kind === 'income';

    if (isReceita) receita += v;
    else despesas += v;

    if (!isReceita) {
      byCategory[cat] = (byCategory[cat] ?? 0) + v;
    }

    const d = dataRef(t);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[key]) monthly[key] = { in: 0, out: 0 };
    if (isReceita) monthly[key].in += v;
    else monthly[key].out += v;

    if (!isReceita && !t.paid_at) {
      const diff = (d.getTime() - now) / (1000 * 60 * 60 * 24);
      if (diff >= 0 && diff <= 7) alertasVencimento += 1;
    }
  }

  const saldo = receita - despesas;
  const lucroOperacional = saldo;
  const inadimplenciaEst = despesas > 0 ? Math.min(100, Math.round((alertasVencimento / Math.max(1, transactions.filter((x) => tipo(x) === 'despesa').length)) * 100)) : 0;

  const topCustos = Object.entries(byCategory)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const monthKeys = Object.keys(monthly).sort().slice(-6);
  const fluxoMensal = monthKeys.map((key) => {
    const [y, m] = key.split('-');
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'short' });
    return { key, label, ...monthly[key], saldo: monthly[key].in - monthly[key].out };
  });

  const recentes = [...transactions]
    .sort((a, b) => dataRef(b).getTime() - dataRef(a).getTime())
    .slice(0, 8);

  return {
    receita,
    despesas,
    saldo,
    lucroOperacional,
    transacoes: transactions.length,
    alertasVencimento,
    inadimplenciaEst,
    topCustos,
    fluxoMensal,
    byCategory,
    recentes,
  };
}

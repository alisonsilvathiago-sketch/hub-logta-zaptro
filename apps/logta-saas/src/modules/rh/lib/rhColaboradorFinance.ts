import { loadLocalFinanceTransactions, type LocalFinanceTransaction } from '../../../lib/financeLocalStorage';
import { downloadExcelCsv, downloadPdfTable } from '../../../lib/reportExport';
import type {
  ColaboradorHolerite,
  ColaboradorRhProfile,
  HoleriteLine,
  HoleriteStatus,
} from '../ponto/colaboradorRhStorage';

export type CollaboratorFinancePayment = {
  id: string;
  description: string;
  amount: number;
  category: string;
  paidAt: string;
  competencia?: string;
  source: 'financeiro';
};

const COLAB_TAG_RE = /\[colab:([^\]]+)\]/i;

export function parseColaboradorIdFromFinanceDescription(description: string): string | null {
  const m = description.match(COLAB_TAG_RE);
  return m?.[1]?.trim() ?? null;
}

export function loadCollaboratorFinancePayments(
  companyId: string,
  profile: ColaboradorRhProfile,
): CollaboratorFinancePayment[] {
  const txs = loadLocalFinanceTransactions(companyId);
  const nameNeedle = profile.fullName.toLowerCase();
  const idNeedle = profile.id.toLowerCase();

  return txs
    .filter((t) => {
      if (t.type !== 'expense') return false;
      const desc = (t.description ?? '').toLowerCase();
      const cat = (t.category ?? '').toLowerCase();
      const tagged = parseColaboradorIdFromFinanceDescription(t.description ?? '');
      if (tagged === profile.id) return true;
      if (!cat.includes('folha') && !desc.includes('folha') && !desc.includes('salário')) return false;
      return desc.includes(nameNeedle) || desc.includes(idNeedle);
    })
    .map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      category: t.category,
      paidAt: t.paid_at,
      competencia: inferCompetenciaFromPayment(t),
      source: 'financeiro' as const,
    }))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

function inferCompetenciaFromPayment(t: LocalFinanceTransaction): string | undefined {
  const m = t.description.match(/(\d{4})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}`;
  const d = new Date(t.paid_at);
  if (Number.isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${mo}`;
}

function competenciaLabel(competencia: string) {
  const [y, m] = competencia.split('-');
  const month = Number(m);
  const names = [
    '',
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${names[month] ?? m}/${y}`;
}

export function buildHoleriteLines(
  profile: ColaboradorRhProfile,
  additions: number,
  competencia: string,
): HoleriteLine[] {
  const config = profile.financialConfig;
  const base = config?.baseSalary || profile.currentSalary || 0;

  const inssBase = base + additions;
  const inss = Math.round(inssBase * 0.11);
  const irrf = Math.round(inssBase * 0.075);

  const lines: HoleriteLine[] = [
    { label: 'Salário base', amount: base, type: 'provento' },
  ];
  if (additions > 0) {
    lines.push({ label: 'Adicionais / prêmios', amount: additions, type: 'provento' });
  }

  if (config?.rules) {
    config.rules.forEach((r) => {
      let val = 0;
      if (r.type === 'fixo') {
        val = r.amount;
      } else if (r.type === 'percentual') {
        const baseCalc = r.base === 'salario_liquido' ? (base - inss - irrf) : base;
        val = Math.round(baseCalc * (r.amount / 100));
      }

      if (val > 0) {
        if (r.recurrence === 'parcelado' && r.totalInstallments) {
          const paid = r.installmentsPaid || 0;
          if (paid < r.totalInstallments) {
            lines.push({
              label: `${r.name} (Parc. ${paid + 1}/${r.totalInstallments})`,
              amount: val,
              type: 'desconto',
            });
          }
        } else {
          lines.push({ label: r.name, amount: val, type: 'desconto' });
        }
      }
    });
  }

  lines.push(
    { label: 'INSS', amount: inss, type: 'desconto' },
    { label: 'IRRF', amount: irrf, type: 'desconto' },
  );

  return lines;
}

function generateHoleritesFromSalary(profile: ColaboradorRhProfile): ColaboradorHolerite[] {
  const base = profile.currentSalary ?? 0;
  if (base <= 0) return [];

  const now = new Date();
  const out: ColaboradorHolerite[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const competencia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const additions = i === 1 ? 850 : i === 3 ? 1200 : 0;
    const lines = buildHoleriteLines(profile, additions, competencia);
    const gross = (profile.financialConfig?.baseSalary || profile.currentSalary || 0) + additions;
    const discounts = lines
      .filter((l) => l.type === 'desconto')
      .reduce((s, l) => s + l.amount, 0);
    const net = gross - discounts;
    const status: HoleriteStatus = i === 0 ? 'aguardando_pagamento' : 'pago';
    out.push({
      id: `hol-gen-${profile.id}-${competencia}`,
      competencia,
      grossSalary: gross,
      additions,
      discounts,
      netSalary: net,
      status,
      paidAt: status === 'pago' ? new Date(d.getFullYear(), d.getMonth() + 1, 5).toISOString() : undefined,
      generatedAt: new Date(d.getFullYear(), d.getMonth(), 28).toISOString(),
      lines,
    });
  }
  return out;
}

export function syncHoleritesWithFinancePayments(
  holerites: ColaboradorHolerite[],
  payments: CollaboratorFinancePayment[],
): ColaboradorHolerite[] {
  return holerites.map((h) => {
    const pay = payments.find(
      (p) =>
        p.competencia === h.competencia ||
        p.description.toLowerCase().includes(h.competencia.replace('-', '/')),
    );
    if (!pay) return h;
    return {
      ...h,
      status: 'pago' as const,
      paidAt: pay.paidAt,
      financeTransactionId: pay.id,
    };
  });
}

export function resolveColaboradorHolerites(
  profile: ColaboradorRhProfile,
  payments: CollaboratorFinancePayment[],
): ColaboradorHolerite[] {
  const base =
    profile.holerites && profile.holerites.length > 0
      ? profile.holerites
      : generateHoleritesFromSalary(profile);
  return syncHoleritesWithFinancePayments(base, payments).sort((a, b) =>
    b.competencia.localeCompare(a.competencia),
  );
}

export function holeriteStatusLabel(status: HoleriteStatus) {
  const map: Record<HoleriteStatus, string> = {
    rascunho: 'Rascunho',
    aguardando_pagamento: 'Aguardando pagamento',
    pago: 'Pago',
    cancelado: 'Cancelado',
  };
  return map[status];
}

export function holeriteStatusClass(status: HoleriteStatus) {
  switch (status) {
    case 'pago':
      return 'bg-emerald-100 text-emerald-800';
    case 'aguardando_pagamento':
      return 'bg-amber-100 text-amber-800';
    case 'cancelado':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function downloadHoleritePdf(holerite: ColaboradorHolerite, profile: ColaboradorRhProfile) {
  const lines = holerite.lines ?? buildHoleriteLines(profile, holerite.additions, holerite.competencia);
  const rows = lines.map((l) => [
    l.type === 'provento' ? 'Provento' : 'Desconto',
    l.label,
    l.type === 'provento' ? l.amount : -l.amount,
  ]);
  rows.push(['', 'Total bruto', holerite.grossSalary]);
  rows.push(['', 'Total descontos', -holerite.discounts]);
  rows.push(['', 'Líquido', holerite.netSalary]);

  downloadPdfTable({
    title: `Holerite — ${profile.fullName}`,
    filenameBase: `holerite-${profile.document || profile.id}-${holerite.competencia}`,
    columns: ['Tipo', 'Descrição', 'Valor (R$)'],
    rows: rows.map((r) => [r[0], r[1], typeof r[2] === 'number' ? r[2].toLocaleString('pt-BR') : r[2]]),
    meta: {
      companyName: 'Logta',
      filtersSummary: `Competência ${competenciaLabel(holerite.competencia)} · ${holeriteStatusLabel(holerite.status)}`,
      exportScope: 'filtered',
    },
  });
}

export function downloadHoleritesCsv(
  holerites: ColaboradorHolerite[],
  profile: ColaboradorRhProfile,
) {
  downloadExcelCsv({
    title: `Holerites — ${profile.fullName}`,
    filenameBase: `holerites-${profile.document || profile.id}`,
    columns: ['Competência', 'Bruto', 'Descontos', 'Líquido', 'Status', 'Pago em'],
    rows: holerites.map((h) => [
      competenciaLabel(h.competencia),
      h.grossSalary,
      h.discounts,
      h.netSalary,
      holeriteStatusLabel(h.status),
      h.paidAt ? new Date(h.paidAt).toLocaleDateString('pt-BR') : '—',
    ]),
    meta: { exportScope: 'filtered' },
  });
}

export function sumPaidAmount(payments: CollaboratorFinancePayment[], holerites: ColaboradorHolerite[]) {
  const fromFinance = payments.reduce((s, p) => s + p.amount, 0);
  if (fromFinance > 0) return fromFinance;
  return holerites
    .filter((h) => h.status === 'pago')
    .reduce((s, h) => s + h.netSalary, 0);
}

export { competenciaLabel };

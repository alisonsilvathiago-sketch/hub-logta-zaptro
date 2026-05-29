import type { TransactionRow } from './financeiroAnalytics';
import type { ShipmentNormalized } from '../fretes/types';

export type FinanceiroLinkContext = {
  shipments?: ShipmentNormalized[];
};

const CLIENT_ROUTES: Array<{ pattern: RegExp; path: string }> = [
  { pattern: /alfa\s*logistics/i, path: '/crm/clientes/cli-alfa' },
  { pattern: /prime\s*cargo/i, path: '/crm/clientes/cli-prime' },
  { pattern: /transbrasil/i, path: '/crm/clientes/cli-trans' },
  { pattern: /nexfrete/i, path: '/crm/clientes/cli-nex' },
  { pattern: /logexpress/i, path: '/crm/clientes/cli-logex' },
  { pattern: /sul\s*minas|transportes\s*sul/i, path: '/crm/clientes/cli-sul' },
];

function descricao(t: TransactionRow) {
  return (t.descricao ?? t.description ?? '').trim();
}

function categoria(t: TransactionRow) {
  return (t.categoria ?? t.category ?? '').toLowerCase();
}

function tipoTransacao(t: TransactionRow) {
  return (t.tipo ?? t.type ?? '').toLowerCase();
}

function isReceitaTransaction(t: TransactionRow) {
  const k = tipoTransacao(t);
  return k === 'receita' || k === 'income';
}

function findOrcamentoIdInDescription(text: string) {
  const match = text.match(/\[orc:([^\]]+)\]/i);
  return match?.[1] ?? null;
}

function findShipmentByFreteNr(text: string, shipments: ShipmentNormalized[]) {
  const match = text.match(/lf-\d+/i);
  if (!match) return null;
  const nr = match[0].toUpperCase();
  return (
    shipments.find((s) => (s.numero_frete ?? '').toUpperCase() === nr) ??
    shipments.find((s) => descricao({ description: String(s.metadata?.numero_frete ?? '') }).toUpperCase().includes(nr))
  );
}

function routeByCategory(cat: string, isReceita: boolean): string | null {
  if (cat.includes('orcamento')) return '/crm/orcamentos';
  if (cat.includes('receita_frete') || cat.includes('frete')) return '/fretes/operacional';
  if (cat.includes('contrato') || cat.includes('recebivel')) return '/crm/vendas';
  if (cat.includes('pix')) return '/crm/clientes';
  if (cat.includes('combustivel')) return '/frota/combustivel';
  if (cat.includes('manutencao') || cat.includes('pneus')) return '/frota/manutencao';
  if (cat.includes('folha')) return '/rh/administrativo/pessoas';
  if (cat.includes('multas')) return '/frota';
  if (cat.includes('seguro')) return '/pgr/seguros';
  if (cat.includes('financiamento') || cat.includes('impostos')) return '/financeiro/gestao';
  if (cat.includes('administrativo')) return '/financeiro/gestao';
  return isReceita ? '/financeiro/receber' : '/financeiro/pagar';
}

/** Resolve a rota de detalhe/módulo para um lançamento financeiro. */
export function resolveFinanceiroTransactionRoute(
  transaction: TransactionRow,
  ctx: FinanceiroLinkContext = {},
): string | null {
  const text = descricao(transaction);
  const cat = categoria(transaction);
  const isReceita = isReceitaTransaction(transaction);

  const meta = transaction as TransactionRow & { metadata?: { linkTo?: string } };
  if (meta.metadata?.linkTo) return meta.metadata.linkTo;

  const orcId = findOrcamentoIdInDescription(text);
  if (orcId) return `/crm/orcamentos/${orcId}`;
  if (/orçamento\s*orc-/i.test(text) || categoria(transaction) === 'orcamento_online') {
    return '/crm/orcamentos';
  }

  if (ctx.shipments?.length) {
    const shp = findShipmentByFreteNr(text, ctx.shipments);
    if (shp?.id) return `/fretes/operacional/${shp.id}`;
  } else if (/lf-\d+/i.test(text)) {
    return '/fretes/operacional';
  }

  for (const { pattern, path } of CLIENT_ROUTES) {
    if (pattern.test(text)) return path;
  }

  if (/proposta|contrato/i.test(text) && /prime\s*cargo/i.test(text)) {
    return '/crm/clientes/cli-prime';
  }

  const plateMatch = text.match(/\b[A-Z]{3}-?\d[A-Z0-9]\d{2}\b/i) || text.match(/\b[A-Z]{3}-\d{4}\b/i);
  if (plateMatch) {
    const rawPlate = plateMatch[0].toUpperCase();
    const isMaintenance = cat.includes('manutencao') || cat.includes('pneus') || /manutenção|pneu|troca|revisão/i.test(text);
    if (isMaintenance) {
      return `/frota/manutencao/${encodeURIComponent(rawPlate)}`;
    }
    return `/frota/veiculos/${encodeURIComponent(rawPlate)}`;
  }

  const byCat = routeByCategory(cat, isReceita);
  if (byCat) return byCat;

  return isReceita ? '/financeiro/receber' : '/financeiro/pagar';
}

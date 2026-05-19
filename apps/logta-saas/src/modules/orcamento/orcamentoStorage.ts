import type {
  OrcamentoPaymentStatus,
  OrcamentoProposal,
  OrcamentoStatus,
  OrcamentoTimelineEvent,
} from './types';
import { createReceitaFromOrcamentoPayment } from './orcamentoFinanceBridge';

const STORAGE_PREFIX = 'logta-orcamentos';

function storageKey(companyId: string) {
  return `${STORAGE_PREFIX}:${companyId}`;
}

export function loadOrcamentos(companyId: string): OrcamentoProposal[] {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    return JSON.parse(raw) as OrcamentoProposal[];
  } catch {
    return [];
  }
}

export function saveOrcamentos(companyId: string, list: OrcamentoProposal[]) {
  localStorage.setItem(storageKey(companyId), JSON.stringify(list));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('logta-orcamento-sync'));
  }
}

export function getOrcamentosAguardandoPagamento(companyId: string) {
  return loadOrcamentos(companyId).filter(
    (o) => o.status === 'aprovado' && (o.paymentStatus ?? 'aguardando_pagamento') === 'aguardando_pagamento',
  );
}

export function isOrcamentoAguardandoPagamento(o: OrcamentoProposal) {
  return o.status === 'aprovado' && (o.paymentStatus ?? 'aguardando_pagamento') !== 'pago';
}

export function findOrcamentoByToken(token: string): OrcamentoProposal | null {
  if (typeof window === 'undefined') return null;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(`${STORAGE_PREFIX}:`)) continue;
    try {
      const list = JSON.parse(localStorage.getItem(key) ?? '[]') as OrcamentoProposal[];
      const hit = list.find((o) => o.publicToken === token);
      if (hit) return hit;
    } catch {
      /* skip */
    }
  }
  return null;
}

export function upsertOrcamento(companyId: string, proposal: OrcamentoProposal) {
  const list = loadOrcamentos(companyId);
  const idx = list.findIndex((o) => o.id === proposal.id);
  if (idx >= 0) list[idx] = proposal;
  else list.unshift(proposal);
  saveOrcamentos(companyId, list);
  return proposal;
}

function event(id: string, type: OrcamentoTimelineEvent['type'], label: string, meta?: string): OrcamentoTimelineEvent {
  return { id, type, label, at: new Date().toISOString(), meta };
}

export function createPublicToken() {
  return `logta-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function historyTypeForStatus(status: OrcamentoStatus): OrcamentoTimelineEvent['type'] {
  if (status === 'aprovado') return 'aprovado';
  if (status === 'rejeitado') return 'rejeitado';
  if (status === 'alteracao_solicitada') return 'alteracao';
  if (status === 'visualizado') return 'visualizado';
  return 'enviado';
}

export function hasUnreadAlteracaoRequest(proposal: OrcamentoProposal) {
  return Boolean(proposal.alteracaoRequestMessage?.trim()) && !proposal.alteracaoRequestRead;
}

export function submitClienteAlteracaoRequest(companyId: string, id: string, message: string) {
  const trimmed = message.trim();
  if (!trimmed) return null;
  const preview = trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
  return updateOrcamentoStatus(companyId, id, 'alteracao_solicitada', {
    alteracaoRequestMessage: trimmed,
    alteracaoRequestedAt: new Date().toISOString(),
    alteracaoRequestRead: false,
    historyLabel: 'Cliente solicitou alteração no orçamento',
    historyMeta: preview,
  });
}

export function markAlteracaoRequestRead(companyId: string, id: string, clearMessage = false) {
  const list = loadOrcamentos(companyId);
  const idx = list.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  const current = list[idx];
  const next: OrcamentoProposal = {
    ...current,
    alteracaoRequestRead: true,
    ...(clearMessage
      ? { alteracaoRequestMessage: undefined, alteracaoRequestedAt: undefined }
      : {}),
    updatedAt: new Date().toISOString(),
  };
  list[idx] = next;
  saveOrcamentos(companyId, list);
  return next;
}

export function updateOrcamentoStatus(
  companyId: string,
  id: string,
  status: OrcamentoStatus,
  extra?: Partial<OrcamentoProposal> & { historyLabel?: string; historyMeta?: string },
): OrcamentoProposal | null {
  const list = loadOrcamentos(companyId);
  const idx = list.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  const current = list[idx];
  const now = new Date().toISOString();
  const next: OrcamentoProposal = {
    ...current,
    ...extra,
    status,
    updatedAt: now,
    ...(status === 'aprovado'
      ? {
          paymentStatus: (extra?.paymentStatus as OrcamentoPaymentStatus | undefined) ?? 'aguardando_pagamento',
          approvedAt: extra?.approvedAt ?? current.approvedAt ?? now,
          approvedByClient: extra?.approvedByClient ?? current.approvedByClient,
        }
      : {}),
    history: [
      ...current.history,
      event(
        `ev-${Date.now()}`,
        historyTypeForStatus(status),
        extra?.historyLabel ?? `Status: ${status}`,
        extra?.historyMeta,
      ),
    ],
  };
  list[idx] = next;
  saveOrcamentos(companyId, list);
  return next;
}

export function approveOrcamentoByTeam(companyId: string, id: string, teamMemberName: string) {
  const next = updateOrcamentoStatus(companyId, id, 'aprovado', {
    approvedByTeam: true,
    teamApprovedByName: teamMemberName,
    teamApprovedAt: new Date().toISOString(),
    paymentStatus: 'aguardando_pagamento',
    alteracaoRequestRead: true,
    historyLabel: 'Aprovado pela equipe (validação manual)',
    historyMeta: 'Cliente confirmou fora do link — aguardando pagamento',
  });
  if (next) void import('./orcamentoCrmBridge').then((m) => m.ensureClientFromOrcamento(companyId, next));
  return next;
}

export function rejectOrcamentoByTeam(companyId: string, id: string, teamMemberName: string) {
  return updateOrcamentoStatus(companyId, id, 'rejeitado', {
    historyLabel: 'Rejeitado pela equipe',
    historyMeta: `Registrado por ${teamMemberName}`,
  });
}

export async function markOrcamentoPaymentReceived(companyId: string, id: string, receivedByName: string) {
  const list = loadOrcamentos(companyId);
  const idx = list.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  const current = list[idx];
  const now = new Date().toISOString();

  const financeTransactionId = await createReceitaFromOrcamentoPayment(companyId, current, receivedByName);

  const next: OrcamentoProposal = {
    ...current,
    paymentStatus: 'pago',
    paymentReceivedAt: now,
    financeTransactionId,
    updatedAt: now,
    history: [
      ...current.history,
      event(
        'ev-pay',
        'aprovado',
        'Pagamento confirmado — lançamento em Contas a receber',
        `R$ ${current.total.toLocaleString('pt-BR')} · ${receivedByName}`,
      ),
    ],
  };
  list[idx] = next;
  saveOrcamentos(companyId, list);
  void import('./orcamentoCrmBridge').then((m) => m.ensureClientFromOrcamento(companyId, next));
  return next;
}

export function buildSandboxOrcamentos(companyId: string): OrcamentoProposal[] {
  const now = new Date();
  const iso = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      id: 'orc-001',
      companyId,
      publicToken: 'logta-demo-alfa-2026',
      number: 'ORC-2026-0142',
      clientName: 'Alfa Logistics',
      clientId: 'cli-alfa',
      clientEmail: 'operacao@alfalogistics.com.br',
      origin: 'São Paulo, SP',
      destination: 'Curitiba, PR',
      services: 'Frete rodoviário lotação + seguro de carga + rastreamento satelital',
      subtotal: 28500,
      taxes: 3420,
      total: 31920,
      validity: iso(15),
      notes: 'Prazo de coleta em até 48h após aceite. Valores sujeitos a reajuste de combustível.',
      status: 'enviado',
      createdBy: 'colab-12345678901',
      createdByName: 'Roberto Silva',
      ownerColabId: 'colab-12345678901',
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      aiScore: 78,
      history: [
        event('e1', 'criado', 'Orçamento criado por Roberto Silva'),
        event('e2', 'enviado', 'Link público enviado ao cliente'),
      ],
    },
    {
      id: 'orc-002',
      companyId,
      publicToken: 'logta-demo-prime-2026',
      number: 'ORC-2026-0148',
      clientName: 'Prime Cargo',
      clientId: 'cli-prime',
      clientEmail: 'fretes@primecargo.com.br',
      origin: 'Campinas, SP',
      destination: 'Rio de Janeiro, RJ',
      services: 'Operação dedicada semanal + gestão de entregas urbanas',
      subtotal: 42000,
      taxes: 5040,
      total: 47040,
      validity: iso(7),
      status: 'visualizado',
      createdBy: 'colab-98765432100',
      createdByName: 'Ana Paula Mendes',
      ownerColabId: 'colab-98765432100',
      createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000).toISOString(),
      viewedAt: new Date(now.getTime() - 3600000).toISOString(),
      aiScore: 62,
      history: [
        event('e1', 'criado', 'Orçamento criado por Ana Paula Mendes'),
        event('e2', 'enviado', 'Enviado por e-mail'),
        event('e3', 'visualizado', 'Cliente abriu o link público'),
      ],
    },
    {
      id: 'orc-003',
      companyId,
      publicToken: 'logta-demo-nex-2026',
      number: 'ORC-2026-0155',
      clientName: 'NexFrete',
      clientId: 'cli-nex',
      origin: 'Rio de Janeiro, RJ',
      destination: 'Belo Horizonte, MG',
      services: 'Frete fracionado + armazenagem 72h',
      subtotal: 18750,
      taxes: 2250,
      total: 21000,
      validity: iso(-2),
      status: 'aprovado',
      createdBy: 'colab-comercial-juliana',
      createdByName: 'Juliana Costa',
      ownerColabId: 'colab-comercial-juliana',
      createdAt: new Date(now.getTime() - 86400000 * 12).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
      approvedAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
      approvedIp: '187.45.201.88',
      approvedDevice: 'Chrome · macOS',
      aiScore: 91,
      history: [
        event('e1', 'criado', 'Orçamento criado por Juliana Costa'),
        event('e2', 'enviado', 'Link compartilhado via WhatsApp'),
        event('e3', 'visualizado', 'Visualizado pelo cliente'),
        event('e4', 'aprovado', 'Aceite digital registrado', 'IP 187.45.201.88'),
      ],
    },
    {
      id: 'orc-004',
      companyId,
      publicToken: 'logta-demo-metal-2026',
      number: 'ORC-2026-0160',
      clientName: 'Indústria Metal Forte',
      clientId: 'lead-003',
      origin: 'São Bernardo, SP',
      destination: 'Porto Alegre, RS',
      services: 'Carga industrial especial — 28 ton',
      subtotal: 89000,
      taxes: 10680,
      total: 99680,
      validity: iso(10),
      status: 'negociacao',
      createdBy: 'colab-98765432100',
      createdByName: 'Ana Paula Mendes',
      ownerColabId: 'colab-98765432100',
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: now.toISOString(),
      aiScore: 54,
      history: [
        event('e1', 'criado', 'Orçamento criado'),
        event('e2', 'alteracao', 'Cliente solicitou revisão de prazo'),
      ],
    },
  ];
}

export function seedOrcamentosSandbox(companyId: string) {
  if (typeof window === 'undefined') return;
  const flag = `logta-orcamentos-seeded:${companyId}`;
  if (localStorage.getItem(flag) === '1') return;
  const existing = loadOrcamentos(companyId);
  if (existing.length < 2) {
    saveOrcamentos(companyId, buildSandboxOrcamentos(companyId));
  }
  localStorage.setItem(flag, '1');
}

export function getOrcamentoKpis(list: OrcamentoProposal[]) {
  const enviados = list.filter((o) => o.status !== 'rascunho').length;
  const aprovados = list.filter((o) => o.status === 'aprovado').length;
  const rejeitados = list.filter((o) => o.status === 'rejeitado').length;
  const negociacao = list.filter((o) => ['negociacao', 'visualizado', 'alteracao_solicitada', 'enviado'].includes(o.status)).length;
  const previsto = list.filter((o) => o.status === 'aprovado').reduce((s, o) => s + o.total, 0);
  const conversao = enviados ? Math.round((aprovados / enviados) * 100) : 0;
  const ticket = list.length ? Math.round(list.reduce((s, o) => s + o.total, 0) / list.length) : 0;
  return { enviados, aprovados, rejeitados, negociacao, previsto, conversao, ticket };
}

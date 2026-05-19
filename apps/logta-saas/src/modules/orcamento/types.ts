export type OrcamentoStatus =
  | 'rascunho'
  | 'enviado'
  | 'visualizado'
  | 'negociacao'
  | 'aprovado'
  | 'rejeitado'
  | 'expirado'
  | 'alteracao_solicitada';

/** Após aprovação do orçamento — controle no financeiro. */
export type OrcamentoPaymentStatus = 'aguardando_pagamento' | 'pago';

export type OrcamentoEventType =
  | 'criado'
  | 'enviado'
  | 'visualizado'
  | 'aprovado'
  | 'rejeitado'
  | 'alteracao'
  | 'expirado'
  | 'follow_up';

export interface OrcamentoTimelineEvent {
  id: string;
  type: OrcamentoEventType;
  label: string;
  at: string;
  meta?: string;
}

export interface OrcamentoProposal {
  id: string;
  companyId: string;
  publicToken: string;
  number: string;
  clientName: string;
  clientId?: string;
  clientEmail?: string;
  clientDocument?: string;
  origin: string;
  destination: string;
  services: string;
  subtotal: number;
  taxes: number;
  total: number;
  validity: string;
  notes?: string;
  attachments?: string[];
  status: OrcamentoStatus;
  createdBy: string;
  createdByName: string;
  ownerColabId?: string;
  createdAt: string;
  updatedAt: string;
  viewedAt?: string;
  approvedAt?: string;
  approvedIp?: string;
  approvedDevice?: string;
  history: OrcamentoTimelineEvent[];
  aiScore?: number;
  /** Mensagem enviada pelo cliente ao solicitar alteração (página pública). */
  alteracaoRequestMessage?: string;
  alteracaoRequestedAt?: string;
  /** false = colaborador ainda não viu/tratou a solicitação (bolinha no dashboard). */
  alteracaoRequestRead?: boolean;
  paymentStatus?: OrcamentoPaymentStatus;
  /** Cliente aprovou pelo link público. */
  approvedByClient?: boolean;
  /** Equipe registrou aprovação manual (ex.: cliente confirmou por WhatsApp). */
  approvedByTeam?: boolean;
  teamApprovedByName?: string;
  teamApprovedAt?: string;
  paymentReceivedAt?: string;
  /** ID do lançamento em transactions (local ou Supabase). */
  financeTransactionId?: string;
}

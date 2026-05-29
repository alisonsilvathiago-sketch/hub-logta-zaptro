/**
 * LogStoka — Hub de integrações (arquitetura alvo)
 * Ver: .cursor/rules/logstoka-integrations-webhooks-hub.mdc
 *
 * Diferencial: interação bidirecional com marketplaces, ERPs, fiscal,
 * pagamentos, automação (WhatsApp, n8n, Zapier) e APIs do cliente.
 */

export const INTEGRATION_CATEGORIES = [
  'marketplace',
  'erp',
  'fiscal',
  'payment',
  'automation',
  'logistics',
  'custom_api',
] as const;

export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

/** Eventos genéricos internos — adaptadores externos mapeiam para estes */
export const INTEGRATION_INBOUND_EVENTS = [
  'order.created',
  'order.paid',
  'order.cancelled',
  'order.shipped',
  'order.delivered',
  'product.created',
  'product.updated',
  'invoice.issued',
  'payment.approved',
  'payment.refused',
  'transfer.created',
  'return.created',
  'stock.in',
  'stock.out',
  'inventory.updated',
] as const;

export const INTEGRATION_OUTBOUND_EVENTS = [
  'product.created',
  'product.updated',
  'stock.changed',
  'order.received',
  'order.shipped',
  'order.delivered',
  'transfer.completed',
  'return.approved',
  'invoice.processed',
  'inventory.completed',
] as const;

export type IntegrationInboundEvent = (typeof INTEGRATION_INBOUND_EVENTS)[number];
export type IntegrationOutboundEvent = (typeof INTEGRATION_OUTBOUND_EVENTS)[number];

/** Escopo configurável por conector — ex.: só entradas de um ERP, só saídas de outro */
export type IntegrationConnectorScope = {
  inboundEvents: IntegrationInboundEvent[];
  outboundEvents: IntegrationOutboundEvent[];
  stockDirection?: 'in' | 'out' | 'both';
};

export type IntegrationJobStatus = 'queued' | 'processing' | 'done' | 'failed' | 'dead_letter';

/** Job na fila — idempotência via idempotencyKey */
export type IntegrationQueueJob = {
  id: string;
  idempotencyKey: string;
  source: string;
  destination?: string;
  event: string;
  payload: unknown;
  status: IntegrationJobStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  processedAt?: string;
};

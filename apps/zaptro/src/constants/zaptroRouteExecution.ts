/**
 * Modelo operacional Zaptro — execução de rota (motorista ≠ atendimento).
 *
 * Camadas:
 * - Cliente: link público só leitura + WhatsApp automático.
 * - Operação: CRM / logística cria rota, define motorista, dispara fluxos.
 * - Motorista: link privado (token) — atualiza status e localização; não é canal comercial.
 */

export type RouteExecutionStatus =
  | 'draft'
  | 'assigned'
  | 'en_route'
  | 'started'
  | 'arrived'
  | 'delivered'
  | 'issue';

/** Ordem para UI e automações. */
export const ROUTE_STATUS_ORDER: RouteExecutionStatus[] = [
  'draft',
  'assigned',
  'en_route',
  'started',
  'arrived',
  'delivered',
  'issue',
];

/** Painel interno / operação. */
export const ROUTE_STATUS_LABEL: Record<RouteExecutionStatus, string> = {
  draft: 'Rascunho',
  assigned: 'Agendada',
  en_route: 'A caminho',
  started: 'Saiu para entrega',
  arrived: 'Chegando na entrega',
  delivered: 'Entrega concluída',
  issue: 'Problema reportado',
};

/** Texto no link público do cliente (mesmo token, sincronizado). */
export const ROUTE_CLIENT_STATUS_LABEL: Record<RouteExecutionStatus, string> = {
  draft: 'A preparar',
  assigned: 'Pedido confirmado',
  en_route: 'Motorista a caminho',
  started: 'Saiu para entrega',
  arrived: 'Chegando ao destino',
  delivered: 'Entrega concluída',
  issue: 'Acompanhamos a sua entrega',
};

/** Eventos para futura fila (WhatsApp / webhooks) — nomes estáveis para backend. */
export const DRIVER_AUTOMATION_EVENTS = {
  EN_ROUTE: 'zaptro.route.en_route',
  ROUTE_STARTED: 'zaptro.route.driver_started',
  DRIVER_ARRIVED: 'zaptro.route.driver_arrived',
  DELIVERED: 'zaptro.route.delivered',
  OPS_INCIDENT: 'zaptro.route.ops_incident',
  ISSUE_REPORTED: 'zaptro.route.issue_reported',
  LOCATION_SHARED: 'zaptro.route.location_shared',
  CONTACT_REQUESTED: 'zaptro.route.contact_requested',
} as const;

/** Botões padrão de transportadora no link do motorista (ordem de execução). */
export const DRIVER_ROUTE_ACTIONS: {
  status: RouteExecutionStatus;
  label: string;
  event: string;
  clientMsg: string;
}[] = [
  {
    status: 'en_route',
    label: 'A caminho',
    event: DRIVER_AUTOMATION_EVENTS.EN_ROUTE,
    clientMsg: 'O motorista está a caminho — o cliente vê no link de rastreio.',
  },
  {
    status: 'started',
    label: 'Saiu para entrega',
    event: DRIVER_AUTOMATION_EVENTS.ROUTE_STARTED,
    clientMsg: 'Saiu para entrega — link do cliente actualizado.',
  },
  {
    status: 'arrived',
    label: 'Chegando na entrega',
    event: DRIVER_AUTOMATION_EVENTS.DRIVER_ARRIVED,
    clientMsg: 'Chegando ao destino — cliente notificado no rastreio.',
  },
  {
    status: 'delivered',
    label: 'Entrega concluída',
    event: DRIVER_AUTOMATION_EVENTS.DELIVERED,
    clientMsg: 'Entrega concluída — rastreio mostra «concluída».',
  },
];

/** Link do motorista; `wa` = telemóvel/WhatsApp cadastrado na frota (identificação automática). */
export function zaptroDriverRoutePath(token: string, driverPhone?: string | null): string {
  const base = `/rota-motorista/${encodeURIComponent(token)}`;
  const digits = (driverPhone || '').replace(/\D/g, '');
  if (!digits) return base;
  return `${base}?wa=${encodeURIComponent(digits)}`;
}

export function zaptroPublicTrackPath(token: string): string {
  return `/rastreamento/${encodeURIComponent(token)}`;
}

export type RouteExecutionSnapshot = {
  token: string;
  companyName: string;
  /**
   * Nome curto da transportadora (sem prefixo «Zaptro ·»).
   * No link público **sem** plano premium de marca, o cabeçalho mostra só isto.
   */
  carrierShortName?: string;
  /**
   * OURO / MASTER (ou equivalente): cabeçalho público com **logo** da empresa em vez do texto combinado.
   * Em produção vem da empresa da rota; em demo pode simular-se.
   */
  publicTrackPremiumBranding?: boolean;
  /** URL HTTPS do logo para o cabeçalho premium (quando `publicTrackPremiumBranding`). */
  publicHeaderLogoUrl?: string | null;
  /** Nome amigável da entrega / referência interna */
  deliveryLabel: string;
  customerName: string;
  deliveryAddress: string;
  driverDisplayName: string;
  status: RouteExecutionStatus;
  /** ISO — última atualização conhecida */
  updatedAt: string;
};

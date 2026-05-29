/**
 * Diagnóstico temporário do fluxo Zaptro ↔ Evolution.
 * Logs no console: [WA-FLOW] STEP_NAME
 * Painel: WhatsappFlowDebugPanel (DEV ou VITE_WA_FLOW_DEBUG=true)
 */

export const WA_FLOW_STEPS = [
  'QR_RENDERED',
  'QR_SCANNED',
  'QR_CONNECTED',
  'EVOLUTION_CONNECTED',
  'WEBHOOK_RECEIVED',
  'MESSAGE_EVENT_RECEIVED',
  'CONNECTION_STATE_UPDATED',
  'SESSION_PERSISTED',
  'MESSAGE_SAVED',
  'CHAT_CREATED',
  'ROUTE_CHANGED',
  'MESSAGE_LISTENER_STARTED',
  'MESSAGE_RECEIVED',
  'UI_UPDATED',
] as const;

export type WaFlowStep = (typeof WA_FLOW_STEPS)[number];

export type WaFlowEvent = {
  step: WaFlowStep;
  at: string;
  meta?: Record<string, unknown>;
};

export type WaFlowSnapshot = {
  status: string;
  lastEvent: WaFlowStep | null;
  lastEventAt: string | null;
  lastError: string | null;
  instance: string | null;
  companyId: string | null;
  connection: {
    connected: boolean;
    phone: string | null;
    state: string;
    raw?: unknown;
  };
  webhook: {
    url: string | null;
    lastReceivedAt: string | null;
    processedHint: number;
  };
  events: WaFlowEvent[];
};

const MAX_EVENTS = 40;

const initialSnapshot = (): WaFlowSnapshot => ({
  status: 'desconectado',
  lastEvent: null,
  lastEventAt: null,
  lastError: null,
  instance: null,
  companyId: null,
  connection: { connected: false, phone: null, state: 'unknown' },
  webhook: { url: null, lastReceivedAt: null, processedHint: 0 },
  events: [],
});

let snapshot: WaFlowSnapshot = initialSnapshot();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function isWaFlowDebugEnabled(): boolean {
  if (import.meta.env.VITE_WA_FLOW_DEBUG === 'true') return true;
  if (import.meta.env.VITE_WA_FLOW_DEBUG === 'false') return false;
  return import.meta.env.DEV;
}

export function getWaFlowSnapshot(): WaFlowSnapshot {
  return snapshot;
}

export function subscribeWaFlow(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetWaFlowDiagnostic(): void {
  snapshot = initialSnapshot();
  notify();
}

export function updateWaFlowSnapshot(partial: Partial<WaFlowSnapshot>): void {
  snapshot = { ...snapshot, ...partial };
  if (partial.connection) {
    snapshot.connection = { ...snapshot.connection, ...partial.connection };
  }
  if (partial.webhook) {
    snapshot.webhook = { ...snapshot.webhook, ...partial.webhook };
  }
  notify();
}

export function logWaFlowError(message: string, meta?: Record<string, unknown>): void {
  snapshot.lastError = message;
  console.error('[WA-FLOW] ERROR', message, meta ?? '');
  notify();
}

export function markWaWebhookReceived(meta?: Record<string, unknown>): void {
  snapshot.webhook = {
    ...snapshot.webhook,
    lastReceivedAt: new Date().toISOString(),
    processedHint: snapshot.webhook.processedHint + 1,
  };
  logWaFlow('WEBHOOK_RECEIVED', meta);
}

export function logWaFlow(step: WaFlowStep, meta?: Record<string, unknown>): void {
  const at = new Date().toISOString();
  const event: WaFlowEvent = { step, at, meta };
  snapshot.lastEvent = step;
  snapshot.lastEventAt = at;
  snapshot.events = [event, ...snapshot.events].slice(0, MAX_EVENTS);
  console.log(`[WA-FLOW] ${step}`, meta ?? '');
  notify();
}

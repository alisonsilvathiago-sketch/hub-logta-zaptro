import type { LogtaHubEntitlementsV1 } from '@shared/lib/logtaEntitlementsContract';
import { getLogtaAppOrigin } from './logtaAppOrigin';

/**
 * Abre o popup LOGTA /hub-bridge e envia o payload de entitlements via postMessage.
 * O Hub Master comanda plano, trial, IA, LogDrive e flags.
 */
export function publishLogtaEntitlementsToClient(entitlements: LogtaHubEntitlementsV1): Window | null {
  const logtaOrigin = getLogtaAppOrigin();
  const url = `${logtaOrigin}/hub-bridge`;
  const child = window.open(url, 'logtaHubBridge', 'width=520,height=400,scrollbars=no');

  const onMessage = (ev: MessageEvent) => {
    if (ev.origin !== logtaOrigin) return;
    if (ev.data?.type === 'LOGTA_BRIDGE_READY') {
      child?.postMessage({ type: 'LOGTA_ENTITLEMENTS_SET', payload: entitlements }, logtaOrigin);
    }
    if (ev.data?.type === 'LOGTA_ENTITLEMENTS_ACK') {
      window.removeEventListener('message', onMessage);
    }
  };

  window.addEventListener('message', onMessage);
  window.setTimeout(() => window.removeEventListener('message', onMessage), 120_000);
  return child;
}

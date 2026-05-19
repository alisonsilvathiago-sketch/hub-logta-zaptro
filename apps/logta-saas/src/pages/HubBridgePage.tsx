import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { LogtaHubEntitlementsV1 } from '@shared/lib/logtaEntitlementsContract';
import { saveLogtaEntitlementsToStorage } from '../lib/logtaEntitlementsClient';
import { getHubOrigin } from '@/lib/hub';

function isAllowedHubOrigin(origin: string): boolean {
  const norm = origin.replace(/\/$/, '');
  const hub = getHubOrigin().replace(/\/$/, '');
  return norm === hub;
}

/**
 * Página mínima aberta pelo Hub em popup para publicar políticas (postMessage).
 * Rota: /hub-bridge
 */
const HubBridgePage: React.FC = () => {
  useEffect(() => {
    const logtaOrigin = window.location.origin;

    const onMessage = (ev: MessageEvent) => {
      if (!isAllowedHubOrigin(ev.origin)) return;
      if (ev.data?.type !== 'LOGTA_ENTITLEMENTS_SET') return;
      const payload = ev.data.payload as LogtaHubEntitlementsV1;
      if (!payload || payload.version !== 1) return;
      saveLogtaEntitlementsToStorage(payload);
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'LOGTA_ENTITLEMENTS_ACK', ok: true }, ev.origin);
      }
      window.location.replace('/inicio');
    };

    window.addEventListener('message', onMessage);
    if (window.opener) {
      window.opener.postMessage({ type: 'LOGTA_BRIDGE_READY' }, '*');
    }

    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-slate-950 px-6 font-sans text-white">
      <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
      <p className="text-center text-sm font-semibold text-slate-400">
        Sincronizando políticas do Hub Master…
      </p>
    </div>
  );
};

export default HubBridgePage;

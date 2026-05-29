import { useCallback, useEffect, useState } from 'react';
import { getEvolutionConnectionState } from '../../services/evolution';
import {
  markWaLinkSessionConnected,
  readWaLinkSession,
  waLinkSharedInstance,
} from './waLinkConfig';

export type WaLinkLiveStatus = 'checking' | 'open' | 'connecting' | 'close' | 'error';

/** Estado real da ligação WhatsApp (Evolution GO). Não apaga sessionStorage no poll. */
export function useWaLinkConnectionStatus(pollMs = 5000) {
  const instanceName = readWaLinkSession().instance || waLinkSharedInstance();
  const [status, setStatus] = useState<WaLinkLiveStatus>('checking');
  const [evoState, setEvoState] = useState('—');

  const refresh = useCallback(async () => {
    try {
      const state = await getEvolutionConnectionState(instanceName);
      setEvoState(state);

      if (state === 'open') {
        setStatus('open');
        const session = readWaLinkSession();
        markWaLinkSessionConnected(instanceName, session.phone, session.companyId);
        return true;
      }
      if (state === 'connecting') {
        setStatus('connecting');
        return false;
      }
      setStatus('close');
      return false;
    } catch {
      setEvoState('erro');
      setStatus('error');
      return false;
    }
  }, [instanceName]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), pollMs);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh, pollMs]);

  const connected = status === 'open';
  const pairing = status === 'connecting';

  return { connected, pairing, status, evoState, instanceName, checking: status === 'checking', refresh };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { getEvolutionConnectionState } from '../services/evolution';
import { resolveCompanyWhatsappInstance } from './whatsappInbox';

/** Estado real da ligação WhatsApp da empresa (instância Evolution correta). */
export function useCompanyWhatsappConnected(companyId: string | null | undefined, userId?: string | null) {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const wasConnectedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setConnected(false);
      setInstanceName(null);
      setChecking(false);
      return false;
    }
    setChecking(true);
    try {
      const instance = await resolveCompanyWhatsappInstance(companyId, userId);
      setInstanceName(instance);
      const state = await getEvolutionConnectionState(instance);
      const isOpen = state === 'open';
      setConnected(isOpen);
      if (isOpen && !wasConnectedRef.current && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zaptro:wa-connected', { detail: { companyId, instance } }));
      }
      wasConnectedRef.current = isOpen;
      return isOpen;
    } catch {
      setConnected(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, [companyId, userId]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 8000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  return { connected, checking, instanceName, refresh };
}

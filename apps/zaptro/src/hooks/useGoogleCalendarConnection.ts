import { useCallback, useEffect, useState } from 'react';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import {
  disconnectGoogleCalendar,
  fetchGoogleConnectUrl,
  fetchGoogleOAuthStatus,
  type GoogleOAuthStatus,
  zaptroGoogleApiConfigured,
} from '../lib/zaptroGoogleApi';

export function useGoogleCalendarConnection() {
  const [status, setStatus] = useState<GoogleOAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const apiReady = zaptroGoogleApiConfigured();

  const refresh = useCallback(async () => {
    if (!apiReady) {
      setStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabaseZaptro.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setStatus(null);
        return;
      }
      const s = await fetchGoogleOAuthStatus(token);
      setStatus(s);
    } catch {
      setStatus({
        connected: false,
        googleEmail: null,
        oauthConfigured: false,
        mapsConfigured: false,
        sheetsConfigured: false,
      });
    } finally {
      setLoading(false);
    }
  }, [apiReady]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!apiReady) return;
    setBusy(true);
    try {
      const { data } = await supabaseZaptro.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('not_authenticated');
      const url = await fetchGoogleConnectUrl(token, '/app/agenda');
      window.location.href = url;
    } finally {
      setBusy(false);
    }
  }, [apiReady]);

  const disconnect = useCallback(async () => {
    if (!apiReady) return;
    setBusy(true);
    try {
      const { data } = await supabaseZaptro.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      await disconnectGoogleCalendar(token);
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [apiReady, refresh]);

  return {
    apiReady,
    status,
    loading,
    busy,
    connected: Boolean(status?.connected),
    googleEmail: status?.googleEmail ?? null,
    oauthConfigured: Boolean(status?.oauthConfigured),
    connect,
    disconnect,
    refresh,
  };
}

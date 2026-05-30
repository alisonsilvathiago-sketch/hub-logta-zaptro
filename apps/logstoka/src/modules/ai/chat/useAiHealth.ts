import { useCallback, useEffect, useState } from 'react';
import { logstokaApi } from '@/lib/logstokaApi';

const POLL_MS = 20_000;

export function useAiHealth(active = true) {
  const [online, setOnline] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    void logstokaApi
      .aiHealth()
      .then((r) => setOnline(r.ollama?.online ?? false))
      .catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [active, refresh]);

  return { online, refresh };
}

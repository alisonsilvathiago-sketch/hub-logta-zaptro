import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  getSessionWithTimeout,
  hasLogtaMockSession,
  resolveHasSession,
} from '../lib/authSession';
import { shouldUseLogtaSandbox } from '../lib/seed';
import { AuthPageFallback } from './AuthPageFallback';

type Props = { children: React.ReactNode };

export function AuthenticatedGate({ children }: Props) {
  const location = useLocation();
  const mockSession = hasLogtaMockSession();
  const [status, setStatus] = useState<'checking' | 'authed' | 'guest'>(mockSession ? 'authed' : 'checking');

  useEffect(() => {
    let alive = true;

    if (mockSession) {
      setStatus('authed');
      return;
    }

    void (async () => {
      const { data, mock, timedOut } = await getSessionWithTimeout(1500);
      if (!alive) return;
      const authed = resolveHasSession(data.session?.user, {
        mock: mock || mockSession,
        allowDevFallback: timedOut || shouldUseLogtaSandbox(),
      });
      setStatus(authed ? 'authed' : 'guest');
    })();

    return () => {
      alive = false;
    };
  }, [mockSession]);

  if (status === 'checking') {
    return <AuthPageFallback message="Verificando sessão…" />;
  }

  if (status === 'guest') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <>{children}</>;
}

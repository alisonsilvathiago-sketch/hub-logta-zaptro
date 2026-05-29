import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSessionWithTimeout, hasLogtaMockSession, resolveHasSession } from '../lib/authSession';
import { useLogtaProfile } from '../contexts/LogtaProfileContext';
import { canAccessLogtaPath } from '../lib/logtaPermissions';
import { shouldUseLogtaSandbox } from '../lib/seed';

const PUBLIC_PATHS = new Set(['/', '/login', '/registrar', '/auth/callback']);

type Props = { children: React.ReactNode };

export const LogtaAuthGate: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const { profile, loading: profileLoading } = useLogtaProfile();
  const mockSession = hasLogtaMockSession();
  const [sessionReady, setSessionReady] = useState(mockSession);
  const [hasSession, setHasSession] = useState(mockSession);

  useEffect(() => {
    if (mockSession) return;

    let mounted = true;

    void (async () => {
      const { data, mock, timedOut } = await getSessionWithTimeout(1500);
      if (!mounted) return;
      setHasSession(
        resolveHasSession(data.session?.user, {
          mock: mock || mockSession,
          allowDevFallback: timedOut || shouldUseLogtaSandbox(),
        }),
      );
      setSessionReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setHasSession(
        resolveHasSession(session?.user, { mock: mockSession, allowDevFallback: shouldUseLogtaSandbox() }),
      );
      setSessionReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [mockSession]);

  const waitProfile =
    profileLoading && !mockSession && !shouldUseLogtaSandbox() && !profile?.company_id;

  if (!sessionReady || waitProfile) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: 'var(--hub-bg, #fafafa)',
          color: 'var(--hub-text-muted, #6b7280)',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '2px solid #e5e7eb',
            borderTopColor: '#2563EB',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span>Carregando…</span>
        <a href="/login" style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>
          Voltar ao login
        </a>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!hasSession) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!profile?.company_id && !(hasSession && shouldUseLogtaSandbox())) {
    return <Navigate to="/login" replace state={{ reason: 'no_tenant' }} />;
  }

  if (!canAccessLogtaPath(location.pathname, profile)) {
    return <Navigate to="/inicio" replace state={{ reason: 'forbidden' }} />;
  }

  return <>{children}</>;
};

export function isLogtaPublicPath(pathname: string): boolean {
  const path = pathname === '' ? '/' : pathname;
  return (
    PUBLIC_PATHS.has(path) ||
    path.startsWith('/ponto/') ||
    path.startsWith('/orcamento/publico/') ||
    path.startsWith('/motorista/rota/') ||
    path.startsWith('/calc/')
  );
}

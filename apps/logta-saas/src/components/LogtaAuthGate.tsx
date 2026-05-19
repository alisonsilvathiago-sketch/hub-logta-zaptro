import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLogtaProfile } from '../contexts/LogtaProfileContext';
import { canAccessLogtaPath } from '../lib/logtaPermissions';
import { LOGTA_SESSION_BOOT_FLAG } from './SessionBootLoader';
import { shouldUseLogtaSandbox } from '../lib/seed';

const PUBLIC_PATHS = new Set(['/', '/login']);

type Props = { children: React.ReactNode };

export const LogtaAuthGate: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const { profile, loading: profileLoading } = useLogtaProfile();
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkSession = () => {
      const hasMock =
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem(LOGTA_SESSION_BOOT_FLAG) === '1';
      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return;
        setHasSession(Boolean(data.session?.user) || hasMock);
        setSessionReady(true);
      });
    };

    checkSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const hasMock =
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem(LOGTA_SESSION_BOOT_FLAG) === '1';
      setHasSession(Boolean(session?.user) || hasMock);
      setSessionReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!sessionReady || profileLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--hub-bg, #fafafa)',
          color: 'var(--hub-text-muted, #6b7280)',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        Carregando…
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
  return (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith('/ponto/') ||
    pathname.startsWith('/orcamento/publico/') ||
    pathname.startsWith('/motorista/rota/') ||
    pathname.startsWith('/calc/')
  );
}

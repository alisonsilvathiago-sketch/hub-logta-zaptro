import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileHasZaptroWhatsappEntitlement } from '../utils/authProductGate';

const PageFallback = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      color: '#D9FF00',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 700,
    }}
  >
    A verificar sessão…
  </div>
);

/** Protege `/app/*` — exige login e perfil com acesso WhatsApp. Não altera Evolution. */
const ZaptroAppGuard: React.FC = () => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageFallback />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ reason: 'auth_required', from: location.pathname }}
      />
    );
  }

  if (profile && !profileHasZaptroWhatsappEntitlement(profile)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ reason: 'whatsapp_not_entitled', from: location.pathname }}
      />
    );
  }

  return <Outlet />;
};

export default ZaptroAppGuard;

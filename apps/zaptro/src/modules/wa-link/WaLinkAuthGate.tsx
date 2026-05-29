import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { WA_LINK_ROUTES } from './waLinkConfig';

type Props = { children: React.ReactNode };

export function WaLinkAuthGate({ children }: Props) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="wa-link-boot">
        <span className="wa-link-boot-dot" />
        A validar sessão…
      </div>
    );
  }

  if (!user) {
    return <Navigate to={WA_LINK_ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';
import HubGuard from './HubGuard';
import { useTenant } from '../context/TenantContext';
import { canAccessPath, getLogtaHomePath } from '../utils/logtaRbac';
import { profileHasLogtaErpAccess } from '../utils/authProductGate';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, isLoading } = useAuth();
  const { company } = useTenant();
  const location = useLocation();

  if (isLoading) {
    return <Loading message="Autenticando..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!profile?.role) {
    return <Loading message="A carregar o seu perfil…" />;
  }
  if (!profileHasLogtaErpAccess(profile)) {
    return <Navigate to="/login" replace state={{ from: location.pathname, reason: 'no_logta_entitlement' }} />;
  }

  if (!canAccessPath(profile.role, location.pathname)) {
    return <Navigate to={getLogtaHomePath(profile.role)} replace />;
  }

  return (
    <HubGuard companyId={company?.id || ''}>
      {children}
    </HubGuard>
  );
};

export default ProtectedRoute;

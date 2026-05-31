import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/LogstokaAuthProvider';
import AccessDeniedPanel from '@/components/security/AccessDeniedPanel';
import { canAccessRoute, roleLabel, resolveRole } from '@/lib/permissions';
import { profileHasLogstokaEntitlement } from '@/lib/authProductGate';

const LogstokaGuard: React.FC = () => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f4]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">Carregando LogStoka…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (profile && !profileHasLogstokaEntitlement(profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h2 className="text-xl font-black">Acesso não autorizado</h2>
          <p className="mt-2 text-sm text-slate-300">
            Sua empresa ainda não possui o módulo LogStoka ativo. Solicite ativação pela HUB.
          </p>
        </div>
      </div>
    );
  }

  if (profile && !canAccessRoute(location.pathname, profile)) {
    const role = resolveRole(profile.role, profile.is_account_owner);
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f4] p-6">
        <AccessDeniedPanel
          title="Área restrita"
          message={`Seu perfil (${roleLabel(role)}) não tem permissão para acessar esta seção. Nenhum dado sensível foi carregado.`}
        />
      </div>
    );
  }

  return <Outlet />;
};

export default LogstokaGuard;

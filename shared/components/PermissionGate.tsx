import React from 'react';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPORTE' | 'FINANCEIRO' | 'OPERADOR';

interface PermissionGateProps {
  role: UserRole | undefined;
  allowed: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ role, allowed, children, fallback = null }) => {
  if (!role || !allowed.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook helper
export const usePermissions = (currentRole: UserRole | undefined) => {
  return {
    can: (allowedRoles: UserRole[]) => currentRole && allowedRoles.includes(currentRole),
    isSuperAdmin: currentRole === 'SUPER_ADMIN',
    isAdmin: currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN',
    isSupport: currentRole === 'SUPORTE' || currentRole === 'SUPER_ADMIN',
    isFinance: currentRole === 'FINANCEIRO' || currentRole === 'SUPER_ADMIN',
  };
};

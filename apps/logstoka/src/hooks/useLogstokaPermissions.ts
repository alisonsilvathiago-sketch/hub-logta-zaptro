import { useMemo } from 'react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import {
  can,
  canAccessRoute,
  canCreateShareLink,
  canViewFinancials,
  canViewStockQuantities,
  resolveRole,
  type PermissionCode,
} from '@/lib/permissions';

export function useLogstokaPermissions() {
  const { profile } = useAuth();
  const role = profile?.role;

  return useMemo(
    () => ({
      role: resolveRole(role),
      can: (permission: PermissionCode) => can(permission, role),
      canAccessRoute: (path: string) => canAccessRoute(path, role),
      canViewFinancials: () => canViewFinancials(role),
      canViewStockQuantities: () => canViewStockQuantities(role),
      canCreateShareLink: () => canCreateShareLink(role),
    }),
    [role],
  );
}

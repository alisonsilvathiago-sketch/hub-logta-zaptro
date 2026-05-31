import { useMemo } from 'react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import {
  canAccessRoute,
  canWithProfile,
  canCreateShareLink,
  canManageBilling,
  canViewBilling,
  canViewFinancials,
  canViewStockQuantities,
  isAccountOwner,
  resolveRole,
  type PermissionCode,
} from '@/lib/permissions';
import { canViewMarketplaceNav } from '@/lib/marketplaceModule';
import { loadOperationalProfile } from '@/lib/operationalProfile';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';

export function useLogstokaPermissions() {
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const role = profile?.role;

  return useMemo(
    () => ({
      role: resolveRole(role, isAccountOwner(profile)),
      can: (permission: PermissionCode) => canWithProfile(permission, profile),
      canAccessRoute: (path: string) => canAccessRoute(path, profile),
      canViewFinancials: () => canViewFinancials(role),
      canViewStockQuantities: () => canViewStockQuantities(role),
      canCreateShareLink: () => canCreateShareLink(role),
      canManageBilling: () => canManageBilling(profile),
      canViewBilling: () => canViewBilling(profile),
      isAccountOwner: () => isAccountOwner(profile),
      canViewMarketplace: () =>
        canViewMarketplaceNav(role, companyId, loadOperationalProfile(companyId)),
    }),
    [role, profile, companyId],
  );
}

import type { LogstokaRoleCode } from '@/types';

export type PermissionCode =
  | 'products.read'
  | 'products.write'
  | 'warehouses.read'
  | 'warehouses.write'
  | 'movements.read'
  | 'movements.write'
  | 'movements.approve'
  | 'inventory.read'
  | 'inventory.write'
  | 'inventory.approve'
  | 'reports.read'
  | 'integrations.read'
  | 'integrations.write'
  | 'settings.read'
  | 'settings.write';

const ROLE_PERMISSIONS: Record<LogstokaRoleCode, PermissionCode[]> = {
  master_admin: [
    'products.read', 'products.write',
    'warehouses.read', 'warehouses.write',
    'movements.read', 'movements.write', 'movements.approve',
    'inventory.read', 'inventory.write', 'inventory.approve',
    'reports.read', 'integrations.read', 'integrations.write',
    'settings.read', 'settings.write',
  ],
  logistics_manager: [
    'products.read', 'warehouses.read', 'warehouses.write',
    'movements.read', 'movements.approve',
    'inventory.read', 'inventory.approve',
    'reports.read', 'integrations.read',
  ],
  operator: [
    'products.read', 'warehouses.read',
    'movements.read', 'movements.write',
    'inventory.read', 'inventory.write',
  ],
};

export function resolveRole(profileRole?: string | null): LogstokaRoleCode {
  if (profileRole === 'MASTER' || profileRole === 'MASTER_ADMIN') return 'master_admin';
  if (profileRole === 'LOGISTICS_MANAGER') return 'logistics_manager';
  return 'operator';
}

export function can(permission: PermissionCode, profileRole?: string | null): boolean {
  const role = resolveRole(profileRole);
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessRoute(path: string, profileRole?: string | null): boolean {
  if (path.startsWith('/app/settings') || path.startsWith('/app/integrations')) {
    return can('settings.read', profileRole) || can('integrations.read', profileRole);
  }
  if (path.startsWith('/app/reports')) return can('reports.read', profileRole);
  if (path.startsWith('/app/inventory')) return can('inventory.read', profileRole);
  if (path.startsWith('/app/movements')) return can('movements.read', profileRole);
  if (path.startsWith('/app/warehouses')) return can('warehouses.read', profileRole);
  if (path.startsWith('/app/products')) return can('products.read', profileRole);
  return true;
}

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
  | 'picking.read'
  | 'picking.write'
  | 'sales.read'
  | 'reports.read'
  | 'financial.read'
  | 'stock.quantities.read'
  | 'integrations.read'
  | 'integrations.write'
  | 'settings.read'
  | 'settings.write'
  | 'sharing.create'
  | 'team.read';

const ROLE_PERMISSIONS: Record<LogstokaRoleCode, PermissionCode[]> = {
  master_admin: [
    'products.read',
    'products.write',
    'warehouses.read',
    'warehouses.write',
    'movements.read',
    'movements.write',
    'movements.approve',
    'inventory.read',
    'inventory.write',
    'inventory.approve',
    'picking.read',
    'picking.write',
    'sales.read',
    'reports.read',
    'financial.read',
    'stock.quantities.read',
    'integrations.read',
    'integrations.write',
    'settings.read',
    'settings.write',
    'sharing.create',
    'team.read',
  ],
  logistics_manager: [
    'products.read',
    'warehouses.read',
    'warehouses.write',
    'movements.read',
    'movements.approve',
    'inventory.read',
    'inventory.approve',
    'picking.read',
    'picking.write',
    'sales.read',
    'reports.read',
    'financial.read',
    'stock.quantities.read',
    'integrations.read',
    'settings.read',
    'sharing.create',
    'team.read',
  ],
  operator: [
    'products.read',
    'warehouses.read',
    'movements.read',
    'movements.write',
    'inventory.read',
    'inventory.write',
    'picking.read',
    'picking.write',
    'stock.quantities.read',
  ],
};

/** Prefixos de rota autenticada → permissão mínima (ordem: mais específico primeiro). */
const ROUTE_RULES: Array<{ prefix: string; permission: PermissionCode }> = [
  { prefix: '/app/configuracoes', permission: 'settings.read' },
  { prefix: '/app/integrations', permission: 'integrations.read' },
  { prefix: '/app/vendas', permission: 'sales.read' },
  { prefix: '/app/reports', permission: 'reports.read' },
  { prefix: '/app/dashboard', permission: 'reports.read' },
  { prefix: '/app/inventory', permission: 'inventory.read' },
  { prefix: '/app/movements', permission: 'movements.read' },
  { prefix: '/app/transfers', permission: 'movements.read' },
  { prefix: '/app/returns', permission: 'movements.read' },
  { prefix: '/app/imports', permission: 'movements.write' },
  { prefix: '/app/picking', permission: 'picking.read' },
  { prefix: '/app/conference', permission: 'picking.read' },
  { prefix: '/app/operacao', permission: 'picking.read' },
  { prefix: '/app/warehouses', permission: 'warehouses.read' },
  { prefix: '/app/products', permission: 'products.read' },
  { prefix: '/app/atividades', permission: 'settings.read' },
  { prefix: '/app/marketplace', permission: 'integrations.read' },
];

export function resolveRole(profileRole?: string | null): LogstokaRoleCode {
  if (profileRole === 'MASTER' || profileRole === 'MASTER_ADMIN' || profileRole === 'admin') {
    return 'master_admin';
  }
  if (profileRole === 'LOGISTICS_MANAGER') return 'logistics_manager';
  return 'operator';
}

export function can(permission: PermissionCode, profileRole?: string | null): boolean {
  const role = resolveRole(profileRole);
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canViewFinancials(profileRole?: string | null): boolean {
  return can('financial.read', profileRole);
}

export function canViewStockQuantities(profileRole?: string | null): boolean {
  return can('stock.quantities.read', profileRole);
}

export function canCreateShareLink(profileRole?: string | null): boolean {
  return can('sharing.create', profileRole);
}

export function canAccessRoute(path: string, profileRole?: string | null): boolean {
  const normalized = path.split('?')[0] ?? path;
  if (normalized === '/app' || normalized === '/app/') return true;

  for (const rule of ROUTE_RULES) {
    if (normalized.startsWith(rule.prefix)) {
      return can(rule.permission, profileRole);
    }
  }

  if (normalized.startsWith('/app/mercadolivre') || normalized.startsWith('/app/shopee')) {
    return can('integrations.read', profileRole);
  }

  return true;
}

export function roleLabel(role: LogstokaRoleCode): string {
  switch (role) {
    case 'master_admin':
      return 'Administrador';
    case 'logistics_manager':
      return 'Gestor logístico';
    default:
      return 'Operador';
  }
}

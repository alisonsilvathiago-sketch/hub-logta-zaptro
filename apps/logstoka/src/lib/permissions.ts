import type { LogstokaRoleCode, Profile } from '@/types';

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
  | 'team.read'
  | 'billing.read'
  | 'billing.write'
  | 'account.manage';

/** Permissões operacionais — Admin Sênior e Administrador regional. */
const ADMIN_OPERATIONAL: PermissionCode[] = [
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
];

/** Só o titular da conta (Admin Sênior — quem comprou). */
const ACCOUNT_OWNER_ONLY: PermissionCode[] = ['billing.read', 'billing.write', 'account.manage'];

const ROLE_PERMISSIONS: Record<LogstokaRoleCode, PermissionCode[]> = {
  master_admin: [...ADMIN_OPERATIONAL, ...ACCOUNT_OWNER_ONLY],
  regional_admin: [...ADMIN_OPERATIONAL],
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

const ROUTE_RULES: Array<{ prefix: string; permission: PermissionCode }> = [
  { prefix: '/app/configuracoes/conta', permission: 'settings.read' },
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

export function resolveRole(profileRole?: string | null, isOwner?: boolean): LogstokaRoleCode {
  if (profileRole === 'MASTER' || profileRole === 'MASTER_ADMIN') return 'master_admin';
  if (profileRole === 'REGIONAL_ADMIN' || profileRole === 'regional_admin') return 'regional_admin';
  if (profileRole === 'admin') return isOwner ? 'master_admin' : 'regional_admin';
  if (profileRole === 'master_admin') return isOwner === false ? 'regional_admin' : 'master_admin';
  if (profileRole === 'LOGISTICS_MANAGER' || profileRole === 'logistics_manager') return 'logistics_manager';
  return 'operator';
}

export function isAccountOwner(profile?: Profile | null): boolean {
  if (!profile) return false;
  if (profile.is_account_owner === true) return true;
  if (profile.is_account_owner === false) return false;
  return profile.role === 'master_admin' || profile.role === 'admin';
}

export function can(permission: PermissionCode, profileRole?: string | null, isOwner?: boolean): boolean {
  const role = resolveRole(profileRole, isOwner);
  if (ACCOUNT_OWNER_ONLY.includes(permission)) {
    return role === 'master_admin' && isOwner !== false;
  }
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canWithProfile(permission: PermissionCode, profile?: Profile | null): boolean {
  return can(permission, profile?.role, isAccountOwner(profile));
}

export function canManageBilling(profile?: Profile | null): boolean {
  return canWithProfile('billing.write', profile);
}

export function canViewBilling(profile?: Profile | null): boolean {
  return canWithProfile('billing.read', profile);
}

/** Somente o Admin Sênior (titular que comprou) vê todos os CDs. Demais perfis ficam no CD autorizado. */
export function hasGlobalWarehouseView(profile?: Profile | null): boolean {
  return isAccountOwner(profile);
}

export function canRegisterWarehouses(profile?: Profile | null): boolean {
  return isAccountOwner(profile);
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

export function canAccessRoute(path: string, profile?: Profile | null): boolean {
  const normalized = path.split('?')[0] ?? path;
  if (normalized === '/app' || normalized === '/app/') return true;

  for (const rule of ROUTE_RULES) {
    if (normalized.startsWith(rule.prefix)) {
      return canWithProfile(rule.permission, profile);
    }
  }

  if (normalized.startsWith('/app/mercadolivre') || normalized.startsWith('/app/shopee')) {
    return canWithProfile('integrations.read', profile);
  }

  return true;
}

export function roleLabel(role: LogstokaRoleCode): string {
  switch (role) {
    case 'master_admin':
      return 'Admin Sênior';
    case 'regional_admin':
      return 'Administrador';
    case 'logistics_manager':
      return 'Gestor logístico';
    default:
      return 'Operador';
  }
}

export function displayRoleLabel(profile?: Profile | null): string {
  if (!profile) return 'Usuário';
  const role = resolveRole(profile.role, isAccountOwner(profile));
  if (role === 'master_admin' && isAccountOwner(profile)) {
    return 'Admin Sênior · Titular da conta';
  }
  return roleLabel(role);
}

export function roleDescription(profile?: Profile | null): string {
  const role = resolveRole(profile?.role, isAccountOwner(profile));
  if (role === 'master_admin' && isAccountOwner(profile)) {
    return 'Quem comprou a plataforma. Visão global de todos os CDs, equipe e cobrança.';
  }
  if (role === 'regional_admin') {
    return 'Administra operação e CDs com as mesmas funções do titular, exceto pagamento e plano.';
  }
  if (role === 'logistics_manager') {
    return 'Supervisiona inventários, movimentações e transferências.';
  }
  return 'Executa entradas, saídas e conferências no CD autorizado.';
}

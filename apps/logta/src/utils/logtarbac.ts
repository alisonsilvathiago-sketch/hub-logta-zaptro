import type { UserRole } from '../types';

/** Normaliza o papel vindo do banco (sempre pela coluna `profiles.role`, nunca pelo e-mail). */
export function normalizeUserRole(role: string | undefined | null): UserRole | '' {
  if (!role || typeof role !== 'string') return '';
  const u = role.trim().toUpperCase() as UserRole;
  return u;
}

export function isMasterRole(role: string | undefined | null): boolean {
  const r = normalizeUserRole(role);
  return r.startsWith('MASTER');
}

/** ADMIN, GERENTE ou qualquer MASTER_* — visão global da empresa / plataforma. */
export function hasGlobalCompanyAccess(role: string | undefined | null): boolean {
  const r = normalizeUserRole(role);
  if (!r) return false;
  if (r === 'ADMIN' || r === 'GERENTE') return true;
  return isMasterRole(r);
}

/**
 * Destino após login (baseado apenas em `profiles.role`).
 */
export function getLogtaHomePath(role: string | undefined | null): string {
  const r = normalizeUserRole(role);
  switch (r) {
    case 'LOGISTICA':
      return '/logistica';
    case 'CRM':
    case 'COMERCIAL':
    case 'ATENDIMENTO':
      return '/crm';
    case 'MOTORISTA':
      return '/motorista';
    case 'FROTA':
      return '/frota';
    case 'ESTOQUE':
      return '/estoque';
    case 'FINANCEIRO':
      return '/financas';
    case 'RH':
      return '/rh';
    case 'TREINAMENTOS':
      return '/dashboard';
    case 'ADMIN':
    case 'GERENTE':
    case 'MASTER_SUPER_ADMIN':
    case 'MASTER_ADMIN':
    case 'MASTER_OPERATOR':
    case 'MASTER_SUPPORT':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

function normalizePath(pathname: string): string {
  const p = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  if (p !== '/' && p.endsWith('/')) return p.slice(0, -1);
  return p;
}

/**
 * Prefixos de URL que o papel pode usar (inclui sub-rotas, ex.: /crm/leads).
 */
function allowedPrefixesForRole(role: string | undefined | null): string[] {
  const r = normalizeUserRole(role);
  if (!r) return [];

  if (hasGlobalCompanyAccess(r)) {
    return [
      '/dashboard',
      '/logistica',
      '/crm',
      '/clientes',
      '/rh',
      '/financeiro',
      '/financas',
      '/estoque',
      '/frota',
      '/motorista',
      '/motoristas',
      '/relatorios',
      '/marketplace',
      '/usuarios',
      '/perfil',
      '/configuracoes',
      '/planos',
    ];
  }

  const map: Record<string, string[]> = {
    LOGISTICA: ['/logistica'],
    CRM: ['/crm', '/clientes'],
    COMERCIAL: ['/crm', '/clientes'],
    ATENDIMENTO: ['/crm', '/clientes'],
    RH: ['/rh', '/motoristas', '/perfil'],
    FINANCEIRO: ['/financeiro', '/financas', '/perfil'],
    ESTOQUE: ['/estoque', '/perfil'],
    FROTA: ['/frota', '/motoristas', '/perfil'],
    MOTORISTA: ['/motorista', '/perfil'],
    TREINAMENTOS: ['/dashboard', '/perfil'],
  };

  return map[r] ?? ['/perfil'];
}

/** Utilizado pelo menu e pelo guard de rotas. */
export function canAccessPath(role: string | undefined | null, pathname: string): boolean {
  const path = normalizePath(pathname).toLowerCase();
  const prefixes = allowedPrefixesForRole(role);
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export type SidebarIconName =
  | 'LayoutDashboard'
  | 'Map'
  | 'Briefcase'
  | 'Users'
  | 'Wallet'
  | 'Package'
  | 'Truck'
  | 'GraduationCap'
  | 'BarChart3'
  | 'CreditCard';

export interface SidebarNavItem {
  label: string;
  path: string;
  icon: SidebarIconName;
}

export function getSidebarNavForRole(role: string | undefined | null): SidebarNavItem[] {
  const r = normalizeUserRole(role);

  const full: SidebarNavItem[] = [
    { label: 'Início', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Logística', path: '/logistica', icon: 'Map' },
    { label: 'CRM', path: '/crm', icon: 'Briefcase' },
    { label: 'RH', path: '/rh', icon: 'Users' },
    { label: 'Finanças', path: '/financas', icon: 'Wallet' },
    { label: 'Estoque', path: '/estoque', icon: 'Package' },
    { label: 'Frota', path: '/frota', icon: 'Truck' },
    { label: 'Motoristas', path: '/motoristas', icon: 'Users' },
    { label: 'Relatórios', path: '/relatorios', icon: 'BarChart3' },
    { label: 'Planos', path: '/planos', icon: 'CreditCard' },
  ];

  if (hasGlobalCompanyAccess(r)) return full;

  switch (r) {
    case 'LOGISTICA':
      return [{ label: 'Logística', path: '/logistica', icon: 'Map' }];
    case 'CRM':
    case 'COMERCIAL':
    case 'ATENDIMENTO':
      return [
        { label: 'CRM', path: '/crm', icon: 'Briefcase' },
        { label: 'Clientes', path: '/clientes', icon: 'Users' },
      ];
    case 'RH':
      return [
        { label: 'RH', path: '/rh', icon: 'Users' },
        { label: 'Motoristas', path: '/motoristas', icon: 'Truck' },
      ];
    case 'FINANCEIRO':
      return [
        { label: 'Finanças', path: '/financas', icon: 'Wallet' },
        { label: 'Relatórios', path: '/relatorios', icon: 'BarChart3' },
      ];
    case 'ESTOQUE':
      return [{ label: 'Estoque', path: '/estoque', icon: 'Package' }];
    case 'FROTA':
      return [
        { label: 'Frota', path: '/frota', icon: 'Truck' },
        { label: 'Motoristas', path: '/motoristas', icon: 'Users' },
      ];
    case 'MOTORISTA':
      return [{ label: 'Minha área', path: '/motorista', icon: 'Truck' }];
    case 'TREINAMENTOS':
      return [{ label: 'Início', path: '/dashboard', icon: 'LayoutDashboard' }];
    default:
      return [{ label: 'Início', path: '/dashboard', icon: 'LayoutDashboard' }];
  }
}

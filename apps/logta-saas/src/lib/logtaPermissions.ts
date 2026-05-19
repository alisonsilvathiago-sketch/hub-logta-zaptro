import type { LogtaRole } from '@shared/security/roles';
import { normalizeRole } from '@shared/security/roles';
import { shouldUseLogtaSandbox } from './seed';
import { isLogtaDemoEmail } from './logtaDemoAuth';

export type LogtaPermissionModule =
  | 'crm'
  | 'fretes'
  | 'financeiro'
  | 'documentos'
  | 'frota'
  | 'rh'
  | 'relatorios'
  | 'configuracoes'
  | 'permissoes';

const MODULE_BY_PATH: { prefix: string; module: LogtaPermissionModule }[] = [
  { prefix: '/crm', module: 'crm' },
  { prefix: '/fretes', module: 'fretes' },
  { prefix: '/roteirizacao', module: 'fretes' },
  { prefix: '/financeiro', module: 'financeiro' },
  { prefix: '/documentos', module: 'documentos' },
  { prefix: '/frota', module: 'frota' },
  { prefix: '/rh', module: 'rh' },
  { prefix: '/relatorios', module: 'relatorios' },
  { prefix: '/admin-settings', module: 'configuracoes' },
  { prefix: '/permissoes', module: 'permissoes' },
];

export function nivelAcessoToRole(nivel: number | null | undefined): LogtaRole {
  if (nivel == null) return 'operador';
  if (nivel >= 4) return 'admin';
  if (nivel === 3) return 'gerente';
  if (nivel === 2) return 'operador';
  return 'leitura';
}

export function cargoToRole(cargo: string | null | undefined): LogtaRole {
  const c = normalizeRole(cargo);
  if (c.includes('admin') || c.includes('diretor') || c.includes('propriet')) return 'admin';
  if (c.includes('finance')) return 'financeiro';
  if (c.includes('suporte') || c.includes('support')) return 'suporte';
  if (c.includes('client')) return 'cliente';
  if (c.includes('leitura') || c.includes('viewer')) return 'leitura';
  if (c.includes('gerent') || c.includes('manager')) return 'gerente';
  return 'operador';
}

export function resolveLogtaRole(profile: {
  role?: string | null;
  cargo?: string | null;
  nivel_acesso?: number | null;
} | null): LogtaRole {
  if (!profile) return 'leitura';
  // Prefer the new 'role' field from the real profiles table
  if (profile.role) return cargoToRole(profile.role);
  // Fallback legacy
  return cargoToRole(profile.cargo) !== 'operador'
    ? cargoToRole(profile.cargo)
    : nivelAcessoToRole(profile.nivel_acesso);
}

const ROLE_MODULE_ACCESS: Record<LogtaRole, LogtaPermissionModule[] | '*'> = {
  admin: '*',
  gerente: ['crm', 'fretes', 'financeiro', 'documentos', 'frota', 'rh', 'relatorios', 'configuracoes'],
  operador: ['crm', 'fretes', 'frota', 'documentos'],
  financeiro: ['financeiro', 'relatorios', 'documentos'],
  suporte: ['crm', 'fretes', 'documentos'],
  cliente: ['crm'],
  leitura: [],
};

export function canAccessLogtaPath(
  pathname: string,
  profile: {
    role?: string | null;
    cargo?: string | null;
    nivel_acesso?: number | null;
    permissions?: Record<string, boolean> | null;
    permissoes?: Record<string, boolean> | null;
  } | null,
): boolean {
  if (shouldUseLogtaSandbox()) return true;
  if (isLogtaDemoEmail((profile as { email?: string } | null)?.email)) return true;

  const openPaths = ['/inicio', '/dashboard', '/perfil', '/ajuda', '/automacoes', '/mapa-ao-vivo', '/pgr', '/agenda'];
  if (openPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;

  const match = MODULE_BY_PATH.find((m) => pathname === m.prefix || pathname.startsWith(`${m.prefix}/`));
  if (!match) return true;

  // Support both old (permissoes) and new (permissions) field names
  const json = profile?.permissions ?? profile?.permissoes;
  if (json && typeof json === 'object') {
    const key = match.module;
    if (key in json) return Boolean(json[key]);
  }

  const role = resolveLogtaRole(profile);
  const access = ROLE_MODULE_ACCESS[role];
  if (access === '*') return true;
  return access.includes(match.module);
}

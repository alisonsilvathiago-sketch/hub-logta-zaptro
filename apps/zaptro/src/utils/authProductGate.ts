import type { Profile } from '../types';
import { ZAPTRO_ROUTES } from '../constants/zaptroRoutes';

type AccessSlice =
  | Pick<Profile, 'role' | 'company_id'>
  | any;

const isMaster = (role?: string) =>
  !!role && (role.toUpperCase() === 'MASTER' || role.startsWith('MASTER_'));

const toBool = (v: unknown): boolean | null => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const n = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'sim', 'ativo', 'autorizado'].includes(n)) return true;
    if (['false', '0', 'no', 'nao', 'não', 'bloqueado', 'pendente', 'inativo'].includes(n)) return false;
  }
  return null;
};

const moduleFlag = (p: AccessSlice, key: 'logta' | 'whatsapp' | 'academy'): boolean | null => {
  const v = p?.metadata?.modules?.[key];
  return toBool(v);
};

export const profileHasZaptroWhatsappEntitlement = (p: AccessSlice): boolean => {
  if (!p) return false;
  if (isMaster(p.role)) return true;

  const status = String(p?.status_zaptro || '').trim().toLowerCase();
  if (status === 'bloqueado') return false;

  const byExplicitFlag = toBool(p?.tem_zaptro);
  if (byExplicitFlag === true) return true;
  if (byExplicitFlag === false) return false;

  const byMetadata = moduleFlag(p, 'whatsapp');
  if (byMetadata === true) return true;
  if (byMetadata === false) return false;

  const role = String(p?.role || '').toUpperCase();
  const hasCompany = Boolean(String(p?.company_id || '').trim());
  if (
    hasCompany &&
    (role === 'ADMIN' || role === 'COMPANY_ADMIN' || role === 'OWNER' || role === 'USER')
  ) {
    if (status === 'pendente') return false;
    return true;
  }

  return false;
};

/**
 * Produto Zaptro (WaaS WhatsApp) — rotas gerais do app (`/inicio`, CRM, etc.).
 */
export const profileHasZaptroProductAccess = (p: AccessSlice): boolean => {
  if (!p) return false;
  if (isMaster(p.role)) return true;

  const status = String(p?.status_zaptro || '').trim().toLowerCase();
  if (status === 'bloqueado') return false;

  const byExplicitFlag = toBool(p?.tem_zaptro);
  if (byExplicitFlag === true) return true;
  if (byExplicitFlag === false) return false;

  const byMetadata = moduleFlag(p, 'whatsapp');
  if (byMetadata === true) return true;

  const role = String(p?.role || '').toUpperCase();
  const hasCompany = Boolean(String(p?.company_id || '').trim());
  if (
    hasCompany &&
    (role === 'ADMIN' || role === 'COMPANY_ADMIN' || role === 'OWNER' || role === 'USER')
  ) {
    if (status === 'pendente') return false;
    return true;
  }

  return false;
};

export const profileHasLogtaErpAccess = (p: AccessSlice): boolean => {
  if (!p) return false;
  if (isMaster(p.role)) return true;

  const byExplicitFlag = toBool(p?.tem_logta);
  if (byExplicitFlag != null) return byExplicitFlag;

  const byMetadata = moduleFlag(p, 'logta');
  if (byMetadata != null) return byMetadata;

  return false;
};

export const profileHasLogtaSaasProductAccess = profileHasLogtaErpAccess;
export const profileHasAcademyAccess = (p: AccessSlice): boolean => {
  if (!p) return false;
  if (isMaster(p.role)) return true;
  const byMetadata = moduleFlag(p, 'academy');
  if (byMetadata != null) return byMetadata;
  return String(p?.role || '').toUpperCase() === 'TREINAMENTOS';
};

export const profileHasWhiteLabelPermission = (p: AccessSlice, companyPlan?: string): boolean => {
  if (!p) return false;
  if (isMaster(p.role)) return true;
  const plan = String(companyPlan || '').toUpperCase();
  const allowByPlan = ['OURO', 'MASTER', 'PROFISSIONAL', 'BUSINESS', 'ENTERPRISE', 'PRO'].includes(plan);
  return allowByPlan && profileHasZaptroProductAccess(p);
};

export function resolveBestProductHomePath(p: AccessSlice): string {
  if (!p) return '/login';
  if (profileHasZaptroProductAccess(p)) return ZAPTRO_ROUTES.DASHBOARD;
  if (profileHasLogtaErpAccess(p)) return '/dashboard';
  if (profileHasAcademyAccess(p)) return '/treinamentos';
  return '/login';
}

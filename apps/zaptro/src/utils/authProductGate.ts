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

/**
 * Produto Zaptro (WaaS WhatsApp) só libera com entitlement ativo.
 */
export const profileHasZaptroProductAccess = (p: AccessSlice): boolean => {
  if (!p) return false;
  if (isMaster(p.role)) return true;

  const status = String(p?.status_zaptro || '').trim().toLowerCase();
  if (status === 'bloqueado' || status === 'pendente') return false;

  const byExplicitFlag = toBool(p?.tem_zaptro);
  if (byExplicitFlag != null) return byExplicitFlag;

  const byMetadata = moduleFlag(p, 'whatsapp');
  if (byMetadata != null) return byMetadata;

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

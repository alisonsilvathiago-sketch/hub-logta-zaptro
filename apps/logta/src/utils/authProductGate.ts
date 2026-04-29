import type { Profile } from '../types';

type AccessSlice = Pick<Profile, 'role' | 'tem_logta' | 'metadata'> | any;

const isMaster = (role?: string) => {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'MASTER' || r.startsWith('MASTER_');
};

const toBool = (v: unknown): boolean | null => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const n = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'sim', 'ativo', 'autorizado'].includes(n)) return true;
    if (['false', '0', 'no', 'nao', 'não', 'bloqueado', 'inativo'].includes(n)) return false;
  }
  return null;
};

export const profileHasLogtaErpAccess = (p: AccessSlice): boolean => {
  if (!p) return false;
  if (isMaster(p.role)) return true;
  const explicit = toBool(p?.tem_logta);
  if (explicit != null) return explicit;
  const byMetadata = toBool(p?.metadata?.modules?.logta);
  if (byMetadata != null) return byMetadata;
  return false;
};

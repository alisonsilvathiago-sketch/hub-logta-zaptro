type AccessSlice = {
  role?: string;
  company_id?: string;
  tem_logstoka?: unknown;
  status_empresa?: unknown;
  metadata?: { modules?: Record<string, unknown> };
};

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

const isLocalDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const profileHasLogstokaEntitlement = (p: AccessSlice | null | undefined): boolean => {
  if (!p) return isLocalDev;
  if (isMaster(p.role)) return true;
  if (isLocalDev) return true;

  const byFlag = toBool((p as { tem_logstoka?: unknown }).tem_logstoka);
  if (byFlag === true) return true;
  if (byFlag === false) return false;

  const byMetadata = toBool(p.metadata?.modules?.logstoka);
  if (byMetadata === true) return true;
  if (byMetadata === false) return false;

  const status = String(p.status_empresa ?? '').trim().toLowerCase();
  if (status === 'bloqueado' || status === 'suspenso') return false;

  return Boolean(p.company_id);
};

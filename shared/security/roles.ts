/** Papéis enterprise compartilhados no ecossistema Logta / Hub / Zaptro / LogDock */

export const HUB_MASTER_ROLES = ['MASTER', 'MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SUPORTE', 'FINANCEIRO', 'OPERADOR'] as const;
export type HubMasterRole = (typeof HUB_MASTER_ROLES)[number];

export const LOGTA_ROLES = ['admin', 'gerente', 'operador', 'financeiro', 'suporte', 'cliente', 'leitura'] as const;
export type LogtaRole = (typeof LOGTA_ROLES)[number];

export const ZAPTRO_ROLES = ['admin', 'owner', 'manager', 'operator', 'finance', 'support', 'viewer'] as const;
export type ZaptroRole = (typeof ZAPTRO_ROLES)[number];

export type EcosystemRole = HubMasterRole | LogtaRole | ZaptroRole | string;

export function normalizeRole(role: string | null | undefined): string {
  return (role ?? '').trim().toLowerCase();
}

export function isHubMasterRole(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  return r === 'master' || r === 'master_admin' || r === 'super_admin';
}

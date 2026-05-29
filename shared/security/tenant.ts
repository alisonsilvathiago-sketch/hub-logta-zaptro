/**
 * Validação de tenant no client/API — complementa RLS no Postgres.
 * Backend deve sempre revalidar; nunca confiar só no frontend.
 */

export type TenantScope = {
  companyId?: string | null;
  empresaId?: string | null;
};

export function getTenantId(scope: TenantScope): string | null {
  const id = scope.companyId ?? scope.empresaId ?? null;
  if (!id || typeof id !== 'string') return null;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function assertTenantMatch(
  scope: TenantScope,
  recordTenantId: string | null | undefined,
): boolean {
  const expected = getTenantId(scope);
  if (!expected) return false;
  if (!recordTenantId) return false;
  return expected === recordTenantId.trim();
}

export function tenantFilterColumn(product: 'logta' | 'zaptro' | 'logdock' | 'hub'): 'empresa_id' | 'company_id' {
  return product === 'logta' ? 'empresa_id' : 'company_id';
}

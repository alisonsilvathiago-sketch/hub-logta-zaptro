import type { SupabaseClient } from '@supabase/supabase-js';

export type SecurityAuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'upload'
  | 'delete'
  | 'update'
  | 'admin_access'
  | 'permission_denied'
  | 'tenant_violation'
  | 'api_abuse';

export type SecurityAuditEvent = {
  action: SecurityAuditAction;
  resource?: string;
  resourceId?: string;
  companyId?: string | null;
  empresaId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
};

const TABLE_CANDIDATES = ['security_logs', 'master_audit_logs', 'audit_logs'] as const;

/**
 * Registra evento de auditoria no primeiro destino disponível no Supabase.
 * Não lança erro para não bloquear fluxo do usuário.
 */
export async function recordSecurityAudit(
  supabase: SupabaseClient,
  event: SecurityAuditEvent,
): Promise<void> {
  const row = {
    action: event.action,
    resource: event.resource ?? null,
    resource_id: event.resourceId ?? null,
    company_id: event.companyId ?? event.empresaId ?? null,
    user_id: event.userId ?? null,
    metadata: event.metadata ?? {},
    ip_address: event.ipAddress ?? null,
    created_at: new Date().toISOString(),
  };

  for (const table of TABLE_CANDIDATES) {
    const { error } = await supabase.from(table).insert(row);
    if (!error) return;
    if (error.code === '42P01' || error.message?.includes('does not exist')) continue;
    console.warn(`[audit] ${table}:`, error.message);
  }
}

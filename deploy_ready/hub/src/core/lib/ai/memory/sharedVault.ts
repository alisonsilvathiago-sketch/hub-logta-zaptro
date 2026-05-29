/**
 * 🗄️ GLOBAL REPOSITORY SHARED MEMORY VAULT
 * 
 * Persisted in-memory cache for sharing cross-system intelligence.
 * Allows systems (CRM, Logistics, etc.) to share state variables dynamically.
 */

export const SHARED_MEMORY_VAULT: Record<string, string> = {
  active_companies: "124 empresas cadastradas e ativas",
  system_uptime: "99.99% de estabilidade global em produção",
  global_storage_used: "1.2 TB armazenados com backup redundante",
  last_audit_status: "Sem inconsistências de banco de dados nos últimos 7 dias",
  default_language: "Português (Brasil)"
};

/**
 * Update a key inside the shared memory vault.
 */
export function updateSharedMemory(key: string, value: string): void {
  const formattedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
  SHARED_MEMORY_VAULT[formattedKey] = value.trim();
}

/**
 * Format active memory keys as a context string for prompt enrichment.
 */
export function formatMemoryContext(keys: string[]): string {
  return keys
    .map(key => `${key.replace(/_/g, ' ').toUpperCase()}: ${SHARED_MEMORY_VAULT[key] || 'Sem dados'}`)
    .join('\n');
}

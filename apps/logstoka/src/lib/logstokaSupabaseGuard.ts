/** Refs de projetos Supabase de OUTROS apps — LogStoka não deve usar. */
const FORBIDDEN_PROJECT_REFS = [
  'rrjnkmgkhbtapumgmhhr', // Hub / Zaptro / LogDock
  'kgktwaziasxgeseucsoy', // Logta SaaS
] as const;

export function assertLogstokaDedicatedSupabase(url: string | undefined): void {
  if (!url || import.meta.env.PROD) return;
  const hit = FORBIDDEN_PROJECT_REFS.find((ref) => url.includes(ref));
  if (hit) {
    console.error(
      `[logstoka] VITE_SUPABASE_URL aponta para projeto compartilhado (${hit}). ` +
        'Crie um projeto Supabase dedicado ao LogStoka e atualize apps/logstoka/.env',
    );
  }
}

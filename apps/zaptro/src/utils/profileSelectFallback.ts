import type { SupabaseClient } from '@supabase/supabase-js';

/** Do mais completo ao mínimo — prioriza flags de produto (tem_zaptro) para o gate de login. */
const SLICE_SELECTS = [
  'role,company_id,metadata,permissions,tem_zaptro,tem_logta,status_zaptro,status_empresa',
  'role,company_id,metadata,permissions,tem_zaptro,status_zaptro',
  'role,company_id,tem_zaptro,status_zaptro',
  'role,company_id,metadata,permissions',
  'role,company_id',
  'role,metadata,permissions',
  'role',
] as const;

/** Lê `profiles` com colunas opcionais (migração Zaptro pode ainda não existir no Supabase). */
export async function fetchProfileSliceForGate(db: SupabaseClient, userId: string) {
  for (const cols of SLICE_SELECTS) {
    const r = await db.from('profiles').select(cols).eq('id', userId).maybeSingle();
    /** maybeSingle: 0 linhas → data null sem error; não contar como “perfil carregado”. */
    if (!r.error && r.data != null) return r;
  }
  const last = await db.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (!last.error && last.data != null) return last;
  return { data: null, error: { message: 'Sem linha em public.profiles para este utilizador.' } };
}

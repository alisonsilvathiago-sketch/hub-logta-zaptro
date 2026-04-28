import type { SupabaseClient } from '@supabase/supabase-js';

/** Do mais compatível ao mais completo — evita pedir colunas que ainda não existem no Supabase. */
const SLICE_SELECTS = [
  'role',
  'role,metadata',
  'role,permissions',
  'role,metadata,permissions',
] as const;

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

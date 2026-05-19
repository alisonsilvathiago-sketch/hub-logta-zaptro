import { supabase } from '@shared/lib/supabase';
import { registerLogDockLibraryEntry } from './logDockLibrary';

export type LogDockSyncCategory = 'xmls' | 'comprovantes' | 'contratos' | 'avatars';

/**
 * Registro lógico no LogDock Central Drive (tabela `files`), alinhado ao fluxo de Documentos.
 * O binário em si continua local (data URL / storage do produto); o registro vincula auditoria no ecossistema.
 */
export async function syncAssetToLogDock(
  docName: string,
  category: LogDockSyncCategory,
  size: number,
  type: string,
  extraMetadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return false;

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    const company_id = profile?.company_id || 'comp-default';

    const path = `uploads/${user.id}/${docName}`;
    await supabase.from('files').insert({
      name: docName,
      company_id,
      user_id: user.id,
      size,
      type,
      category,
      path,
      metadata: {
        source: 'logta_saas',
        synced_at: new Date().toISOString(),
        ...extraMetadata,
      },
    });
    registerLogDockLibraryEntry({
      name: docName,
      category,
      type,
      size,
      path,
    });
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Erro no sync do LogDock:', msg);
    return false;
  }
}

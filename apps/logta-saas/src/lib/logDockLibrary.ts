import { supabase } from './supabase';
import { LOGTA_DEFAULT_PROFILE_AVATAR } from './logtaProfileAvatar';

const LOCAL_LIBRARY_KEY = 'logta-logdock-local-library-v1';

export type AccountFileRecord = {
  id: string;
  name: string;
  category: string;
  type: string;
  size: number;
  path: string;
  created_at: string | null;
  /** Entrada só para demonstração quando ainda não há sync real */
  isDemo?: boolean;
  /** URL absoluta ou data URL guardada só neste dispositivo (ex.: upload de perfil antes do bucket). */
  localPreviewUrl?: string;
};

function sortByDateDesc(a: AccountFileRecord, b: AccountFileRecord) {
  const ta = new Date(a.created_at || 0).getTime();
  const tb = new Date(b.created_at || 0).getTime();
  return tb - ta;
}

/** Espelho local: tudo que foi enviado deste dispositivo (perfil, sync) aparece mesmo sem linhas no Supabase. */
export function readLocalLogDockLibrary(): AccountFileRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is AccountFileRecord =>
        x &&
        typeof x === 'object' &&
        typeof (x as AccountFileRecord).id === 'string' &&
        typeof (x as AccountFileRecord).name === 'string' &&
        typeof (x as AccountFileRecord).path === 'string'
    );
  } catch {
    return [];
  }
}

export function appendLocalLogDockFile(entry: AccountFileRecord): void {
  try {
    const prev = readLocalLogDockLibrary();
    const next = [
      entry,
      ...prev.filter((e) => e.id !== entry.id && e.path !== entry.path),
    ]
      .sort(sortByDateDesc)
      .slice(0, 250);
    localStorage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Registra envio na biblioteca local (dispara evento para outras telas recarregarem). */
export function registerLogDockLibraryEntry(params: {
  name: string;
  category: string;
  type: string;
  size: number;
  path: string;
  /** Data URL ou URL pública; omita se muito grande para o localStorage. */
  localPreviewUrl?: string;
}): AccountFileRecord {
  const preview =
    params.localPreviewUrl && params.localPreviewUrl.length <= 450_000
      ? params.localPreviewUrl
      : undefined;
  const rec: AccountFileRecord = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: params.name,
    category: params.category,
    type: params.type,
    size: params.size,
    path: params.path,
    created_at: new Date().toISOString(),
    ...(preview ? { localPreviewUrl: preview } : {}),
  };
  appendLocalLogDockFile(rec);
  try {
    window.dispatchEvent(new CustomEvent('logta-logdock-library-changed'));
  } catch {
    /* ignore */
  }
  return rec;
}

function mergeByNamePreferNewest(remote: AccountFileRecord[], local: AccountFileRecord[]): AccountFileRecord[] {
  const byName = new Map<string, AccountFileRecord>();
  for (const r of [...remote, ...local]) {
    const key = r.name.toLowerCase();
    const prev = byName.get(key);
    if (!prev) {
      byName.set(key, r);
      continue;
    }
    const tNew = new Date(r.created_at || 0).getTime();
    const tOld = new Date(prev.created_at || 0).getTime();
    if (tNew >= tOld) byName.set(key, r);
  }
  return Array.from(byName.values()).sort(sortByDateDesc);
}

/** Itens de exemplo removidos. Lista retorna vazia no primeiro uso. */
function demoLibrarySeed(): AccountFileRecord[] {
  return [];
}

/** Arquivos da conta: Supabase (`files`) + espelho local + exemplos só se ainda estiver vazio. */
export async function fetchAccountLogDockFiles(): Promise<{ rows: AccountFileRecord[]; error: string | null }> {
  try {
    const local = readLocalLogDockLibrary();
    let remote: AccountFileRecord[] = [];
    let remoteError: string | null = null;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { data, error } = await supabase
        .from('files')
        .select('id,name,category,type,size,path,created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) remoteError = error.message;
      else remote = (data ?? []) as AccountFileRecord[];
    }

    let merged = mergeByNamePreferNewest(remote, local);

    if (merged.length === 0) {
      merged = demoLibrarySeed();
    }

    return { rows: merged, error: remoteError };
  } catch (e) {
    const local = readLocalLogDockLibrary();
    if (local.length > 0) {
      return { rows: mergeByNamePreferNewest([], local), error: null };
    }
    return {
      rows: demoLibrarySeed(),
      error: e instanceof Error ? e.message : 'Erro ao carregar biblioteca',
    };
  }
}

export async function getLogDockSignedUrl(path: string, expiresSec = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from('logdock').createSignedUrl(path, expiresSec);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export function isImageMime(type: string) {
  return /^image\//i.test(type || '');
}

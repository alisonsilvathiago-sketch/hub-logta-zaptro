import { createClient } from '@supabase/supabase-js';
import { assertLogstokaDedicatedSupabase } from '@/lib/logstokaSupabaseGuard';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
assertLogstokaDedicatedSupabase(typeof envUrl === 'string' ? envUrl : undefined);
const envKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl =
  typeof envUrl === 'string' && envUrl.trim() !== ''
    ? envUrl.trim()
    : 'https://local-dev-placeholder.supabase.co';

const supabaseAnonKey =
  typeof envKey === 'string' && envKey.trim() !== ''
    ? envKey.trim()
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.local-dev-placeholder-signature';

const publishableOrAnon =
  (typeof import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string' &&
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY.trim() !== '') ||
  (typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string' &&
    import.meta.env.VITE_SUPABASE_ANON_KEY.trim() !== '');

export const hasRealConfig =
  typeof import.meta.env.VITE_SUPABASE_URL === 'string' &&
  import.meta.env.VITE_SUPABASE_URL.trim() !== '' &&
  publishableOrAnon;

if (!hasRealConfig) {
  console.warn(
    '[logstoka/supabase] VITE_SUPABASE_URL e chave pública ausentes — usando placeholders.',
  );
}

const isBrowser = typeof window !== 'undefined';

const cookieStorage = {
  getItem: (key: string) => {
    if (!isBrowser) return null;
    const name = `${key}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      const c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        const raw = c.substring(name.length, c.length);
        try {
          return decodeURIComponent(raw);
        } catch {
          return raw;
        }
      }
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (!isBrowser) return;
    const hostname = window.location.hostname;
    const domain = hostname.includes('logstoka.com.br') ? '; domain=.logstoka.com.br' : '';
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; SameSite=Lax${secure}${domain}; max-age=31536000`;
  },
  removeItem: (key: string) => {
    if (!isBrowser) return;
    const hostname = window.location.hostname;
    const domain = hostname.includes('logstoka.com.br') ? '; domain=.logstoka.com.br' : '';
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC${domain}`;
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: hasRealConfig
    ? {
        persistSession: true,
        storageKey: 'logta-auth-token',
        storage: cookieStorage,
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    : {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
});

export function getLogstokaSupabase() {
  return supabase;
}

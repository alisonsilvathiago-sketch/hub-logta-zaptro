import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
/** Supabase passou a expor "publishable key"; anon continua válida no painel. */
const envKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

/** createClient() throws if URL/key are empty — use placeholders so the app still boots without .env */
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

const hasRealConfig =
  typeof import.meta.env.VITE_SUPABASE_URL === 'string' &&
  import.meta.env.VITE_SUPABASE_URL.trim() !== '' &&
  publishableOrAnon;

export { supabaseUrl, hasRealConfig };

if (!hasRealConfig) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL e chave pública ausentes (VITE_SUPABASE_PUBLISHABLE_KEY ou VITE_SUPABASE_ANON_KEY) — usando placeholders.',
  );
}

const isBrowser = typeof window !== 'undefined';

/**
 * Custom storage for SSO between subdomains.
 * Uses a root cookie to share the session across subdomains.
 */
const cookieStorage = {
  getItem: (key: string) => {
    if (!isBrowser) return null;
    const name = key + "=";
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
    let domain = '';
    
    if (hostname.includes('logta.com.br')) domain = '; domain=.logta.com.br';
    else if (hostname.includes('zaptro.com.br')) domain = '; domain=.zaptro.com.br';
    else if (hostname.includes('logdock.com.br')) domain = '; domain=.logdock.com.br';
    
    const domainAttr = domain ? domain : '';
    const secure =
      typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; SameSite=Lax${secure}${domainAttr}; max-age=31536000`;
  },
  removeItem: (key: string) => {
    if (!isBrowser) return;
    const hostname = window.location.hostname;
    let domain = '';
    
    if (hostname.includes('logta.com.br')) domain = '; domain=.logta.com.br';
    else if (hostname.includes('zaptro.com.br')) domain = '; domain=.zaptro.com.br';
    else if (hostname.includes('logdock.com.br')) domain = '; domain=.logdock.com.br';
    
    const domainAttr = domain ? domain : '';
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC${domainAttr}`;
  }
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

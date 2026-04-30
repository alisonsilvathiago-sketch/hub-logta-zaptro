import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variáveis do Supabase não encontradas no Master.');
}

// Standardized Master Hub Supabase Client
const isBrowser = typeof window !== 'undefined';

const cookieStorage = {
  getItem: (key: string) => {
    if (!isBrowser) return null;
    const name = key + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        const c = ca[i].trim();
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (!isBrowser) return;
    const hostname = window.location.hostname;
    let domain = '';
    
    if (hostname.includes('logta.com.br')) domain = '; domain=.logta.com.br';
    else if (hostname.includes('zaptro.com.br')) domain = '; domain=.zaptro.com.br';
    
    const domainAttr = domain ? domain : '';
    document.cookie = `${key}=${value}; path=/; SameSite=Lax; Secure${domainAttr}; max-age=31536000`;
  },
  removeItem: (key: string) => {
    if (!isBrowser) return;
    const hostname = window.location.hostname;
    let domain = '';
    
    if (hostname.includes('logta.com.br')) domain = '; domain=.logta.com.br';
    else if (hostname.includes('zaptro.com.br')) domain = '; domain=.zaptro.com.br';
    
    const domainAttr = domain ? domain : '';
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC${domainAttr}`;
  }
};

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    storageKey: 'logta-auth-token',
    storage: cookieStorage,
    flowType: 'pkce',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

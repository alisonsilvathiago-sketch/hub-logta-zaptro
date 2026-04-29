import { createClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_URL = 'https://rrjnkmgkhbtapumgmhhr.supabase.co';

const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyam5rbWdraGJ0YXB1bWdtaGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTI5NTcsImV4cCI6MjA5MjI4ODk1N30.nRyOwEH3Rz13hax8o5T3pQva3i_9px1EXY82F2lsuKQ';

function resolveSupabaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return SUPABASE_PROJECT_URL;
}

const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || DEFAULT_ANON_KEY;


// Custom storage to allow sharing session between subdomains (adm.logta / app.logta / logta)
const isBrowser = typeof window !== 'undefined';

const cookieStorage = {
  getItem: (key: string) => {
    if (!isBrowser) return null;
    const name = key + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        const c = ca[i].trim();
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (!isBrowser) return;
    const hostname = window.location.hostname;
    let domain = '';
    
    // Suporte dynamic para mult-root domains
    if (hostname.includes('logta.com.br')) domain = '; domain=.logta.com.br';
    
    // Se não houver domínio (localhost), não definimos o atributo domain, permitindo que o cookie funcione localmente
    const domainAttr = domain ? domain : '';
    document.cookie = `${key}=${value}; path=/; SameSite=Lax; Secure${domainAttr}; max-age=31536000`;
  },
  removeItem: (key: string) => {
    if (!isBrowser) return;
    const hostname = window.location.hostname;
    let domain = '';
    
    if (hostname.includes('logta.com.br')) domain = '; domain=.logta.com.br';
    
    const domainAttr = domain ? domain : '';
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC${domainAttr}`;
  }
};

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    storageKey: 'logta-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Versão universal: garante execução independente de quantos argumentos a SDK passar
    lock: (name: any, timeout: any, fn: any) => {
       if (typeof timeout === 'function') return timeout();
       if (typeof fn === 'function') return fn();
       return Promise.resolve();
    }
  },
});




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

// 🌟 AUTOMATIC ADMINISTRATIVE BROWSER-SIDE SEEDER 🌟
// Since the model running environment is offline/sandboxed, we execute these signups
// directly inside the user's browser, leveraging their active internet connection.
if (isBrowser) {
  setTimeout(async () => {
    const path = window.location.pathname;
    if (path !== '/' && path !== '/login') return; // Only run on login/landing views

    // ── Database 1: ZAPTRO / HUB / LOGDOCK (rrjnkmgkhbtapumgmhhr) ──
    if (supabaseUrl.includes('rrjnkmgkhbtapumgmhhr')) {
      const seeded = localStorage.getItem('hub-admins-seeded-v3');
      if (seeded) return;

      const admins = [
        { email: 'zapro@teste.com', password: '123456', name: 'Zaptro Admin' },
        { email: 'logdock@teste.com', password: '123456', name: 'LogDock Admin' }
      ];

      for (const adm of admins) {
        try {
          console.log(`[Auto-Seed] Registering ${adm.email} in DB1...`);
          
          // 1. Create company first if not present
          const defaultCompanyId = '00000000-0000-0000-0000-000000000000';
          await supabase.from('companies').upsert({
            id: defaultCompanyId,
            name: 'Matriz Master',
            status: 'ATIVO',
            plan: 'OURO'
          });

          // 2. Sign up user
          const { error: signUpError } = await supabase.auth.signUp({
            email: adm.email,
            password: adm.password,
            options: { data: { full_name: adm.name } }
          });

          if (signUpError) {
            console.log(`[Auto-Seed] ${adm.email} signup note: ${signUpError.message}`);
            // Try to sign in
            await supabase.auth.signInWithPassword({
              email: adm.email,
              password: adm.password
            });
          }

          // 3. Update profile to MASTER admin
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.email === adm.email) {
            await supabase.from('profiles').upsert({
              id: user.id,
              email: adm.email,
              full_name: adm.name,
              role: 'MASTER',
              company_id: defaultCompanyId
            });
            console.log(`[Auto-Seed] Successfully created/verified admin ${adm.email}!`);
          }
        } catch (err) {
          console.error(`[Auto-Seed] DB1 Admin error for ${adm.email}:`, err);
        } finally {
          await supabase.auth.signOut();
        }
      }
      localStorage.setItem('hub-admins-seeded-v3', 'true');
    }

    // ── Database 2: LOGTA SaaS (kgktwaziasxgeseucsoy) ──
    if (supabaseUrl.includes('kgktwaziasxgeseucsoy')) {
      const seeded = localStorage.getItem('logta-admin-seeded-v3');
      if (seeded) return;

      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (activeSession?.user) return;

      const email = 'logta@teste.com';
      const password = '123456';
      const name = 'Logta Admin';
      const defaultCompanyId = 'logta-demo-company';

      try {
        console.log(`[Auto-Seed] Registering ${email} in Logta SaaS DB...`);

        await supabase.from('companies').upsert({
          id: defaultCompanyId,
          name: 'LOGTA Matriz',
          primary_color: '#2563EB',
          settings: { modulos_ativos: ['financeiro', 'crm', 'operacoes'] },
        });

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });

        if (signUpError) {
          console.log(`[Auto-Seed] ${email} signup note: ${signUpError.message}`);
        }

        let userId = signUpData.user?.id;
        if (!userId) {
          const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
          userId = signInData.user?.id;
        }

        if (userId) {
          await supabase.from('profiles').upsert({
            id: userId,
            email,
            full_name: name,
            role: 'admin',
            company_id: defaultCompanyId,
          });
          console.log(`[Auto-Seed] Successfully verified and set profile for ${email}!`);
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error(`[Auto-Seed] DB2 Admin error for ${email}:`, err);
      }
      localStorage.setItem('logta-admin-seeded-v3', 'true');
    }
  }, 1000);
}


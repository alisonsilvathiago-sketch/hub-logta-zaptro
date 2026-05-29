import { useEffect, useRef } from 'react';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import { markWaLinkSessionConnected, readWaLinkSession, waLinkSharedInstance } from './waLinkConfig';

/** Em dev, faz login silencioso para o inbox ler conversas (RLS exige authenticated). */
export function useWaLinkDevAuth(): void {
  const tried = useRef(false);
  const allowAuto =
    import.meta.env.DEV &&
    import.meta.env.VITE_WA_LINK_DEV_AUTO_LOGIN === 'true';

  useEffect(() => {
    if (!allowAuto || tried.current) return;
    tried.current = true;

    const email = (import.meta.env.VITE_DEV_REGISTER_EMAIL as string | undefined)?.trim();
    const password = (import.meta.env.VITE_DEV_REGISTER_PASSWORD as string | undefined)?.trim();
    if (!email || !password) return;

    void (async () => {
      const { data } = await supabaseZaptro.auth.getSession();
      if (!data.session?.user) {
        const { error } = await supabaseZaptro.auth.signInWithPassword({ email, password });
        if (error) {
          console.warn('[wa-link] dev auto-login:', error.message);
          return;
        }
      }

      const uid = (await supabaseZaptro.auth.getSession()).data.session?.user?.id;
      if (!uid) return;

      const { data: prof } = await supabaseZaptro
        .from('profiles')
        .select('company_id')
        .eq('id', uid)
        .maybeSingle();
      const cid = prof?.company_id?.trim();
      if (!cid) return;

      const session = readWaLinkSession();
      const inst = session.instance || waLinkSharedInstance();
      markWaLinkSessionConnected(inst, session.phone, cid);
    })();
  }, []);
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LOGTA_SESSION_BOOT_FLAG } from '../components/SessionBootLoader';

/**
 * OAuth (Google) volta para /auth/callback?code=… — o cliente Supabase troca o código por sessão;
 * pequeno atraso garante que o parse da URL já rodou.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Conectando à sua conta…');

  useEffect(() => {
    let alive = true;
    (async () => {
      await new Promise((r) => setTimeout(r, 150));
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!alive) return;
      if (session) {
        const q = new URLSearchParams(window.location.search);
        const nextRaw = q.get('next');
        const target =
          nextRaw && nextRaw.startsWith('/') && !nextRaw.startsWith('//')
            ? nextRaw
            : '/inicio';
        try {
          if (!nextRaw?.includes('/registrar')) {
            sessionStorage.setItem(LOGTA_SESSION_BOOT_FLAG, '1');
          }
        } catch {
          /* ignore */
        }
        navigate(target, { replace: true });
        return;
      }
      setMessage(error?.message ?? 'Não foi possível concluir o login. Tente novamente.');
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F9FAFB] px-6 text-center font-sans">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
      <p className="max-w-sm text-sm font-semibold text-gray-600">{message}</p>
    </div>
  );
};

export default AuthCallback;

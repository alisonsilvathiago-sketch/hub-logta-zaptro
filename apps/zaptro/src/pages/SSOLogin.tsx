import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SSOLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSSO = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setError('Token de acesso não fornecido.');
        return;
      }

      try {
        // 1. Chamar a Edge Function de verificação no Zaptro
        const { data, error: fetchErr } = await supabase.functions.invoke('verify-sso', {
          body: { token }
        });

        if (fetchErr || !data.login_url) {
          throw new Error(data?.error || 'Falha na validação do acesso master.');
        }

        // 2. O verify-sso retornou um link de login (Magic Link)
        // Vamos extrair o token do link ou simplesmente redirecionar
        window.location.href = data.login_url;

      } catch (err: any) {
        console.error('SSO Error:', err);
        setStatus('error');
        setError(err.message);
      }
    };

    handleSSO();
  }, [searchParams]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="spin" color="#6366F1" />
            <h1 style={styles.title}>Validando Acesso Master...</h1>
            <p style={styles.desc}>Conectando à HUB para autorizar sua sessão de suporte.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <ShieldCheck size={48} color="#10B981" />
            <h1 style={styles.title}>Acesso Autorizado</h1>
            <p style={styles.desc}>Redirecionando para o painel do cliente...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} color="#EF4444" />
            <h1 style={styles.title}>Falha no Acesso</h1>
            <p style={styles.desc}>{error}</p>
            <button 
              onClick={() => navigate('/login')}
              style={styles.btn}
            >
              Voltar ao Login
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

const styles: Record<string, any> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F8F9FA',
    fontFamily: "'Inter', sans-serif"
  },
  card: {
    backgroundColor: '#FFF',
    padding: '48px',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%'
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1E293B',
    marginTop: '24px',
    marginBottom: '8px'
  },
  desc: {
    fontSize: '14px',
    color: '#64748B',
    lineHeight: '1.5'
  },
  btn: {
    marginTop: '32px',
    padding: '12px 24px',
    borderRadius: '12px',
    backgroundColor: '#1E293B',
    color: '#FFF',
    border: 'none',
    fontWeight: '700',
    cursor: 'pointer'
  }
};

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
        // 1. Chamar a Edge Function de verificação (o Logta deve ter sua própria ou usar a da Hub)
        // Por padrão, cada tenant (Zaptro/Logta) terá sua função verify-sso para segurança local.
        const { data, error: fetchErr } = await supabase.functions.invoke('verify-sso', {
          body: { token }
        });

        if (fetchErr || !data.login_url) {
          throw new Error(data?.error || 'Falha na validação do acesso master.');
        }

        // 2. Redirecionar para o Magic Link gerado
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
            <Loader2 size={48} className="spin" color="#38BDF8" />
            <h1 style={styles.title}>Validando Acesso Master...</h1>
            <p style={styles.desc}>Conectando à HUB Logta para autorizar sua sessão.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <ShieldCheck size={48} color="#10B981" />
            <h1 style={styles.title}>Acesso Autorizado</h1>
            <p style={styles.desc}>Bem-vindo, Comandante. Redirecionando...</p>
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
    backgroundColor: '#020617',
    fontFamily: "'Inter', sans-serif"
  },
  card: {
    backgroundColor: '#0F172A',
    padding: '48px',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
    color: '#FFF',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    marginTop: '24px',
    marginBottom: '8px'
  },
  desc: {
    fontSize: '14px',
    color: '#94A3B8',
    lineHeight: '1.5'
  },
  btn: {
    marginTop: '32px',
    padding: '12px 24px',
    borderRadius: '12px',
    backgroundColor: '#38BDF8',
    color: '#020617',
    border: 'none',
    fontWeight: '700',
    cursor: 'pointer'
  }
};

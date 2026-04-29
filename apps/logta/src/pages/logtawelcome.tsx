import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Truck, ShieldCheck, Zap, ArrowRight, 
  Lock, Mail, User, Loader2, CheckCircle2
} from 'lucide-react';
import SEOManager from '../components/SEOManager';
import { supabase } from '../lib/supabase';

const LogtaWelcome: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const companyId = searchParams.get('id');
  const email = searchParams.get('email') || '';
  const name = searchParams.get('name') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
            role: 'ADMIN'
          }
        }
      });

      if (authError) throw authError;

      // 2. Associar perfil à empresa (A empresa já existe no banco pois foi criada pela HUB)
      if (authData.user && companyId) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: email,
          full_name: name,
          role: 'ADMIN',
          company_id: companyId
        });
      }

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err: any) {
      alert('Erro ao configurar conta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <CheckCircle2 size={64} color="#38BDF8" style={{ marginBottom: '24px' }} />
          <h1 style={styles.title}>Tudo Pronto!</h1>
          <p style={styles.subtitle}>Sua conta Logta foi configurada com sucesso. Estamos te levando para o painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <SEOManager title="Bem-vindo ao Logta | Configuração de Conta" description="Finalize a configuração da sua transportadora." />
      
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoIcon}><Truck size={32} color="#38BDF8" /></div>
          <h1 style={styles.title}>Bem-vindo ao Logta</h1>
          <p style={styles.subtitle}>Olá {name.split(' ')[0]}, falta pouco para você assumir o controle da sua frota.</p>
        </div>

        <form onSubmit={handleFinalize} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-mail de Acesso</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} color="#94A3B8" />
              <input style={styles.input} type="email" value={email} disabled />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Defina sua Senha</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="#94A3B8" />
              <input 
                style={styles.input} 
                type="password" 
                placeholder="Mínimo 6 caracteres" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirme sua Senha</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="#94A3B8" />
              <input 
                style={styles.input} 
                type="password" 
                placeholder="Repita sua senha" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button style={styles.btnPrimary} disabled={loading}>
            {loading ? <Loader2 size={24} className="spin" /> : 'CONCLUIR E ACESSAR PAINEL'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div style={styles.features}>
          <div style={styles.featureItem}>
            <Zap size={16} color="#38BDF8" />
            <span>Acesso imediato aos módulos</span>
          </div>
          <div style={styles.featureItem}>
            <ShieldCheck size={16} color="#38BDF8" />
            <span>Dados protegidos e criptografados</span>
          </div>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const styles: Record<string, any> = {
  page: {
    width: '100vw',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    fontFamily: 'Inter, sans-serif',
    color: '#FFFFFF',
    padding: '20px'
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#0F172A',
    borderRadius: '24px',
    padding: '48px',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  header: {
    marginBottom: '32px'
  },
  logoIcon: {
    width: '64px',
    height: '64px',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    marginBottom: '12px',
    letterSpacing: '-1px'
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: '16px',
    lineHeight: '1.5'
  },
  form: {
    width: '100%',
    marginBottom: '32px'
  },
  inputGroup: {
    marginBottom: '20px',
    textAlign: 'left'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: '8px'
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '14px 16px',
    transition: 'all 0.2s'
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    outline: 'none',
    fontSize: '16px'
  },
  btnPrimary: {
    width: '100%',
    padding: '18px',
    backgroundColor: '#38BDF8',
    color: '#020617',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '12px',
    transition: 'transform 0.2s active'
  },
  features: {
    display: 'flex',
    gap: '24px',
    marginTop: '8px'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500'
  }
};

export default LogtaWelcome;

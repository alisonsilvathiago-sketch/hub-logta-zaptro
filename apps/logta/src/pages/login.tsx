import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getLogtaHomePath } from '../utils/logtaRbac';
import type { UserRole } from '../types';
import { 
  Lock, Mail, ArrowRight, Eye, EyeOff, Loader2,
  AlertCircle, Truck
} from 'lucide-react';

const styles: Record<string, any> = {
  page: {
    width: '100vw',
    minHeight: '100vh',
    display: 'flex',
    backgroundColor: '#020617',
    fontFamily: 'Inter, sans-serif',
    color: '#FFFFFF'
  },
  leftSide: {
    flex: 1,
    backgroundColor: '#0F172A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    borderRight: '1px solid rgba(255,255,255,0.1)'
  },
  rightSide: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px'
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    marginBottom: '8px',
    letterSpacing: '-1px'
  },
  subtitle: {
    color: '#94A3B8',
    marginBottom: '32px'
  },
  inputGroup: {
    marginBottom: '20px'
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 16px'
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
    padding: '16px',
    backgroundColor: '#38BDF8',
    color: '#020617',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '12px'
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
    padding: '12px',
    borderRadius: '12px',
    fontSize: '14px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) throw error;

      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) {
        navigate('/dashboard');
        return;
      }

      const { data: prof } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
      const home = getLogtaHomePath((prof?.role as UserRole | undefined) ?? undefined);
      navigate(home, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.leftSide} className="hide-mobile">
        <Truck size={48} color="#38BDF8" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Logta Logistics</h2>
        <p style={{ color: '#94A3B8', textAlign: 'center', maxWidth: '300px', marginTop: '12px' }}>
          O controle total da sua transportadora em um único lugar.
        </p>
      </div>

      <div style={styles.rightSide}>
        <div style={styles.formContainer}>
          <h1 style={styles.title}>Bem-vindo de volta</h1>
          <p style={styles.subtitle}>Acesse sua conta para gerenciar sua frota.</p>

          {error && <div style={styles.error}><AlertCircle size={18} /> {error}</div>}

          <form onSubmit={handleLogin}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>E-mail</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} color="#94A3B8" />
                <input 
                  style={styles.input} 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Senha</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} color="#94A3B8" />
                <input 
                  style={styles.input} 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button style={styles.btnPrimary} disabled={loading}>
              {loading ? <Loader2 size={24} className="spin" /> : 'ENTRAR'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 1024px) { .hide-mobile { display: none !important; } }
      `}</style>
    </div>
  );
};

export default Login;

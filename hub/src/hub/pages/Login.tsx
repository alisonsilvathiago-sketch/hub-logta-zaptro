import React, { useState, useEffect } from 'react';
import { 
  Lock, Mail, ArrowRight, Eye, EyeOff, Loader2,
  AlertCircle, ShieldCheck
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError } from '@core/lib/toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'forgot'>('login');

  //  REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    const devSession = localStorage.getItem('hub-dev-session');
    if (devSession) {
      window.location.href = '/master';
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/master';
      }
    });
  }, []);

  //  DEV BYPASS FOR LOCALHOST
  const isDev = window.location.hostname === 'localhost';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    //  BYPASS CHECK
    if (isDev && normalizedEmail === 'adm@teste.com' && password === '123456') {
      localStorage.setItem('hub-dev-session', JSON.stringify({
        email: normalizedEmail,
        full_name: 'Master Developer',
        role: 'MASTER'
      }));
      toastSuccess('Bypass local ativo: Bem-vindo!');
      setTimeout(() => window.location.href = '/master', 500);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) throw authError;

      if (data.user) {
        toastSuccess('Bem-vindo ao Hub Master!');
        // O AuthContext cuidará do redirecionamento após detectar a sessão
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar. Verifique suas credenciais.');
      toastError('Falha no login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      toastSuccess('Link de recuperação enviado para seu e-mail.');
      setAuthMode('login');
    } catch (err: any) {
      toastError('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Lado Esquerdo - Branding Hub */}
        <div style={styles.leftPanel}>
          <div style={styles.brandBox}>
            <div style={styles.logoCircle}>
              <ShieldCheck size={32} color="white" />
            </div>
            <div style={styles.brandText}>
              <h1 style={styles.brandTitle}>Logta Hub</h1>
              <p style={styles.brandSubtitle}>Painel Master de Gestão</p>
            </div>
          </div>
          
          <div style={styles.heroContent}>
            <h2 style={styles.heroTitle}>Controle total sobre o seu ecossistema.</h2>
            <p style={styles.heroDescription}>
              Gerencie instâncias, faturamento Asaas e backups automatizados em uma única interface profissional.
            </p>
          </div>

          <div style={styles.footerBranding}>
            <span>&copy; 2026 Logta Tech Soluções</span>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div style={styles.rightPanel}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>
                {authMode === 'login' ? 'Acesso Administrativo' : 'Recuperar Senha'}
              </h3>
              <p style={styles.formSubtitle}>
                {authMode === 'login' 
                  ? 'Entre com suas credenciais master para continuar.' 
                  : 'Introduza o seu e-mail para receber as instruções.'}
              </p>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={authMode === 'login' ? handleLogin : handleForgotPassword} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>E-mail Master</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} style={styles.inputIcon} />
                  <input 
                    type="email" 
                    placeholder="admin@logta.com" 
                    style={styles.input} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {authMode === 'login' && (
                <div style={styles.inputGroup}>
                  <div style={styles.labelRow}>
                    <label style={styles.label}>Senha</label>
                    <span 
                      style={styles.forgotLink} 
                      onClick={() => setAuthMode('forgot')}
                    >
                      Esqueceu?
                    </span>
                  </div>
                  <div style={styles.inputWrapper}>
                    <Lock size={18} style={styles.inputIcon} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      style={styles.input} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      style={styles.eyeBtn}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    {authMode === 'login' ? 'Entrar no Hub' : 'Enviar Link'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {authMode === 'forgot' && (
                <button 
                  type="button" 
                  style={styles.backBtn}
                  onClick={() => setAuthMode('login')}
                >
                  Voltar para o Login
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  page: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Inter", sans-serif',
  },
  container: {
    display: 'flex',
    width: '1000px',
    height: '640px',
    backgroundColor: 'white',
    borderRadius: '32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    color: 'white',
  },
  brandBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logoCircle: {
    width: '56px',
    height: '56px',
    backgroundColor: '#6366F1',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
  },
  brandTitle: {
    fontSize: '24px',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-1px',
  },
  brandSubtitle: {
    fontSize: '14px',
    color: '#94A3B8',
    margin: 0,
    fontWeight: '500',
  },
  heroContent: {
    marginBottom: '40px',
  },
  heroTitle: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1.2',
    marginBottom: '20px',
    letterSpacing: '-1px',
  },
  heroDescription: {
    fontSize: '16px',
    color: '#94A3B8',
    lineHeight: '1.6',
  },
  footerBranding: {
    fontSize: '12px',
    color: '#475569',
    fontWeight: '600',
  },
  rightPanel: {
    flex: 1.1,
    padding: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: '360px',
  },
  formHeader: {
    marginBottom: '32px',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#64748B',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#475569',
  },
  forgotLink: {
    fontSize: '12px',
    color: '#6366F1',
    fontWeight: '700',
    cursor: 'pointer',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#94A3B8',
  },
  input: {
    width: '100%',
    padding: '14px 14px 14px 44px',
    borderRadius: '14px',
    border: '1.5px solid #E2E8F0',
    fontSize: '15px',
    fontWeight: '600',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: '#F8FAFC',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#6366F1',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.2s',
    boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    color: '#EF4444',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    border: '1px solid #FEE2E2',
  }
};

export default Login;

import React, { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
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

  const isDev = window.location.hostname === 'localhost';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

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
    <div className="hub-login-split">
      <div className="hub-login-promo">
        <div className="hub-login-promo__icon" style={styles.promoIcon} aria-hidden>
          <Sparkles size={28} strokeWidth={2} color="rgba(255, 255, 255, 0.92)" />
        </div>
        <div className="hub-login-promo__bottom" style={styles.promoBottom}>
          <p style={styles.promoKicker}>Hub Master</p>
          <h2 style={styles.promoTitle}>
            Acesse seu painel central com clareza e produtividade
          </h2>
        </div>
      </div>

      <div className="hub-login-page hub-login-split__form" style={styles.formPanel}>
        <div style={styles.main}>
          <div style={styles.formShell}>
            <div style={styles.cardHeader}>
              <h1 style={styles.titleHeading}>
                {authMode === 'login' ? 'Entrar' : 'Recuperar acesso'}
              </h1>
              {authMode === 'forgot' && (
                <p style={styles.subtitle}>
                  Informe o e-mail cadastrado para receber o link de redefinição.
                </p>
              )}
            </div>

            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={authMode === 'login' ? handleLogin : handleForgotPassword}
              style={styles.form}
            >
              <div style={styles.field}>
                <label htmlFor="hub-login-email" style={styles.label}>Seu e-mail</label>
                <input
                  id="hub-login-email"
                  className="hub-login-field"
                  type="email"
                  placeholder="nome@empresa.com"
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {authMode === 'login' && (
                <div style={{ ...styles.field, marginTop: '18px' }}>
                  <label htmlFor="hub-login-password" style={styles.label}>Senha</label>
                  <div style={styles.passwordRow}>
                    <input
                      id="hub-login-password"
                      className="hub-login-field"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      style={{
                        ...styles.input,
                        height: '51px',
                        fontSize: '16px',
                        paddingTop: 0,
                        paddingBottom: 0,
                        paddingLeft: '21px',
                        paddingRight: '52px',
                        lineHeight: '49px',
                      }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      style={styles.eyeBtn}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                style={{
                  ...styles.submitBtn,
                  ...(loading ? { opacity: 0.88, cursor: 'wait' as const } : {}),
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  authMode === 'login' ? 'Entrar' : 'Enviar link'
                )}
              </button>

              {authMode === 'forgot' && (
                <button
                  type="button"
                  style={styles.textLinkBtn}
                  onClick={() => setAuthMode('login')}
                >
                  Voltar ao login
                </button>
              )}

              {authMode === 'login' && (
                <p style={styles.forgotRow}>
                  Esqueceu sua senha?{' '}
                  <button
                    type="button"
                    style={styles.inlineLink}
                    onClick={() => {
                      setError(null);
                      setAuthMode('forgot');
                    }}
                  >
                    Recuperar senha
                  </button>
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const fontSans = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const styles: Record<string, React.CSSProperties> = {
  promoIcon: {
    position: 'absolute',
    top: 'clamp(24px, 4vw, 40px)',
    left: 'clamp(24px, 4vw, 52px)',
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxSizing: 'border-box',
    zIndex: 2,
    pointerEvents: 'none',
  },
  formPanel: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    fontFamily: fontSans,
    boxSizing: 'border-box',
  },
  promoBottom: {
    width: '100%',
    maxWidth: '446px',
    height: '151px',
    marginLeft: '26px',
    marginRight: '26px',
    boxSizing: 'border-box',
  },
  promoKicker: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    fontFamily: fontSans,
  },
  promoTitle: {
    margin: '12px 0 0',
    fontSize: 'clamp(1.5rem, 2.8vw, 2.125rem)',
    fontWeight: 800,
    color: '#FFFFFF',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    fontFamily: fontSans,
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(28px, 6vw, 56px) clamp(24px, 5vw, 64px) 48px',
    minHeight: 0,
  },
  formShell: {
    width: '100%',
    maxWidth: '420px',
  },
  cardHeader: {
    marginBottom: '28px',
  },
  titleHeading: {
    margin: 0,
    fontFamily: fontSans,
    fontSize: '37px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: 0,
    lineHeight: 1.15,
  },
  subtitle: {
    margin: '12px 0 0',
    fontSize: '13px',
    fontWeight: 400,
    color: 'rgba(115, 115, 115, 1)',
    lineHeight: 1.5,
    maxWidth: '360px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  field: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    letterSpacing: '-0.01em',
  },
  passwordRow: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    paddingTop: '19px',
    paddingBottom: '19px',
    paddingLeft: '16px',
    paddingRight: '16px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    fontSize: '15px',
    fontWeight: 500,
    outline: 'none',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontFamily: fontSans,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    top: '25px',
    transform: 'translateY(-50%)',
    width: '39px',
    height: '39px',
    background: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(120, 120, 120, 1)',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    boxShadow: 'none',
  },
  submitBtn: {
    width: '100%',
    marginTop: '18px',
    marginBottom: '18px',
    boxSizing: 'border-box',
    minHeight: '59px',
    padding: '17px 16px',
    backgroundColor: 'var(--accent)',
    color: 'rgba(255, 255, 255, 1)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '17px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    cursor: 'pointer',
    fontFamily: fontSans,
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: fontSans,
    marginTop: '2px',
    textAlign: 'left' as const,
    padding: 0,
  },
  forgotRow: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#64748B',
    fontWeight: 500,
    lineHeight: 1.5,
    textAlign: 'center' as const,
  },
  inlineLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: 'var(--accent)',
    fontWeight: 650,
    cursor: 'pointer',
    fontSize: 'inherit',
    fontFamily: fontSans,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    color: '#EF4444',
    padding: '12px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
    border: '1px solid #FEE2E2',
  },
};

export default Login;

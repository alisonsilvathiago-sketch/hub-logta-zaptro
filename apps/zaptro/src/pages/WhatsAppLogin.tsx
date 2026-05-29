import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { hasRealConfig } from '../lib/supabase';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import {
  loginHintFromAuthError,
  syncZaptroAuthToAppContext,
} from '../lib/zaptroAuthSession';
import { profileHasZaptroWhatsappEntitlement } from '../utils/authProductGate';
import { ZAPTRO_APP_ROUTES } from '../app/zaptroAppRoutes';
import { fetchProfileSliceForGate } from '../utils/profileSelectFallback';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import { getDevRegisterPrefill } from '../utils/zaptroRegisterDevPrefill';

const ACCENT = '#D9FF00';
const INK = '#0f172a';
const MUTED = '#949494';

type LoginLocationState = {
  reason?: 'whatsapp_not_entitled' | 'auth_required';
};

const WhatsAppLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile, profile, user } = useAuth();
  const routeState = (location.state ?? null) as LoginLocationState | null;

  React.useEffect(() => {
    if (profile && user) {
      navigate(ZAPTRO_APP_ROUTES.INBOX, { replace: true });
    }
  }, [profile, user, navigate]);

  const devPrefill = getDevRegisterPrefill();
  const [email, setEmail] = useState(devPrefill?.email ?? '');
  const [password, setPassword] = useState(devPrefill?.password ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [banner, setBanner] = useState<string | null>(() => {
    if (!hasRealConfig) {
      return 'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em apps/zaptro/.env.local e reinicie o npm run dev.';
    }
    if (routeState?.reason === 'whatsapp_not_entitled') {
      return 'Esta conta não tem o módulo WhatsApp activo. Peça ao administrador ou conclua o cadastro em /registre.';
    }
    return null;
  });
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      setSessionChecking(true);
      try {
        const { data } = await supabaseZaptro.auth.getSession();
        if (cancelled || !data?.session?.user) return;

        await syncZaptroAuthToAppContext(data.session);

        const { data: profile, error } = await fetchProfileSliceForGate(
          supabaseZaptro,
          data.session.user.id,
        );

        if (cancelled) return;

        if (error || !profileHasZaptroWhatsappEntitlement(profile)) {
          await supabaseZaptro.auth.signOut();
          if (!cancelled) {
            setBanner(
              'Sessão sem permissão para o chat WhatsApp. Use uma conta com tem_zaptro activo no perfil.',
            );
          }
          return;
        }

        await refreshProfile();
        if (!cancelled) navigate(ZAPTRO_APP_ROUTES.INBOX, { replace: true });
      } finally {
        if (!cancelled) setSessionChecking(false);
      }
    };

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [navigate, refreshProfile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);

    const em = email.trim().toLowerCase();
    const pw = password.trim();

    if (!em) {
      notifyZaptro('warning', 'E-mail obrigatório', 'Preencha o e-mail Zaptro para entrar.');
      return;
    }
    if (!pw) {
      notifyZaptro('warning', 'Senha obrigatória', 'Digite sua senha e tente novamente.');
      return;
    }

    if (!hasRealConfig) {
      notifyZaptro(
        'error',
        'Supabase em falta',
        'Configure VITE_SUPABASE_URL e a chave anon em apps/zaptro/.env.local',
      );
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabaseZaptro.auth.signInWithPassword({ email: em, password: pw });

      if (error) {
        notifyZaptro('error', 'Não foi possível entrar', loginHintFromAuthError(error.message));
        return;
      }

      await syncZaptroAuthToAppContext(data.session);

      const uid = data.user?.id;
      if (!uid) {
        notifyZaptro('error', 'Sessão inválida', 'Tente entrar novamente.');
        await supabaseZaptro.auth.signOut();
        return;
      }

      const { data: profile, error: profErr } = await fetchProfileSliceForGate(supabaseZaptro, uid);

      if (profErr) {
        notifyZaptro('error', 'Perfil não carregado', profErr.message || 'Tente de novo em instantes.');
        await supabaseZaptro.auth.signOut();
        return;
      }

      if (!profileHasZaptroWhatsappEntitlement(profile)) {
        await supabaseZaptro.auth.signOut();
        setBanner(
          'Acesso negado: o seu perfil não tem o módulo WhatsApp (tem_zaptro). Conclua /registre ou peça activação ao administrador.',
        );
        return;
      }

      await refreshProfile();
      navigate(ZAPTRO_APP_ROUTES.INBOX, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const em = email.trim().toLowerCase();
    if (!em) {
      notifyZaptro('warning', 'E-mail', 'Indique o e-mail para receber o link de recuperação.');
      return;
    }
    if (!hasRealConfig) {
      notifyZaptro('error', 'Supabase em falta', 'Configure .env.local antes de recuperar a senha.');
      return;
    }
    setResetSent(false);
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabaseZaptro.auth.resetPasswordForEmail(em, { redirectTo });
    if (error) {
      notifyZaptro('error', 'Recuperação', loginHintFromAuthError(error.message));
      return;
    }
    setResetSent(true);
    notifyZaptro('success', 'E-mail enviado', 'Abra a caixa de entrada e siga o link para definir uma nova senha.');
  };

  const busy = loading || sessionChecking;

  return (
    <div className="zw-login-root" style={styles.root}>
      <aside className="zw-login-hero" style={styles.hero}>
        <div style={styles.heroGlowA} />
        <div style={styles.heroGlowB} />
        <div style={styles.heroInner}>
          <div style={styles.brandRow}>
            <div style={styles.logoBox}>
              <MessageSquare size={22} color={INK} strokeWidth={2.25} />
            </div>
            <span style={styles.brandName}>Zaptro</span>
          </div>
          <div className="zw-hero-copy" style={styles.heroCopy}>
            <p style={styles.heroEyebrow}>Você pode facilmente</p>
            <h2 style={styles.heroTitle}>
              Acessar sua central de multi-atendimento empresarial.
            </h2>
          </div>
          <div style={styles.heroBadges}>
            <span style={styles.heroBadge}>
              <ShieldCheck size={15} /> API Oficial
            </span>
            <span style={styles.heroBadge}>
              <Zap size={15} /> Alta performance
            </span>
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.formShell}>
          <div style={styles.formAccent}>
            <Sparkles size={18} color="#ea580c" strokeWidth={2} />
          </div>

          <header style={styles.formHeader}>
            <h1 style={styles.formTitle}>Entrar no Zaptro WhatsApp</h1>
            <p style={styles.formSubtitle}>
              Acesse filas, conversas e automações da sua operação — tudo em um só lugar, com a API
              oficial do WhatsApp.
            </p>
          </header>

          {banner ? (
            <div style={styles.alertBox} role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{banner}</span>
            </div>
          ) : null}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="zw-email" style={styles.label}>
                E-mail Zaptro
              </label>
              <div
                style={{
                  ...styles.inputWrapper,
                  ...(focusedField === 'email' ? styles.inputWrapperFocus : {}),
                }}
              >
                <Mail size={18} style={styles.fieldIcon} />
                <input
                  id="zw-email"
                  type="email"
                  placeholder="seu@email.com"
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="email"
                  required
                  disabled={busy}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="zw-password" style={styles.label}>
                Senha de atendente
              </label>
              <div
                style={{
                  ...styles.inputWrapper,
                  ...(focusedField === 'password' ? styles.inputWrapperFocus : {}),
                }}
              >
                <Lock size={18} style={styles.fieldIcon} />
                <input
                  id="zw-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  style={{ ...styles.input, paddingRight: 48 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="current-password"
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={busy}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" style={styles.loginBtn} disabled={busy}>
              {sessionChecking
                ? 'A verificar sessão…'
                : loading
                  ? 'A autenticar…'
                  : 'Entrar no chat'}
              {!busy && <ArrowRight size={18} />}
            </button>

            <button
              type="button"
              style={styles.forgotBtn}
              onClick={() => void handleForgotPassword()}
              disabled={busy}
            >
              Esqueci a senha
            </button>
            {resetSent ? (
              <p style={styles.resetHint}>Link de recuperação enviado — verifique o spam.</p>
            ) : null}
          </form>

          <footer style={styles.footer}>
            <p style={styles.footerText}>Ainda não usa nosso multi-atendimento?</p>
            <button
              type="button"
              style={styles.plansLink}
              onClick={() => navigate('/registre')}
            >
              Criar conta em /registre
            </button>
            <button
              type="button"
              style={{ ...styles.plansLink, marginTop: 8, color: MUTED, fontWeight: 600 }}
              onClick={() => navigate('/checkout-whatsapp')}
            >
              Ver planos WhatsApp
            </button>
          </footer>
        </div>
      </main>

      <style>{`
        .zw-login-root {
          max-width: 100vw;
          overflow-x: hidden;
        }
        @media (max-width: 900px) {
          .zw-login-root { flex-direction: column !important; }
          .zw-login-hero {
            flex: 0 0 auto !important;
            width: 100% !important;
            min-height: 220px !important;
          }
          .zw-login-hero .zw-hero-copy { margin-top: 24px !important; }
        }
        @media (min-width: 1400px) {
          .zw-login-root {
            justify-content: center;
          }
          .zw-login-hero {
            flex: 0 0 min(520px, 42vw) !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100dvh',
    width: '100%',
    maxWidth: '100vw',
    display: 'flex',
    flexDirection: 'row',
    fontFamily: 'inherit',
    overflow: 'hidden',
    background: '#fff',
    boxSizing: 'border-box',
  },
  hero: {
    position: 'relative',
    flex: '0 0 46%',
    minWidth: 0,
    maxWidth: 'min(560px, 50vw)',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: '48px 40px',
    boxSizing: 'border-box',
    background:
      'linear-gradient(145deg, #041208 0%, #0a1f0a 38%, #132816 72%, #1e3a24 100%)',
    overflow: 'hidden',
  },
  heroGlowA: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(217,255,0,0.35) 0%, transparent 68%)',
    top: '-12%',
    right: '-18%',
    pointerEvents: 'none',
  },
  heroGlowB: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(234,88,12,0.18) 0%, transparent 70%)',
    bottom: '-8%',
    left: '-12%',
    pointerEvents: 'none',
  },
  heroInner: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 440,
    minHeight: '100%',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 44,
    height: 44,
    backgroundColor: ACCENT,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(217,255,0,0.25)',
  },
  brandName: {
    fontSize: 22,
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '-0.03em',
  },
  heroCopy: {
    marginTop: 'auto',
    marginBottom: 'auto',
    padding: '32px 0',
  },
  heroEyebrow: {
    margin: '0 0 12px',
    fontSize: 14,
    fontWeight: 600,
    color: 'rgba(248,250,252,0.72)',
  },
  heroTitle: {
    margin: 0,
    fontSize: 'clamp(28px, 3.2vw, 40px)',
    fontWeight: 800,
    lineHeight: 1.12,
    letterSpacing: '-0.03em',
    color: '#fff',
  },
  heroBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(248,250,252,0.9)',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  main: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 28px',
    boxSizing: 'border-box',
    background: '#fff',
  },
  formShell: {
    width: '100%',
    maxWidth: 420,
  },
  formAccent: {
    marginBottom: 20,
  },
  formHeader: {
    marginBottom: 28,
  },
  formTitle: {
    margin: '0 0 10px',
    fontSize: 'clamp(26px, 2.8vw, 32px)',
    fontWeight: 800,
    color: INK,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  formSubtitle: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.55,
    color: MUTED,
    fontWeight: 500,
  },
  alertBox: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: '12px 14px',
    borderRadius: 12,
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    color: '#9a3412',
    fontSize: 13,
    lineHeight: 1.45,
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: INK,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    background: '#f4f4f4',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  },
  inputWrapperFocus: {
    borderColor: ACCENT,
    background: '#fff',
    boxShadow: '0 0 0 3px rgba(217,255,0,0.2)',
  },
  fieldIcon: {
    position: 'absolute',
    left: 16,
    color: '#949494',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '15px 16px 15px 48px',
    border: 'none',
    borderRadius: 14,
    background: 'transparent',
    fontSize: 15,
    fontWeight: 500,
    color: INK,
    outline: 'none',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    background: 'none',
    border: 'none',
    color: '#949494',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 4,
  },
  forgotBtn: {
    marginTop: 4,
    padding: '8px 4px',
    background: 'transparent',
    border: 'none',
    color: MUTED,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  resetHint: {
    margin: 0,
    fontSize: 12,
    color: '#15803d',
    textAlign: 'center',
    fontWeight: 600,
  },
  loginBtn: {
    marginTop: 4,
    padding: '16px 20px',
    backgroundColor: ACCENT,
    color: '#000',
    borderRadius: 14,
    border: 'none',
    fontWeight: 800,
    fontSize: 15,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: '0 12px 28px -8px rgba(217,255,0,0.55)',
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTop: '1px solid #e8e8e8',
    textAlign: 'center',
  },
  footerText: {
    margin: '0 0 12px',
    fontSize: 13,
    color: MUTED,
    fontWeight: 500,
  },
  plansLink: {
    background: 'transparent',
    border: 'none',
    padding: 0,
    color: '#ea580c',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    display: 'block',
    width: '100%',
  },
};

export default WhatsAppLogin;

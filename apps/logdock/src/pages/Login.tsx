import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/context/AuthContext';
import { supabase } from '@shared/lib/supabase';
import { Shield, ArrowRight, Lock, User, RefreshCw } from 'lucide-react';
import Button from '@shared/components/Button';
import { toast } from 'react-hot-toast';
import logoImg from '../assets/logo.png';
import Logo from '../components/Logo';

const LogDockLogin: React.FC = () => {
  const { user, profile, isLoading: authLoading, isLoggingIn, setIsLoggingIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Se o usuário já tiver perfil e estiver autenticado, redireciona para o app
    if (!authLoading && user && profile) {
      navigate('/app');
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Bem-vindo ao LogDock!');
      navigate('/app');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao entrar. Verifique suas credenciais.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error('Erro ao entrar com Google.');
    }
  };

  if (authLoading) {
    return (
      <div style={styles.loadingScreen}>
        <RefreshCw className="animate-spin" size={32} color="#2563EB" />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.header}>
          <div style={styles.logoRow}>
            <Logo style={{ height: '60px', width: 'auto' }} />
          </div>
          <p style={styles.subtitle}>Sua operação logística protegida no cofre digital.</p>
        </div>

        {user && !profile ? (
          <div style={styles.ssoBox}>
            <div style={styles.ssoHeader}>
              <div style={styles.userAvatar}>{user.email?.[0].toUpperCase()}</div>
              <div>
                <div style={styles.userName}>{user.email}</div>
                <div style={styles.userStatus}>Sessão ativa detectada</div>
              </div>
            </div>
            <p style={styles.ssoText}>Você já está autenticado via Hub Master. Clique abaixo para carregar seu container.</p>
            <Button 
              label="Acessar meu LogDock" 
              onClick={() => navigate('/app')} 
              primary 
              fullWidth 
              icon={<ArrowRight size={18} />} 
            />
            <button style={styles.switchAccount} onClick={() => supabase.auth.signOut()}>
              Entrar com outra conta
            </button>
          </div>
        ) : (
          <form style={styles.form} onSubmit={handleLogin}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>E-mail Corporativo</label>
              <div style={styles.inputWrapper}>
                <User size={18} color="#94A3B8" />
                <input 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input} 
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Senha de Acesso</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} color="#94A3B8" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input} 
                  required
                />
              </div>
            </div>

            <Button 
              label={isLoggingIn ? "Autenticando..." : "Entrar no logDock"} 
              type="submit"
              primary 
              fullWidth 
              loading={isLoggingIn}
              style={{ marginTop: '10px' }}
            />

            <div style={styles.divider}>
                <div style={styles.dividerLine} />
                <span style={styles.dividerText}>OU</span>
                <div style={styles.dividerLine} />
            </div>

            <button type="button" onClick={handleGoogleLogin} style={styles.googleBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar com Google
            </button>

            <div style={styles.footer}>
              <p>Esqueceu sua senha? <span style={styles.link}>Recuperar acesso</span></p>
            </div>
          </form>
        )}
      </div>

      <div style={styles.visualSection}>
        <div style={styles.overlay} />
        <div style={styles.visualContent}>
          <h2 style={styles.visualTitle}>Logística Inteligente. Armazenamento Seguro.</h2>
          <p style={styles.visualSubtitle}>O LogDock integra todos os seus documentos do Logta e Zaptro em um único container digital auditável.</p>
          <div style={styles.badges}>
            <div style={styles.badge}><Shield size={16} /> Encriptação de Ponta</div>
            <div style={styles.badge}><RefreshCw size={16} /> Sincronização em Tempo Real</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  loadingScreen: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#F9F9F7' },
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#F9F9F7', fontFamily: "'Inter', sans-serif", alignItems: 'center', justifyContent: 'center' },
  loginCard: { width: '450px', backgroundColor: '#FFF', padding: '60px', borderRadius: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', border: '1px solid #EAEAEA' },
  header: { marginBottom: '40px', textAlign: 'center' },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' },
  logoImage: { height: '54px', width: 'auto', objectFit: 'contain' },
  subtitle: { fontSize: '15px', color: '#666', lineHeight: '1.5', fontWeight: '500' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '800', color: '#1E1E1E', textTransform: 'uppercase', letterSpacing: '0.5px' },
  inputWrapper: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#FFFFFF', padding: '14px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' },
  input: { border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '15px', fontWeight: '600', color: '#1E1E1E' },
  footer: { marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' },
  link: { color: '#0061FF', fontWeight: '700', cursor: 'pointer' },
  ssoBox: { backgroundColor: '#F0F9FF', padding: '24px', borderRadius: '20px', border: '1px solid #BAE6FD', display: 'flex', flexDirection: 'column', gap: '20px' },
  ssoHeader: { display: 'flex', alignItems: 'center', gap: '16px' },
  userAvatar: { width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#0061FF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px' },
  userName: { fontSize: '16px', fontWeight: '800', color: '#1E1E1E' },
  userStatus: { fontSize: '12px', color: '#0061FF', fontWeight: '700' },
  ssoText: { fontSize: '14px', color: '#0369A1', lineHeight: '1.6' },
  switchAccount: { background: 'none', border: 'none', color: '#666', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' },
  visualSection: { display: 'none' }, // Remove visual section for clean Dropbox look
  overlay: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(15,23,42,0.8) 100%)', zIndex: 1 },
  visualContent: { zIndex: 2, maxWidth: '600px' },
  visualTitle: { fontSize: '48px', fontWeight: '900', color: 'white', marginBottom: '24px', lineHeight: '1.1', letterSpacing: '-2px' },
  visualSubtitle: { fontSize: '18px', color: '#94A3B8', marginBottom: '40px', lineHeight: '1.6' },
  badges: { display: 'flex', gap: '20px' },
  badge: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)' },
  googleBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', color: '#1E1E1E', fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' },
  divider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' },
  dividerLine: { flex: 1, height: '1px', backgroundColor: '#F1F5F9' },
  dividerText: { fontSize: '10px', fontWeight: '900', color: '#94A3B8' }
};

export default LogDockLogin;

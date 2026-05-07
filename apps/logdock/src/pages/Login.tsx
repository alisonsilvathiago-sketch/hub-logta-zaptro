import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/context/AuthContext';
import { supabase } from '@shared/lib/supabase';
import { Shield, Sparkles, ShieldCheck, Brain, HardDrive, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Logo from '../components/Logo';

const LogDockLogin: React.FC = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomePhase, setWelcomePhase] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Se o usuário acabar de logar (ou já estiver logado), inicia a animação de boas-vindas
    if (!authLoading && user && !showWelcome) {
      setShowWelcome(true);
    }
  }, [user, authLoading, showWelcome]);

  // Sequência de animação da tela de boas-vindas EXATA como pedido
  useEffect(() => {
    if (showWelcome) {
      const timers = [
        setTimeout(() => setWelcomePhase(1), 1000), // "Olá, {nome}"
        setTimeout(() => setWelcomePhase(2), 2500), // "Bem-vindo"
        setTimeout(() => setWelcomePhase(3), 4000), // "ao seu sistema inteligente"
        setTimeout(() => navigate('/app/inicio'), 6000)
      ];
      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [showWelcome, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app/inicio`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conectar com Google. Verifique sua conexão.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsAuthLoading(true);
    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Login realizado!');
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: `${window.location.origin}/app` }
        });
        if (error) throw error;
        toast.success('Cadastro realizado! Verifique seu e-mail.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro na autenticação');
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={styles.loadingScreen}>
        <RefreshCw className="animate-spin" size={48} color="#0061FF" />
      </div>
    );
  }

  // TELA DE BOAS-VINDAS PREMIUM (Fundo Branco como pedido)
  if (showWelcome) {
    const userName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';
    
    return (
      <div style={styles.welcomeScreen}>
         <div style={styles.welcomeContent}>
            {welcomePhase === 1 && (
              <div style={styles.phaseContainer} key="phase1">
                <h1 style={styles.welcomeText}>Olá, <span style={styles.gradientText}>{userName}</span></h1>
              </div>
            )}
            
            {welcomePhase === 2 && (
              <div style={styles.phaseContainer} key="phase2">
                <h1 style={styles.welcomeText}>Bem-vindo</h1>
              </div>
            )}

            {welcomePhase >= 3 && (
              <div style={styles.phaseContainer} key="phase3">
                <h1 style={styles.welcomeText}>ao seu <span style={styles.gradientText}>sistema inteligente</span></h1>
                <div style={styles.progressContainer}>
                  <div style={styles.progressFill} />
                </div>
              </div>
            )}
         </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes meshMove {
            0% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
            100% { background-position: 0% 0%; }
          }
          @keyframes fadeInSlide {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes progressGrow {
            from { width: 0%; }
            to { width: 100%; }
          }
          .google-btn:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0, 97, 255, 0.15);
            background-color: #F8FAFC;
          }
          .google-btn:active {
            transform: translateY(-1px);
          }
        `}
      </style>

      {/* PAINEL VISUAL (MESH GRADIENT) */}
      <div style={styles.visualSection}>
        <div style={styles.meshGradient} />
        <div style={styles.visualOverlay} />
        
        <div style={styles.visualContent}>
          <div style={styles.visualLogo}>
             <Logo size={40} color="white" />
          </div>
          
          <div style={{ marginTop: 'auto' }}>
            <div style={styles.statusBadge}>
               <div style={styles.statusDot} />
               <span>SISTEMA OPERACIONAL • IA ATIVA</span>
            </div>
            
            <h1 style={styles.visualTitle}>
              LogDock Intelligence
            </h1>
            <p style={styles.visualSubtitle}>
              A evolução da gestão de documentos logísticos com inteligência artificial cognitiva.
            </p>
            
            <div style={styles.visualFeatures}>
              <div style={styles.visualFeature}>
                <div style={styles.featureIcon}><ShieldCheck size={18} /></div>
                <div>
                  <div style={styles.featureName}>Segurança Militar</div>
                  <div style={styles.featureDesc}>Criptografia AES-256 e RLS ativo.</div>
                </div>
              </div>
              <div style={styles.visualFeature}>
                <div style={styles.featureIcon}><Brain size={18} /></div>
                <div>
                  <div style={styles.featureName}>Cérebro LogDock</div>
                  <div style={styles.featureDesc}>Organização automática via visão computacional.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAINEL DE LOGIN (SIMPLIFICADO GOOGLE) */}
      <div style={styles.formSection}>
        <div style={styles.formContainer}>
          <div style={styles.header}>
            <div style={styles.formIcon}>
               <HardDrive size={32} color="#0061FF" />
            </div>
            <h2 style={styles.formTitle}>{isLoginMode ? 'Bem-vindo ao Futuro' : 'Crie sua Conta'}</h2>
            <p style={styles.formSubtitle}>
              Acesse sua central inteligente utilizando sua conta corporativa.
            </p>
          </div>

          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>E-mail Corporativo</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemplo@empresa.com"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Senha de Acesso</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                required
              />
            </div>

            <button type="submit" disabled={isAuthLoading} style={styles.submitBtn}>
              {isAuthLoading ? <RefreshCw className="animate-spin" size={20} /> : (isLoginMode ? 'Entrar no Sistema' : 'Criar Conta Inteligente')}
            </button>

            <button type="button" onClick={handleGoogleLogin} className="google-btn" style={styles.googleFullBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.86 0-5.29 1.93-6.16 4.53l-3.66 2.84C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84C6.71 16.71 9.14 18.64 12 18.64c1.62 0 3.06-.56 4.21-1.64l3.15 3.15c-1.82 1.68-4.31 2.66-7.28 2.66-4.3 0-8.01-2.47-9.82-6.07l3.66-2.84c.87 2.6 3.3 4.53 6.16 4.53z" fill="#EA4335"/>
                </svg>
                Entrar com Google
            </button>

            <p style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>
              {isLoginMode ? 'Não tem conta?' : 'Já tem conta?'} {' '}
              <span 
                onClick={() => setIsLoginMode(!isLoginMode)}
                style={{ color: '#0061FF', fontWeight: 800, cursor: 'pointer' }}
              >
                {isLoginMode ? 'Cadastre-se' : 'Faça login'}
              </span>
            </p>
          </form>

          <div style={styles.formFooter}>
            <div style={styles.divider}>
                <div style={styles.dividerLine} />
                <span style={styles.dividerText}>SECURITY CORE</span>
                <div style={styles.dividerLine} />
            </div>
            <div style={styles.trustBadgesDark}>
               <div style={styles.trustBadgeDark}>ISO 27001</div>
               <div style={styles.trustBadgeDark}>LGPD READY</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#FFF', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
  loadingScreen: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#FFF' },
  
  // Welcome Screen (White background as requested)
  welcomeScreen: { position: 'fixed', inset: 0, backgroundColor: '#FFF', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  welcomeContent: { maxWidth: '800px', padding: '40px' },
  phaseContainer: { animation: 'fadeInSlide 1s cubic-bezier(0.16, 1, 0.3, 1) forwards' },
  welcomeText: { fontSize: '56px', fontWeight: 900, color: '#0F172A', letterSpacing: '-2px', marginBottom: '16px' },
  gradientText: { 
    background: 'linear-gradient(to right, #0061FF, #60A5FA)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 900
  },
  progressContainer: { width: '240px', height: '4px', backgroundColor: '#F1F5F9', margin: '48px auto 0', borderRadius: '100px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#0061FF', animation: 'progressGrow 2.5s ease-in-out infinite' },

  // Left Panel
  visualSection: { flex: 1.2, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '80px' },
  meshGradient: { 
    position: 'absolute', 
    inset: 0, 
    background: '#000',
    backgroundImage: `
      radial-gradient(at 0% 0%, #0061FF 0%, transparent 50%),
      radial-gradient(at 100% 0%, #000 0%, transparent 50%),
      radial-gradient(at 100% 100%, #0061FF 0%, transparent 50%),
      radial-gradient(at 0% 100%, #000 0%, transparent 50%)
    `,
    backgroundSize: '150% 150%',
    animation: 'meshMove 20s ease infinite alternate',
    zIndex: 0 
  },
  visualOverlay: { 
    position: 'absolute', 
    inset: 0, 
    background: 'rgba(0,0,0,0.3)', 
    zIndex: 1 
  },
  visualContent: { position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' },
  visualLogo: { width: '72px', height: '72px', backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', border: '1px solid rgba(255,255,255,0.1)' },
  
  statusBadge: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderRadius: '100px', width: 'fit-content', fontSize: '10px', fontWeight: 900, color: '#FFF', letterSpacing: '2px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 12px #10B981' },

  visualTitle: { fontSize: '64px', fontWeight: 950, color: 'white', lineHeight: '1', maxWidth: '500px', marginBottom: '24px', letterSpacing: '-3px' },
  visualSubtitle: { fontSize: '20px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', maxWidth: '480px', marginBottom: '64px', fontWeight: 500 },
  
  visualFeatures: { display: 'flex', flexDirection: 'column', gap: '24px' },
  visualFeature: { display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', backgroundColor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', width: 'fit-content' },
  featureIcon: { width: '48px', height: '48px', borderRadius: '16px', backgroundColor: 'rgba(0,97,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0061FF' },
  featureName: { fontSize: '17px', fontWeight: 900, color: '#FFF' },
  featureDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginTop: '4px' },
  
  // Right Panel
  formSection: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', backgroundColor: '#FFF' },
  formContainer: { width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', textAlign: 'center' },
  formIcon: { width: '80px', height: '80px', backgroundColor: '#F0F7FF', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', margin: '0 auto 32px' },
  header: { marginBottom: '48px' },
  formTitle: { fontSize: '40px', fontWeight: 950, color: '#0F172A', marginBottom: '16px', letterSpacing: '-1.5px' },
  formSubtitle: { fontSize: '17px', color: '#64748B', lineHeight: '1.6', fontWeight: 500 },
  
  googleFullBtn: { width: '100%', height: '64px', borderRadius: '20px', border: '1.5px solid #E2E8F0', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '17px', fontWeight: 800, color: '#0F172A', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  
  divider: { display: 'flex', alignItems: 'center', gap: '20px', margin: '24px 0' },
  dividerLine: { flex: 1, height: '1.5px', backgroundColor: '#F1F5F9' },
  dividerText: { fontSize: '10px', color: '#CBD5E1', fontWeight: 900, whiteSpace: 'nowrap', letterSpacing: '2px' },
  
  formFooter: { marginTop: '24px' },
  trustBadgesDark: { display: 'flex', justifyContent: 'center', gap: '24px', opacity: 0.5 },
  trustBadgeDark: { fontSize: '10px', fontWeight: 900, color: '#64748B', letterSpacing: '1.5px' },
  link: { color: '#0061FF', fontWeight: '900', cursor: 'pointer' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' },
  inputLabel: { fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' },
  input: { padding: '14px 20px', borderRadius: '14px', border: '1.5px solid #E2E8F0', fontSize: '15px', fontWeight: 600, outline: 'none', transition: 'all 0.2s', color: '#0F172A' },
  submitBtn: { width: '100%', height: '56px', borderRadius: '16px', backgroundColor: '#0061FF', color: '#FFF', border: 'none', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', marginTop: '8px' },
};

export default LogDockLogin;

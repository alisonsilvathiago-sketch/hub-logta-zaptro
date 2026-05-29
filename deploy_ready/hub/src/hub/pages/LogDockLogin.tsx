import React, { useState, useEffect } from 'react';
import { 
  Lock, Mail, ArrowRight, Eye, EyeOff, Loader2,
  ShieldCheck, Globe, CheckCircle2,
  AlertCircle, Cloud, Layout, Zap, Shield,
  HardDrive, Smartphone, FolderLock, Box, Square, 
  ChevronRight, Folder, LayoutGrid, LockKeyhole
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError } from '@core/lib/toast';
import { useNavigate } from 'react-router-dom';

const LogDockLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- INTELIGÊNCIA DE AUTO-LOGIN (SSO) ---
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const devSession = localStorage.getItem('hub-dev-session');
      
      if (session || devSession) {
        toastSuccess('Acesso autorizado. Entrando no LogDock...');
        setTimeout(() => navigate('/logdock/app'), 800);
      } else {
        setCheckingSession(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) throw authError;

      if (data.user) {
        localStorage.setItem('hub-login-context', 'logdock');
        toastSuccess('Bem-vindo ao LogDock!');
        navigate('/logdock/app');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar. Verifique suas credenciais.');
      toastError('Falha no login');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loaderBox}>
          <Loader2 className="animate-spin" size={48} color="#2563EB" />
          <h2 style={styles.loadingText}>Sincronizando seu LogDock...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.mainWrapper}>
        
        {/* COLUNA ESQUERDA: VISUAL / BRANDING */}
        <div style={styles.leftColumn}>
          <div style={styles.brandingHeader}>
            <div style={styles.logoWrapper}>
               <div style={styles.logoIcon}>
                  <Box size={32} color="white" />
               </div>
               <div style={styles.logoText}>
                  <span style={styles.logoMain}>LOGDOCK</span>
                  <span style={styles.logoSub}>.COM.BR</span>
               </div>
            </div>
          </div>

          <div style={styles.heroSection}>
            <div style={styles.containerVisual}>
              <img 
                src="/logta-container-hero.png" 
                alt="LogDock Container" 
                style={styles.heroImage} 
                className="heroImage"
              />
            </div>
            
            <div style={styles.heroText}>
              <h1 style={styles.heroTitle}>O container digital da sua <br/> operação <span style={{color: '#2563EB'}}>logística</span></h1>
              <p style={styles.heroSubtitle}>
                Tudo que acontece na sua operação, guardado automaticamente. Segurança, prova digital e organização em um só lugar.
              </p>
            </div>
          </div>

          <div style={styles.benefitGrid}>
            <div style={styles.benefitItem}>
              <div style={styles.benefitIcon}><Shield size={22} color="#2563EB" /></div>
              <span>Prova Digital <br/> Inviolável</span>
            </div>
            <div style={styles.benefitItem}>
              <div style={styles.benefitIcon}><Zap size={22} color="#2563EB" /></div>
              <span>Sincronização <br/> em Tempo Real</span>
            </div>
            <div style={styles.benefitItem}>
              <div style={styles.benefitIcon}><LayoutGrid size={22} color="#2563EB" /></div>
              <span>Organização <br/> por Container</span>
            </div>
            <div style={styles.benefitItem}>
              <div style={styles.benefitIcon}><LockKeyhole size={22} color="#2563EB" /></div>
              <span>Segurança <br/> Guardião</span>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO */}
        <div style={styles.rightColumn}>
          <div style={styles.loginCard}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>Acesse sua conta</h2>
              <p style={styles.formSubtitle}>Entre para gerenciar seus arquivos</p>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>E-mail ou usuário</label>
                <div style={styles.inputField}>
                  <Mail size={20} style={styles.fieldIcon} />
                  <input 
                    type="email" 
                    placeholder="Digite seu e-mail ou usuário" 
                    style={styles.input} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Senha</label>
                <div style={styles.inputField}>
                  <Lock size={20} style={styles.fieldIcon} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Digite sua senha" 
                    style={styles.input} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    style={styles.eyeToggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={styles.formOptions}>
                <label style={styles.remember}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span>Lembrar de mim</span>
                </label>
                <span style={styles.forgotLink}>Esqueceu sua senha?</span>
              </div>

              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? <Loader2 size={22} className="animate-spin" /> : 'Entrar no LogDock'}
              </button>
            </form>

            <div style={styles.separator}>
              <div style={styles.line} />
              <span style={styles.sepText}>ou</span>
              <div style={styles.line} />
            </div>

            <button style={styles.googleBtn}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '18px'}} />
              <span>Entrar com Google</span>
            </button>

            <div style={styles.signupBox}>
              Novo por aqui? <span style={styles.signupLink}>Contratar LogDock</span>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER DE SEGURANÇA */}
      <div style={styles.pageFooter}>
        <Lock size={14} color="#94A3B8" />
        <span>Sua operação protegida pelo sistema Guardião de Criptografia.</span>
      </div>

      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .heroImage { animation: float 4s ease-in-out infinite; }
        input::placeholder { color: #94A3B8; font-weight: 500; }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { height: '100vh', width: '100vw', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif', overflow: 'hidden', position: 'relative' },
  loadingPage: { height: '100vh', width: '100vw', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif' },
  loaderBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
  loadingText: { fontSize: '16px', fontWeight: '700', color: '#2563EB', letterSpacing: '0.5px' },
  mainWrapper: { display: 'flex', width: '100%', height: '100%', maxWidth: '1440px' },
  
  // COLUNA ESQUERDA
  leftColumn: { flex: 1.2, padding: '60px 100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  brandingHeader: { marginBottom: '20px' },
  logoWrapper: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' },
  logoIcon: { width: '48px', height: '48px', backgroundColor: '#2563EB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)' },
  logoText: { display: 'flex', alignItems: 'baseline', gap: '2px' },
  logoMain: { fontSize: '28px', fontWeight: '900', color: '#0F172A', letterSpacing: '-1.5px' },
  logoSub: { fontSize: '16px', fontWeight: '700', color: '#2563EB', opacity: 0.8 },
  heroSection: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '20px' },
  containerVisual: { position: 'relative', width: '100%', maxWidth: '650px', marginBottom: '40px' },
  heroImage: { width: '100%', height: 'auto', objectFit: 'contain' },
  heroText: { maxWidth: '520px' },
  heroTitle: { fontSize: '48px', fontWeight: '900', color: '#0F172A', marginBottom: '16px', lineHeight: '1.05', letterSpacing: '-1.8px' },
  heroSubtitle: { fontSize: '19px', color: '#64748B', lineHeight: '1.5', fontWeight: '500', opacity: 0.9 },
  benefitGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '10px' },
  benefitItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: '700', fontSize: '12px', textAlign: 'center' },
  benefitIcon: { width: '44px', height: '44px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // COLUNA DIREITA
  rightColumn: { flex: 1, backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  loginCard: { width: '100%', maxWidth: '520px', backgroundColor: '#FFF', borderRadius: '32px', padding: '64px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0' },
  formHeader: { textAlign: 'center', marginBottom: '52px' },
  formTitle: { fontSize: '36px', fontWeight: '900', color: '#0F172A', marginBottom: '14px', letterSpacing: '-1.5px' },
  formSubtitle: { fontSize: '17px', color: '#64748B', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '28px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '15px', fontWeight: '700', color: '#1E293B' },
  inputField: { position: 'relative', display: 'flex', alignItems: 'center' },
  fieldIcon: { position: 'absolute', left: '18px', color: '#94A3B8' },
  input: { width: '100%', padding: '18px 18px 18px 56px', borderRadius: '14px', border: '1.5px solid #E2E8F0', fontSize: '16px', fontWeight: '600', outline: 'none', transition: 'all 0.2s', color: '#0F172A', backgroundColor: '#FBFBFE' },
  eyeToggle: { position: 'absolute', right: '18px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' },
  formOptions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginTop: '-8px' },
  remember: { display: 'flex', alignItems: 'center', gap: '10px', color: '#64748B', fontWeight: '600', cursor: 'pointer' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer', accentColor: '#2563EB', borderRadius: '6px' },
  forgotLink: { color: '#3B82F6', fontWeight: '700', cursor: 'pointer' },
  submitBtn: { width: '100%', padding: '20px', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '14px', fontSize: '17px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' },
  separator: { display: 'flex', alignItems: 'center', gap: '20px', margin: '36px 0' },
  line: { flex: 1, height: '1px', backgroundColor: '#E2E8F0' },
  sepText: { fontSize: '14px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  googleBtn: { width: '100%', padding: '18px', backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '16px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', cursor: 'pointer', transition: 'all 0.2s' },
  signupBox: { marginTop: '36px', textAlign: 'center', fontSize: '16px', color: '#64748B', fontWeight: '600' },
  signupLink: { color: '#2563EB', fontWeight: '800', cursor: 'pointer' },
  errorBox: { backgroundColor: '#FEF2F2', color: '#EF4444', padding: '16px 20px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', border: '1px solid #FEE2E2' },
  pageFooter: { position: 'absolute', bottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#94A3B8', fontSize: '12px', fontWeight: '600' }
};

export default LogDockLogin;

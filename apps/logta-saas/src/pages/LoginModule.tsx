import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { hasRealConfig, supabase, supabaseUrl } from '../lib/supabase';
import { signInWithPasswordWithTimeout } from '../lib/authSession';
import { LOGTA_SESSION_BOOT_FLAG } from '../components/SessionBootLoader';
import { isLogtaDemoLogin } from '../lib/logtaDemoAuth';
/** Hero da coluna esquerda — `public/login-hero-containers.png` (atualize o arquivo sem rebuild). */
const LOGIN_HERO_URL = '/login-hero-containers.png';

/** Marca Logta no login: glifo azul + wordmark (alinhado ao layout HTML de referência). */
const LoginBrandWordmark = () => (
  <div className="mb-4 flex flex-wrap items-center justify-center gap-2.5 sm:mb-5 sm:gap-2.5" aria-label="Logta">
    <svg
      className="h-10 w-10 shrink-0 sm:h-11 sm:w-11 md:h-12 md:w-12"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M10 10 V90 H90 V60 H40 V10 Z" fill="#2563EB" />
      <rect x="50" y="10" width="40" height="40" fill="#2563EB" />
    </svg>
    <div
      className="flex items-start text-[#0f172a]"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      <span className="text-2xl font-extrabold leading-none tracking-[-0.04em] sm:text-3xl md:text-4xl">
        Logta
      </span>
      <sup className="ml-0.5 mt-0.5 text-[10px] font-extrabold leading-none sm:mt-1 sm:text-xs md:text-sm">®</sup>
    </div>
  </div>
);

const GoogleMark = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const { updateConfig } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('logta-public-auth');
    return () => {
      document.body.classList.remove('logta-public-auth');
    };
  }, []);

  const handleEmailBlur = () => {
    if (email.includes('@transportessilva.com')) {
      updateConfig({
        companyName: 'Transportes Silva',
        primaryColor: '#F97316',
      });
    } else if (email.includes('@logta.com')) {
      updateConfig({
        companyName: 'LOGTA',
        primaryColor: '#2563EB',
      });
    } else if (email.includes('@varejoglobal.com')) {
      updateConfig({
        companyName: 'Varejo Global',
        primaryColor: '#10B981',
      });
    } else if (email.includes('@zaptro.com')) {
      updateConfig({
        companyName: 'Zaptro Hub',
        primaryColor: '#8B5CF6',
      });
    }
  };

  const grantDemoSessionAndEnter = () => {
    try {
      sessionStorage.setItem(LOGTA_SESSION_BOOT_FLAG, '1');
    } catch {
      /* ignore */
    }
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '/inicio';
    navigate(next, { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailNorm = email.trim().toLowerCase();
    const passwordNorm = password;

    /** Credenciais locais — entra direto, sem esperar Supabase. */
    if (isLogtaDemoLogin(emailNorm, passwordNorm)) {
      grantDemoSessionAndEnter();
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signInWithPasswordWithTimeout(emailNorm, passwordNorm);

      if (error) {
        console.error('Login error:', error.message);

        if (isLogtaDemoLogin(emailNorm, passwordNorm)) {
          grantDemoSessionAndEnter();
          return;
        }

        setErrorMsg(
          error.message.includes('Email not confirmed')
            ? 'Confirme o e-mail no Supabase ou use logta@teste.com em ambiente local.'
            : error.name === 'AuthTimeout'
              ? 'Servidor de autenticação demorou demais. Tente de novo ou use logta@teste.com no local.'
              : 'E-mail ou senha inválidos.',
        );
        return;
      }

      if (data?.session) {
        grantDemoSessionAndEnter();
        return;
      }

      setErrorMsg('Não foi possível iniciar a sessão. Tente novamente.');
    } catch (err: unknown) {
      console.error('Unexpected auth error:', err);
      if (isLogtaDemoLogin(emailNorm, passwordNorm)) {
        grantDemoSessionAndEnter();
        return;
      }
      setErrorMsg('Falha na conexão com o servidor de autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthError(null);
    if (!hasRealConfig) {
      setOauthError(
        'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env (veja o painel Supabase → Settings → API) e reinicie o servidor de desenvolvimento.',
      );
      return;
    }

    const baseUrl = supabaseUrl.replace(/\/$/, '');
    try {
      const ctrl = new AbortController();
      const tid = window.setTimeout(() => ctrl.abort(), 12_000);
      const res = await fetch(`${baseUrl}/auth/v1/health`, {
        signal: ctrl.signal,
        credentials: 'omit',
      });
      window.clearTimeout(tid);
      if (res.status >= 500) {
        setOauthError(
          'O Supabase não está respondendo. No dashboard, confira se o projeto está ativo (não pausado).',
        );
        return;
      }
    } catch {
      setOauthError(
        'Não foi possível conectar ao Supabase. Confira se a URL no .env está idêntica à de Settings → API (erros comuns: projeto errado, digitação tipo “las” no lugar de “ias”, ou projeto removido).',
      );
      return;
    }

    setOauthLoading(true);
    const next = encodeURIComponent('/inicio');
    const redirectTo = `${window.location.origin}/auth/callback?next=${next}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) {
      setOauthError(error.message);
      setOauthLoading(false);
      return;
    }
    if (data?.url) {
      window.location.assign(data.url);
      return;
    }
    setOauthLoading(false);
  };

  return (
    <div className="flex h-screen overflow-y-auto w-full items-stretch bg-white selection:bg-primary/30 font-sans">
      <div className="relative hidden min-h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-black to-gray-900 lg:flex lg:w-1/2 lg:min-w-0">
        <div className="relative flex h-full min-h-[100dvh] w-full flex-col justify-end">
          <img
            src={LOGIN_HERO_URL}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/45"
            aria-hidden
          />
          <div className="relative z-10 w-full px-8 pb-12 pt-8 sm:px-12 sm:pb-16 lg:px-14 lg:pb-20">
            <div className="max-w-md space-y-6">
              <span className="text-sm font-bold uppercase tracking-normal text-white/70">
                Plataforma SaaS
              </span>
              <h2 className="text-4xl font-black leading-[1.15] tracking-tight !text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
                O controle completo da sua logística, simplificado.
              </h2>
              <p className="text-lg font-medium leading-relaxed text-white/85 [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]">
                Tenha visibilidade total em tempo real sobre frotas, fretes e resultados operacionais em uma
                única tela inteligente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right column: logo + formulário; padding equilibrado (evita “vazio” de 170px) */}
      <div className="relative z-10 flex min-h-[100dvh] w-full flex-1 flex-col items-center justify-center self-stretch overflow-x-hidden overflow-y-auto px-6 py-10 animate-in fade-in duration-1000 sm:px-10 sm:py-12 lg:w-1/2 lg:min-w-0 lg:flex-initial lg:px-[119px] lg:py-14 xl:px-[119px]">
        <div className="mx-auto flex w-full max-w-[866px] flex-col items-center justify-start gap-7 sm:gap-8">
          <div className="flex w-full max-w-md flex-col items-center text-center">
            <LoginBrandWordmark />
            <h1 className="mb-2 text-3xl font-black tracking-tight !text-gray-900 sm:text-4xl">Acessar agora</h1>
            <p className="mx-auto max-w-[280px] text-pretty text-sm font-medium text-gray-500 sm:max-w-sm">
              Insira seu e-mail corporativo e senha de acesso abaixo.
            </p>
            {import.meta.env.DEV ? (
              <p className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
                Local: <span className="font-mono">logta@teste.com</span> · senha <span className="font-mono">123456</span>
              </p>
            ) : null}
          </div>

          <form onSubmit={handleLogin} className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-0">
              <label className="ml-1 mb-10 flex h-8 items-center text-xs font-black uppercase tracking-normal text-gray-700">
                E-mail Corporativo
              </label>
              <div className="relative group">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="voce@empresa.com.br"
                  className="w-full px-5 py-4 bg-white border border-gray-200 hover:border-gray-300 focus:border-primary rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 px-1">
                <label className="py-[3px] text-xs font-black uppercase tracking-normal text-gray-700">Senha de Acesso</label>
                <a href="#" className="shrink-0 text-xs font-bold text-primary hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full h-[60px] pl-5 pr-12 py-4 bg-white border border-gray-200 hover:border-gray-300 focus:border-primary rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            {errorMsg ? (
              <p className="text-center text-xs font-semibold text-red-600 mt-2" role="alert">
                {errorMsg}
              </p>
            ) : null}

            <button 
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-[23px] text-[15px] font-black uppercase tracking-normal text-white shadow-xl shadow-primary/20 transition-all duration-300 hover:opacity-95 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Social login divider */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs font-black uppercase tracking-normal text-gray-400">
              <span className="bg-white px-4">ou continue com</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={oauthLoading || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 px-4 text-xs font-bold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Entrar com Google"
            >
              {oauthLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
              ) : (
                <GoogleMark />
              )}
              Google
            </button>
            {oauthError ? (
              <p className="mt-3 text-center text-xs font-semibold text-red-600" role="alert">
                {oauthError}
              </p>
            ) : null}
          </div>

          <p className="mx-auto max-w-md text-center text-xs font-bold text-gray-400">
            Novo na LOGTA?{' '}
            <Link to="/registrar" className="text-primary hover:underline">
              Teste grátis por 5 dias
            </Link>
            {' · '}
            <a href="#" className="text-gray-500 hover:text-primary hover:underline">
              Falar com consultor
            </a>
          </p>
        </div>
      </div>
      
    </div>
  );
};

export default Login;

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Truck } from 'lucide-react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { hasRealConfig, supabase } from '@/lib/supabase';
import { logstokaSignIn } from '@/lib/logstokaAuthSession';
import {
  LOGSTOKA_DEMO_LOGIN_EMAIL,
  LOGSTOKA_DEMO_LOGIN_PASSWORD,
  isLogstokaDemoLogin,
} from '@/lib/logstokaDemoAuth';

const LOGIN_HERO_URL = '/login-hero-containers.png';

const LoginBrandWordmark = () => (
  <div className="mb-4 flex flex-wrap items-center justify-center gap-2.5 sm:mb-5" aria-label="LogStoka">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#111827] text-white sm:h-12 sm:w-12">
      <Truck size={24} strokeWidth={2.2} />
    </span>
    <div className="flex items-start text-[#0f172a]">
      <span className="text-2xl font-extrabold leading-none tracking-[-0.04em] sm:text-3xl md:text-4xl">
        LogStoka
      </span>
      <sup className="ml-0.5 mt-0.5 text-[10px] font-extrabold leading-none sm:mt-1 sm:text-xs md:text-sm">
        ®
      </sup>
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

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('logstoka-public-auth');
    return () => {
      document.body.classList.remove('logstoka-public-auth');
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/app';
      navigate(next, { replace: true });
    }
  }, [user, authLoading, navigate]);

  const goNext = () => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '/app';
    window.location.href = next.startsWith('/') ? next : '/app';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailNorm = email.trim().toLowerCase();
    const passwordNorm = password;

    if (isLogstokaDemoLogin(emailNorm, passwordNorm)) {
      await logstokaSignIn(emailNorm, passwordNorm);
      goNext();
      return;
    }

    setIsLoading(true);

    try {
      const result = await logstokaSignIn(emailNorm, passwordNorm);

      if (result.ok) {
        goNext();
        return;
      }

      const error = result.error as { message?: string; name?: string } | undefined;
      setErrorMsg(
        error?.message?.includes('Email not confirmed')
          ? 'Confirme o e-mail no Supabase ou use logstoka@teste.com em ambiente local.'
          : error?.name === 'AuthTimeout'
            ? 'Servidor de autenticação demorou demais. Use logstoka@teste.com no local.'
            : 'E-mail ou senha inválidos.',
      );
    } catch {
      if (isLogstokaDemoLogin(emailNorm, passwordNorm)) {
        await logstokaSignIn(emailNorm, passwordNorm);
        goNext();
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
      setOauthError('Configure Supabase no .env e reinicie o servidor, ou use logstoka@teste.com / 123456.');
      return;
    }

    setOauthLoading(true);
    const next = encodeURIComponent('/app');
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-stretch overflow-y-auto bg-white font-sans selection:bg-orange-500/25">
      <div className="relative hidden min-h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-black to-gray-900 lg:flex lg:w-1/2 lg:min-w-0">
        <div className="relative flex h-full min-h-[100dvh] w-full flex-col justify-end">
          <img
            src={LOGIN_HERO_URL}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50"
            aria-hidden
          />
          <div className="relative z-10 w-full px-8 pb-12 pt-8 sm:px-12 sm:pb-16 lg:px-14 lg:pb-20">
            <div className="max-w-md space-y-6">
              <span className="text-sm font-bold uppercase tracking-normal text-white/70">WMS · Estoque</span>
              <h2 className="text-4xl font-black leading-[1.15] tracking-tight !text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
                Controle de estoque multicanal, simplificado.
              </h2>
              <p className="text-lg font-medium leading-relaxed text-white/85 [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]">
                Entradas, saídas, inventário e integrações em uma operação única — com IA operacional
                LogStoka.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[100dvh] w-full flex-1 flex-col items-center justify-center self-stretch overflow-x-hidden overflow-y-auto px-6 py-10 sm:px-10 sm:py-12 lg:w-1/2 lg:min-w-0 lg:flex-initial lg:px-[119px] lg:py-14 xl:px-[119px]">
        <div className="mx-auto flex w-full max-w-[866px] flex-col items-center justify-start gap-7 sm:gap-8">
          <div className="flex w-full max-w-md flex-col items-center text-center">
            <LoginBrandWordmark />
            <h1 className="mb-2 text-3xl font-black tracking-tight !text-gray-900 sm:text-4xl">Acessar agora</h1>
            <p className="mx-auto max-w-[280px] text-pretty text-sm font-medium text-gray-500 sm:max-w-sm">
              Insira seu e-mail corporativo e senha de acesso abaixo.
            </p>
            <p className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
              Acesso local: <span className="font-mono">{LOGSTOKA_DEMO_LOGIN_EMAIL}</span> · senha{' '}
              <span className="font-mono">{LOGSTOKA_DEMO_LOGIN_PASSWORD}</span>
            </p>
          </div>

          <form onSubmit={(e) => void handleLogin(e)} className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-0">
              <label className="ml-1 mb-10 flex h-8 items-center text-xs font-black uppercase tracking-normal text-gray-700">
                E-mail Corporativo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-bold text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 px-1">
                <label className="py-[3px] text-xs font-black uppercase tracking-normal text-gray-700">
                  Senha de Acesso
                </label>
                <span className="shrink-0 text-xs font-bold text-orange-600">Esqueceu a senha?</span>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="h-[60px] w-full rounded-2xl border border-gray-200 bg-white py-4 pl-5 pr-12 text-sm font-bold text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-900"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {errorMsg ? (
              <p className="mt-2 text-center text-xs font-semibold text-red-600" role="alert">
                {errorMsg}
              </p>
            ) : null}

            <button
              disabled={isLoading}
              type="submit"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-[23px] text-[15px] font-black uppercase tracking-normal text-white shadow-xl shadow-orange-600/20 transition-all duration-300 hover:bg-orange-500 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

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
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-xs font-bold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Entrar com Google"
            >
              {oauthLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
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
            Novo na LogStoka?{' '}
            <Link to="/vendas#precos" className="text-orange-600 hover:underline">
              Ver planos
            </Link>
            {' · '}
            <Link to="/vendas" className="text-gray-500 hover:text-orange-600 hover:underline">
              Voltar ao site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import MasterSidebar from '../components/MasterSidebar';
import SpotlightSearch from '../components/SpotlightSearch';
import GlobalActivityTicker from '../components/GlobalActivityTicker';
import { supabase } from '@core/lib/supabase';
import { AlertCircle, WifiOff } from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import {
  MASTER_ROUTE_TOKEN_PARAM,
  getExpectedMasterRouteToken,
} from '@core/lib/masterRouteToken';

const HUB_MASTER_SPLASH_PHRASE_MS = 2000;

/** Três frases em sequência (~2s cada); sem ícone. */
const HubMasterLoaderSplash: React.FC<{ greetingName?: string | null }> = ({ greetingName }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (phraseIndex >= 2) return;
    const t = window.setTimeout(() => setPhraseIndex((i) => i + 1), HUB_MASTER_SPLASH_PHRASE_MS);
    return () => window.clearTimeout(t);
  }, [phraseIndex]);

  const first = (greetingName || '').trim().split(/\s+/)[0] || '';
  const phrases = [
    first ? `Olá, ${first}` : 'Olá!',
    'Estamos atualizando o painel…',
    'Abrindo o Hub Master…',
  ];

  return (
    <>
      <div
        className="hub-splash-loading-text hub-master-loader-phrase"
        key={phraseIndex}
        aria-live="polite"
        aria-atomic="true"
        style={{
          margin: 0,
          width: '100%',
          maxWidth: 'min(90vw, 720px)',
          boxSizing: 'border-box',
          padding: '12px 24px',
          textAlign: 'center',
          fontSize: 46,
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: '#FFFFFF',
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          WebkitBackgroundClip: 'unset',
          backgroundClip: 'unset',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
        }}
      >
        {phrases[phraseIndex]}
      </div>
      <style>{`
        @keyframes hub-master-loader-fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        #hub-master-splash-screen .hub-splash-loading-text,
        #hub-master-splash-screen .hub-master-loader-phrase {
          animation: hub-master-loader-fade 0.35s ease-out;
          background: transparent !important;
          background-color: transparent !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          font-weight: 900 !important;
          font-size: 46px !important;
        }
      `}</style>
    </>
  );
};

/** Tempo mínimo com o splash visível após carregar (3 frases × 2s + folga). */
const HUB_MASTER_MIN_SPLASH_MS = 6200;

const MasterLayout: React.FC = () => {
  const { user, profile, isLoading, signOut } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [splashMinElapsed, setSplashMinElapsed] = useState(true);
  const splashSinceRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const rawNeedsSplash = isLoading || (!!user && !profile);

  useEffect(() => {
    if (rawNeedsSplash) {
      if (splashSinceRef.current == null) splashSinceRef.current = Date.now();
      setSplashMinElapsed(false);
      return;
    }

    if (!user && !isLoading) {
      splashSinceRef.current = null;
      setSplashMinElapsed(true);
      return;
    }

    const start = splashSinceRef.current;
    if (start == null) {
      setSplashMinElapsed(true);
      return;
    }

    const remaining = Math.max(0, HUB_MASTER_MIN_SPLASH_MS - (Date.now() - start));
    if (remaining === 0) {
      splashSinceRef.current = null;
      setSplashMinElapsed(true);
      return;
    }

    const t = window.setTimeout(() => {
      splashSinceRef.current = null;
      setSplashMinElapsed(true);
    }, remaining);
    return () => window.clearTimeout(t);
  }, [rawNeedsSplash, user, isLoading]);

  const showSplash = rawNeedsSplash || !splashMinElapsed;

  // Monitoramento Inteligente de Conexão - TOP LEVEL
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        setConnectionError(!!error);
      } catch {
        setConnectionError(true);
      }
    };

    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    (window as any).toggleSpotlight = () => setIsSpotlightOpen(prev => !prev);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      delete (window as any).toggleSpotlight;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /** Garante ?token=... único por página, preservando demais query params. */
  useEffect(() => {
    if (!user || !profile) return;
    const isMasterUser =
      profile.role === 'MASTER' || profile.role === 'MASTER_ADMIN';
    if (!isMasterUser) return;

    const path = location.pathname;
    if (!path.startsWith('/master')) return;

    const expected = getExpectedMasterRouteToken(path);
    const params = new URLSearchParams(location.search);
    if (params.get(MASTER_ROUTE_TOKEN_PARAM) === expected) return;

    params.set(MASTER_ROUTE_TOKEN_PARAM, expected);
    navigate(
      {
        pathname: location.pathname,
        search: params.toString(),
        hash: location.hash,
      },
      { replace: true }
    );
  }, [
    user,
    profile,
    location.pathname,
    location.search,
    location.hash,
    navigate,
  ]);

  if (showSplash) {
    return (
      <div
        id="hub-master-splash-screen"
        role="status"
        aria-busy="true"
        aria-label={user && !profile ? 'Carregando perfil' : 'Carregando'}
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
        }}
      >
        <HubMasterLoaderSplash greetingName={profile?.full_name} />
      </div>
    );
  }

  // Refined Auth Protection Logic
  const isMaster = profile?.role === 'MASTER' || profile?.role === 'MASTER_ADMIN';

  if (!user && !isLoading) {
    return <Navigate to="/" replace />;
  }

  if (user && !isMaster && !isLoading) {
    return (
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', color: 'white',
        textAlign: 'center', padding: '40px'
      }}>
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '24px' }} />
        <h1 style={{ fontSize: '29px', fontWeight: '800', marginBottom: '12px', letterSpacing: 0, color: '#000000', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>Acesso Negado</h1>
        <p style={{ color: '#94A3B8', maxWidth: '400px', marginBottom: '32px' }}>
          Sua conta não possui permissões administrativas para acessar o Hub Master.
        </p>
        <button 
          onClick={() => signOut()}
          style={{
            padding: '12px 24px', backgroundColor: '#EF4444', border: 'none',
            borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer'
          }}
        >
          Sair do Sistema
        </button>
      </div>
    );
  }

  const isMasterHome = location.pathname === '/master' || location.pathname === '/master/';
  const isFullWidthPage = isMasterHome || location.pathname.includes('/hubchat');

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#F8FAFC',
      fontFamily: "'Inter', sans-serif",
      position: 'relative'
    }}>
      {/* Alerta de Conexão Inteligente */}
      {connectionError && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#EF4444', color: 'white', padding: '12px 24px', borderRadius: '24px',
          zIndex: 10001, fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 20px 40px rgba(239, 68, 68, 0.4)', letterSpacing: '0.5px', textTransform: 'uppercase',
          animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <style>{`
            @keyframes slideDown {
              from { transform: translate(-50%, -100%); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
          <WifiOff size={18} /> Instabilidade detectada na rede master. 
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        :root {
          --primary: #0061FF;
          --primary-dark: #0052D9;
          --bg-main: #F8FAFC;
          --bg-card: #ffffff;
          --text-title: #111827;
          --text-subtitle: #6B7280;
          --text-body: #374151;
          --text-primary: #0F172A;
          --text-secondary: #64748B;
          --border: #E2E8F0;
          --accent: #0061FF;
          --accent-glow: #38BDF8;
          --accent-light: #F0F7FF;
          --bg-overlay: rgba(99, 102, 241, 0.05);
          --bg-secondary: #F1F5F9;
          --secondary: #0F172A;
        }

        * {
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background-color: var(--bg-main);
          color: var(--text-body);
          -webkit-font-smoothing: antialiased;
          font-size: 16px;
          line-height: 1.6;
          letter-spacing: 0.2px;
        }

        h1, .h1-style, .page-title, .title-main {
          font-size: 29px !important;
          font-weight: 800 !important;
          color: #000000 !important;
          letter-spacing: 0 !important;
          line-height: 1.2 !important;
          margin-bottom: 4px !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
          background-image: none !important;
          background-clip: unset !important;
          -webkit-background-clip: unset !important;
        }

        h2, .h2-style {
          font-size: 22px !important;
          font-weight: 800 !important;
          color: #000000 !important;
          line-height: 1.25 !important;
          margin-bottom: 12px !important;
          letter-spacing: 0 !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
          background-image: none !important;
          background-clip: unset !important;
          -webkit-background-clip: unset !important;
        }

        h3, .h3-style {
          font-size: 16px !important;
          font-weight: 700 !important;
          color: #000000 !important;
          line-height: 1.25 !important;
          margin-bottom: 8px !important;
          letter-spacing: 0 !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
          background-image: none !important;
          background-clip: unset !important;
          -webkit-background-clip: unset !important;
        }

        p, span, div {
          color: var(--text-body);
        }

        .text-subtitle {
          color: rgba(0, 0, 0, 0.46) !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          margin: 0 !important;
          padding: 7px 0 !important;
          max-width: 510px !important;
          line-height: 1.5 !important;
          letter-spacing: 0 !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
        }

        main table th {
          font-size: 10px !important;
          line-height: 1 !important;
          letter-spacing: 0 !important;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .kpi-value, .stat-value, .metric-value {
          font-size: 20px !important;
          font-weight: 800 !important;
          color: #000000 !important;
          letter-spacing: -0.2px !important;
          line-height: 1 !important;
          margin: 2px 0 !important;
        }

        .kpi-label, .stat-label, .metric-label {
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #94A3B8 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>

      {/* SIDEBAR FIXED (80px wide base) */}
      {!isMobile && <MasterSidebar />}
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflow: 'hidden',
        marginLeft: isMobile ? 0 : '80px',
        transition: 'margin-left 0.3s ease'
      }}>
        <Header 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          isMobile={isMobile} 
        />
        
        <main style={{ 
          flex: 1, 
          minHeight: 0,
          overflowY: isFullWidthPage ? 'hidden' : 'auto',
          backgroundColor: '#F8FAFC',
          padding: isMasterHome ? '0' : isFullWidthPage ? '0 24px' : (isMobile ? '20px' : '40px'),
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(217, 255, 0, 0.03) 0%, transparent 50%)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* CENTERED CONTENT WRAPPER */}
          <div style={{
            maxWidth: isFullWidthPage ? '100%' : '1400px',
            margin: '0 auto',
            width: '100%',
            flex: isFullWidthPage ? 1 : undefined,
            minHeight: isFullWidthPage ? 0 : undefined,
            height: isFullWidthPage ? '665px' : 'auto',
            padding: '0',
            position: 'relative',
            display: isFullWidthPage ? 'flex' : undefined,
            flexDirection: isFullWidthPage ? 'column' : undefined,
            gap: isFullWidthPage ? 0 : undefined,
            boxSizing: 'border-box'
          }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* MOBILE OVERLAY MENU */}
      {isMobile && isMobileMenuOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1100 }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            style={{ width: '280px', height: '100%', backgroundColor: '#FFFFFF', boxShadow: '10px 0 32px rgba(15, 23, 42, 0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <MasterSidebar variant="drawer" />
          </div>
        </div>
      )}

      {/* GLOBAL SEARCH */}
      <SpotlightSearch 
        isOpen={isSpotlightOpen} 
        onClose={() => setIsSpotlightOpen(false)} 
      />

      {/* GLOBAL ACTIVITY TICKER */}
      <GlobalActivityTicker />
    </div>
  );
};

export default MasterLayout;

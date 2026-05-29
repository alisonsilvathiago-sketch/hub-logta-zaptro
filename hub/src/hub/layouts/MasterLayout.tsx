import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import '../styles/hubShellEnterprise.css';
import Header from '../components/Header';
import MasterSidebar from '../components/MasterSidebar';
import SpotlightSearch from '../components/SpotlightSearch';
import GlobalActivityTicker from '../components/GlobalActivityTicker';
import HubProjectAiDrawer from '../components/HubProjectAiDrawer';
import { HubProjectAiProvider } from '@hub/context/HubProjectAiContext';
import { HubMasterNotificationsProvider } from '@hub/context/HubMasterNotificationsContext';
import HubNotificationToastStack from '@hub/components/HubNotificationToastStack';
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
          fontSize: 40,
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: '#FFFFFF',
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          WebkitBackgroundClip: 'unset',
          backgroundClip: 'unset',
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
          font-size: 40px !important;
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
        <h1 style={{ fontSize: '29px', fontWeight: '800', marginBottom: '12px', letterSpacing: 0, color: '#000000' }}>Acesso Negado</h1>
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
  const isProjectPage = ['/master/logta', '/master/zaptro', '/master/logdock', '/master/logstoka', '/master/whatsapp', '/master/ia-gateway'].some((p) => location.pathname.startsWith(p));
  const isMasterShellPage =
    location.pathname.startsWith('/master/settings') ||
    location.pathname.startsWith('/master/billing') ||
    location.pathname.startsWith('/master/companies') ||
    location.pathname.startsWith('/master/logistica') ||
    location.pathname.startsWith('/master/crm') ||
    location.pathname.startsWith('/master/agenda');
  const isFullWidthPage = isMasterHome || location.pathname.includes('/hubchat') || isProjectPage;
  const isHubChatPage = location.pathname.includes('/hubchat');
  /** Inset do frame: desligado em shells com menu lateral próprio (Configurações, Financeiro, Empresas) e em projetos */
  const useOutletPageInset = !isProjectPage && !isMasterShellPage;

  return (
    <HubMasterNotificationsProvider>
    <HubProjectAiProvider>
    <div
      className="master-layout-container hub-master-shell"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--hub-bg)',
        position: 'relative',
      }}
    >
      {/* Alerta de Conexão Inteligente */}
      {connectionError && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#EF4444', color: 'white', padding: '12px 24px', borderRadius: '24px',
          zIndex: 10001, fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 20px 40px rgba(239, 68, 68, 0.4)', letterSpacing: '0.5px', textTransform: 'uppercase',
        }}>
          <WifiOff size={18} /> Instabilidade detectada na rede master. 
        </div>
      )}

      {/* SIDEBAR FIXED */}
      {!isMobile && <MasterSidebar />}
      
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: isMobile ? '100%' : 'calc(100% - 64px)',
          marginLeft: isMobile ? 0 : 64,
          height: '100vh',
          overflow: 'hidden',
          boxSizing: 'border-box',
          transition: 'margin-left 0.2s ease, width 0.2s ease',
        }}
      >
        <Header 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          isMobile={isMobile} 
        />
        
        <main
          className="hub-master-main"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: isHubChatPage ? 'hidden' : 'auto',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            className={`hub-master-outlet-frame${useOutletPageInset ? ' hub-master-outlet-frame--inset' : ''}`}
            style={{
              maxWidth: isFullWidthPage || isMasterShellPage ? '100%' : '1400px',
              margin: isFullWidthPage || isMasterShellPage ? '0' : '0 auto',
              width: '100%',
              minWidth: 0,
              flex: isHubChatPage ? 1 : undefined,
              minHeight: isHubChatPage ? 0 : undefined,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'stretch',
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* MOBILE OVERLAY MENU */}
      {isMobile && isMobileMenuOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1100 }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            style={{ width: '280px', height: '100%', backgroundColor: 'var(--hub-bg)' }}
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

      <HubNotificationToastStack />

      <HubProjectAiDrawer />
    </div>
    </HubProjectAiProvider>
    </HubMasterNotificationsProvider>
  );
};

export default MasterLayout;

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import SEOManager from './components/SEOManager';
import { getContext } from './utils/domains';
import { hasZaptroGranularPermission, isZaptroTenantAdminRole } from './utils/zaptroPermissions';
import { pathnameToZaptroPageId } from './utils/zaptroPagePermissionMap';

import { 
  ZAPTRO_LOADING_PHRASES, 
  ZAPTRO_LOADING_FADE_MS, 
  ZAPTRO_LOADING_STEP_HOLD_MS 
} from './constants/zaptroLoadingPhrases';

const LIME = '#D9FF00';

const Loading = ({ context }: { context?: string }) => {
  const { profile } = useAuth();
  const userName = profile?.full_name?.split(' ')[0] || 'Você';
  
  const ctxKey = (context === 'logout' || context === 'login' ? context : 'login');
  const rawPhrases = ZAPTRO_LOADING_PHRASES[ctxKey];
  
  // Removemos o marcador [[lime]] para aplicar o degradê no texto puro
  const phrases = React.useMemo(() => 
    rawPhrases.map(s => s.replace('{{name}}', userName).replace(/\[\[lime\]\]/g, '')),
    [rawPhrases, userName]
  );

  const [step, setStep] = React.useState(0);
  const [opacity, setOpacity] = React.useState(0);
  const timers = React.useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const q = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  React.useEffect(() => {
    clearTimers();
    q(() => setOpacity(1), 30);
    q(() => setOpacity(0), ZAPTRO_LOADING_STEP_HOLD_MS);
    if (step < phrases.length - 1) {
      q(() => setStep(s => s + 1), ZAPTRO_LOADING_STEP_HOLD_MS + ZAPTRO_LOADING_FADE_MS + 60);
    }
    return clearTimers;
  }, [step, phrases.length]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(217,255,0,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
        <p
          style={{
            position: 'relative',
            zIndex: 1,
            margin: 0,
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            opacity,
            transition: `opacity ${ZAPTRO_LOADING_FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            textAlign: 'center',
            padding: '0 24px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #D9FF00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {phrases[step]}
        </p>
    </div>
  );
};

// Lazy pages
const WhatsAppSales = lazy(() => import('./pages/WhatsAppSales'));
const Home = lazy(() => import('./pages/Home'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const PlansPage = lazy(() => import('./pages/PlansPage'));
const Login = lazy(() => import('./pages/WhatsAppLogin'));
const ZaptroRegister = lazy(() => import('./pages/ZaptroRegister'));
const SSOLogin = lazy(() => import('./pages/SSOLogin'));
const ZaptroHomeNovoDesign = lazy(() => import('./pages/ZaptroHomeNovoDesign'));
const Checkout = lazy(() => import('./pages/Checkout'));

// Zaptro Dashboard Pages
const ZaptroDashboardResults = lazy(() => import('./pages/ZaptroDashboardResults'));
const ZaptroFuelCenter = lazy(() => import('./pages/ZaptroFuelCenter'));
const ZaptroCrm = lazy(() => import('./pages/ZaptroCrm'));
const ZaptroQuotesList = lazy(() => import('./pages/ZaptroQuotesList'));
const ZaptroRoutes = lazy(() => import('./pages/ZaptroRoutes'));
const ZaptroDrivers = lazy(() => import('./pages/ZaptroDrivers'));
const WhatsAppPremium = lazy(() => import('./pages/WhatsAppPremium'));
const ZaptroClients = lazy(() => import('./pages/ZaptroClients'));
const ZaptroSettings = lazy(() => import('./pages/ZaptroSettings'));
const ZaptroProfile = lazy(() => import('./pages/ZaptroProfile'));
const ZaptroBilling = lazy(() => import('./pages/ZaptroBilling'));
const ZaptroTeam = lazy(() => import('./pages/ZaptroTeam'));
const ZaptroHistory = lazy(() => import('./pages/ZaptroHistory'));

const ZaptroClientDetail = lazy(() => import('./pages/ZaptroClientDetail'));
const ZaptroDriverProfile = lazy(() => import('./pages/ZaptroDriverProfile'));
const ZaptroDriverRoute = lazy(() => import('./pages/ZaptroDriverRoute'));
const ZaptroPublicQuote = lazy(() => import('./pages/ZaptroPublicQuote'));
const ZaptroPublicTrack = lazy(() => import('./pages/ZaptroPublicTrack'));
const ZaptroVehicleProfile = lazy(() => import('./pages/ZaptroVehicleProfile'));
const ZaptroLeadProfile = lazy(() => import('./pages/ZaptroLeadProfile'));
const MasterConnect = lazy(() => import('./pages/MasterConnect'));
const PublicDeliveryAction = lazy(() => import('./pages/PublicDeliveryAction'));


const ZaptroGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Loading />;
  if (!profile) return <Navigate to="/login" replace />;

  // Admin / Master / Hub / Master_ bypass all guards
  if (isZaptroTenantAdminRole(profile.role)) {
    return <>{children}</>;
  }

  const pageId = pathnameToZaptroPageId(location.pathname, location.search);

  // Se não identificamos a página (ex: perfil próprio, início sem permissão específica), permitimos ou redirecionamos.
  // No Zaptro, 'inicio' costuma ser a base. Mas se tiver ID 'inicio' no registro, validamos.
  if (!pageId) return <>{children}</>;

  const hasAccess = hasZaptroGranularPermission(profile.role, profile.permissions, pageId);

  if (!hasAccess) {
    console.warn(`[ZaptroGuard] Acesso negado para ${location.pathname} (PageID: ${pageId})`);
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { isLoading, isLoggingOut, isLoggingIn } = useAuth();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const context = getContext();
  const isCheckoutDomain = context === 'CHECKOUT' || hostname.includes('play.');

  if (isLoggingOut) return <Loading context="logout" />;
  if (isLoggingIn) return <Loading context="login" />;
  if (isLoading) return <Loading />;

  // Default App Behavior (app.zaptro.com.br)
  const isAppDomain = hostname.includes('app.zaptro.com.br');
  const isZaptroHome = hostname === 'zaptro.com.br' || hostname === 'www.zaptro.com.br';

  return (
    <Suspense fallback={<Loading />}>
      <SEOManager />
      <Routes>
        <Route 
          path="/" 
          element={
            isCheckoutDomain ? <Checkout /> :
            context === 'BLOG' ? <BlogPage /> :
            (context === 'SUPPORT' || context === 'FAQ') ? <HelpCenter /> :
            isZaptroHome ? <Home /> :
            (isAppDomain ? <Navigate to="/inicio" replace /> : <WhatsAppSales />)
          } 
        />
        <Route path="/play/:checkoutId?" element={<Checkout />} />
        <Route 
          path="/:checkoutId" 
          element={isCheckoutDomain ? <Checkout /> : <Navigate to="/" replace />} 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/registrar" element={<ZaptroRegister />} />
        <Route path="/registre" element={<ZaptroRegister />} />
        <Route path="/sso" element={<SSOLogin />} />
        <Route path="/master/connect" element={<MasterConnect />} />

        
        {/* Public Help & Support Routes */}
        <Route path="/ajuda" element={<HelpCenter />} />
        <Route path="/faq" element={<HelpCenter />} />
        <Route path="/suporte" element={<HelpCenter />} />
        
        {/* Zaptro Dashboard Routes */}
        {/* Zaptro Dashboard Routes (Protected by Guard) */}
        <Route path="/inicio" element={<ZaptroGuard><ZaptroHomeNovoDesign /></ZaptroGuard>} />
        <Route path="/resultados" element={<ZaptroGuard><ZaptroDashboardResults /></ZaptroGuard>} />
        <Route path="/combustivel" element={<ZaptroGuard><ZaptroFuelCenter /></ZaptroGuard>} />
        <Route path="/comercial" element={<ZaptroGuard><ZaptroCrm /></ZaptroGuard>} />
        <Route path="/comercial/orcamentos" element={<ZaptroGuard><ZaptroQuotesList /></ZaptroGuard>} />
        <Route path="/rotas" element={<ZaptroGuard><ZaptroRoutes /></ZaptroGuard>} />
        <Route path="/motoristas" element={<ZaptroGuard><ZaptroDrivers /></ZaptroGuard>} />
        <Route path="/frota" element={<ZaptroGuard><ZaptroDrivers /></ZaptroGuard>} />
        <Route path="/whatsapp/:waThread?" element={<ZaptroGuard><WhatsAppPremium /></ZaptroGuard>} />
        <Route path="/clientes" element={<ZaptroGuard><ZaptroClients /></ZaptroGuard>} />
        <Route path="/clientes/leads" element={<ZaptroGuard><ZaptroClients /></ZaptroGuard>} />
        <Route path="/configuracao" element={<ZaptroGuard><ZaptroSettings /></ZaptroGuard>} />
        <Route path="/conta" element={<ZaptroGuard><ZaptroProfile /></ZaptroGuard>} />
        <Route path="/faturamento" element={<ZaptroGuard><ZaptroBilling /></ZaptroGuard>} />
        <Route path="/equipe" element={<ZaptroGuard><ZaptroTeam /></ZaptroGuard>} />
        <Route path="/historico" element={<ZaptroGuard><ZaptroHistory /></ZaptroGuard>} />
        
        <Route path="/perfil-cliente/:id" element={<ZaptroGuard><ZaptroClientDetail /></ZaptroGuard>} />
        <Route path="/clientes/leads/perfil/:id" element={<ZaptroGuard><ZaptroLeadProfile /></ZaptroGuard>} />
        <Route path="/motoristas/:id" element={<ZaptroGuard><ZaptroDriverProfile /></ZaptroGuard>} />
        <Route path="/frota/:id" element={<ZaptroGuard><ZaptroVehicleProfile /></ZaptroGuard>} />
        <Route path="/rota-motorista/:token" element={<ZaptroDriverRoute />} />
        <Route path="/orcamento/:token" element={<ZaptroPublicQuote />} />
        <Route path="/rastreamento/:token" element={<ZaptroPublicTrack />} />
        <Route path="/entrega/:token" element={<PublicDeliveryAction />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;

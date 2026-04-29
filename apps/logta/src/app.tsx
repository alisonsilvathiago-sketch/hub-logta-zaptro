import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getLogtaHomePath } from './utils/logtaRbac';
import type { UserRole } from './types';
import SEOManager from './components/SEOManager';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Loading';

import Sidebar, { SIDEBAR_MAIN_OFFSET_PX } from './components/Sidebar';
import LogtaAppShellHeader from './components/LogtaAppShellHeader';
import { LOGTA_PAGE_PAD_X, LOGTA_SHELL_BG } from './constants/logtaLayout';

import Logistics from './product-logta/pages/Logistics';
import Finance from './product-logta/pages/Finance';
import HR from './product-logta/pages/HR';
import CRM from './product-logta/pages/CRM';
import Fleet from './product-logta/pages/Fleet';
import Inventory from './product-logta/pages/Inventory';
import Reports from './product-logta/pages/Reports';
import IntelligenceDashboard from './product-logta/pages/IntelligenceDashboard';
import FuelCenter from './product-logta/pages/FuelCenter';
import DriverPortal from './product-logta/pages/DriverPortal';
import Drivers from './product-logta/pages/Drivers';
import UserManagement from './product-logta/pages/UserManagement';
import CompanySettings from './product-logta/pages/CompanySettings';
import DriverMobileApp from './product-logta/pages/DriverMobileApp';
import Pricing from './product-logta/pages/Pricing';

import Home from './pages/Home';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';
import Clients from './pages/Clients';
import UserProfile from './pages/UserProfile';

import Checkout from './pages/Checkout';
import LogtaWelcome from './pages/LogtaWelcome';
import SSOLogin from './pages/SSOLogin';
import MasterConnect from './pages/MasterConnect';
import { getContext } from './utils/domains';

function AppRootIndex() {
  const { user, isLoading, profile } = useAuth();
  if (isLoading) return <Loading message="A preparar a sessão…" />;
  if (!user) return <Home />;
  return <Navigate to={getLogtaHomePath(profile?.role as UserRole | undefined)} replace />;
}

const App: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const context = getContext();

  const isCheckoutDomain = context === 'CHECKOUT' || window.location.hostname.includes('play.');
  const isPublic = ['/', '/login', '/master/connect'].some((p) => location.pathname === p);
  const isMobileApp = location.pathname.startsWith('/app-motorista');

  /** Miolo autenticado: sempre sidebar + header global + mesmo fundo (inclui `/dashboard`). */
  const authenticatedShell = Boolean(user && !isPublic && !isMobileApp);
  const showSidebar = authenticatedShell;
  const showShellHeader = authenticatedShell;

  return (
    <>
      <SEOManager />
      <div
        id="logta-app-root"
        style={{
          display: 'flex',
          width: '100%',
          minHeight: '100vh',
          backgroundColor: isPublic ? '#000' : 'var(--bg-app)',
          color: 'var(--text-main)',
          overflow: 'hidden',
        }}
      >
        {showSidebar && <Sidebar />}

        <div
          id="logta-main-container"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            marginLeft: showSidebar ? `${SIDEBAR_MAIN_OFFSET_PX}px` : 0,
            minWidth: 0,
            /* Área logada: sempre cinza claro (referência dashboard); não seguir tema escuro no miolo */
            backgroundColor: showShellHeader ? LOGTA_SHELL_BG : 'var(--bg-app)',
            ...(showShellHeader
              ? ({ ['--logta-dash-pad-x']: LOGTA_PAGE_PAD_X } as React.CSSProperties)
              : {}),
          }}
        >
          {showShellHeader && (
            <div
              style={{
                flexShrink: 0,
                paddingLeft: LOGTA_PAGE_PAD_X,
                paddingRight: LOGTA_PAGE_PAD_X,
                paddingTop: 16,
                backgroundColor: showShellHeader ? LOGTA_SHELL_BG : 'var(--bg-app)',
              }}
            >
              <LogtaAppShellHeader />
            </div>
          )}
          <main
            style={{
              flex: 1,
              position: 'relative',
              backgroundColor: showShellHeader ? LOGTA_SHELL_BG : 'var(--bg-app)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              ...(showShellHeader
                ? {
                    paddingLeft: LOGTA_PAGE_PAD_X,
                    paddingRight: LOGTA_PAGE_PAD_X,
                    boxSizing: 'border-box' as const,
                  }
                : {}),
            }}
          >
            <div
              className="logta-routes-root"
              style={{
                flex: 1,
                minHeight: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
            <Routes>
              <Route 
                path="/" 
                element={isCheckoutDomain ? <Checkout /> : <AppRootIndex />} 
              />
              <Route path="/play/:checkoutId?" element={<Checkout />} />
              <Route 
                path="/:checkoutId" 
                element={isCheckoutDomain ? <Checkout /> : <Navigate to="/" replace />} 
              />
              <Route path="/login" element={<Login />} />
              <Route path="/master/connect" element={<MasterConnect />} />
              <Route path="/welcome" element={<LogtaWelcome />} />
              <Route path="/sso" element={<SSOLogin />} />

              <Route path="/dashboard" element={<ProtectedRoute><IntelligenceDashboard /></ProtectedRoute>} />
              <Route path="/combustivel" element={<ProtectedRoute><FuelCenter /></ProtectedRoute>} />
              <Route path="/logistica" element={<ProtectedRoute><Navigate to="/logistica/dashboard" replace /></ProtectedRoute>} />
              <Route path="/logistica/:tab" element={<ProtectedRoute><Logistics /></ProtectedRoute>} />
              <Route path="/financeiro" element={<ProtectedRoute><Navigate to="/financeiro/inteligencia" replace /></ProtectedRoute>} />
              <Route path="/financeiro/:tab" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
              <Route path="/financas" element={<ProtectedRoute><Navigate to="/financeiro/inteligencia" replace /></ProtectedRoute>} />
              <Route path="/financas/:tab" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
              <Route path="/crm" element={<ProtectedRoute><Navigate to="/crm/inteligencia" replace /></ProtectedRoute>} />
              <Route path="/crm/:tab" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
              <Route path="/rh" element={<ProtectedRoute><Navigate to="/rh/dashboard" replace /></ProtectedRoute>} />
              <Route path="/rh/:tab" element={<ProtectedRoute><HR /></ProtectedRoute>} />
              <Route path="/frota" element={<ProtectedRoute><Navigate to="/frota/veiculos" replace /></ProtectedRoute>} />
              <Route path="/frota/:tab" element={<ProtectedRoute><Fleet /></ProtectedRoute>} />
              <Route path="/estoque" element={<ProtectedRoute><Navigate to="/estoque/materiais" replace /></ProtectedRoute>} />
              <Route path="/estoque/:tab" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/relatorios/:tab" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/treinamentos" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />

              <Route path="/motorista/*" element={<ProtectedRoute><DriverPortal /></ProtectedRoute>} />
              <Route path="/motoristas" element={<ProtectedRoute><Drivers /></ProtectedRoute>} />
              <Route path="/motoristas/:tab" element={<ProtectedRoute><Drivers /></ProtectedRoute>} />
              <Route path="/motoristas/perfil/:id" element={<ProtectedRoute><Drivers /></ProtectedRoute>} />

              <Route path="/app-motorista" element={<ProtectedRoute><DriverMobileApp /></ProtectedRoute>} />

              <Route path="/usuarios" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/perfil/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/planos" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            </Routes>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default App;

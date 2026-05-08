import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import HubLogin from './hub/pages/Login';

// Master Layout & Pages
import MasterLayout from './hub/layouts/MasterLayout';
import Dashboard from './hub/modules/hub/Dashboard';
import Inicio from './hub/modules/hub/Inicio';
import CompanyManagement from './hub/modules/hub/Companies';
import CompanyProfile from './hub/modules/hub/CompanyProfile';
import BillingManagement from './hub/modules/hub/Billing';
import Settings from './hub/modules/hub/GlobalSettings';
import AccountSettings from './hub/modules/core/Profile';
import Infrastructure from './hub/modules/hub/Infrastructure';
import CRM from './hub/modules/hub/CRM';
import Agenda from './hub/modules/hub/Agenda';
import ClientsList from './hub/modules/clients/ClientsList';
import CustomerDetail from './hub/modules/hub/CustomerDetail';
import Reports from './hub/modules/hub/Reports';
import TeamMemberDetail from './hub/modules/core/MemberDetail';
import PublicCheckout from './hub/pages/PublicCheckout';
import PaymentCheckout from './hub/pages/PaymentCheckout';
import ClientBackup from './hub/pages/ClientBackup';
import HubNotifications from './hub/pages/HubNotifications';
import HubChat from './hub/modules/hub/Chat';
import LogisticaHub from './hub/modules/hub/Logistica';
import Workflows from './hub/modules/hub/Workflows';
import IntegrationsPage from './hub/modules/hub/IntegrationsPage';
import IaGatewayCenter from './hub/modules/hub/IaGateway';
import PublicFuelDashboard from './hub/pages/PublicFuelDashboard';
import AnalyticalFuelDashboard from './hub/pages/AnalyticalFuelDashboard';
import PublicRouteTracking from './hub/pages/PublicRouteTracking';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import { KeyboardProvider } from './core/context/KeyboardContext';
import CommandPalette from '@shared/components/CommandPalette';
import ShortcutHelp from '@shared/components/ShortcutHelp';
import HubLogDock from './hub/modules/hub/LogDock';
import LogDockLogin from './hub/pages/LogDockLogin';
import LogDockLayout from './hub/layouts/LogDockLayout';
import GlobalLoader from '@shared/components/GlobalLoader';
import MasterKnowledge from './hub/modules/hub/Knowledge';

import { runMasterAuditSync } from './core/lib/masterIntelligence';

/** /master/team e /master/team/* → Equipe Master ou Empresas (Módulos/Métricas), preservando query. */
function RedirectMasterTeamToSettings() {
  const { pathname, search, hash } = useLocation();
  const params = new URLSearchParams(search);
  const suffix = pathname.replace(/^.*\/master\/team\/?/, '').replace(/^\/+/, '');
  if (suffix === 'sistemas') {
    params.delete('tab');
    const qs = params.toString();
    return <Navigate to={`/master/companies/modulos-sync${qs ? `?${qs}` : ''}`} replace />;
  }
  if (suffix === 'performance') {
    params.delete('tab');
    const qs = params.toString();
    return <Navigate to={`/master/companies/metricas-score${qs ? `?${qs}` : ''}`} replace />;
  }
  if (suffix === 'usuarios-hub') params.set('tab', 'usuarios-hub');
  else if (suffix === 'membros') params.delete('tab');
  const qs = params.toString();
  return (
    <Navigate
      to={{ pathname: '/master/settings/equipe', search: qs || undefined, hash }}
      replace
    />
  );
}

/** `/master/admins` e `/master/companies/usuarios-hub` → Configurações › Equipe › aba Usuários Hub (preserva query). */
function NavigateToSettingsEquipeUsuariosHub() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set('tab', 'usuarios-hub');
  const qs = params.toString();
  return <Navigate to={`/master/settings/equipe${qs ? `?${qs}` : '?tab=usuarios-hub'}`} replace />;
}

const App: React.FC = () => {
  React.useEffect(() => {
    // 🧠 Master Intelligence Background Guardian
    // Executa auditoria global a cada 5 minutos
    const auditInterval = setInterval(() => {
      runMasterAuditSync();
    }, 1000 * 60 * 5);

    // Executa a primeira vez após carregar
    runMasterAuditSync();

    return () => clearInterval(auditInterval);
  }, []);

  React.useEffect(() => {
    // Global Error and Promise Rejection Interceptor
    const handleError = (event: ErrorEvent) => {
      console.error('[Global System Error]:', event.error);
      toast.error('Ocorreu um erro inesperado no sistema.');
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('[Unhandled Promise Rejection]:', event.reason);
      // We only toast if it's not already handled by systemFeedback
      if (!event.reason?.__handled) {
         toast.error(event.reason?.message || 'Falha na comunicação com o servidor.');
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <>
      <Toaster
        position="bottom-right"
        closeButton
        expand={false}
        theme="light"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#0F172A',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          },
          success: {
            icon: <CheckCircle size={20} color="#10B981" />,
          },
          error: {
            icon: <AlertCircle size={20} color="#EF4444" />,
          },
          warning: {
            icon: <AlertTriangle size={20} color="#F59E0B" />,
          },
        }}
      />
      <KeyboardProvider>
        <GlobalLoader />
        <CommandPalette />
        <ShortcutHelp />
        
        <Routes>
          <Route path="/" element={<HubLogin />} />
          <Route path="/app" element={<Navigate to="/logdock/app" replace />} />
          <Route path="/auth/logdock" element={<LogDockLogin />} />
          
          {/* Rota de Checkout Público */}
          <Route path="/checkout" element={<PublicCheckout />} />
          <Route path="/play/:id" element={<PublicCheckout />} />
          <Route path="/pagar/:id" element={<PaymentCheckout />} />
          <Route path="/combustivel" element={<PublicFuelDashboard />} />
          <Route path="/fuel" element={<AnalyticalFuelDashboard />} />
          <Route path="/rastreamento-publico" element={<PublicRouteTracking />} />
          <Route path="/rastreamento-publico/:id" element={<PublicRouteTracking />} />
          
          {/* Rota Expandida LogDock (Focada) */}
          <Route path="/logdock" element={
            <ErrorBoundary>
              <LogDockLayout />
            </ErrorBoundary>
          }>
            <Route path="app" element={<HubLogDock />} />
          </Route>

          {/* Rotas do Hub Master */}
          <Route path="/master" element={
            <ErrorBoundary>
              <MasterLayout />
            </ErrorBoundary>
          }>
            {/* Core Hub Routes */}
            <Route index element={<Inicio />} />
            <Route path="resultados" element={<Dashboard />} />
            
            {/* CRM Routes */}
            <Route path="crm" element={<CRM />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="hubchat" element={<HubChat />} />
            
            {/* Clients & Companies Unified */}
            <Route path="clientes" element={<ClientsList />} />
            <Route path="clientes/:id" element={<CustomerDetail />} />
            <Route path="companies/modulos-sync" element={<CompanyManagement />} />
            <Route path="companies/metricas-score" element={<CompanyManagement />} />
            <Route path="companies/usuarios-hub" element={<NavigateToSettingsEquipeUsuariosHub />} />
            <Route path="companies" element={<CompanyManagement />} />
            <Route path="companies/:id" element={<CompanyProfile />} />

            {/* Financial Unified */}
            <Route path="billing/*" element={<BillingManagement />} />
            <Route path="financeiro" element={<Navigate to="/master/billing?tab=financeiro" replace />} />

            {/* Security & Infrastructure Unified */}
            <Route path="infrastructure/*" element={<Infrastructure />} />
            <Route path="backup" element={<Navigate to="/master/infrastructure/storage" replace />} />
            <Route path="security" element={<Navigate to="/master/infrastructure/security" replace />} />

            {/* Logistics Unified */}
            <Route path="logistica" element={<LogisticaHub />} />
            <Route path="logistica/:subPage" element={<LogisticaHub />} />
            <Route path="destinos" element={<Navigate to="/master/logistica?tab=destinos" replace />} />

            {/* Intelligence & Reports Unified */}
            <Route path="reports" element={<Navigate to="/master/hubchat" replace />} />
            <Route path="intelligence" element={<Navigate to="/master/logistica/estrategia" replace />} />

            {/* Support & Admin */}
            <Route path="admins" element={<NavigateToSettingsEquipeUsuariosHub />} />
            <Route path="settings/ia-gateway" element={<Navigate to="/master/ia-gateway" replace />} />
            <Route path="settings/interacoes" element={<Navigate to="/master/integracoes" replace />} />
            <Route path="settings/notificacoes" element={<Navigate to="/master/notifications" replace />} />
            <Route path="settings/*" element={<Settings />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="team/colaborador/:id" element={<TeamMemberDetail />} />
            <Route path="team/*" element={<RedirectMasterTeamToSettings />} />
            <Route path="staff" element={<Navigate to="/master/settings/equipe" replace />} />
            <Route path="analytics" element={<Navigate to="/master/companies/metricas-score" replace />} />
            <Route path="plans" element={<Navigate to="/master/billing/planos" replace />} />
            <Route path="notifications" element={<HubNotifications />} />
            <Route path="ia-gateway" element={<IaGatewayCenter />} />
            <Route path="automacoes" element={<Workflows />} />
            <Route path="automacoes/ia-gateway" element={<Navigate to="/master/ia-gateway" replace />} />
            <Route path="logdock" element={<HubLogDock />} />
            <Route path="integracoes" element={<IntegrationsPage />} />
            <Route path="integracoes/:tab" element={<IntegrationsPage />} />
            <Route path="biblioteca" element={<MasterKnowledge />} />
            <Route path="profile" element={<AccountSettings />} />
            <Route path="configuracoes/perfil" element={<Navigate to="/master/account" replace />} />
          </Route>

          <Route path="/dashboard" element={<Navigate to="/master" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </KeyboardProvider>
    </>
  );
};

export default App;

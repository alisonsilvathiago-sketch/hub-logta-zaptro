import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { HubThemeToaster } from './hub/components/HubThemeToaster';
import { AlertTriangle, RefreshCw, Box } from 'lucide-react';
import HubLogin from './hub/pages/Login';
import MasterLayout from './hub/layouts/MasterLayout';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import CommandPalette from '@shared/components/CommandPalette';
import { KeyboardProvider } from './core/context/KeyboardContext';
import { WhiteLabelProvider } from './core/context/WhiteLabelContext';
import GlobalLoader from '@shared/components/GlobalLoader';

const Inicio = React.lazy(() => import('./hub/modules/hub/Inicio'));
const CompanyManagement = React.lazy(() => import('./hub/modules/hub/Companies'));
const CompanyProfile = React.lazy(() => import('./hub/modules/hub/CompanyProfile'));
const BillingManagement = React.lazy(() => import('./hub/modules/hub/Billing'));
const Settings = React.lazy(() => import('./hub/modules/hub/GlobalSettings'));
const AccountSettings = React.lazy(() => import('./hub/modules/core/Profile'));
const CRM = React.lazy(() => import('./hub/modules/hub/CRM'));
const Agenda = React.lazy(() => import('./hub/modules/hub/Agenda'));
const ClientsList = React.lazy(() => import('./hub/modules/clients/ClientsList'));
const CustomerDetail = React.lazy(() => import('./hub/modules/hub/CustomerDetail'));
const TeamMemberDetail = React.lazy(() => import('./hub/modules/core/MemberDetail'));
const PublicCheckout = React.lazy(() => import('./hub/pages/PublicCheckout'));
const PaymentCheckout = React.lazy(() => import('./hub/pages/PaymentCheckout'));
const HubChat = React.lazy(() => import('./hub/modules/hub/Chat'));
const LogisticaHub = React.lazy(() => import('./hub/modules/hub/Logistica'));
const PublicFuelDashboard = React.lazy(() => import('./hub/pages/PublicFuelDashboard'));
const AnalyticalFuelDashboard = React.lazy(() => import('./hub/pages/AnalyticalFuelDashboard'));
const PublicRouteTracking = React.lazy(() => import('./hub/pages/PublicRouteTracking'));
const MasterKnowledge = React.lazy(() => import('./hub/modules/hub/Knowledge'));
const LogtaAdmin = React.lazy(() => import('./hub/modules/hub/LogtaAdmin'));
const LogtaClientProfile = React.lazy(() => import('./hub/modules/hub/LogtaClientProfile'));
const ZaptroAdmin = React.lazy(() => import('./hub/modules/hub/ZaptroAdmin'));
const BackupsAdmin = React.lazy(() => import('./hub/modules/hub/BackupsAdmin'));
const BackupsClientProfile = React.lazy(() => import('./hub/modules/hub/BackupsClientProfile'));
const EvolutionManager = React.lazy(() => import('./hub/modules/hub/EvolutionManager'));
const AuditLogs = React.lazy(() => import('./hub/modules/hub/AuditLogs'));
const LogDockAdmin = React.lazy(() => import('./hub/modules/hub/LogDockAdmin'));
const LogStokaAdmin = React.lazy(() => import('./hub/modules/hub/LogStokaAdmin'));
const WhatsappAdmin = React.lazy(() => import('./hub/modules/hub/WhatsappAdmin'));
const IAGatewayAdmin = React.lazy(() => import('./hub/modules/hub/IAGatewayAdmin'));

const HubRouteFallback = () => <GlobalLoader />;

import { runMasterAuditSync } from './core/lib/masterIntelligence';
import { subscribeToEvents } from './core/lib/eventBridge';

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

/** Rotas legadas `/master/integracoes/:tab` → Configurações › Integrações (sub-aba interna). */
function NavigateIntegracoesToSettings() {
  const { tab } = useParams<{ tab: string }>();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set('tab', 'integracoes');
  if (tab && tab !== 'google') params.set('sub', tab);
  else params.delete('sub');
  return <Navigate to={`/master/settings?${params.toString()}`} replace />;
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

    // 📡 Global Event Bridge Listener
    const unsubscribe = subscribeToEvents((event) => {
      if (event.type === 'SYSTEM_SYNC') {
        toast.info(`Sincronização global detectada: ${event.origin}`, {
          description: 'As configurações locais estão sendo atualizadas.',
          icon: <RefreshCw size={16} />
        });
      }
      if (event.type === 'POD_PENDING') {
        toast.warning(`Comprovante Pendente: ${event.payload.client_name}`, {
          description: 'Uma carga foi entregue e o canhoto precisa ser validado.',
          icon: <Box size={16} />
        });
      }
      if (event.type === 'SECURITY_ALERT') {
        toast.error(`ALERTA DE SEGURANÇA: ${event.origin}`, {
          description: event.payload.details,
          icon: <AlertTriangle size={16} />
        });
      }
    });

    return () => {
      clearInterval(auditInterval);
      unsubscribe();
    };
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
      <HubThemeToaster />
      <WhiteLabelProvider>
        <KeyboardProvider>
          <GlobalLoader />
          <CommandPalette />

        <Suspense fallback={<HubRouteFallback />}>
        <Routes>
          <Route path="/" element={<HubLogin />} />
          <Route path="/app" element={<Navigate to="/master" replace />} />
          <Route path="/auth/logdock" element={<Navigate to="/" replace />} />
          <Route path="/logdock/*" element={<Navigate to="/master" replace />} />
          
          {/* Rota de Checkout Público */}
          <Route path="/checkout" element={<PublicCheckout />} />
          <Route path="/play/:id" element={<PublicCheckout />} />
          <Route path="/pagar/:id" element={<PaymentCheckout />} />
          <Route path="/combustivel" element={<PublicFuelDashboard />} />
          <Route path="/fuel" element={<AnalyticalFuelDashboard />} />
          <Route path="/rastreamento-publico" element={<PublicRouteTracking />} />
          <Route path="/rastreamento-publico/:id" element={<PublicRouteTracking />} />
          
          {/* Rotas do Hub Master */}
          <Route path="/master" element={
            <ErrorBoundary>
              <MasterLayout />
            </ErrorBoundary>
          }>
            {/* Core Hub Routes */}
            <Route index element={<Inicio />} />
            <Route path="resultados" element={<Navigate to="/master#operacional" replace />} />
            
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

            {/* Infraestrutura removida do menu — rotas legadas redirecionam para Configurações */}
            <Route path="infrastructure/audit" element={<AuditLogs />} />
            <Route path="infrastructure/*" element={<Navigate to="/master/settings" replace />} />
            <Route path="backup" element={<Navigate to="/master/settings" replace />} />
            <Route path="security" element={<Navigate to="/master/settings?tab=seguranca" replace />} />

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
            <Route path="settings/interacoes" element={<Navigate to="/master/settings?tab=integracoes" replace />} />
            <Route path="settings/notificacoes" element={<Navigate to="/master/settings?tab=notificacoes" replace />} />
            <Route path="settings/*" element={<Settings />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="team/colaborador/:id" element={<TeamMemberDetail />} />
            <Route path="team/*" element={<RedirectMasterTeamToSettings />} />
            <Route path="staff" element={<Navigate to="/master/settings/equipe" replace />} />
            <Route path="analytics" element={<Navigate to="/master/companies/metricas-score" replace />} />
            <Route path="plans" element={<Navigate to="/master/billing/planos" replace />} />
            <Route path="notifications" element={<Navigate to="/master/settings?tab=notificacoes" replace />} />
            <Route path="automacoes" element={<Navigate to="/master/settings?tab=automacoes" replace />} />
            <Route path="automacoes/*" element={<Navigate to="/master/settings?tab=automacoes" replace />} />
            <Route path="automacoes/ia-gateway" element={<Navigate to="/master/ia-gateway" replace />} />
            <Route path="ia-gateway" element={<IAGatewayAdmin />} />
            <Route path="whatsapp" element={<WhatsappAdmin />} />
            <Route path="credits/*" element={<Navigate to="/master" replace />} />
            <Route path="logta" element={<LogtaAdmin />} />
            <Route path="logta/:id" element={<LogtaClientProfile />} />
            <Route path="zaptro" element={<ZaptroAdmin />} />
            <Route path="zaptro/:id/m/:metric" element={<ZaptroAdmin />} />
            <Route path="zaptro/:id" element={<ZaptroAdmin />} />
            <Route path="logdock" element={<LogDockAdmin />} />
            <Route path="logdock/:id" element={<LogDockAdmin />} />
            <Route path="logstoka" element={<LogStokaAdmin />} />
            <Route path="backups" element={<BackupsAdmin />} />
            <Route path="backups/:id" element={<BackupsClientProfile />} />
            <Route path="evolution" element={<EvolutionManager />} />
            <Route path="integracoes" element={<Navigate to="/master/settings?tab=integracoes" replace />} />
            <Route path="integracoes/:tab" element={<NavigateIntegracoesToSettings />} />
            <Route path="biblioteca" element={<MasterKnowledge />} />
            <Route path="profile" element={<AccountSettings />} />
            <Route path="configuracoes/perfil" element={<Navigate to="/master/account" replace />} />
          </Route>

          <Route path="/dashboard" element={<Navigate to="/master" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </KeyboardProvider>
    </WhiteLabelProvider>
    </>
  );
};

export default App;

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ZAPTRO_APP_ROUTES } from './app/zaptroAppRoutes';

/** Landing comercial oficial Zaptro — não alterar estrutura de conteúdo */
const WhatsAppSales = lazy(() => import('./pages/WhatsAppSales'));
const WhatsAppLogin = lazy(() => import('./pages/WhatsAppLogin'));
const ZaptroAppGuard = lazy(() => import('./app/ZaptroAppGuard'));
const ZaptroAppShell = lazy(() => import('./app/ZaptroAppShell'));
const ZaptroAppHomePage = lazy(() => import('./app/ZaptroAppHomePage'));
const ZaptroAppDashboardPage = lazy(() => import('./app/ZaptroAppDashboardPage'));
const ZaptroAppSettingsPage = lazy(() => import('./app/ZaptroAppSettingsPage'));
const ZaptroAppCompanyPage = lazy(() => import('./app/ZaptroAppCompanyPage'));
const ZaptroAppTeamPage = lazy(() => import('./app/ZaptroAppTeamPage'));
const ZaptroAppTeamMemberProfilePage = lazy(() => import('./app/ZaptroAppTeamMemberProfilePage'));
const ZaptroAppClientsPage = lazy(() => import('./app/ZaptroAppClientsPage'));
const ZaptroAppClientProfilePage = lazy(() => import('./app/ZaptroAppClientProfilePage'));
const ZaptroAppContactsPage = lazy(() => import('./app/ZaptroAppContactsPage'));
const ZaptroAppProfilePage = lazy(() => import('./app/ZaptroAppProfilePage'));
const ZaptroAppLogisticsPage = lazy(() => import('./app/ZaptroAppLogisticsPage'));
const ZaptroAppFilesPage = lazy(() => import('./app/ZaptroAppFilesPage'));
const ZaptroAppCrmPage = lazy(() => import('./app/ZaptroAppCrmPage'));
const ZaptroAppCrmLeadProfilePage = lazy(() => import('./app/ZaptroAppCrmLeadProfilePage'));
const ZaptroAppQuotesPage = lazy(() => import('./app/ZaptroAppQuotesPage'));
const ZaptroAppRoutesPage = lazy(() => import('./app/ZaptroAppRoutesPage'));
const ZaptroAppDriversPage = lazy(() => import('./app/ZaptroAppDriversPage'));
const ZaptroAppFleetPage = lazy(() => import('./app/ZaptroAppFleetPage'));
const ZaptroAppVehicleProfilePage = lazy(() => import('./app/ZaptroAppVehicleProfilePage'));
const ZaptroAppDriverProfilePage = lazy(() => import('./app/ZaptroAppDriverProfilePage'));
const ZaptroAppHelpersPage = lazy(() => import('./app/ZaptroAppHelpersPage'));
const ZaptroAppHelperProfilePage = lazy(() => import('./app/ZaptroAppHelperProfilePage'));
const WaLinkInboxPage = lazy(() => import('./modules/wa-link/WaLinkInboxPage'));
const WaLinkBroadcastsPage = lazy(() => import('./modules/wa-link/WaLinkBroadcastsPage'));
const ZaptroAgendaPage = lazy(() => import('./pages/ZaptroAgenda'));
const ZaptroQuotePublic = lazy(() => import('./pages/ZaptroQuotePublic'));
const ZaptroPublicTrack = lazy(() => import('./pages/ZaptroPublicTrack'));
const ZaptroDriverRoute = lazy(() => import('./pages/ZaptroDriverRoute'));

function RedirectWithToken({ toPrefix }: { toPrefix: string }) {
  const { token = '' } = useParams<{ token: string }>();
  return <Navigate to={`${toPrefix}/${encodeURIComponent(token)}`} replace />;
}

function RedirectLegacyLeadProfile() {
  const { leadId = '' } = useParams<{ leadId: string }>();
  return <Navigate to={ZAPTRO_APP_ROUTES.leadProfile(leadId)} replace />;
}

function RedirectTeamMemberProfile() {
  const { memberId = '' } = useParams<{ memberId: string }>();
  return <Navigate to={ZAPTRO_APP_ROUTES.teamMemberProfile(memberId)} replace />;
}

const PageFallback = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      color: '#D9FF00',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 700,
    }}
  >
    Zaptro…
  </div>
);

const App: React.FC = () => (
  <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<WhatsAppSales />} />
      <Route path="/vendas" element={<WhatsAppSales />} />

      <Route path={ZAPTRO_APP_ROUTES.LOGIN} element={<WhatsAppLogin />} />

      <Route path="/orcamento/:token" element={<ZaptroQuotePublic />} />
      <Route path="/rastreamento/:token" element={<ZaptroPublicTrack />} />
      <Route path="/acompanhar/:token" element={<RedirectWithToken toPrefix="/rastreamento" />} />
      <Route path="/rota-motorista/:token" element={<ZaptroDriverRoute />} />
      <Route path="/rota/:token" element={<RedirectWithToken toPrefix="/rota-motorista" />} />

      <Route element={<ZaptroAppGuard />}>
        <Route path={ZAPTRO_APP_ROUTES.ROOT} element={<ZaptroAppShell />}>
          <Route index element={<ZaptroAppHomePage />} />
          <Route path="resultados" element={<ZaptroAppDashboardPage />} />
          <Route path="conversas" element={<WaLinkInboxPage />} />
          <Route path="listas-transmissao" element={<WaLinkBroadcastsPage />} />
          <Route path="contatos" element={<ZaptroAppContactsPage />} />
          <Route path="clientes" element={<ZaptroAppClientsPage />} />
          <Route path="clientes/perfil/:clientId" element={<ZaptroAppClientProfilePage />} />
          <Route path="crm" element={<ZaptroAppCrmPage />} />
          <Route path="crm/leads/:leadId" element={<ZaptroAppCrmLeadProfilePage />} />
          <Route path="crm/leads/perfil/:leadId" element={<RedirectLegacyLeadProfile />} />
          <Route path="agenda" element={<ZaptroAgendaPage />} />
          <Route path="orcamentos" element={<ZaptroAppQuotesPage />} />
          <Route path="rotas" element={<ZaptroAppRoutesPage />} />
          <Route path="motoristas" element={<ZaptroAppDriversPage />} />
          <Route path="motoristas/perfil/:driverId" element={<ZaptroAppDriverProfilePage />} />
          <Route path="motoristas/frota" element={<ZaptroAppFleetPage />} />
          <Route path="motoristas/frota/perfil/:vehicleId" element={<ZaptroAppVehicleProfilePage />} />
          <Route path="motoristas/ajudantes" element={<ZaptroAppHelpersPage />} />
          <Route path="motoristas/ajudantes/perfil/:helperId" element={<ZaptroAppHelperProfilePage />} />
          <Route path="logistica" element={<ZaptroAppLogisticsPage />} />
          <Route path="arquivos" element={<ZaptroAppFilesPage />} />
          <Route path="minha-empresa" element={<ZaptroAppCompanyPage />} />
          <Route path="membros" element={<ZaptroAppTeamPage />} />
          <Route path="membros/perfil/:memberId" element={<ZaptroAppTeamMemberProfilePage />} />
          <Route path="configuracoes" element={<ZaptroAppSettingsPage />} />
          <Route path="perfil" element={<ZaptroAppProfilePage />} />
        </Route>
      </Route>

      <Route path="/conexao" element={<Navigate to={ZAPTRO_APP_ROUTES.CONNECT} replace />} />
      <Route path="/app/conexao" element={<Navigate to={ZAPTRO_APP_ROUTES.CONNECT} replace />} />
      <Route path="/conversas" element={<Navigate to={ZAPTRO_APP_ROUTES.INBOX} replace />} />
      <Route path="/comercial" element={<Navigate to={ZAPTRO_APP_ROUTES.CRM} replace />} />
      <Route path="/clientes/leads/perfil/:leadId" element={<RedirectLegacyLeadProfile />} />
      <Route path="/comercial/orcamentos" element={<Navigate to={ZAPTRO_APP_ROUTES.QUOTES} replace />} />
      <Route path="/rotas" element={<Navigate to={ZAPTRO_APP_ROUTES.ROUTES} replace />} />
      <Route path="/motoristas" element={<Navigate to={ZAPTRO_APP_ROUTES.DRIVERS} replace />} />
      <Route path="/frota" element={<Navigate to={ZAPTRO_APP_ROUTES.FLEET} replace />} />
      <Route path="/motoristas/frota" element={<Navigate to={ZAPTRO_APP_ROUTES.FLEET} replace />} />
      <Route path="/app/login" element={<Navigate to={ZAPTRO_APP_ROUTES.LOGIN} replace />} />
      <Route
        path="/equipe/perfil/:memberId"
        element={<RedirectTeamMemberProfile />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default App;

import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import LogstokaGuard from '@/app/LogstokaGuard';
import AppShell from '@/components/layout/AppShell';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/Login';

const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'));
const InicioPage = lazy(() => import('@/modules/inicio/InicioPage'));
const ProductsSectionLayout = lazy(() => import('@/modules/products/ProductsSectionLayout'));
const WarehousesPage = lazy(() => import('@/modules/warehouses/WarehousesPage'));
const MovementsPage = lazy(() => import('@/modules/movements/MovementsPage'));
const PickingPage = lazy(() => import('@/modules/picking/PickingPage'));
const ConferencePage = lazy(() => import('@/modules/conference/ConferencePage'));
const InventoryPage = lazy(() => import('@/modules/inventory/InventoryPage'));
const ReturnsPage = lazy(() => import('@/modules/returns/ReturnsPage'));
const TransfersPage = lazy(() => import('@/modules/transfers/TransfersPage'));
const ProductsPage = lazy(() => import('@/modules/products/ProductsPage'));
const ProductStoreGroupsPage = lazy(() => import('@/modules/products/ProductStoreGroupsPage'));
const ProductPublicationPage = lazy(() => import('@/modules/products/ProductPublicationPage'));
const ProductSyncPage = lazy(() => import('@/modules/products/ProductSyncPage'));
const ProductDetailPage = lazy(() => import('@/modules/products/ProductDetailPage'));
const MovementDetailPage = lazy(() => import('@/modules/movements/MovementDetailPage'));
const TransferDetailPage = lazy(() => import('@/modules/transfers/TransferDetailPage'));
const ReturnDetailPage = lazy(() => import('@/modules/returns/ReturnDetailPage'));
const ImportDetailPage = lazy(() => import('@/modules/imports/ImportDetailPage'));
const InventoryDetailPage = lazy(() => import('@/modules/inventory/InventoryDetailPage'));
const PickingDetailPage = lazy(() => import('@/modules/picking/PickingDetailPage'));
const AlertDetailPage = lazy(() => import('@/modules/alerts/AlertDetailPage'));
const CollaboratorDetailPage = lazy(() => import('@/modules/team/CollaboratorDetailPage'));
const IntegrationLogDetailPage = lazy(() => import('@/modules/integrations/IntegrationLogDetailPage'));
const ImportsPage = lazy(() => import('@/modules/imports/ImportsPage'));
const ReportsPage = lazy(() => import('@/modules/reports/ReportsPage'));
const MarketplaceRankingPage = lazy(() => import('@/modules/integrations/MarketplaceRankingPage'));
const MarketplaceStorePage = lazy(() => import('@/modules/integrations/MarketplaceStorePage'));
const MarketplaceHubPage = lazy(() => import('@/modules/integrations/MarketplaceHubPage'));
const SettingsLayout = lazy(() => import('@/modules/settings/SettingsLayout'));
const SettingsProfilePanel = lazy(() => import('@/modules/settings/panels/SettingsProfilePanel'));
const SettingsCompanyPanel = lazy(() => import('@/modules/settings/panels/SettingsCompanyPanel'));
const SettingsTeamPanel = lazy(() => import('@/modules/settings/panels/SettingsTeamPanel'));
const SettingsApiWebhooksPanel = lazy(() => import('@/modules/settings/panels/SettingsApiWebhooksPanel'));
const SettingsIntegrationsPanel = lazy(() => import('@/modules/settings/panels/SettingsIntegrationsPanel'));
const SettingsNotificationsPanel = lazy(() => import('@/modules/settings/panels/SettingsNotificationsPanel'));
const SettingsAuditPanel = lazy(() => import('@/modules/settings/panels/SettingsAuditPanel'));
const SettingsSecurityPanel = lazy(() => import('@/modules/settings/panels/SettingsSecurityPanel'));
const SettingsWhiteLabelPanel = lazy(() => import('@/modules/settings/panels/SettingsWhiteLabelPanel'));
const TeamRankingPage = lazy(() => import('@/modules/team/TeamRankingPage'));

const LegacyCollaboratorRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/app/configuracoes/equipe/${id ?? ''}`} replace />;
};

const LegacyIntegrationLogRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/app/configuracoes/api-webhooks/logs/${id ?? ''}`} replace />;
};

const LegacyAlertRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (id) return <Navigate to={`/app/configuracoes/notificacoes/${id}`} replace />;
  return <Navigate to="/app/configuracoes/notificacoes?tab=alertas" replace />;
};

const Loading: React.FC = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold text-slate-500">
    Carregando módulo…
  </div>
);

const App: React.FC = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/vendas" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<LogstokaGuard />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<InicioPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsSectionLayout />}>
            <Route index element={<ProductsPage />} />
            <Route path="grupos" element={<ProductStoreGroupsPage />} />
            <Route path="publicacao" element={<ProductPublicationPage />} />
            <Route path="sincronizacao" element={<ProductSyncPage />} />
            <Route path=":id" element={<ProductDetailPage />} />
          </Route>
          <Route path="movements/:id" element={<MovementDetailPage />} />
          <Route path="transfers/:id" element={<TransferDetailPage />} />
          <Route path="returns/:id" element={<ReturnDetailPage />} />
          <Route path="imports/:id" element={<ImportDetailPage />} />
          <Route path="inventory/:id" element={<InventoryDetailPage />} />
          <Route path="picking/:key" element={<PickingDetailPage />} />
          <Route path="warehouses" element={<WarehousesPage />} />
          <Route path="movements" element={<MovementsPage />} />
          <Route path="transfers" element={<TransfersPage />} />
          <Route path="picking" element={<PickingPage />} />
          <Route path="conference" element={<ConferencePage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="returns" element={<ReturnsPage />} />
          <Route path="imports" element={<ImportsPage />} />
          <Route path="reports" element={<ReportsPage />} />

          {/* Hub operacional por marketplace — /app/mercadolivre, /app/shopee, … */}
          <Route path="mercadolivre" element={<MarketplaceHubPage />} />
          <Route path="marcadolivre" element={<Navigate to="/app/mercadolivre" replace />} />
          <Route path="shopee" element={<MarketplaceHubPage />} />
          <Route path="amazon" element={<MarketplaceHubPage />} />
          <Route path="tiktok" element={<MarketplaceHubPage />} />
          <Route path="magalu" element={<MarketplaceHubPage />} />

          <Route path="configuracoes" element={<SettingsLayout />}>
            <Route index element={<Navigate to="meu-perfil" replace />} />
            <Route path="meu-perfil" element={<SettingsProfilePanel />} />
            <Route path="empresa" element={<SettingsCompanyPanel />} />
            <Route path="equipe" element={<SettingsTeamPanel />} />
            <Route path="equipe/ranking" element={<TeamRankingPage embedded />} />
            <Route path="equipe/:id" element={<CollaboratorDetailPage />} />
            <Route path="api-webhooks" element={<SettingsApiWebhooksPanel />} />
            <Route path="api-webhooks/logs/:id" element={<IntegrationLogDetailPage />} />
            <Route path="integracoes/marketplaces" element={<MarketplaceRankingPage embedded />} />
            <Route path="integracoes/:marketplace/:storeSlug" element={<MarketplaceStorePage embedded />} />
            <Route path="integracoes/:marketplace" element={<MarketplaceStorePage embedded />} />
            <Route path="integracoes" element={<SettingsIntegrationsPanel />} />
            <Route path="notificacoes" element={<SettingsNotificationsPanel />} />
            <Route path="notificacoes/:id" element={<AlertDetailPage embedded />} />
            <Route path="auditoria" element={<SettingsAuditPanel />} />
            <Route path="seguranca" element={<SettingsSecurityPanel />} />
            <Route path="white-label" element={<SettingsWhiteLabelPanel />} />
          </Route>

          {/* Rotas legadas → hub de configurações */}
          <Route path="settings" element={<Navigate to="/app/configuracoes/empresa" replace />} />
          <Route path="perfil" element={<Navigate to="/app/configuracoes/meu-perfil" replace />} />
          <Route path="empresa" element={<Navigate to="/app/configuracoes/empresa" replace />} />
          <Route path="colaboradores/ranking" element={<Navigate to="/app/configuracoes/equipe/ranking" replace />} />
          <Route path="colaboradores/:id" element={<LegacyCollaboratorRedirect />} />
          <Route path="colaboradores" element={<Navigate to="/app/configuracoes/equipe" replace />} />
          <Route path="interacoes" element={<Navigate to="/app/configuracoes/auditoria" replace />} />
          <Route path="integrations/marketplaces" element={<Navigate to="/app/configuracoes/integracoes/marketplaces" replace />} />
          <Route path="integrations/logs/:id" element={<LegacyIntegrationLogRedirect />} />
          <Route path="integrations" element={<Navigate to="/app/configuracoes/integracoes" replace />} />
          <Route path="alerts/:id" element={<LegacyAlertRedirect />} />
          <Route path="alerts" element={<LegacyAlertRedirect />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default App;

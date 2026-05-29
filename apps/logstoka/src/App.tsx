import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LogstokaGuard from '@/app/LogstokaGuard';
import AppShell from '@/components/layout/AppShell';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/Login';

const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'));
const ProductsPage = lazy(() => import('@/modules/products/ProductsPage'));
const WarehousesPage = lazy(() => import('@/modules/warehouses/WarehousesPage'));
const MovementsPage = lazy(() => import('@/modules/movements/MovementsPage'));
const PickingPage = lazy(() => import('@/modules/picking/PickingPage'));
const ConferencePage = lazy(() => import('@/modules/conference/ConferencePage'));
const InventoryPage = lazy(() => import('@/modules/inventory/InventoryPage'));
const ReturnsPage = lazy(() => import('@/modules/returns/ReturnsPage'));
const TransfersPage = lazy(() => import('@/modules/transfers/TransfersPage'));
const ProductDetailPage = lazy(() => import('@/modules/products/ProductDetailPage'));
const ImportsPage = lazy(() => import('@/modules/imports/ImportsPage'));
const ReportsPage = lazy(() => import('@/modules/reports/ReportsPage'));
const IntegrationsPage = lazy(() => import('@/modules/integrations/IntegrationsPage'));
const AlertsPage = lazy(() => import('@/modules/alerts/AlertsPage'));
const SettingsPage = lazy(() => import('@/modules/settings/SettingsPage'));

const Loading: React.FC = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold text-slate-500">
    Carregando módulo…
  </div>
);

const App: React.FC = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<LogstokaGuard />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="warehouses" element={<WarehousesPage />} />
          <Route path="movements" element={<MovementsPage />} />
          <Route path="transfers" element={<TransfersPage />} />
          <Route path="picking" element={<PickingPage />} />
          <Route path="conference" element={<ConferencePage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="returns" element={<ReturnsPage />} />
          <Route path="imports" element={<ImportsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default App;

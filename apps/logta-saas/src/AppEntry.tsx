import React, { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { isLogtaPublicPath } from './components/LogtaAuthGate';
import { AuthenticatedShell } from './AuthenticatedShell';
import { AuthenticatedGate } from './components/AuthenticatedGate';
import { AuthPageFallback } from './components/AuthPageFallback';
import { TenantProvider } from './contexts/TenantContext';
import { LogtaProfileProvider } from './contexts/LogtaProfileContext';
import { HubEntitlementsProvider } from './contexts/HubEntitlementsContext';
import { LogtaModuleActivationProvider } from './contexts/LogtaModuleActivationContext';
import { OperationalDataProvider } from './contexts/OperationalDataContext';
import { LogtaIaProvider } from './contexts/LogtaIaContext';
import { LogtaSandboxBootstrap } from './components/LogtaSandboxBootstrap';

const PublicRoutes = lazy(() => import('./routes/PublicRoutes'));

/**
 * Login e rotas públicas não carregam o painel (~AppChrome).
 */
export default function AppEntry() {
  const { pathname } = useLocation();
  const isPublic = isLogtaPublicPath(pathname);

  if (isPublic) {
    return (
      <TenantProvider>
        <Suspense
          fallback={
            <AuthPageFallback
              message={pathname === '/login' ? 'Carregando login…' : 'Carregando…'}
            />
          }
        >
          <PublicRoutes />
        </Suspense>
      </TenantProvider>
    );
  }

  return (
    <TenantProvider>
      <AuthenticatedGate>
        <LogtaSandboxBootstrap />
        <OperationalDataProvider>
          <LogtaIaProvider>
            <LogtaProfileProvider>
              <HubEntitlementsProvider>
                <LogtaModuleActivationProvider>
                  <AuthenticatedShell />
                </LogtaModuleActivationProvider>
              </HubEntitlementsProvider>
            </LogtaProfileProvider>
          </LogtaIaProvider>
        </OperationalDataProvider>
      </AuthenticatedGate>
    </TenantProvider>
  );
}

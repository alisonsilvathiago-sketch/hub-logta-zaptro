import React, { useMemo } from 'react';
import HubGuard from '../components/HubGuard';
import { ZaptroThemeProvider } from '../context/ZaptroThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { isZaptroBrandingEntitledByPlan } from '../utils/zaptroBrandingEntitlement';
import { hasZaptroGranularPermission, isZaptroTenantAdminRole } from '../utils/zaptroPermissions';
import './zaptroAppModule.css';

type Props = {
  children: React.ReactNode;
  /** Rotas/mapa em ecrã inteiro — sem padding extra. */
  fullBleed?: boolean;
};

const ZaptroAppModuleShell: React.FC<Props> = ({ children, fullBleed = false }) => {
  const { profile, isMaster } = useAuth();
  const { company } = useTenant();

  const canCustomizeTenant = useMemo(() => {
    if (isMaster) return true;
    if (!isZaptroBrandingEntitledByPlan(company)) return false;
    if (isZaptroTenantAdminRole(profile?.role)) return true;
    return hasZaptroGranularPermission(profile?.role, profile?.permissions, 'cfg_marca');
  }, [isMaster, profile?.role, profile?.permissions, company]);

  const companyId = company?.id || profile?.company_id || '';

  return (
    <div
      className={`zaptro-app-module-page${fullBleed ? ' zaptro-app-module-page--fullbleed' : ''}`}
      style={
        fullBleed
          ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
          : { flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }
      }
    >
      <HubGuard companyId={companyId}>
        <ZaptroThemeProvider canCustomizeTenant={canCustomizeTenant}>
          {children}
        </ZaptroThemeProvider>
      </HubGuard>
    </div>
  );
};

export default ZaptroAppModuleShell;

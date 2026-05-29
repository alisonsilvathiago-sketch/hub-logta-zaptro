import React, { useMemo } from 'react';
import { ZaptroThemeProvider } from '../context/ZaptroThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { ZaptroSettingsInner } from '../pages/ZaptroSettings';
import { isZaptroBrandingEntitledByPlan } from '../utils/zaptroBrandingEntitlement';
import { hasZaptroGranularPermission, isZaptroTenantAdminRole } from '../utils/zaptroPermissions';
import './zaptroAppSettings.css';

const ZaptroAppSettingsPage: React.FC = () => {
  const { profile, isMaster } = useAuth();
  const { company } = useTenant();

  const canCustomizeTenant = useMemo(() => {
    if (isMaster) return true;
    if (!isZaptroBrandingEntitledByPlan(company)) return false;
    if (isZaptroTenantAdminRole(profile?.role)) return true;
    return hasZaptroGranularPermission(profile?.role, profile?.permissions, 'cfg_marca');
  }, [isMaster, profile?.role, profile?.permissions, company]);

  return (
    <div className="zaptro-app-settings-page">
      <ZaptroThemeProvider canCustomizeTenant={canCustomizeTenant}>
        <ZaptroSettingsInner />
      </ZaptroThemeProvider>
    </div>
  );
};

export default ZaptroAppSettingsPage;

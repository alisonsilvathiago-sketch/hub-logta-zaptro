import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import {
  activateMarketplaceModule,
  isMarketplaceModuleActive,
  loadMarketplaceModuleConfig,
  MARKETPLACE_MODULE_CHANGED_EVENT,
} from '@/lib/marketplaceModule';
import { loadOperationalProfile } from '@/lib/operationalProfile';

export function useMarketplaceModule() {
  const { companyId } = useLogstokaTenant();
  const operationalProfile = useMemo(() => loadOperationalProfile(companyId), [companyId]);
  const [, bump] = useState(0);

  useEffect(() => {
    const onChange = () => bump((value) => value + 1);
    window.addEventListener(MARKETPLACE_MODULE_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(MARKETPLACE_MODULE_CHANGED_EVENT, onChange);
  }, []);

  const isActive = isMarketplaceModuleActive(companyId, operationalProfile);
  const config = loadMarketplaceModuleConfig(companyId);

  const activate = useCallback(() => {
    activateMarketplaceModule(companyId);
  }, [companyId]);

  return {
    isActive,
    activate,
    activatedAt: config.activatedAt,
    operationalProfile,
  };
}

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMarketplaceModule } from '@/hooks/useMarketplaceModule';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

type Props = {
  children: React.ReactNode;
};

const MarketplaceModuleGuard: React.FC<Props> = ({ children }) => {
  const { isActive } = useMarketplaceModule();
  const location = useLocation();

  if (isActive) return <>{children}</>;

  return (
    <Navigate
      to={LOGSTOKA_ROUTES.MARKETPLACE_HUB}
      replace
      state={{ from: location.pathname, locked: true }}
    />
  );
};

export default MarketplaceModuleGuard;

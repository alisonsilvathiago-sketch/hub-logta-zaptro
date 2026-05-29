import React from 'react';
import { NavLink } from 'react-router-dom';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { INTEGRATED_MARKETPLACES, marketplaceHubPath } from '@/lib/marketplaceHub';
import { MARKETPLACE_LABELS, type Marketplace } from '@/types';

const TopbarIntegrationStrip: React.FC = () => (
  <>
    <span className="lsdash-topbar-sep" aria-hidden />
    <nav className="lsdash-integrations-strip" aria-label="Interações ativas">
    {INTEGRATED_MARKETPLACES.map((mp: Marketplace) => (
      <NavLink
        key={mp}
        to={marketplaceHubPath(mp)}
        title={`${MARKETPLACE_LABELS[mp]} — ver painel operacional`}
        className={({ isActive }) =>
          `lsdash-integration-logo${isActive ? ' lsdash-integration-logo--active' : ''}`
        }
      >
        <MarketplaceLogo marketplace={mp} size={28} />
      </NavLink>
    ))}
    </nav>
  </>
);

export default TopbarIntegrationStrip;

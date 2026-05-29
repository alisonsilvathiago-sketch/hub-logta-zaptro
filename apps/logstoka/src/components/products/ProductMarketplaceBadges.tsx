import React from 'react';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import type { Marketplace } from '@/types';

type Props = {
  marketplaces: Marketplace[];
};

const ProductMarketplaceBadges: React.FC<Props> = ({ marketplaces }) => {
  if (marketplaces.length === 0) {
    return <span className="text-xs font-semibold text-[#a3a3a3]">—</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {marketplaces.map((mp) => (
        <span key={mp} className="ls-product-mp-badge" title={mp}>
          <MarketplaceLogo marketplace={mp} size={22} />
        </span>
      ))}
    </span>
  );
};

export default ProductMarketplaceBadges;

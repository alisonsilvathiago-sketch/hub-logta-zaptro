import React from 'react';
import { Link } from 'react-router-dom';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { stopRowNavigate } from '@/components/ui/ClickableTableRow';
import { marketplaceHubPath } from '@/lib/marketplaceHub';
import { marketplaceStorePath, resolveBrandToStore } from '@/lib/marketplaceStores';
import type { Marketplace } from '@/types';
import { MARKETPLACE_LABELS } from '@/types';

type Props = {
  brand?: string | null;
  marketplace?: Marketplace;
  storeName?: string;
  storeSlug?: string;
  logoUrl?: string;
  size?: number;
  showName?: boolean;
};

/** Logo + link para página da loja/marketplace integrada */
const StoreLinkCell: React.FC<Props> = ({
  brand,
  marketplace,
  storeName,
  storeSlug,
  logoUrl,
  size = 32,
  showName = true,
}) => {
  const fromBrand = resolveBrandToStore(brand);
  const mp = marketplace ?? fromBrand?.marketplace;
  const name = storeName ?? fromBrand?.name ?? brand;
  const slug = storeSlug ?? fromBrand?.slug;
  const img = logoUrl ?? fromBrand?.logoUrl;

  if (!mp || !name) {
    return <span className="text-slate-500">{brand || '—'}</span>;
  }

  const href = slug ? marketplaceStorePath(mp, slug) : marketplaceHubPath(mp);

  return (
    <div className="flex items-center gap-2.5" onClick={stopRowNavigate}>
      <Link
        to={href}
        className="group flex shrink-0 items-center gap-2.5 rounded-xl transition hover:opacity-90"
        title={`Ver painel ${name} · ${MARKETPLACE_LABELS[mp]}`}
      >
        <span className="relative flex shrink-0 items-center">
          {img ? (
            <img
              src={img}
              alt=""
              width={size}
              height={size}
              className="rounded-xl object-cover ring-1 ring-slate-200"
              style={{ width: size, height: size }}
            />
          ) : (
            <MarketplaceLogo marketplace={mp} size={size} />
          )}
          <span className="absolute -bottom-1 -right-1 rounded-md ring-2 ring-white">
            <MarketplaceLogo marketplace={mp} size={14} />
          </span>
        </span>
        {showName && (
          <span className="font-semibold text-slate-800 group-hover:text-orange-700">{name}</span>
        )}
      </Link>
    </div>
  );
};

export default StoreLinkCell;

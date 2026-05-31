import React from 'react';
import IntegrationBrandLogo from '@/components/integrations/IntegrationBrandLogo';
import { getIntegrationBrand, getIntegrationBrandLabel } from '@/lib/integrationBrandAssets';
import type { Marketplace } from '@/types';
import { MARKETPLACE_LABELS } from '@/types';

type LogoProps = { size?: number; className?: string };

/** Registro extensível — novos marketplaces podem ser adicionados em runtime */
const extraRegistry = new Map<string, { label: string }>();

export function registerMarketplaceBrand(key: string, label: string) {
  extraRegistry.set(key, { label });
}

export function getMarketplaceLabel(marketplace: string): string {
  const brand = getIntegrationBrand(marketplace);
  if (brand) return brand.label;
  if (marketplace in MARKETPLACE_LABELS) {
    return MARKETPLACE_LABELS[marketplace as Marketplace];
  }
  return extraRegistry.get(marketplace)?.label ?? getIntegrationBrandLabel(marketplace);
}

export type MarketplaceLogoProps = {
  marketplace: Marketplace | string;
  size?: number;
  className?: string;
  showLabel?: boolean;
  labelClassName?: string;
  linkToHub?: boolean;
};

/** Logo oficial salvo em public/integrations/brands/ — Mercado Livre e demais canais */
export function MarketplaceLogo({
  marketplace,
  size = 28,
  className,
  showLabel = false,
  labelClassName,
  linkToHub = false,
}: MarketplaceLogoProps) {
  return (
    <IntegrationBrandLogo
      brandKey={marketplace}
      size={size}
      className={className}
      showLabel={showLabel}
      labelClassName={labelClassName}
      linkToHub={linkToHub}
    />
  );
}

export default MarketplaceLogo;

/** @deprecated use MarketplaceLogo — mantido para imports legados */
export type { LogoProps };

import React from 'react';
import type { Marketplace } from '@/types';
import { MARKETPLACE_LABELS } from '@/types';

type LogoProps = { size?: number; className?: string };

function ShopeeLogo({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="11" fill="#EE4D2D" />
      <path
        fill="#fff"
        d="M14 17h20l-1.8 14H15.8L14 17zm2.2-5.5h15.6l1.6 3.5H14.6l1.6-3.5zM24 29.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"
      />
    </svg>
  );
}

function MercadoLivreLogo({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="11" fill="#FFE600" />
      <ellipse cx="18" cy="26" rx="7" ry="8" fill="#2D3277" />
      <ellipse cx="30" cy="26" rx="7" ry="8" fill="#2D3277" />
      <path fill="#fff" d="M24 18c-2.5 0-4.5 1.2-5.8 3.1 1.8-1 3.9-1.4 5.8-1.4s4 .4 5.8 1.4C28.5 19.2 26.5 18 24 18z" />
    </svg>
  );
}

function AmazonLogo({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="11" fill="#131921" />
      <path
        fill="#FF9900"
        d="M11 28.5c4.2 3.2 8.7 4.8 13.5 4.8 5.1 0 9.5-1.4 13.2-4.2l1.2 1.8c-4.2 3.4-9.2 5.1-14.4 5.1-6 0-11.4-2.2-15.8-6.6l2.3-1z"
      />
      <path fill="#fff" d="M14 16h3.2v8.4H14V16zm5.8 0h3v1.2c.8-.9 1.9-1.4 3.2-1.4 2.6 0 4.2 1.7 4.2 4.6v6H27v-5.6c0-1.8-.9-2.8-2.5-2.8-1.5 0-2.5 1-2.8 2.5-.1.3-.1.7-.1 1.1v4.8h-3.2V16z"
      />
    </svg>
  );
}

function TikTokLogo({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="11" fill="#010101" />
      <path
        fill="#25F4EE"
        d="M28.5 14v14.8a4.2 4.2 0 1 1-2.8-4v-6.8h2.8V14h-2.8V11h3.5l.3 3z"
      />
      <path
        fill="#FE2C55"
        d="M30 14v14.8a4.2 4.2 0 1 1-2.8-4v-6.8H30V14z"
        opacity="0.95"
      />
      <path fill="#fff" d="M27.2 28.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z" />
    </svg>
  );
}

function MagaluLogo({ size = 28, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="11" fill="#0086FF" />
      <path
        fill="#fff"
        d="M24 11c5.8 0 10.5 4.4 10.5 9.8 0 4.8-3.4 8.8-8 9.6V35h-5v-4.6c-4.6-.8-8-4.8-8-9.6C13.5 15.4 18.2 11 24 11zm0 4.2c-3.1 0-5.6 2.5-5.6 5.6S20.9 26.4 24 26.4s5.6-2.5 5.6-5.6S27.1 15.2 24 15.2z"
      />
    </svg>
  );
}

function FallbackMarketplaceLogo({ label, size = 28, className }: LogoProps & { label: string }) {
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="11" fill="#EA580C" />
      <text x="24" y="30" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800" fontFamily="Inter, system-ui, sans-serif">
        {initials || '?'}
      </text>
    </svg>
  );
}

const LOGO_MAP: Record<Marketplace, React.FC<LogoProps>> = {
  shopee: ShopeeLogo,
  mercadolivre: MercadoLivreLogo,
  amazon: AmazonLogo,
  tiktok: TikTokLogo,
  magalu: MagaluLogo,
};

/** Registro extensível — novos marketplaces podem ser adicionados em runtime */
const extraRegistry = new Map<string, { label: string; Logo?: React.FC<LogoProps> }>();

export function registerMarketplaceBrand(
  key: string,
  label: string,
  Logo?: React.FC<LogoProps>,
) {
  extraRegistry.set(key, { label, Logo });
}

export function getMarketplaceLabel(marketplace: string): string {
  if (marketplace in MARKETPLACE_LABELS) {
    return MARKETPLACE_LABELS[marketplace as Marketplace];
  }
  return extraRegistry.get(marketplace)?.label ?? marketplace.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export type MarketplaceLogoProps = {
  marketplace: Marketplace | string;
  size?: number;
  className?: string;
  showLabel?: boolean;
  labelClassName?: string;
};

export function MarketplaceLogo({
  marketplace,
  size = 28,
  className,
  showLabel = false,
  labelClassName,
}: MarketplaceLogoProps) {
  const label = getMarketplaceLabel(marketplace);
  const KnownLogo = LOGO_MAP[marketplace as Marketplace];
  const extra = extraRegistry.get(marketplace);
  const Logo = KnownLogo ?? extra?.Logo;

  const icon = Logo ? (
    <Logo size={size} className={className} />
  ) : (
    <FallbackMarketplaceLogo label={label} size={size} className={className} />
  );

  if (!showLabel) return icon;

  return (
    <span className="inline-flex items-center gap-2.5">
      {icon}
      <span className={labelClassName ?? 'font-black text-slate-900'}>{label}</span>
    </span>
  );
}

export default MarketplaceLogo;

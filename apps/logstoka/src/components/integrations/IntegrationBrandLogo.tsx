import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getIntegrationBrand,
  getIntegrationBrandHubPath,
  getIntegrationBrandLabel,
} from '@/lib/integrationBrandAssets';

export type IntegrationBrandLogoProps = {
  brandKey: string;
  size?: number;
  className?: string;
  showLabel?: boolean;
  labelClassName?: string;
  linkToHub?: boolean;
  rounded?: boolean;
  /** Cor de fallback (#RRGGBB) quando não há PNG/SVG */
  fallbackColor?: string;
};

function BrandFallback({
  label,
  size,
  className,
  rounded,
  fallbackColor,
}: {
  label: string;
  size: number;
  className?: string;
  rounded?: boolean;
  fallbackColor?: string;
}) {
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span
      className={`ls-brand-logo ls-brand-logo--fallback ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded === false ? 8 : '14px',
        background: fallbackColor ? `#${fallbackColor.replace(/^#/, '')}` : undefined,
      }}
      aria-hidden
    >
      {initials || '?'}
    </span>
  );
}

function BrandImage({
  brandKey,
  size,
  className,
  rounded,
  fallbackColor,
}: {
  brandKey: string;
  size: number;
  className?: string;
  rounded?: boolean;
  fallbackColor?: string;
}) {
  const brand = getIntegrationBrand(brandKey);
  const label = getIntegrationBrandLabel(brandKey);
  const [src, setSrc] = useState(brand?.png ?? brand?.svg ?? '');
  const [failed, setFailed] = useState(!src);

  if (!brand || failed) {
    return (
      <BrandFallback
        label={label}
        size={size}
        className={className}
        rounded={rounded}
        fallbackColor={fallbackColor}
      />
    );
  }

  return (
    <img
      src={src}
      alt={brand.label}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`ls-brand-logo ${rounded === false ? 'ls-brand-logo--square' : ''} ${className ?? ''}`.trim()}
      style={{ width: size, height: size }}
      onError={() => {
        if (src !== brand.svg && brand.svg) {
          setSrc(brand.svg);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

export function IntegrationBrandLogo({
  brandKey,
  size = 32,
  className,
  showLabel = false,
  labelClassName,
  linkToHub = false,
  rounded = true,
  fallbackColor,
}: IntegrationBrandLogoProps) {
  const label = getIntegrationBrandLabel(brandKey);
  const hubPath = getIntegrationBrandHubPath(brandKey);

  const icon = (
    <BrandImage
      brandKey={brandKey}
      size={size}
      className={className}
      rounded={rounded}
      fallbackColor={fallbackColor}
    />
  );

  const wrappedIcon =
    linkToHub && hubPath ? (
      <Link to={hubPath} className="ls-brand-logo-link" title={`Abrir ${label}`}>
        {icon}
      </Link>
    ) : (
      icon
    );

  if (!showLabel) return wrappedIcon;

  return (
    <span className="inline-flex items-center gap-2.5">
      {wrappedIcon}
      <span className={labelClassName ?? 'font-bold text-slate-900'}>{label}</span>
    </span>
  );
}

export default IntegrationBrandLogo;

import React, { useState } from 'react';
import { Building2, User } from 'lucide-react';

export type HubEntityAvatarKind = 'company' | 'driver' | 'user';

function initialsFromName(name?: string, max = 2): string {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, max).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export interface HubEntityAvatarProps {
  kind: HubEntityAvatarKind;
  src?: string | null;
  name?: string;
  size?: number;
  accent?: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  /** `cover` preenche o quadro; `contain` mantém a logo inteira visível. */
  imageFit?: 'cover' | 'contain';
  /** Sem imagem: `brand` = inicial em gradiente (empresas); `subtle` = fundo claro. */
  letterFallback?: 'brand' | 'subtle';
}

const kindDefaults: Record<HubEntityAvatarKind, { radius: string; Icon: typeof Building2 }> = {
  company: { radius: '12px', Icon: Building2 },
  driver: { radius: '50%', Icon: User },
  user: { radius: '50%', Icon: User },
};

export function HubEntityAvatar({
  kind,
  src,
  name,
  size = 40,
  accent = '#0061FF',
  title,
  className,
  style,
  imageFit,
  letterFallback = kind === 'company' ? 'brand' : 'subtle',
}: HubEntityAvatarProps) {
  const [failed, setFailed] = useState(false);
  const { radius, Icon } = kindDefaults[kind];
  const trimmedSrc = (src || '').trim();
  const showImage = Boolean(trimmedSrc) && !failed;
  const fontSize = Math.max(10, Math.round(size * 0.34));
  const initials = initialsFromName(name, kind === 'company' ? 1 : 2);
  const objectFit = imageFit ?? 'cover';
  const useBrandLetter = !showImage && kind === 'company' && letterFallback === 'brand';
  const letterFontSize = size >= 56 ? Math.round(size * 0.44) : fontSize;

  React.useEffect(() => {
    setFailed(false);
  }, [trimmedSrc]);

  return (
    <div
      className={className}
      title={title || name}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: showImage
          ? '#F8FAFC'
          : useBrandLetter
            ? `linear-gradient(135deg, ${accent}, ${accent}CC)`
            : `${accent}14`,
        border: `1.5px solid ${showImage ? '#E2E8F0' : useBrandLetter ? 'rgba(255,255,255,0.35)' : `${accent}33`}`,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {showImage ? (
        <img
          src={trimmedSrc}
          alt={name || ''}
          style={{
            width: '100%',
            height: '100%',
            minWidth: '100%',
            minHeight: '100%',
            objectFit,
            objectPosition: 'center',
            display: 'block',
            padding: objectFit === 'contain' ? '4px' : 0,
            boxSizing: 'border-box',
          }}
          onError={() => setFailed(true)}
        />
      ) : kind === 'company' ? (
        <span
          style={{
            fontSize: letterFontSize,
            fontWeight: 900,
            color: useBrandLetter ? '#FFFFFF' : accent,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {initials}
        </span>
      ) : (
        <Icon size={Math.round(size * 0.45)} color={accent} strokeWidth={2} aria-hidden />
      )}
    </div>
  );
}

export default HubEntityAvatar;

import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import {
  getHubMasterInitials,
  resolveHubMasterAvatarUrl,
} from '@hub/lib/hubMasterAvatar';

export type HubMasterAvatarProps = {
  size?: number;
  borderRadius?: number | string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  /** Se false, mostra apenas iniciais quando não houver URL válida (raro). */
  preferImage?: boolean;
};

const HubMasterAvatar: React.FC<HubMasterAvatarProps> = ({
  size = 40,
  borderRadius = 12,
  className,
  style,
  alt,
  preferImage = true,
}) => {
  const { profile } = useAuth();
  const avatarUrl = resolveHubMasterAvatarUrl(profile);
  const initials = getHubMasterInitials(profile);
  const label = alt || profile?.full_name || 'Usuário Master';

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius,
    flexShrink: 0,
    objectFit: 'cover',
    ...style,
  };

  if (preferImage && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        className={className}
        style={baseStyle}
        onError={(e) => {
          const img = e.currentTarget;
          img.onerror = null;
          img.src = '/assets/avatars/avatar1.jpg';
        }}
      />
    );
  }

  return (
    <span
      className={className}
      aria-hidden
      style={{
        ...baseStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0061FF',
        color: '#fff',
        fontWeight: 800,
        fontSize: Math.max(12, Math.round(size * 0.38)),
      }}
    >
      {initials || <User size={Math.max(14, Math.round(size * 0.45))} strokeWidth={2} />}
    </span>
  );
};

export default HubMasterAvatar;

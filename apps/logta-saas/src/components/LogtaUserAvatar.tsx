import React, { useEffect, useState } from 'react';
import { useLogtaProfile } from '../contexts/LogtaProfileContext';
import { useLogtaProfileAvatar } from '../hooks/useLogtaProfileAvatar';

function profileInitials(name: string | null | undefined): string {
  if (!name?.trim()) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

type LogtaUserAvatarProps = {
  variant?: 'header' | 'profile';
  className?: string;
};

export const LogtaUserAvatar: React.FC<LogtaUserAvatarProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { avatarUrl } = useLogtaProfileAvatar();
  const { profile } = useLogtaProfile();
  const initials = profileInitials(profile?.full_name);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  const isProfile = variant === 'profile';

  return (
    <div
      className={`logta-user-avatar flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-tr from-primary to-blue-600 shadow-sm ${
        isProfile
          ? 'h-28 w-28 rounded-[32px] border-4 border-white shadow-xl'
          : 'h-10 w-10 rounded-full border-2 border-white/50'
      } ${className}`}
    >
      {!imgFailed && avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="logta-user-avatar__initials">{initials}</span>
      )}
    </div>
  );
};

export default LogtaUserAvatar;

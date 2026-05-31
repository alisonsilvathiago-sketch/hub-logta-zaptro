import React from 'react';
import { useLogstokaPermissions } from '@/hooks/useLogstokaPermissions';
import type { PermissionCode } from '@/lib/permissions';
import AccessDeniedPanel from './AccessDeniedPanel';

type Props = {
  permission: PermissionCode | PermissionCode[];
  mode?: 'all' | 'any';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Se true, mostra painel de acesso negado em vez de esconder silenciosamente */
  showDenied?: boolean;
};

const PermissionGate: React.FC<Props> = ({
  permission,
  mode = 'all',
  children,
  fallback = null,
  showDenied = false,
}) => {
  const { can } = useLogstokaPermissions();
  const list = Array.isArray(permission) ? permission : [permission];
  const allowed =
    mode === 'any' ? list.some((p) => can(p)) : list.every((p) => can(p));

  if (allowed) return <>{children}</>;
  if (showDenied) return <AccessDeniedPanel compact />;
  return <>{fallback}</>;
};

export default PermissionGate;

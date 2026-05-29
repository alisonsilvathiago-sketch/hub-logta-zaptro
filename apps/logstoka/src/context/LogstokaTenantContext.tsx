import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { resolveRole } from '@/lib/permissions';
import type { LogstokaRoleCode } from '@/types';

interface LogstokaTenantContextValue {
  companyId: string | null;
  role: LogstokaRoleCode;
  isReady: boolean;
}

const LogstokaTenantContext = createContext<LogstokaTenantContextValue>({
  companyId: null,
  role: 'operator',
  isReady: false,
});

export const LogstokaTenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isLoading } = useAuth();
  const companyId = profile?.company_id ?? null;
  const role = useMemo(() => resolveRole(profile?.role), [profile?.role]);

  return (
    <LogstokaTenantContext.Provider
      value={{ companyId, role, isReady: !isLoading && Boolean(profile) }}
    >
      {children}
    </LogstokaTenantContext.Provider>
  );
};

export function useLogstokaTenant() {
  return useContext(LogstokaTenantContext);
}

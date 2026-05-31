import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { canViewFinancials } from '@/lib/permissions';
import { useLogstokaMoneyPrivacy } from '@/context/LogstokaMoneyPrivacyContext';

type SecurityContextValue = {
  financialLocked: boolean;
};

const LogstokaSecurityContext = createContext<SecurityContextValue>({ financialLocked: true });

/**
 * Aplica políticas de privacidade por perfil:
 * operadores sem financial.read não veem valores (custo, venda, faturamento).
 */
export const LogstokaSecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const { setHideMoney } = useLogstokaMoneyPrivacy();

  const financialLocked = useMemo(
    () => !canViewFinancials(profile?.role),
    [profile?.role],
  );

  useEffect(() => {
    if (financialLocked) {
      setHideMoney(true);
    }
  }, [financialLocked, setHideMoney]);

  return (
    <LogstokaSecurityContext.Provider value={{ financialLocked }}>
      {children}
    </LogstokaSecurityContext.Provider>
  );
};

export function useLogstokaSecurity(): SecurityContextValue {
  return useContext(LogstokaSecurityContext);
}

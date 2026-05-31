import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { readMoneyPrivacyHidden, writeMoneyPrivacyHidden } from '@/lib/moneyPrivacy';

type MoneyPrivacyContextType = {
  hideMoney: boolean;
  toggleHideMoney: () => void;
  setHideMoney: (hidden: boolean) => void;
};

const LogstokaMoneyPrivacyContext = createContext<MoneyPrivacyContextType | undefined>(undefined);

export const LogstokaMoneyPrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideMoney, setHideMoneyState] = useState(() => readMoneyPrivacyHidden());

  useEffect(() => {
    writeMoneyPrivacyHidden(hideMoney);
    document.documentElement.classList.toggle('logstoka-money-hidden', hideMoney);
    return () => {
      document.documentElement.classList.remove('logstoka-money-hidden');
    };
  }, [hideMoney]);

  const setHideMoney = useCallback((hidden: boolean) => {
    setHideMoneyState(hidden);
  }, []);

  const toggleHideMoney = useCallback(() => {
    setHideMoneyState((prev) => !prev);
  }, []);

  return (
    <LogstokaMoneyPrivacyContext.Provider value={{ hideMoney, toggleHideMoney, setHideMoney }}>
      {children}
    </LogstokaMoneyPrivacyContext.Provider>
  );
};

export function useLogstokaMoneyPrivacy(): MoneyPrivacyContextType {
  const ctx = useContext(LogstokaMoneyPrivacyContext);
  if (!ctx) {
    throw new Error('useLogstokaMoneyPrivacy must be used within LogstokaMoneyPrivacyProvider');
  }
  return ctx;
}

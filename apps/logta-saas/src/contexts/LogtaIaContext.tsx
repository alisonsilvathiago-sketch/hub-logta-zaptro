import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type LogtaIaContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const LogtaIaContext = createContext<LogtaIaContextValue | null>(null);

export function LogtaIaProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );

  return <LogtaIaContext.Provider value={value}>{children}</LogtaIaContext.Provider>;
}

export function useLogtaIa() {
  const ctx = useContext(LogtaIaContext);
  if (!ctx) throw new Error('useLogtaIa must be used within LogtaIaProvider');
  return ctx;
}

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type HubProjectAiContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const HubProjectAiContext = createContext<HubProjectAiContextValue | null>(null);

export const HubProjectAiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );

  return <HubProjectAiContext.Provider value={value}>{children}</HubProjectAiContext.Provider>;
};

export function useHubProjectAi(): HubProjectAiContextValue {
  const ctx = useContext(HubProjectAiContext);
  if (!ctx) {
    throw new Error('useHubProjectAi must be used within HubProjectAiProvider');
  }
  return ctx;
}

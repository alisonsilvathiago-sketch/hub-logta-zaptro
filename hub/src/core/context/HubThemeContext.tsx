import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyHubThemeToDocument,
  HUB_THEME_STORAGE_KEY,
  HubThemeMode,
  readStoredHubThemeMode,
  resolveHubTheme,
} from '@core/lib/hubTheme';

type HubThemeContextValue = {
  mode: HubThemeMode;
  resolved: 'light' | 'dark';
  setMode: (mode: HubThemeMode) => void;
};

const HubThemeContext = createContext<HubThemeContextValue | undefined>(undefined);

export const HubThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<HubThemeMode>(() => readStoredHubThemeMode());
  const resolved = useMemo(() => resolveHubTheme(mode), [mode]);

  const setMode = useCallback((next: HubThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(HUB_THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    const r = resolveHubTheme(next);
    applyHubThemeToDocument(r, true);
  }, []);

  useEffect(() => {
    applyHubThemeToDocument(resolved, false);
  }, [resolved]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      applyHubThemeToDocument(resolveHubTheme('system'), true);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  return <HubThemeContext.Provider value={value}>{children}</HubThemeContext.Provider>;
};

export function useHubTheme(): HubThemeContextValue {
  const ctx = useContext(HubThemeContext);
  if (!ctx) throw new Error('useHubTheme must be used within HubThemeProvider');
  return ctx;
}

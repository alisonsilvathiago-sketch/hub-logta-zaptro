import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type LogstokaTheme = 'light' | 'dark';

const STORAGE_KEY = 'logstoka-theme';

type ThemeContextValue = {
  theme: LogstokaTheme;
  isDark: boolean;
  setTheme: (theme: LogstokaTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): LogstokaTheme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: LogstokaTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function LogstokaThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<LogstokaTheme>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next: LogstokaTheme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useLogstokaTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useLogstokaTheme must be used within LogstokaThemeProvider');
  return ctx;
}

export type HubThemeMode = 'light' | 'dark' | 'system';

export const HUB_THEME_STORAGE_KEY = 'hub-master-theme-mode';

export function resolveHubTheme(mode: HubThemeMode): 'light' | 'dark' {
  if (mode === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

export function readStoredHubThemeMode(): HubThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const raw = localStorage.getItem(HUB_THEME_STORAGE_KEY);
    if (raw === 'dark' || raw === 'light' || raw === 'system') return raw;
  } catch {
    /* ignore */
  }
  return 'light';
}

export function applyHubThemeToDocument(resolved: 'light' | 'dark', animate = false): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-hub-theme', resolved);
  root.style.colorScheme = resolved;
  if (animate) {
    root.classList.add('hub-theme-transition');
    window.setTimeout(() => root.classList.remove('hub-theme-transition'), 320);
  }
}

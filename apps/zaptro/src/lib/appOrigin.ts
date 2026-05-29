/**
 * Origem pública da app (redirects, links, documentação).
 * Em dev: `VITE_APP_URL` ou http://localhost:5174
 */
export function zaptroAppOrigin(): string {
  const fromEnv = (import.meta.env.VITE_APP_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (import.meta.env.DEV) return 'http://localhost:5174';
  if (typeof window !== 'undefined') return window.location.origin.replace(/\/+$/, '');
  return 'https://app.zaptro.com.br';
}

export function isZaptroLocalhost(): boolean {
  if (typeof window === 'undefined') return import.meta.env.DEV;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

/**
 * Deep links Hub Master → LogStoka (`apps/logstoka`).
 */

export function getLogstokaAppOrigin(): string {
  const raw = import.meta.env.VITE_LOGSTOKA_APP_ORIGIN as string | undefined;
  const env = raw?.replace(/\/$/, '').trim();
  if (env) return env;
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:5177';
  }
  return 'https://app.logstoka.com.br';
}

export function logstokaAppDeepLink(path: string): string {
  const origin = getLogstokaAppOrigin();
  const p = path.startsWith('/') ? path : `/${path}`;
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');
  const url = new URL(`${origin}${p}`);
  if (token) {
    url.searchParams.set('token', token);
    url.searchParams.set('master_bypass', 'true');
  }
  return url.toString();
}

export function openLogstokaApp(path = '/app'): void {
  window.open(logstokaAppDeepLink(path), '_blank', 'noopener,noreferrer');
}

export function companyHasLogstoka(settings: unknown): boolean {
  const s = settings as { modules?: string[] } | null | undefined;
  return Array.isArray(s?.modules) && s.modules.includes('logstoka');
}

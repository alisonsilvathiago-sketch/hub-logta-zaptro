const DEFAULT_HUB = 'http://localhost:5175';
const DEFAULT_APP = 'http://localhost:5177';

export function getHubAppUrl(): string {
  return (import.meta.env.VITE_HUB_APP_URL as string | undefined)?.replace(/\/$/, '') || DEFAULT_HUB;
}

export function getLogstokaAppUrl(): string {
  return (import.meta.env.VITE_LOGSTOKA_APP_URL as string | undefined)?.replace(/\/$/, '') || DEFAULT_APP;
}

/** Login centralizado na HUB — sem tela local. */
export function buildHubLoginUrl(mode: 'login' | 'register' = 'login'): string {
  const hub = getHubAppUrl();
  const params = new URLSearchParams({ app: 'logstoka', mode });
  return `${hub}/?${params.toString()}`;
}

export function redirectToHubLogin(mode: 'login' | 'register' = 'login'): void {
  window.location.href = buildHubLoginUrl(mode);
}

/** Após sessão na HUB, retorno SSO para o app. */
export function buildLogstokaSsoUrl(accessToken: string, path = '/app'): string {
  const origin = getLogstokaAppUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  const params = new URLSearchParams({
    token: accessToken,
    master_bypass: 'true',
  });
  return `${origin}${p}?${params.toString()}`;
}

import type { LogstokaConfig } from '../config.js';
import { getPublicApiBaseUrl, OAUTH_CALLBACK_PATH } from '../lib/apiDomains.js';

const ML_AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const ML_USER_URL = 'https://api.mercadolibre.com/users/me';

export function getMercadoLivreCredentials(cfg: LogstokaConfig): { clientId: string; clientSecret: string } | null {
  const clientId = cfg.mercadolivreAppId?.trim();
  const clientSecret = cfg.mercadolivreAppSecret?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function buildMercadoLivreAuthUrl(cfg: LogstokaConfig, companyId: string): string | null {
  const creds = getMercadoLivreCredentials(cfg);
  if (!creds) return null;

  const redirectUri = `${getPublicApiBaseUrl()}${OAUTH_CALLBACK_PATH('mercadolivre')}`;
  const state = `${companyId}:${crypto.randomUUID()}`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: creds.clientId,
    redirect_uri: redirectUri,
    state,
  });

  return `${ML_AUTH_URL}?${params.toString()}`;
}

export type MercadoLivreTokenResult = {
  access_token: string;
  refresh_token: string;
  user_id: number;
  expires_in: number;
  token_type: string;
};

export async function exchangeMercadoLivreCode(
  cfg: LogstokaConfig,
  code: string,
): Promise<MercadoLivreTokenResult> {
  const creds = getMercadoLivreCredentials(cfg);
  if (!creds) throw new Error('Credenciais Mercado Livre não configuradas no servidor');

  const redirectUri = `${getPublicApiBaseUrl()}${OAUTH_CALLBACK_PATH('mercadolivre')}`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(ML_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  });

  const data = (await res.json()) as MercadoLivreTokenResult & { message?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.message || data.error || `ML token error ${res.status}`);
  }
  return data;
}

export async function fetchMercadoLivreUser(accessToken: string) {
  const res = await fetch(ML_USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`ML user error ${res.status}`);
  return res.json() as Promise<{ id: number; nickname: string; email?: string }>;
}

export function getAppReturnUrl(path = '/app/integrations'): string {
  const env = process.env.LOGSTOKA_APP_URL?.trim();
  if (env) return `${env.replace(/\/$/, '')}${path}`;
  return `http://localhost:5177${path}`;
}

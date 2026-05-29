/**
 * Cliente Google Calendar OAuth (servidor Zaptro — nunca expõe client secret).
 */

function apiBase(): string {
  const raw = (import.meta.env.VITE_ZAPTRO_MAIL_API_URL as string | undefined)?.trim() || '';
  return raw.replace(/\/$/, '');
}

export function zaptroGoogleApiConfigured(): boolean {
  return Boolean(apiBase());
}

async function authFetch(accessToken: string, path: string, init?: RequestInit) {
  const base = apiBase();
  if (!base) throw new Error('mail_api_not_configured');
  const r = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = (json as { error?: string; details?: string }).error || `http_${r.status}`;
    throw new Error(err);
  }
  return json;
}

export type GoogleOAuthStatus = {
  connected: boolean;
  googleEmail: string | null;
  oauthConfigured: boolean;
  mapsConfigured: boolean;
  sheetsConfigured: boolean;
};

export async function fetchGoogleOAuthStatus(accessToken: string): Promise<GoogleOAuthStatus> {
  return authFetch(accessToken, '/v1/google/oauth/status') as Promise<GoogleOAuthStatus>;
}

export async function fetchGoogleConnectUrl(accessToken: string, returnTo = '/app/agenda'): Promise<string> {
  const q = new URLSearchParams({ returnTo });
  const json = (await authFetch(accessToken, `/v1/google/oauth/connect-url?${q}`)) as { url: string };
  return json.url;
}

export async function disconnectGoogleCalendar(accessToken: string): Promise<void> {
  await authFetch(accessToken, '/v1/google/oauth/disconnect', { method: 'POST', body: '{}' });
}

export type CreateGoogleCalendarEventBody = {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  location?: string;
  attendees?: string[];
  addGoogleMeet?: boolean;
  actorName?: string;
  geocodeLocation?: boolean;
};

export type CreateGoogleCalendarEventResult = {
  eventId: string;
  htmlLink?: string | null;
  meetLink?: string | null;
  location?: string | null;
};

export async function createGoogleCalendarEvent(
  accessToken: string,
  body: CreateGoogleCalendarEventBody,
): Promise<CreateGoogleCalendarEventResult> {
  return authFetch(accessToken, '/v1/google/calendar/events', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<CreateGoogleCalendarEventResult>;
}

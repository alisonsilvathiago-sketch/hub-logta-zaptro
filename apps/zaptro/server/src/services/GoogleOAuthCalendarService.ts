import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { AppConfig } from '../config.js';
import { GoogleOAuthTokenStore, type GoogleCalendarConnectionRow } from './googleOAuthTokenStore.js';

export const GOOGLE_USER_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
] as const;

export type CreateUserCalendarEventInput = {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  location?: string;
  attendees?: string[];
  addGoogleMeet?: boolean;
};

export type CreateUserCalendarEventResult = {
  eventId: string;
  htmlLink?: string | null;
  meetLink?: string | null;
  location?: string | null;
};

export class GoogleOAuthCalendarService {
  private store: GoogleOAuthTokenStore;

  constructor(private cfg: AppConfig) {
    if (!cfg.supabaseUrl || !cfg.supabaseServiceRoleKey) {
      throw new Error('supabase_service_role_required');
    }
    this.store = new GoogleOAuthTokenStore(cfg.supabaseUrl, cfg.supabaseServiceRoleKey);
  }

  isOAuthConfigured(): boolean {
    return Boolean(this.cfg.googleOAuthClientId && this.cfg.googleOAuthClientSecret && this.cfg.googleOAuthRedirectUri);
  }

  createOAuthClient(): OAuth2Client {
    return new google.auth.OAuth2(
      this.cfg.googleOAuthClientId,
      this.cfg.googleOAuthClientSecret,
      this.cfg.googleOAuthRedirectUri,
    );
  }

  buildConsentUrl(state: string): string {
    const client = this.createOAuthClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: [...GOOGLE_USER_OAUTH_SCOPES],
      state,
    });
  }

  async exchangeCodeForTokens(code: string) {
    const client = this.createOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const me = await oauth2.userinfo.get();
    const googleEmail = me.data.email ?? null;

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes: tokens.scope ?? GOOGLE_USER_OAUTH_SCOPES.join(' '),
      googleEmail,
    };
  }

  async saveConnectionForUser(
    userId: string,
    companyId: string | null,
    tokens: Awaited<ReturnType<GoogleOAuthCalendarService['exchangeCodeForTokens']>>,
  ) {
    await this.store.upsertConnection({
      userId,
      companyId,
      googleEmail: tokens.googleEmail,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.expiryDate,
      scopes: tokens.scopes,
    });
  }

  async getConnection(userId: string) {
    return this.store.getByUserId(userId);
  }

  async disconnect(userId: string) {
    await this.store.disconnect(userId);
  }

  private async getAuthedClient(row: GoogleCalendarConnectionRow): Promise<OAuth2Client> {
    const client = this.createOAuthClient();
    client.setCredentials({
      access_token: row.access_token,
      refresh_token: row.refresh_token ?? undefined,
      expiry_date: row.token_expiry ? new Date(row.token_expiry).getTime() : undefined,
    });

    client.on('tokens', async (tokens) => {
      if (!tokens.access_token) return;
      await this.store.upsertConnection({
        userId: row.user_id,
        companyId: row.company_id,
        googleEmail: row.google_email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? row.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes: row.scopes ?? GOOGLE_USER_OAUTH_SCOPES.join(' '),
      });
    });

    return client;
  }

  async createEventForUser(userId: string, input: CreateUserCalendarEventInput): Promise<CreateUserCalendarEventResult> {
    const row = await this.store.getByUserId(userId);
    if (!row) throw new Error('google_not_connected');

    const auth = await this.getAuthedClient(row);
    const calendar = google.calendar({ version: 'v3', auth });
    const tz = input.timeZone || 'America/Sao_Paulo';
    const requestId = `zaptro-${userId.slice(0, 8)}-${Date.now()}`;

    const event: Record<string, unknown> = {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: { dateTime: input.startDateTime, timeZone: tz },
      end: { dateTime: input.endDateTime, timeZone: tz },
      attendees: input.attendees?.filter(Boolean).map((email) => ({ email: email.trim() })),
    };

    if (input.addGoogleMeet !== false) {
      event.conferenceData = {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: input.addGoogleMeet !== false ? 1 : 0,
      sendUpdates: input.attendees?.length ? 'all' : 'none',
    });

    const data = response.data;
    const meetLink =
      data.hangoutLink ||
      data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
      null;

    return {
      eventId: data.id || '',
      htmlLink: data.htmlLink,
      meetLink,
      location: data.location ?? input.location ?? null,
    };
  }

  async listUpcomingForUser(userId: string, maxResults = 20) {
    const row = await this.store.getByUserId(userId);
    if (!row) throw new Error('google_not_connected');

    const auth = await this.getAuthedClient(row);
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.data.items ?? [];
  }
}

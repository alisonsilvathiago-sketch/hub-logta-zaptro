import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import type { AppConfig } from '../config.js';
import { requireSupabaseAuth, type AuthedRequest } from '../middleware/requireSupabaseAuth.js';
import { GoogleOAuthCalendarService } from '../services/GoogleOAuthCalendarService.js';
import { GoogleMapsGeocodeService } from '../services/GoogleMapsGeocodeService.js';
import { GoogleSheetsReportService } from '../services/GoogleSheetsReportService.js';
import { signGoogleOAuthState, verifyGoogleOAuthState } from '../services/googleOAuthState.js';

const createEventBody = z.object({
  summary: z.string().min(1).max(500),
  description: z.string().max(8000).optional(),
  startDateTime: z.string().min(1),
  endDateTime: z.string().min(1),
  timeZone: z.string().max(80).optional(),
  location: z.string().max(500).optional(),
  attendees: z.array(z.string().email()).max(50).optional(),
  addGoogleMeet: z.boolean().optional(),
  actorName: z.string().max(200).optional(),
  geocodeLocation: z.boolean().optional(),
  appendToSheet: z.boolean().optional(),
});

function oauthSecret(cfg: AppConfig): string {
  return cfg.internalSecret || cfg.googleOAuthClientSecret || 'zaptro-google-oauth-dev';
}

function safeReturnTo(raw: string | undefined, cfg: AppConfig): string {
  const fallback = `${cfg.zaptroAppUrl.replace(/\/$/, '')}/app/agenda`;
  if (!raw?.trim()) return fallback;
  try {
    const u = new URL(raw, cfg.zaptroAppUrl);
    if (u.origin !== new URL(cfg.zaptroAppUrl).origin) return fallback;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return fallback;
  }
}

function googleOAuthConfigured(cfg: AppConfig): boolean {
  return Boolean(cfg.googleOAuthClientId && cfg.googleOAuthClientSecret && cfg.googleOAuthRedirectUri);
}

/** API sobe mesmo sem service role — OAuth fica indisponível até configurar SUPABASE_SERVICE_ROLE_KEY. */
function registerGoogleOAuthRoutesDisabled(app: Express, cfg: AppConfig) {
  const auth = requireSupabaseAuth(cfg);
  const maps = new GoogleMapsGeocodeService(cfg);
  const sheets = new GoogleSheetsReportService(cfg);

  // eslint-disable-next-line no-console
  console.warn('[google-oauth] rotas OAuth desativadas — defina SUPABASE_SERVICE_ROLE_KEY no server/.env');

  app.get('/v1/google/oauth/status', auth, (_req: AuthedRequest, res: Response) => {
    res.json({
      connected: false,
      googleEmail: null,
      oauthConfigured: googleOAuthConfigured(cfg),
      mapsConfigured: maps.isConfigured(),
      sheetsConfigured: sheets.isConfigured(),
    });
  });

  const unavailable = (_req: Request, res: Response) => {
    res.status(503).json({ error: 'google_oauth_unavailable', reason: 'supabase_service_role_required' });
  };

  app.get('/v1/google/oauth/connect-url', auth, unavailable);
  app.get('/v1/google/oauth/callback', (_req: Request, res: Response) => {
    const base = safeReturnTo(undefined, cfg);
    res.redirect(
      `${cfg.zaptroAppUrl.replace(/\/$/, '')}${base}?google=error&reason=${encodeURIComponent('supabase_service_role_required')}`,
    );
  });
  app.post('/v1/google/oauth/disconnect', auth, unavailable);
  app.post('/v1/google/calendar/events', auth, unavailable);
  app.get('/v1/google/calendar/events', auth, unavailable);
}

export function registerGoogleOAuthRoutes(app: Express, cfg: AppConfig) {
  if (!cfg.supabaseUrl || !cfg.supabaseServiceRoleKey) {
    registerGoogleOAuthRoutesDisabled(app, cfg);
    return;
  }

  const auth = requireSupabaseAuth(cfg);
  const calendar = new GoogleOAuthCalendarService(cfg);
  const maps = new GoogleMapsGeocodeService(cfg);
  const sheets = new GoogleSheetsReportService(cfg);

  /**
   * GET /v1/google/oauth/connect-url
   * Devolve URL de consentimento (OAuth Web Server Flow).
   */
  app.get('/v1/google/oauth/connect-url', auth, (req: AuthedRequest, res: Response) => {
    if (!calendar.isOAuthConfigured()) {
      res.status(503).json({ error: 'google_oauth_not_configured' });
      return;
    }
    const userId = req.zaptroUser!.id;
    const returnTo = safeReturnTo(String(req.query.returnTo || ''), cfg);
    const state = signGoogleOAuthState(oauthSecret(cfg), {
      userId,
      companyId: req.zaptroProfile?.company_id ?? null,
      returnTo,
      ts: Date.now(),
    });
    res.json({ url: calendar.buildConsentUrl(state) });
  });

  /**
   * GET /v1/google/oauth/callback?code=&state=
   * Google redireciona aqui após consentimento.
   */
  app.get('/v1/google/oauth/callback', async (req: Request, res: Response) => {
    const code = String(req.query.code || '');
    const stateRaw = String(req.query.state || '');
    const err = String(req.query.error || '');

    const returnFail = (reason: string) => {
      const base = safeReturnTo(undefined, cfg);
      res.redirect(`${cfg.zaptroAppUrl.replace(/\/$/, '')}${base}?google=error&reason=${encodeURIComponent(reason)}`);
    };

    if (err) {
      returnFail(err);
      return;
    }
    if (!code || !stateRaw) {
      returnFail('missing_code');
      return;
    }

    const payload = verifyGoogleOAuthState(oauthSecret(cfg), stateRaw);
    if (!payload) {
      returnFail('invalid_state');
      return;
    }

    try {
      const tokens = await calendar.exchangeCodeForTokens(code);
      await calendar.saveConnectionForUser(payload.userId, payload.companyId, tokens);
      const dest = `${cfg.zaptroAppUrl.replace(/\/$/, '')}${payload.returnTo}?google=connected`;
      res.redirect(dest);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'token_exchange_failed';
      returnFail(msg);
    }
  });

  app.get('/v1/google/oauth/status', auth, async (req: AuthedRequest, res: Response) => {
    try {
      const row = await calendar.getConnection(req.zaptroUser!.id);
      res.json({
        connected: Boolean(row),
        googleEmail: row?.google_email ?? null,
        oauthConfigured: calendar.isOAuthConfigured(),
        mapsConfigured: maps.isConfigured(),
        sheetsConfigured: sheets.isConfigured(),
      });
    } catch (e: unknown) {
      res.status(500).json({ error: 'status_failed', details: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post('/v1/google/oauth/disconnect', auth, async (req: AuthedRequest, res: Response) => {
    try {
      await calendar.disconnect(req.zaptroUser!.id);
      res.json({ ok: true });
    } catch (e: unknown) {
      res.status(500).json({ error: 'disconnect_failed', details: e instanceof Error ? e.message : String(e) });
    }
  });

  /**
   * POST /v1/google/calendar/events
   * Cria evento na agenda pessoal do utilizador + Meet + Maps + Sheets.
   */
  app.post('/v1/google/calendar/events', auth, async (req: AuthedRequest, res: Response) => {
    const parsed = createEventBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
      return;
    }
    const body = parsed.data;

    try {
      let location = body.location?.trim() || undefined;
      if (location && body.geocodeLocation !== false && maps.isConfigured()) {
        const geo = await maps.geocodeAddress(location);
        if (geo) location = geo.formattedAddress;
      }

      const created = await calendar.createEventForUser(req.zaptroUser!.id, {
        summary: body.summary,
        description: body.description,
        startDateTime: body.startDateTime,
        endDateTime: body.endDateTime,
        timeZone: body.timeZone,
        location,
        attendees: body.attendees,
        addGoogleMeet: body.addGoogleMeet,
      });

      const conn = await calendar.getConnection(req.zaptroUser!.id);

      if (body.appendToSheet !== false && sheets.isConfigured()) {
        await sheets.appendMeetingRow({
          createdAt: new Date().toISOString(),
          summary: body.summary,
          start: body.startDateTime,
          end: body.endDateTime,
          meetLink: created.meetLink || '',
          location: location || '',
          attendees: (body.attendees || []).join(', '),
          googleEmail: conn?.google_email || '',
          actorName: body.actorName || '',
        });
      }

      res.status(201).json(created);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = msg === 'google_not_connected' ? 403 : 500;
      res.status(status).json({ error: msg });
    }
  });

  app.get('/v1/google/calendar/events', auth, async (req: AuthedRequest, res: Response) => {
    try {
      const items = await calendar.listUpcomingForUser(req.zaptroUser!.id, 25);
      res.json({ items });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = msg === 'google_not_connected' ? 403 : 500;
      res.status(status).json({ error: msg });
    }
  });
}

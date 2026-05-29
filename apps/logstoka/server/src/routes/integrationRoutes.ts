import type { Express, Request, Response } from 'express';
import type { LogstokaConfig } from '../config.js';
import { getPublicApiBaseUrl, MARKETPLACE_SLUGS, OAUTH_CALLBACK_PATH, WEBHOOK_PATH } from '../lib/apiDomains.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { logstokaQueue } from '../queue/inMemoryQueue.js';
import { persistMercadoLivreOAuth } from '../services/integrationStoreService.js';
import {
  buildMercadoLivreAuthUrl,
  exchangeMercadoLivreCode,
  fetchMercadoLivreUser,
  getAppReturnUrl,
  getMercadoLivreCredentials,
} from '../services/mercadolivreOAuth.js';

/**
 * OAuth callbacks + webhooks por marketplace.
 * Mercado Livre: Authorization Code + Refresh Token (não Client Credentials).
 */
export function registerIntegrationRoutes(app: Express, cfg: LogstokaConfig) {
  app.get('/integrations/catalog', (_req, res) => {
    const base = getPublicApiBaseUrl();
    const mlConfigured = Boolean(getMercadoLivreCredentials(cfg));
    res.json({
      apiBaseUrl: base,
      domains: {
        landing: 'https://logstoka.com.br',
        app: 'https://app.logstoka.com.br',
        api: base,
      },
      marketplaces: MARKETPLACE_SLUGS.map((slug) => ({
        slug,
        oauthCallback: `${base}${OAUTH_CALLBACK_PATH(slug)}`,
        webhook: `${base}${WEBHOOK_PATH(slug)}`,
      })),
      mercadolivreOAuth: {
        configured: mlConfigured,
        grantTypes: ['authorization_code', 'refresh_token'],
        excludeGrantTypes: ['client_credentials'],
        redirectUri: `${base}${OAUTH_CALLBACK_PATH('mercadolivre')}`,
      },
    });
  });

  app.get('/integrations/mercadolivre/connect', (req: Request, res: Response) => {
    const companyId = String(req.query.company_id ?? req.query.companyId ?? '');
    if (!companyId) return res.status(400).json({ error: 'company_id obrigatório' });

    const authUrl = buildMercadoLivreAuthUrl(cfg, companyId);
    if (!authUrl) {
      return res.status(503).json({
        error: 'Mercado Livre não configurado',
        hint: 'Defina MERCADOLIVRE_APP_ID e MERCADOLIVRE_APP_SECRET no servidor',
      });
    }

    res.redirect(authUrl);
  });

  app.get('/integrations/mercadolivre/status', (_req, res) => {
    res.json({
      configured: Boolean(getMercadoLivreCredentials(cfg)),
      redirectUri: `${getPublicApiBaseUrl()}${OAUTH_CALLBACK_PATH('mercadolivre')}`,
    });
  });

  for (const slug of MARKETPLACE_SLUGS) {
    app.get(OAUTH_CALLBACK_PATH(slug), async (req: Request, res: Response) => {
      const code = typeof req.query.code === 'string' ? req.query.code : null;
      const state = typeof req.query.state === 'string' ? req.query.state : null;
      const error = typeof req.query.error === 'string' ? req.query.error : null;
      const companyId = state?.split(':')[0] ?? '';

      if (error) {
        const url = `${getAppReturnUrl()}?oauth=${slug}&status=error&message=${encodeURIComponent(error)}`;
        return res.redirect(url);
      }

      if (!code) {
        return res.status(400).json({
          ok: false,
          marketplace: slug,
          message: 'Parâmetro code ausente — configure Redirect URI no painel do marketplace',
          expectedRedirectUri: `${getPublicApiBaseUrl()}${OAUTH_CALLBACK_PATH(slug)}`,
        });
      }

      if (slug === 'mercadolivre' && getMercadoLivreCredentials(cfg)) {
        try {
          const tokens = await exchangeMercadoLivreCode(cfg, code);
          const user = await fetchMercadoLivreUser(tokens.access_token);

          const oauthPayload = {
            marketplace: slug,
            companyId,
            code,
            state,
            tokens: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              user_id: tokens.user_id,
              seller_id: String(user.id),
            },
            user: { id: user.id, nickname: user.nickname },
            receivedAt: new Date().toISOString(),
          };

          if (companyId) {
            const admin = getSupabaseAdmin(cfg);
            if (admin) {
              await persistMercadoLivreOAuth(admin, companyId, {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                user_id: tokens.user_id,
                seller_id: String(user.id),
                nickname: user.nickname,
                expires_in: tokens.expires_in,
              });
            } else {
              console.warn('[logstoka-integration] Supabase indisponível — tokens não persistidos');
            }
          }

          await logstokaQueue.enqueue('integration.oauth', oauthPayload);

          const params = new URLSearchParams({
            oauth: 'mercadolivre',
            status: 'success',
            seller_id: String(user.id),
            nickname: user.nickname,
          });
          if (companyId) params.set('company_id', companyId);

          return res.redirect(`${getAppReturnUrl()}?${params.toString()}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erro OAuth ML';
          return res.redirect(`${getAppReturnUrl()}?oauth=mercadolivre&status=error&message=${encodeURIComponent(msg)}`);
        }
      }

      await logstokaQueue.enqueue('integration.oauth', {
        marketplace: slug,
        companyId,
        code,
        state,
        receivedAt: new Date().toISOString(),
      });

      res.redirect(`${getAppReturnUrl()}?oauth=${slug}&status=success`);
    });

    app.post(WEBHOOK_PATH(slug), async (req: Request, res: Response) => {
      const companyId = String(req.headers['x-company-id'] ?? req.body?.company_id ?? '');

      await logstokaQueue.enqueue('webhook.inbound', {
        companyId: companyId || undefined,
        eventType: req.body?.event ?? req.body?.topic ?? `${slug}.event`,
        source: slug,
        payload: req.body,
      });

      res.status(202).json({ accepted: true, marketplace: slug });
    });
  }
}

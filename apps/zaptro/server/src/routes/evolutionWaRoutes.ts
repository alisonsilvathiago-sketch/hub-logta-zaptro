import type { Express, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { AppConfig } from '../config.js';
import { processEvolutionWebhookPayload } from '../lib/waLinkEvolutionWebhook.js';

function serviceDb(cfg: AppConfig) {
  if (!cfg.supabaseUrl || !cfg.supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY obrigatórios no server/.env.local');
  }
  return createClient(cfg.supabaseUrl, cfg.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function registerEvolutionWaRoutes(app: Express, cfg: AppConfig) {
  /**
   * POST /v1/webhooks/evolution-wa
   * Receptor público para Evolution GO (sem JWT Supabase).
   * Use com URL pública (ngrok, API em produção) em VITE_WA_LINK_WEBHOOK_URL.
   */
  app.post('/v1/webhooks/evolution-wa', async (req: Request, res: Response) => {
    if (cfg.evolutionWebhookSecret) {
      const got =
        String(req.headers['x-zaptro-webhook-secret'] ?? req.headers['x-webhook-secret'] ?? '');
      if (got !== cfg.evolutionWebhookSecret) {
        res.status(401).json({ error: 'Webhook não autorizado' });
        return;
      }
    }

    if (!cfg.supabaseServiceRoleKey) {
      res.status(503).json({
        error: 'SUPABASE_SERVICE_ROLE_KEY em falta no server/.env.local',
        hint: 'Copie a service_role em Supabase → Settings → API',
      });
      return;
    }

    try {
      const db = serviceDb(cfg);
      const result = await processEvolutionWebhookPayload(db, req.body, {
        defaultInstance: cfg.evolutionInstance,
        defaultCompanyId: cfg.waLinkDefaultCompanyId,
      });

      if (result.processed === 0 && result.skipped > 0) {
        console.warn('[wa-webhook] mensagens ignoradas:', result.errors.join('; '));
      } else if (result.processed > 0) {
        console.log('[wa-webhook] gravadas:', result.processed);
      }

      res.status(200).json({ ok: true, ...result });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('[wa-webhook]', message);
      res.status(500).json({ error: message });
    }
  });

  app.get('/v1/webhooks/evolution-wa/health', (_req, res) => {
    res.json({
      ok: Boolean(cfg.supabaseUrl && cfg.supabaseServiceRoleKey),
      service: 'zaptro-mail-api',
      route: 'POST /v1/webhooks/evolution-wa',
    });
  });
}

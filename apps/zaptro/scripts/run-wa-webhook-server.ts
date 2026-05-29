/**
 * Servidor mínimo — webhook Evolution → Supabase (dev + localtunnel).
 * npm run wa:webhook  (ou tsx --env-file=server/.env.local scripts/run-wa-webhook-server.ts)
 */
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { processEvolutionWebhookPayload } from '../server/src/lib/waLinkEvolutionWebhook.js';

const port = Number(process.env.WA_WEBHOOK_PORT || 8787);
const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const instance = process.env.EVOLUTION_INSTANCE?.trim() || 'zaptro';
const companyId = process.env.WA_LINK_DEFAULT_COMPANY_ID?.trim() || 'b1111111-1111-4111-8111-111111111111';

if (!url || !key) {
  console.error('Falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em server/.env.local');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/v1/webhooks/evolution-wa/health', (_req, res) => {
  res.json({ ok: true, service: 'wa-webhook-server', port, instance, companyId });
});

app.post('/v1/webhooks/evolution-wa', async (req, res) => {
  try {
    const result = await processEvolutionWebhookPayload(db, req.body, {
      defaultInstance: instance,
      defaultCompanyId: companyId,
    });
    if (result.processed > 0) console.log('[wa-webhook] gravadas:', result.processed);
    res.status(200).json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[wa-webhook]', message);
    res.status(500).json({ error: message });
  }
});

app.listen(port, '127.0.0.1', () => {
  console.log(`[wa-webhook-server] http://127.0.0.1:${port}/v1/webhooks/evolution-wa`);
});

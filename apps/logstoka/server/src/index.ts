import express from 'express';
import cors from 'cors';
import { loadConfig } from './config.js';
import { globalRateLimit } from './middleware/rateLimit.js';
import { pingOllama } from './modules/ai/ollamaService.js';
import { registerApiV1Routes } from './routes/apiV1Routes.js';
import { registerWebhookRoutes } from './routes/webhookRoutes.js';
import { registerIntegrationRoutes } from './routes/integrationRoutes.js';
import { registerQueueHandlers } from './queue/handlers.js';

async function main() {
  const cfg = loadConfig();
  registerQueueHandlers(cfg);

  const app = express();
  app.use(cors({ origin: true, maxAge: 86400 }));
  app.use(express.json({ limit: '15mb' }));
  app.use(globalRateLimit(cfg));

  app.get('/', (_req, res) => {
    res.json({
      name: 'LogStoka API',
      version: '1.0.0',
      status: 'online',
      docs: '/health',
    });
  });

  app.get('/health', async (_req, res) => {
    const ollama = await pingOllama();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      supabase: Boolean(cfg.supabaseUrl && cfg.supabaseServiceRoleKey),
      queue: cfg.redisUrl ? 'redis' : 'memory',
      ollama,
    });
  });

  registerApiV1Routes(app, cfg);
  registerIntegrationRoutes(app, cfg);
  registerWebhookRoutes(app, cfg);

  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  app.listen(cfg.port, host, () => {
    console.log(`[logstoka-api] listening on http://${host}:${cfg.port}`);
  });
}

main().catch((err) => {
  console.error('[logstoka-api] fatal', err);
  process.exit(1);
});

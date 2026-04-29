import express from 'express';
import cors from 'cors';
import { loadConfig } from './config.js';
import { createEmailLogger } from './logging/emailLog.js';
import { createMailQueue } from './queue/createMailQueue.js';
import { registerMailRoutes } from './routes/mailRoutes.js';
import { registerCalendarRoutes } from './routes/calendarRoutes.js';
import { registerNotificationRoutes } from './routes/notificationRoutes.js';
import { registerGoogleRoutes } from './routes/googleRoutes.js';
import { registerWebhookRoutes } from './routes/webhookRoutes.js';
import { WorkflowService } from './services/workflowService.js';
import { MaintenanceService } from './services/maintenanceService.js';
import { AutomationHandlers } from './services/automationHandlers.js';
import { IntelligenceService } from './services/intelligenceService.js';
import { AutoAutomationService } from './services/autoAutomationService.js';
import { EventHub } from './services/eventHub.js';

async function main() {
  const cfg = loadConfig();
  const logger = createEmailLogger(cfg.logDir);
  const sendDeps = {
    apiKey: cfg.sendgridApiKey,
    defaultFrom: { email: cfg.fromEmail, name: cfg.fromName },
    logger,
  };
  const queue = await createMailQueue(sendDeps, cfg.redisUrl);

  const app = express();
  app.use(
    cors({
      origin: true,
      maxAge: 86400,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Zaptro-Internal-Secret'],
    }),
  );
  app.use(express.json({ limit: '600kb' }));

  app.get('/', (_req, res) => {
    res.send(`
      <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
        <h1 style="color: #38bdf8;">Zaptro Mail API</h1>
        <p>O servidor backend está rodando corretamente.</p>
        <div style="margin-top: 20px; padding: 10px 20px; background: #1e293b; border-radius: 8px; border: 1px solid #334155;">
          <code style="color: #94a3b8;">Status: Online</code>
        </div>
        <p style="margin-top: 20px; font-size: 0.8rem; color: #64748b;">Acesse /health para detalhes técnicos.</p>
      </div>
    `);
  });

  registerMailRoutes(app, cfg, logger, queue);
  registerCalendarRoutes(app, cfg);
  registerNotificationRoutes(app, cfg, logger, queue);
  registerGoogleRoutes(app, cfg);
  registerWebhookRoutes(app);

  // --- Intelligent Hub Initialization ---
  // Initialize the Event Hub (Singleton)
  const eventHub = EventHub.getInstance();

  // Initialize Autonomous Services (they start listening to events automatically)
  const workflowService = new WorkflowService(cfg, queue);
  const maintenanceService = new MaintenanceService();
  const automationHandlers = new AutomationHandlers();
  const intelligenceService = new IntelligenceService(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const autoAutomationService = new AutoAutomationService(cfg.supabaseUrl, cfg.supabaseAnonKey);

  console.log('[Intelligent Hub] Autonomous services, Intelligence Cortex, and Auto-Automation Synthesizer initialized...');

  app.listen(cfg.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[zaptro-mail-api] listening on http://localhost:${cfg.port}`);
  });

  const shutdown = async () => {
    await queue.close?.();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

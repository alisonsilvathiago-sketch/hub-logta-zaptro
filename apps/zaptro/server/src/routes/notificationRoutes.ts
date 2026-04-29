import type { Express } from 'express';
import { z } from 'zod';
import type { AppConfig } from '../config.js';
import type { createEmailLogger } from '../logging/emailLog.js';
import { normalizeEmail } from '../sendgrid/validateEmail.js';
import {
  buildTransactionalEmail,
  type TransactionalKind,
} from '../templates/index.js';
import type { MailQueue } from '../queue/createMailQueue.js';
import { WorkflowService } from '../services/workflowService.js';

const notificationEventSchema = z.object({
  event: z.string(), // e.g. "leads.insert", "master_payments.update"
  kind: z.string(),  // mapping to TransactionalKind
  target_email: z.string().email(),
  variables: z.record(z.union([z.string(), z.number(), z.null()])).optional(),
  company_id: z.string().uuid().optional(),
});

export function registerNotificationRoutes(
  app: Express,
  cfg: AppConfig,
  logger: ReturnType<typeof createEmailLogger>,
  queue: MailQueue,
) {
  // INTERNAL SECURE ROUTE for automatic triggers
  app.post('/v1/notifications/event', async (req, res) => {
    const secret = req.headers['x-zaptro-internal-secret'];
    if (!cfg.internalSecret || secret !== cfg.internalSecret) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const parsed = notificationEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    }

    const { kind, target_email, variables, company_id, event } = parsed.data;

    try {
      // 1. Check for Intelligent Workflows
      if (kind === 'new_lead' && variables?.lead_email) {
        const workflow = new WorkflowService(cfg, queue);
        await workflow.processLeadConversion({
          name: String(variables.lead_name || 'Interessado'),
          email: String(variables.lead_email),
          interest: String(variables.interest || 'Serviços Hub')
        });
        
        // Also send the original admin notification
      }

      // 2. Standard Notification Logic
      // Resolve company name if needed, or use default
      let companyName = 'Logta Hub';
      
      // Build the email
      const { subject, html, text } = buildTransactionalEmail(
        kind as TransactionalKind,
        companyName,
        variables || {},
      );

      // Enqueue the job
      await queue.enqueue({
        to: normalizeEmail(target_email),
        subject,
        html,
        text,
      });

      res.status(202).json({ ok: true, queued: true });
    } catch (err: any) {
      logger.write({
        at: new Date().toISOString(),
        level: 'error',
        to: target_email,
        message: `Event Trigger Failed: ${err.message}`,
      });
      res.status(500).json({ error: 'trigger_failed', message: err.message });
    }
  });
}

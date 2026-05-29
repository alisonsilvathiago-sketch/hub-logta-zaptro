import type { Express, Request, Response } from 'express';
import type { LogstokaConfig } from '../config.js';
import { logstokaQueue } from '../queue/inMemoryQueue.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

export function registerWebhookRoutes(app: Express, cfg: LogstokaConfig) {
  app.post('/webhooks/orders', async (req: Request, res: Response) => {
    const companyId = String(req.headers['x-company-id'] ?? req.body?.company_id ?? '');
    if (!companyId) return res.status(400).json({ error: 'company_id required' });

    const jobId = await logstokaQueue.enqueue('webhook.inbound', {
      companyId,
      eventType: req.body?.event ?? 'order.created',
      source: 'orders',
      payload: req.body,
    });

    res.status(202).json({ accepted: true, jobId });
  });

  app.post('/webhooks/marketplaces', async (req: Request, res: Response) => {
    const companyId = String(req.headers['x-company-id'] ?? req.body?.company_id ?? '');
    const marketplace = String(req.body?.marketplace ?? req.headers['x-marketplace'] ?? 'unknown');

    await logstokaQueue.enqueue('webhook.inbound', {
      companyId,
      eventType: req.body?.event ?? 'marketplace.event',
      source: marketplace,
      payload: req.body,
    });

    await logstokaQueue.enqueue('integration.sync', {
      companyId,
      marketplace,
      action: 'order_sync',
    });

    res.status(202).json({ accepted: true });
  });

  app.post('/webhooks/inventory', async (req: Request, res: Response) => {
    await logstokaQueue.enqueue('webhook.inbound', {
      companyId: req.body?.company_id,
      eventType: 'inventory.updated',
      source: 'inventory',
      payload: req.body,
    });
    res.status(202).json({ accepted: true });
  });

  app.post('/webhooks/shipping', async (req: Request, res: Response) => {
    await logstokaQueue.enqueue('webhook.inbound', {
      companyId: req.body?.company_id,
      eventType: req.body?.event ?? 'shipping.updated',
      source: 'shipping',
      payload: req.body,
    });
    res.status(202).json({ accepted: true });
  });

  app.post('/webhooks/reprocess/:eventId', async (req: Request, res: Response) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin) return res.status(503).json({ error: 'Service unavailable' });

    const { data, error } = await admin
      .from('ls_webhook_events')
      .select('*')
      .eq('id', req.params.eventId)
      .maybeSingle();

    if (error || !data) return res.status(404).json({ error: 'Event not found' });

    await logstokaQueue.enqueue('webhook.inbound', {
      companyId: data.company_id,
      eventType: data.event_type,
      source: data.source,
      payload: data.payload,
      reprocess: true,
    });

    await admin
      .from('ls_webhook_events')
      .update({ status: 'retrying', retry_count: (data.retry_count ?? 0) + 1 })
      .eq('id', data.id);

    res.json({ reprocessed: true });
  });
}

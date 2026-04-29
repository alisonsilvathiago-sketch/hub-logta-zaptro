import type { Express } from 'express';
import { EventHub, SystemEvent } from '../services/eventHub.js';

export function registerWebhookRoutes(app: Express) {
  const hub = EventHub.getInstance();

  /**
   * POST /v1/webhooks/supabase
   * Endpoint for Supabase Database Webhooks.
   * Secure this with a secret in production.
   */
  app.post('/v1/webhooks/supabase', (req, res) => {
    const { table, record, type } = req.body;

    console.log(`[Webhook] Received Supabase trigger from ${table} (${type})`);

    // Map database changes to System Events
    if (table === 'leads' && type === 'INSERT') {
      hub.emit(SystemEvent.LEAD_CREATED, {
        name: record.name,
        email: record.email,
        source: record.source || 'supabase_webhook'
      });
    }

    if (table === 'payments' && type === 'INSERT') {
      hub.emit(SystemEvent.PAYMENT_RECEIVED, {
        amount: record.amount,
        currency: record.currency,
        userId: record.user_id
      });
    }

    res.status(200).json({ status: 'processed' });
  });

  /**
   * GET /v1/webhooks/health
   */
  app.get('/v1/webhooks/health', (req, res) => {
    res.json({ status: 'active', listeners: 'EventHub' });
  });
}

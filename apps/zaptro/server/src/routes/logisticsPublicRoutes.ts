import type { Express, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from '../services/eventHub.js';

export function registerLogisticsPublicRoutes(app: Express, cfg: any) {
  const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const hub = EventHub.getInstance();

  /**
   * GET /v1/public/delivery/:token
   * Fetches delivery details for the customer portal
   */
  app.get('/v1/public/delivery/:token', async (req: Request, res: Response) => {
    const { token } = req.params;

    try {
      const { data: action, error } = await supabase
        .from('delivery_actions')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !action) {
        return res.status(404).json({ error: 'Token inválido ou expirado' });
      }

      // Se for apenas para visualizar, retornamos os dados básicos
      res.json(action);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar entrega' });
    }
  });

  /**
   * POST /v1/public/delivery/:token/respond
   * Processes customer response (confirm, reschedule, cancel)
   */
  app.post('/v1/public/delivery/:token/respond', async (req: Request, res: Response) => {
    const { token } = req.params;
    const { status, feedback, rescheduled_date, rescheduled_faixa } = req.body;

    try {
      const { data: action, error: findError } = await supabase
        .from('delivery_actions')
        .select('*')
        .eq('token', token)
        .single();

      if (findError || !action) {
        return res.status(404).json({ error: 'Token inválido' });
      }

      // 1. Update the database
      const { error: updateError } = await supabase
        .from('delivery_actions')
        .update({
          status,
          customer_feedback: feedback,
          rescheduled_date,
          rescheduled_faixa,
          responded_at: new Date().toISOString()
        })
        .eq('token', token);

      if (updateError) throw updateError;

      // 2. Emit event for the Autonomous Hub to react
      const eventType = status === 'confirmado' 
        ? 'DELIVERY_CONFIRMED_BY_CLIENT' 
        : status === 'reagendado' 
          ? 'DELIVERY_RESCHEDULED_BY_CLIENT' 
          : 'DELIVERY_CANCELLED_BY_CLIENT';

      hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
        action: eventType,
        actorId: 'CLIENT_PORTAL',
        metadata: {
          deliveryId: action.order_id,
          token,
          status,
          rescheduled_date,
          rescheduled_faixa
        }
      });

      // 3. Log in Audit Trail
      await supabase.from('operational_audit_log').insert([{
        service: 'FulfillmentGuardian',
        action: eventType,
        details: { token, order_id: action.order_id, status }
      }]);

      res.json({ ok: true, message: 'Resposta processada com sucesso' });

    } catch (err) {
      console.error('[PublicLogistics] Failed to process response:', err);
      res.status(500).json({ error: 'Falha ao processar resposta' });
    }
  });

  /**
   * GET /v1/public/fuel-market
   * Returns current fuel prices for the public portal
   */
  app.get('/v1/public/fuel-market', async (req: Request, res: Response) => {
    try {
      const { data } = await supabase.from('fuel_prices').select('*');
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar preços' });
    }
  });
}

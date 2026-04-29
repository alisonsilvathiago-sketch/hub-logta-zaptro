import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * DeliveryGuardianService: The "Guardian of Fulfillment".
 * It autonomously manages delivery confirmations via ZAPTRO, 
 * handles expiration timers (12h), and coordinates rescheduling logic in the HUB.
 */
export class DeliveryGuardianService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      // 1. Initial Trigger: Send confirmation message
      if (data.action === 'DELIVERY_ORCHESTRATED') {
        await this.initiateConfirmation(data.metadata.deliveryId, data.actorId);
      }
      
      // 2. Watchdog: Check for expired confirmations every hour
      if (data.action === 'MAINTENANCE_TICK') {
        await this.auditExpiredConfirmations();
      }
    });
  }

  /**
   * Initiates the confirmation loop via Zaptro.
   */
  async initiateConfirmation(deliveryId: string, companyId: string) {
    try {
      console.log(`[Guardian] Initiating confirmation for delivery ${deliveryId}...`);
      
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12h from now

      const { data: conf } = await this.supabase.from('delivery_actions').insert([{
        order_id: deliveryId,
        token,
        status: 'pendente',
        expires_at: expiresAt
      }]).select().single();

      // Trigger ZAPTRO message via Decision Engine -> Workflow
      this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
        action: 'SEND_DELIVERY_CONFIRMATION_REQUEST',
        actorId: companyId,
        metadata: { 
          deliveryId, 
          token, 
          expiresAt: expiresAt.toISOString(),
          confirmationUrl: `https://hub.logta.com/confirm?token=${token}`
        }
      });

    } catch (err) {
      console.error('[Guardian] Confirmation initiation failed:', err);
    }
  }

  /**
   * Audit: Blocks deliveries that were not confirmed within 12h.
   */
  async auditExpiredConfirmations() {
    console.log('[Guardian] Auditing for expired confirmations...');
    const now = new Date().toISOString();

    const { data: expired } = await this.supabase
      .from('delivery_actions')
      .select('id, order_id')
      .eq('status', 'pendente')
      .lt('expires_at', now);

    for (const item of expired || []) {
      await this.supabase.from('delivery_actions')
        .update({ status: 'expirado' })
        .eq('id', item.id);

      // Block the delivery in the master system
      this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
        action: 'DELIVERY_CONFIRMATION_EXPIRED',
        actorId: 'SYSTEM',
        metadata: { deliveryId: item.delivery_id }
      });

      console.log(`[Guardian] Delivery ${item.delivery_id} BLOCKED due to no response (12h).`);
    }
  }

  /**
   * Public: Processes the client's choice (Confirm/Reschedule).
   */
  async processChoice(token: string, action: 'CONFIRM' | 'RESCHEDULE', choiceMetadata?: any) {
    const { data: conf } = await this.supabase
      .from('delivery_actions')
      .select('*')
      .eq('token', token)
      .eq('status', 'pendente')
      .single();

    if (!conf) throw new Error('Invalid or expired token.');

    if (action === 'CONFIRM') {
      await this.supabase.from('delivery_actions')
        .update({ status: 'confirmado', responded_at: new Date() })
        .eq('id', conf.id);
      
      this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
        action: 'DELIVERY_CONFIRMED_BY_CLIENT',
        metadata: { deliveryId: conf.delivery_id }
      });
    } else {
      await this.supabase.from('delivery_actions')
        .update({ 
          status: 'reagendado', 
          rescheduled_date: choiceMetadata.newDate,
          metadata: { slotId: choiceMetadata.slotId }
        })
        .eq('id', conf.id);

      this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
        action: 'DELIVERY_RESCHEDULED_BY_CLIENT',
        metadata: { 
          deliveryId: conf.delivery_id, 
          newDate: choiceMetadata.newDate,
          slotId: choiceMetadata.slotId 
        }
      });
    }
  }
}

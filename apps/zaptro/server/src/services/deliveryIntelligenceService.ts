import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * DeliveryIntelligenceService: The "Guardian" of the Hub.
 * It ensures that every critical message or action actually reaches its destination and achieves results.
 * If a message isn't read or a payment isn't made, it triggers intelligent retries.
 */
export class DeliveryIntelligenceService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for executed actions to start tracking
    this.hub.on(SystemEvent.DECISION_MADE, async (decision) => {
      const trackableLogics = [
        'StrategicCommunication', 
        'GrowthInvitation', 
        'FulfillmentGuardian', 
        'OperationalShield',
        'GeofencingGuardian',
        'DocumentAuditCoordination'
      ];

      if (trackableLogics.includes(decision.logic)) {
        await this.startTracking(decision.companyId, decision.outcome, decision.logic);
      }
    });

    // Listen for behavior updates that might "Complete" a delivery (e.g. user read or paid)
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      // Logic for Completion
      if (data.action === 'PAYMENT_RECEIVED') {
        await this.markAsCompleted(data.actorId, 'BILLING_MESSAGE');
      }
      if (data.action === 'MESSAGE_READ') {
        await this.updateStatus(data.actorId, data.metadata.messageType, 'READ');
      }
      if (data.action === 'DELIVERY_CONFIRMED_BY_CLIENT' || data.action === 'DELIVERY_RESCHEDULED_BY_CLIENT') {
        await this.markAsCompleted(data.actorId, 'CONFIRMATION_REQUEST');
      }
    });
  }

  /**
   * Starts tracking a critical delivery
   */
  async startTracking(companyId: string, outcome: any, logicName: string) {
    try {
      await this.supabase.from('system_delivery_tracking').insert([{
        company_id: companyId === 'GLOBAL' || companyId === 'SYSTEM' ? null : companyId,
        action_type: outcome.action,
        status: 'SENT',
        metadata: { ...outcome, logic: logicName },
        next_check_at: new Date(Date.now() + 2 * 60 * 60 * 1000) // First check in 2 hours
      }]);
      console.log(`[DeliveryGuardian] Tracking started for ${outcome.action} (${companyId}) via ${logicName}`);
    } catch (err) {
      console.error('[DeliveryGuardian] Failed to start tracking:', err);
    }
  }

  /**
   * The "Watchdog" cycle: checks for stalled deliveries and triggers retries
   */
  async runDeliveryAudit() {
    console.log('[DeliveryGuardian] Running audit of pending deliveries...');
    
    try {
      const { data: stalled } = await this.supabase
        .from('system_delivery_tracking')
        .select('*')
        .in('status', ['SENT', 'DELIVERED', 'READ', 'AWAITING_REPLY'])
        .lt('next_check_at', new Date().toISOString())
        .lt('retry_count', 5); // Increased max retries

      if (!stalled || stalled.length === 0) return;

      for (const item of stalled) {
        console.log(`[DeliveryGuardian] Action stalled: ${item.action_type} for ${item.company_id}. Status: ${item.status}. Retrying...`);
        
        // Exponential Backoff Logic: 2h -> 4h -> 8h -> 16h -> 32h
        const retryMultiplier = Math.pow(2, item.retry_count);
        const nextCheckHours = 2 * retryMultiplier;
        
        // 1. Increment retry
        await this.supabase
          .from('system_delivery_tracking')
          .update({ 
            retry_count: item.retry_count + 1, 
            last_attempt_at: new Date(),
            next_check_at: new Date(Date.now() + nextCheckHours * 60 * 60 * 1000)
          })
          .eq('id', item.id);

        // 2. Trigger a re-evaluation by the Decision Engine
        this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
          action: item.action_type,
          actorId: item.company_id,
          metadata: { ...item.metadata, is_retry: true, previous_status: item.status, retry_count: item.retry_count + 1 }
        });
      }
    } catch (err) {
      console.error('[DeliveryGuardian] Audit failed:', err);
    }
  }

  private async markAsCompleted(companyId: string, actionType: string) {
    await this.supabase
      .from('system_delivery_tracking')
      .update({ status: 'COMPLETED' })
      .eq('company_id', companyId)
      .eq('action_type', actionType)
      .neq('status', 'COMPLETED');
  }

  private async updateStatus(companyId: string, actionType: string, status: string) {
    await this.supabase
      .from('system_delivery_tracking')
      .update({ status })
      .eq('company_id', companyId)
      .eq('action_type', actionType)
      .neq('status', 'COMPLETED');
  }
}

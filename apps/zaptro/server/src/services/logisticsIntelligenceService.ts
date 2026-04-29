import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * LogisticsIntelligenceService: The "Logistics Brain" of the Hub.
 * It monitors deliveries in real-time, predicts delays using a risk-scoring engine,
 * and orchestrates ZAPTRO (comm) and LOGTA (events) to resolve issues.
 */
export class LogisticsIntelligenceService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for external logistics triggers (e.g. GPS updates or manual alerts)
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      if (data.action === 'GPS_UPDATE_RECEIVED') {
        await this.analyzeDeliveryDelay(data.actorId, data.metadata);
      }
    });
  }

  /**
   * Analyzes a delivery's progress and calculates the risk of delay.
   */
  async analyzeDeliveryDelay(deliveryId: string, gpsData: any) {
    try {
      // 1. Fetch Delivery Context
      const { data: delivery } = await this.supabase
        .from('logistics_deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (!delivery || delivery.status !== 'IN_TRANSIT') return;

      // 2. Risk Calculation (Intelligence Layer)
      // Logic: If ETA > Estimated Delivery Time, or if speed is low in a known congestion zone
      const now = new Date();
      const eta = new Date(gpsData.current_eta);
      const est = new Date(delivery.estimated_delivery_at);
      
      const timeDiffMs = eta.getTime() - est.getTime();
      const delayMinutes = Math.max(0, Math.floor(timeDiffMs / (1000 * 60)));
      
      let riskScore = 0;
      let reason = 'NORMAL';

      if (delayMinutes > 30) {
        riskScore = 85.0;
        reason = 'HEAVY_TRAFFIC';
      } else if (delayMinutes > 10) {
        riskScore = 45.0;
        reason = 'MINOR_TRAFFIC';
      }

      // 3. If high risk, trigger orchestration
      if (riskScore > 70.0) {
        console.log(`[LogisticsBrain] HIGH DELAY RISK detected for ${delivery.tracking_code}: ${riskScore}%`);
        
        // Save Prediction
        await this.supabase.from('logistics_delay_predictions').insert([{
          delivery_id: deliveryId,
          risk_score: riskScore,
          reason,
          predicted_delay_minutes: delayMinutes,
          suggested_action: 'NOTIFY_CUSTOMER'
        }]);

        // Update Delivery status
        await this.supabase.from('logistics_deliveries').update({
          is_delayed_predicted: true,
          delay_minutes: delayMinutes
        }).eq('id', deliveryId);

        // 4. Log Event (Logta Memory)
        await this.logEvent(deliveryId, 'DELAY_DETECTED', `Risco de atraso detectado: ${riskScore}%. Motivo: ${reason}`, { delayMinutes });

        // 5. Trigger Decision (Cortex)
        this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
          action: 'LOGISTICS_DELAY_DETECTED',
          actorId: delivery.company_id,
          metadata: { 
            deliveryId, 
            trackingCode: delivery.tracking_code,
            delayMinutes,
            customerName: delivery.customer_name,
            customerEmail: delivery.customer_email
          }
        });
      }

    } catch (err) {
      console.error('[LogisticsBrain] Analysis failed:', err);
    }
  }

  /**
   * Logs an event (Logta style)
   */
  async logEvent(deliveryId: string, type: string, description: string, metadata: any = {}) {
    await this.supabase.from('logistics_events').insert([{
      delivery_id: deliveryId,
      event_type: type,
      description,
      metadata
    }]);
  }
}

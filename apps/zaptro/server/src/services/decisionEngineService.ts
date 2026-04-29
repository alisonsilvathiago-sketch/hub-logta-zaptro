import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * DecisionEngineService: The "Cortex" of the Hub.
 * It doesn't just execute; it decides the BEST way to execute based on context.
 */
export class DecisionEngineService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for events that require a decision
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      if (data.action === 'BILLING_DUE_SOON' || data.action === 'BILLING_OVERDUE') {
        await this.decideCommunicationStrategy(data);
      }
      
      if (data.action === 'PAYMENT_RECEIVED') {
        await this.updateBehavioralProfile(data.actorId, data.metadata);
      }
    });
  }

  /**
   * Decides the best channel, time, and tone for a communication
   */
  private async decideCommunicationStrategy(event: any) {
    const companyId = event.actorId;
    
    try {
      // 1. Fetch Company Profile
      const { data: company } = await this.supabase
        .from('companies')
        .select('name, behavioral_profile, health_score')
        .eq('id', companyId)
        .single();

      if (!company) return;

      const profile = company.behavioral_profile || {};
      
      // 2. The Decision Logic (Intelligence Layer)
      let selectedChannel = profile.preferred_channel || 'email';
      let delayMs = 0;
      let rationale = 'Default strategy.';

      // Decision Rule: If health is critical, prioritize WhatsApp (higher urgency)
      if (company.health_score < 40) {
        selectedChannel = 'whatsapp';
        rationale = 'Critical health detected. Escalating to WhatsApp for higher urgency.';
      }

      // Decision Rule: If user pays at specific hours, delay message to hit that window
      if (profile.preferred_payment_hour) {
        const currentHour = new Date().getHours();
        const targetHour = profile.preferred_payment_hour;
        
        if (currentHour !== targetHour) {
          const hoursToWait = (targetHour - currentHour + 24) % 24;
          delayMs = hoursToWait * 60 * 60 * 1000;
          rationale += ` Optimizing for target payment window (Hour: ${targetHour}).`;
        }
      }

      // 3. Log the Decision
      const decision = {
        action: event.action,
        channel: selectedChannel,
        delay_ms: delayMs,
        original_context: event.metadata
      };

      await this.supabase.from('system_decision_logs').insert([{
        company_id: companyId,
        trigger_event: event.action,
        decision_taken: decision,
        rationale,
        confidence: 0.9
      }]);

      // 4. Emit the decision for WorkflowService to execute
      // We use a slight delay if necessary
      setTimeout(() => {
        this.hub.emit(SystemEvent.DECISION_MADE, {
          logic: 'StrategicCommunication',
          outcome: decision,
          companyId
        });
      }, 100);

    } catch (err) {
      console.error('[DecisionEngine] Decision failed:', err);
    }
  }

  /**
   * Learns from payment events to optimize future decisions
   */
  private async updateBehavioralProfile(companyId: string, metadata: any) {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      
      const { data: company } = await this.supabase
        .from('companies')
        .select('behavioral_profile')
        .eq('id', companyId)
        .single();

      const profile = company?.behavioral_profile || {};
      
      // Learn the preferred payment hour
      profile.preferred_payment_hour = currentHour;
      profile.last_successful_method = metadata.method || 'PIX';

      await this.supabase
        .from('companies')
        .update({ behavioral_profile: profile })
        .eq('id', companyId);

      console.log(`[DecisionEngine] Profile updated for ${companyId}: Learned preferred hour ${currentHour}`);
    } catch (err) {
      console.error('[DecisionEngine] Profile update failed:', err);
    }
  }
}

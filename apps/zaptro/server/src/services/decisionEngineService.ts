import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';
import { OptimizationEngineService } from './optimizationEngineService.js';

/**
 * DecisionEngineService: The "Cortex" of the Hub.
 * It doesn't just execute; it decides the BEST way to execute based on context.
 */
export class DecisionEngineService {
  private hub: EventHub;
  private supabase: SupabaseClient;
  private optimization: OptimizationEngineService;

  constructor(supabaseUrl: string, supabaseKey: string, optimization: OptimizationEngineService) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.optimization = optimization;
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for events that require a decision
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      if (data.action === 'BILLING_DUE_SOON' || data.action === 'BILLING_OVERDUE') {
        await this.decideCommunicationStrategy(data);
      }
      
      if (data.action === 'REFERRAL_INVITE_TRIGGERED') {
        await this.decideGrowthStrategy(data);
      }

      if (data.action === 'LEVEL_UP') {
        await this.decideGamificationReward(data);
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
      let experimentId = null;
      let variantId = null;

      // --- AB TESTING OVERRIDE ---
      const activeExperiment = await this.optimization.getOptimalVariant('BILLING_STRATEGY');
      if (activeExperiment && !event.metadata.is_retry) {
        selectedChannel = activeExperiment.data.channel || selectedChannel;
        rationale = `Experiment active: ${activeExperiment.id}.`;
        experimentId = activeExperiment.experimentId;
        variantId = activeExperiment.id;
      } else {
        // Strategic Retry Logic: If the previous attempt didn't work (not read/not paid), escalate.
        if (event.metadata.is_retry) {
          selectedChannel = 'whatsapp';
          rationale = `Retry detected (Previous: ${event.metadata.previous_status}). Escalating to WhatsApp for guaranteed delivery.`;
        } else if (company.health_score < 40) {
          // Decision Rule: If health is critical, prioritize WhatsApp (higher urgency)
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
      }

      // 3. Log the Decision
      const decision = {
        action: event.action,
        channel: selectedChannel,
        delay_ms: delayMs,
        original_context: event.metadata,
        variantId
      };

      await this.supabase.from('system_decision_logs').insert([{
        company_id: companyId,
        trigger_event: event.action,
        decision_taken: decision,
        rationale,
        confidence: 0.9,
        experiment_id: experimentId,
        variant_id: variantId
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
   * Decides the best incentive for a referral invite
   */
  private async decideGrowthStrategy(event: any) {
    const companyId = event.actorId;
    
    try {
      const { data: company } = await this.supabase
        .from('companies')
        .select('behavioral_profile')
        .eq('id', companyId)
        .single();

      const profile = company?.behavioral_profile || {};
      
      // Strategy: If customer has "last_successful_method" as CREDIT_CARD, they might prefer a DISCOUNT.
      // If they use PIX, they might prefer a direct CREDIT balance.
      const preferredReward = profile.last_successful_method === 'CREDIT_CARD' ? 'DISCOUNT' : 'CREDIT';
      
      const decision = {
        action: 'SEND_GROWTH_INVITE',
        reward_type: preferredReward,
        referral_link: event.metadata.referral_link,
        original_context: event.metadata
      };

      await this.supabase.from('system_decision_logs').insert([{
        company_id: companyId,
        trigger_event: 'REFERRAL_INVITE_TRIGGERED',
        decision_taken: decision,
        rationale: `Promoter identified. Offering ${preferredReward} based on payment history.`,
        confidence: 0.85
      }]);

      this.hub.emit(SystemEvent.DECISION_MADE, {
        logic: 'GrowthInvitation',
        outcome: decision,
        companyId
      });

    } catch (err) {
      console.error('[DecisionEngine] Growth decision failed:', err);
    }
  }

  /**
   * Decides the best reward for a Level Up event
   */
  private async decideGamificationReward(event: any) {
    const companyId = event.actorId;
    const { newLevel, levelName } = event.metadata;
    
    try {
      let reward = 'CONGRATULATIONS_MESSAGE';
      let benefit = 'Nenhum';

      if (newLevel === 2) {
        reward = 'UNLOCK_BETA_FEATURES';
        benefit = 'Acesso antecipado a novos módulos';
      } else if (newLevel === 3) {
        reward = 'PRIORITY_SUPPORT';
        benefit = 'Suporte via WhatsApp 24/7';
      } else if (newLevel === 4) {
        reward = 'LEGENDARY_CREDIT';
        benefit = 'R$ 200 em créditos de uso';
      }

      const decision = {
        action: 'SEND_GAMIFICATION_REWARD',
        level: newLevel,
        level_name: levelName,
        reward_type: reward,
        benefit_description: benefit
      };

      await this.supabase.from('system_decision_logs').insert([{
        company_id: companyId,
        trigger_event: 'LEVEL_UP',
        decision_taken: decision,
        rationale: `Customer reached level ${newLevel} (${levelName}). Applying ${reward} strategy.`,
        confidence: 0.95
      }]);

      this.hub.emit(SystemEvent.DECISION_MADE, {
        logic: 'GamificationReward',
        outcome: decision,
        companyId
      });

    } catch (err) {
      console.error('[DecisionEngine] Gamification reward decision failed:', err);
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

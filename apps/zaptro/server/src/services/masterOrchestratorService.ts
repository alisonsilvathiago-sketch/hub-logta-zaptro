import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * MasterOrchestratorService: The "CEO" of the platform.
 * It coordinates all intelligent services (Cortex, Scientist, Guardian, Game Master) 
 * to ensure that ZAPTRO and LOGTA work in perfect harmony.
 */
export class MasterOrchestratorService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupGlobalOrchestration();
  }

  private setupGlobalOrchestration() {
    // 1. Listen for ALL Behavior (The Hub "sees" everything)
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      console.log(`[MasterOrchestrator] Event intercepted: ${data.action} from ${data.actorId}`);
      
      // We log the start of an orchestration cycle for high-value actions
      if (['BILLING_DUE_SOON', 'BILLING_OVERDUE', 'LEVEL_UP', 'REFERRAL_INVITE_TRIGGERED'].includes(data.action)) {
        await this.logOrchestrationStep(data.actorId, data.action, { step: 'EVENT_DETECTED', module: 'LOGTA', data });
      }
    });

    // 2. Listen for Decisions (The Hub validates the Cortex's thought)
    this.hub.on(SystemEvent.DECISION_MADE, async (decision) => {
      console.log(`[MasterOrchestrator] Strategic Decision Approved: ${decision.logic} for ${decision.companyId}`);
      
      await this.logOrchestrationStep(decision.companyId, decision.logic, { 
        step: 'DECISION_FINALIZED', 
        module: 'CORTEX', 
        result: decision.outcome 
      });
    });

    // 3. Listen for Results (The Hub analyzes the outcome)
    this.hub.on(SystemEvent.PAYMENT_RECEIVED, async (data) => {
      console.log(`[MasterOrchestrator] Operation Successful: Payment Received for ${data.companyId}`);
      
      await this.finalizeOrchestration(data.companyId, 'COMPLETED');
    });
  }

  /**
   * Logs a step in the multi-module operational flow
   */
  private async logOrchestrationStep(companyId: string, operationName: string, stepData: any) {
    try {
      const { data: existing } = await this.supabase
        .from('system_orchestration_logs')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'IN_PROGRESS')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        const steps = [...existing.steps, { ...stepData, timestamp: new Date() }];
        await this.supabase
          .from('system_orchestration_logs')
          .update({ steps, current_step: steps.length, updated_at: new Date() })
          .eq('id', existing.id);
      } else {
        await this.supabase.from('system_orchestration_logs').insert([{
          company_id: companyId,
          operation_name: operationName,
          steps: [{ ...stepData, timestamp: new Date() }],
          current_step: 1
        }]);
      }
    } catch (err) {
      console.error('[MasterOrchestrator] Failed to log step:', err);
    }
  }

  private async finalizeOrchestration(companyId: string, status: string) {
    await this.supabase
      .from('system_orchestration_logs')
      .update({ status, updated_at: new Date() })
      .eq('company_id', companyId)
      .eq('status', 'IN_PROGRESS');
  }

  /**
   * High-level command: Trigger a full coordinated campaign
   */
  async triggerCoordinatedAction(companyId: string, actionType: string, context: any) {
    console.log(`[MasterOrchestrator] COORDINATED_ACTION: ${actionType} -> Target: ${companyId}`);
    
    // The CEO emits the command, and all services (Decision, Workflow, Guardian) act in sequence.
    this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
      action: actionType,
      actorId: companyId,
      metadata: context
    });
  }
}

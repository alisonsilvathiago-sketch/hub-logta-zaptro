import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';
import crypto from 'crypto';

/**
 * AutoAutomationService: The "Synthesizer" that creates automations autonomously.
 * It watches sequences of events and builds new Hub Workflows.
 */
export class AutoAutomationService {
  private hub: EventHub;
  private supabase: SupabaseClient;
  private recentActions: Map<string, string[]> = new Map(); // actorId -> actionQueue
  private readonly SEQUENCE_WINDOW = 3;
  private readonly AUTO_GEN_THRESHOLD = 5;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.setupObservation();
  }

  private setupObservation() {
    // Watch all behavior to identify sequences
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      const actorId = data.actorId || 'system_global';
      await this.processActionForSequence(actorId, data.action);
    });
  }

  private async processActionForSequence(actorId: string, action: string) {
    if (!this.recentActions.has(actorId)) {
      this.recentActions.set(actorId, []);
    }

    const queue = this.recentActions.get(actorId)!;
    queue.push(action);

    if (queue.length >= this.SEQUENCE_WINDOW) {
      const currentSequence = queue.slice(-this.SEQUENCE_WINDOW);
      await this.trackSequence(actorId, currentSequence);
      queue.shift(); // Maintain window size
    }
  }

  private async trackSequence(actorId: string, actions: string[]) {
    const sequenceStr = actions.join(' -> ');
    const hash = crypto.createHash('sha256').update(sequenceStr).digest('hex');

    try {
      const { data: existing } = await this.supabase
        .from('behavioral_sequences')
        .select('id, occurrence_count, is_synthesized')
        .eq('sequence_hash', hash)
        .maybeSingle();

      if (existing) {
        if (existing.is_synthesized) return;

        const newCount = existing.occurrence_count + 1;
        await this.supabase
          .from('behavioral_sequences')
          .update({ occurrence_count: newCount, last_triggered_at: new Date() })
          .eq('id', existing.id);

        if (newCount >= this.AUTO_GEN_THRESHOLD) {
          await this.synthesizeAutomation(hash, actions);
        }
      } else {
        await this.supabase
          .from('behavioral_sequences')
          .insert([{
            actor_id: actorId === 'system_global' ? null : actorId,
            sequence_hash: hash,
            actions_json: actions,
            occurrence_count: 1
          }]);
      }
    } catch (err) {
      console.error('[AutoAutomation] Error tracking sequence:', err);
    }
  }

  /**
   * Generates a new Workflow entry in the database based on detected behavior
   */
  private async synthesizeAutomation(hash: string, actions: string[]) {
    console.log(`[AutoAutomation] Synthesizing new workflow for sequence: ${actions.join(' -> ')}`);

    const trigger = actions[0];
    const finalAction = actions[actions.length - 1];
    
    const workflowName = `Auto: ${trigger} -> ${finalAction}`;
    
    try {
      // 1. Create the workflow in suggested mode
      const { data: workflow, error } = await this.supabase
        .from('hub_workflows')
        .insert([{
          name: workflowName,
          trigger: trigger,
          action: finalAction,
          is_active: false, // Start as suggested/inactive
          icon_name: 'Cpu',
          metadata: {
            is_auto_generated: true,
            detected_sequence: actions,
            generated_at: new Date(),
            confidence: 0.85
          }
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Mark sequence as synthesized
      await this.supabase
        .from('behavioral_sequences')
        .update({ is_synthesized: true })
        .eq('sequence_hash', hash);

      // 3. Emit event so the system knows a new automation exists
      this.hub.emit(SystemEvent.DECISION_MADE, {
        logic: 'AutoWorkflowSynthesis',
        outcome: { 
          workflowId: workflow.id, 
          message: `New automation suggested: ${workflowName}` 
        },
        confidence: 0.85
      });

    } catch (err) {
      console.error('[AutoAutomation] Failed to synthesize workflow:', err);
    }
  }
}

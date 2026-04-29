import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';
import crypto from 'crypto';

/**
 * AutoAutomationMachine: The core engine that observes, learns, and generates automations.
 * Implements a 5-layer architecture: Collection -> Patterns -> Synthesis -> Execution -> Evolution.
 */
export class AutoAutomationService {
  private hub: EventHub;
  private supabase: SupabaseClient;
  private recentActions: Map<string, string[]> = new Map(); 
  private readonly SEQUENCE_WINDOW = 3;
  private readonly CONFIDENCE_THRESHOLD = 0.8;
  private readonly HIT_THRESHOLD = 5;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.setupMachine();
  }

  private setupMachine() {
    // Layer 1: Continuous Observation
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      await this.recordOperationalEvent(data);
      const actorId = data.actorId || 'system_global';
      await this.processBehaviorFlow(actorId, data.action);
    });
  }

  /**
   * Layer 1: Event Collection (The Eye)
   */
  private async recordOperationalEvent(data: any) {
    try {
      await this.supabase
        .from('system_operational_events')
        .insert([{
          actor_id: data.actorId === 'system_global' ? null : data.actorId,
          action_type: data.action,
          metadata: data.metadata || {}
        }]);
    } catch (err) {
      console.error('[AutomationMachine] Event logging failed:', err);
    }
  }

  /**
   * Layer 2: Pattern Engine (The Brain)
   */
  private async processBehaviorFlow(actorId: string, action: string) {
    if (!this.recentActions.has(actorId)) {
      this.recentActions.set(actorId, []);
    }

    const queue = this.recentActions.get(actorId)!;
    queue.push(action);

    if (queue.length >= this.SEQUENCE_WINDOW) {
      const currentSequence = queue.slice(-this.SEQUENCE_WINDOW);
      await this.analyzePattern(currentSequence);
      queue.shift();
    }
  }

  private async analyzePattern(actions: string[]) {
    const sequenceStr = actions.join(' -> ');
    const hash = crypto.createHash('sha256').update(sequenceStr).digest('hex');

    try {
      const { data: pattern } = await this.supabase
        .from('system_behavioral_patterns')
        .select('*')
        .eq('pattern_hash', hash)
        .maybeSingle();

      if (pattern) {
        const newHits = pattern.hit_count + 1;
        const confidence = Math.min(1, newHits / 10); // Simple confidence evolution

        await this.supabase
          .from('system_behavioral_patterns')
          .update({ 
            hit_count: newHits, 
            confidence_score: confidence,
            last_triggered_at: new Date() 
          })
          .eq('id', pattern.id);

        // Layer 3: Synthesis Trigger
        if (confidence >= this.CONFIDENCE_THRESHOLD && newHits >= this.HIT_THRESHOLD) {
          await this.synthesizeWorkflow(hash, actions, confidence);
        }
      } else {
        await this.supabase
          .from('system_behavioral_patterns')
          .insert([{
            pattern_hash: hash,
            sequence_data: actions,
            hit_count: 1,
            confidence_score: 0.1
          }]);
      }
    } catch (err) {
      console.error('[AutomationMachine] Pattern analysis failed:', err);
    }
  }

  /**
   * Layer 3: Automation Synthesis (The Creator)
   */
  private async synthesizeWorkflow(hash: string, actions: string[], confidence: number) {
    const trigger = actions[0];
    const finalAction = actions[actions.length - 1];
    const name = `Autonomous: ${trigger} → ${finalAction}`;

    try {
      // Check if workflow already exists for this pattern
      const { data: existing } = await this.supabase
        .from('hub_workflows')
        .select('id')
        .eq('trigger', trigger)
        .eq('action', finalAction)
        .eq('metadata->pattern_hash', hash)
        .maybeSingle();

      if (existing) return;

      const { data: workflow } = await this.supabase
        .from('hub_workflows')
        .insert([{
          name,
          trigger,
          action: finalAction,
          is_active: false, // Default to suggested mode
          icon_name: 'Cpu',
          metadata: {
            pattern_hash: hash,
            confidence,
            is_auto_generated: true,
            sequence: actions
          }
        }])
        .select()
        .single();

      if (workflow) {
        console.log(`[AutomationMachine] New machine-generated workflow synthesized: ${name}`);
        this.hub.emit(SystemEvent.DECISION_MADE, {
          logic: 'AutoSynthesis',
          outcome: { id: workflow.id, name, confidence },
          confidence
        });
      }
    } catch (err) {
      console.error('[AutomationMachine] Synthesis failed:', err);
    }
  }
}

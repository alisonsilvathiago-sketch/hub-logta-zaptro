import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * IntelligenceService: The "Pre-Frontal Cortex" of the Hub.
 * It observes behavior, makes automated decisions, and optimizes the system.
 */
export class IntelligenceService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupIntelligence();
  }

  private setupIntelligence() {
    // 1. Behavioral Learning: Observe all actions to find patterns
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      await this.recordInPersistentMemory('BEHAVIOR', data.action, data);
      await this.analyzePatterns(data.action);
    });

    // 2. Decision Support: When a critical event happens, provide an automated decision
    this.hub.on(SystemEvent.LEAD_CREATED, (data) => {
      this.makeAutomatedDecision('LEAD_ROUTING', data);
    });

    // 3. Error Recurrence Analysis: Learn from mistakes
    this.hub.on(SystemEvent.ERROR_CRITICAL, async (data) => {
      const key = `error_${data.service}_${data.message.substring(0, 50).replace(/\s/g, '_')}`;
      await this.recordInPersistentMemory('ERROR', key, data);
      await this.analyzeErrorRecurrence(key);
    });

    // 4. Self-Optimization: Trigger periodic internal optimizations
    setInterval(() => {
      this.optimizeSystemFlux();
    }, 14400000); // Every 4 hours
  }

  /**
   * Persists an observation in the system's "Smart Memory"
   */
  private async recordInPersistentMemory(type: string, key: string, metadata: any) {
    try {
      const { data, error } = await this.supabase
        .from('system_intelligence_memory')
        .select('id, occurrence_count')
        .eq('key_identifier', key)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Update existing memory
        await this.supabase
          .from('system_intelligence_memory')
          .update({ 
            occurrence_count: data.occurrence_count + 1,
            last_seen: new Date(),
            metadata: { ...metadata, updated_at: new Date() }
          })
          .eq('id', data.id);
      } else {
        // Create new memory entry
        await this.supabase
          .from('system_intelligence_memory')
          .insert([{
            pattern_type: type,
            key_identifier: key,
            metadata,
            occurrence_count: 1
          }]);
      }
    } catch (err) {
      console.error('[Intelligence] Failed to record in memory:', err);
    }
  }

  /**
   * Pattern Analysis: Checks persistent memory to find strong patterns
   */
  private async analyzePatterns(action: string) {
    const { data } = await this.supabase
      .from('system_intelligence_memory')
      .select('occurrence_count')
      .eq('key_identifier', action)
      .maybeSingle();

    if (data && data.occurrence_count >= 10) {
      console.log(`[Intelligence] Strong behavioral pattern detected for "${action}".`);
      this.hub.emit(SystemEvent.DECISION_MADE, {
        logic: 'MemoryPatternAnalysis',
        outcome: { action, recommendation: 'Automate repetitive flow' },
        confidence: 0.98
      });
    }
  }

  /**
   * Error Recurrence Analysis: If an error repeats, mark it for auto-fix
   */
  private async analyzeErrorRecurrence(key: string) {
    const { data } = await this.supabase
      .from('system_intelligence_memory')
      .select('occurrence_count')
      .eq('key_identifier', key)
      .maybeSingle();

    if (data && data.occurrence_count >= 3) {
      console.warn(`[Intelligence] Recurring error detected: ${key}. Suggesting automated remediation.`);
      this.hub.emit(SystemEvent.MAINTENANCE_REQUIRED, {
        type: 'AUTO_FIX_RECURRING_ERROR',
        details: { key, occurrences: data.occurrence_count }
      });
    }
  }

  /**
   * Decision Engine: Takes complex context and outputs an outcome
   */
  private makeAutomatedDecision(type: string, context: any) {
    console.log(`[Intelligence] Making automated decision for ${type}...`);
    
    let outcome: any = {};
    let confidence = 0;

    if (type === 'LEAD_ROUTING') {
      outcome = { routeTo: context.source.includes('log') ? 'Logta' : 'Zaptro' };
      confidence = 0.88;
    }

    this.hub.emit(SystemEvent.DECISION_MADE, {
      logic: type,
      outcome,
      confidence
    });
  }

  private optimizeSystemFlux() {
    console.log('[Intelligence] Running system self-optimization...');
    this.hub.emit(SystemEvent.MAINTENANCE_REQUIRED, {
      type: 'INTERNAL_OPTIMIZATION',
      details: { optimizedAt: new Date() }
    });
  }
}

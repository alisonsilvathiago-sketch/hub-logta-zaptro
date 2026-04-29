import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * OptimizationEngineService: The "Scientist" of the Hub.
 * It runs A/B tests on messages, timing, and channels, automatically choosing winners.
 */
export class OptimizationEngineService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for conversions to update experiment results
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      if (data.action === 'PAYMENT_RECEIVED') {
        await this.recordConversion(data.actorId);
      }
    });
  }

  /**
   * Decides which variant to use for a given experiment type
   */
  async getOptimalVariant(experimentType: string): Promise<{ id: string; data: any; experimentId: string } | null> {
    try {
      // 1. Check for active experiment
      const { data: experiment } = await this.supabase
        .from('system_experiments')
        .select('*')
        .eq('type', experimentType)
        .eq('status', 'RUNNING')
        .maybeSingle();

      if (!experiment) return null;

      // 2. If winner already chosen, return it
      if (experiment.winner_variant) {
        return { 
          id: experiment.winner_variant, 
          data: experiment.variants[experiment.winner_variant],
          experimentId: experiment.id
        };
      }

      // 3. Otherwise, pick randomly (A/B distribution)
      const variantIds = Object.keys(experiment.variants);
      const selectedId = variantIds[Math.floor(Math.random() * variantIds.length)];
      
      // 4. Record impression
      await this.supabase.rpc('increment_experiment_impression', { 
        exp_id: experiment.id, 
        var_id: selectedId 
      });

      return { 
        id: selectedId, 
        data: experiment.variants[selectedId],
        experimentId: experiment.id
      };
    } catch (err) {
      console.error('[OptimizationEngine] Failed to get variant:', err);
      return null;
    }
  }

  /**
   * Automatically records a conversion for the last decision made for this company
   */
  private async recordConversion(companyId: string) {
    try {
      // Find the last decision that had an experiment linked
      const { data: lastDecision } = await this.supabase
        .from('system_decision_logs')
        .select('experiment_id, variant_id')
        .eq('company_id', companyId)
        .not('experiment_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastDecision?.experiment_id && lastDecision.variant_id) {
        await this.supabase.rpc('increment_experiment_conversion', { 
          exp_id: lastDecision.experiment_id, 
          var_id: lastDecision.variant_id 
        });
        
        console.log(`[OptimizationEngine] Conversion recorded for Exp: ${lastDecision.experiment_id}, Variant: ${lastDecision.variant_id}`);
      }
    } catch (err) {
      console.error('[OptimizationEngine] Failed to record conversion:', err);
    }
  }

  /**
   * Evaluates experiments and selects winners based on conversion rate
   */
  async evaluateExperiments() {
    console.log('[OptimizationMachine] Evaluating active experiments...');
    
    try {
      const { data: experiments } = await this.supabase
        .from('system_experiments')
        .select('*, system_experiment_results(*)')
        .eq('status', 'RUNNING');

      if (!experiments) return;

      for (const exp of experiments) {
        const results = exp.system_experiment_results;
        if (!results || results.length < 2) continue;

        // Check if we have enough data (e.g., 50 impressions per variant)
        const totalImpressions = results.reduce((acc: number, r: any) => acc + r.impressions, 0);
        if (totalImpressions < 100) continue;

        // Find winner by conversion rate
        let bestRate = -1;
        let winnerId = '';

        for (const res of results) {
          const rate = res.conversions / (res.impressions || 1);
          if (rate > bestRate) {
            bestRate = rate;
            winnerId = res.variant_id;
          }
        }

        if (winnerId) {
          console.log(`[OptimizationMachine] Winner found for ${exp.name}: Variant ${winnerId} (${(bestRate * 100).toFixed(2)}% conversion)`);
          await this.supabase
            .from('system_experiments')
            .update({ winner_variant: winnerId, status: 'COMPLETED', ends_at: new Date() })
            .eq('id', exp.id);
        }
      }
    } catch (err) {
      console.error('[OptimizationMachine] Evaluation failed:', err);
    }
  }
}

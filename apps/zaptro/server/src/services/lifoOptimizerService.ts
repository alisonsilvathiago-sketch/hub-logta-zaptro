import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * LIFOOptimizerService: The "Loader" of the Hub.
 * It autonomously implements the "Last In, First Out" (LIFO) logic for cargo.
 * By inverting the delivery sequence, it tells the driver exactly where to 
 * place each package (FRONT, MIDDLE, BACK) for maximum exit efficiency.
 */
export class LIFOOptimizerService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      // 1. Triggered when a new plan is created in LastMileMaster
      if (data.action === 'PLAN_CREATED') {
        await this.optimizeCargoLoading(data.details.planId);
      }
    });
  }

  /**
   * Optimizes the loading plan using LIFO (Reverse) logic.
   */
  async optimizeCargoLoading(planId: string) {
    try {
      console.log(`[LIFO-Optimizer] Inverting delivery sequence for plan ${planId}...`);
      
      const { data: items } = await this.supabase
        .from('logistics_plan_items')
        .select('*')
        .eq('plan_id', planId)
        .order('sequence_position', { ascending: true });

      if (!items || items.length === 0) return;

      const totalItems = items.length;
      const third = Math.ceil(totalItems / 3);

      for (let i = 0; i < totalItems; i++) {
        const item = items[i];
        
        // LIFO Logic: First delivery stop (pos 1) -> Loaded LAST (pos 1 in loading)
        // This is a bit semantic, but the goal is:
        // sequence_position 1 -> FRONT (loaded last)
        // sequence_position N -> BACK (loaded first)
        
        let zone = 'MIDDLE';
        if (item.sequence_position <= third) {
          zone = 'FRONT'; // Near the door, ready for early stops
        } else if (item.sequence_position > (totalItems - third)) {
          zone = 'BACK'; // Deep in the truck, for final stops
        }

        await this.supabase
          .from('logistics_plan_items')
          .update({ 
            loading_zone: zone,
            qr_code_sequence: `L-${planId.slice(0,4)}-${item.sequence_position}`
          })
          .eq('id', item.id);
      }

      await this.logLoadingEvent(planId, 'LIFO_GENERATED', { 
        totalItems, 
        zones: ['FRONT', 'MIDDLE', 'BACK'] 
      });

      console.log(`[LIFO-Optimizer] Cargo plan completed. ${totalItems} items mapped to LIFO zones.`);

    } catch (err) {
      console.error('[LIFO-Optimizer] Optimization failed:', err);
    }
  }

  private async logLoadingEvent(planId: string, action: string, details: any) {
    await this.supabase.from('logistics_loading_logs').insert([{
      plan_id: planId,
      action,
      details
    }]);
  }
}

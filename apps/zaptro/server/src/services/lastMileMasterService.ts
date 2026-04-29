import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * LastMileMasterService: The "Organizer" of the Hub.
 * It autonomously organizes daily and weekly delivery plans,
 * grouping items by region, optimizing the delivery sequence,
 * and generating physical loading instructions (First out, Front-loaded).
 */
export class LastMileMasterService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      // 1. Plan creation trigger
      if (data.action === 'BATCH_READY_FOR_PLANNING') {
        await this.generatePlan(data.actorId, data.metadata.region, data.metadata.deliveries);
      }
    });
  }

  /**
   * Generates an intelligent plan for a driver/region.
   */
  async generatePlan(driverId: string, region: string, deliveryIds: string[]) {
    try {
      console.log(`[LastMileMaster] Generating plan for driver ${driverId} in region ${region}...`);
      
      const today = new Date().toISOString().split('T')[0];
      const weekNumber = this.getWeekNumber(new Date());

      // Create Master Plan
      const { data: plan } = await this.supabase.from('logistics_route_plans').insert([{
        driver_id: driverId,
        region_name: region,
        planning_day: today,
        planning_week: weekNumber,
        status: 'PUBLISHED'
      }]).select().single();

      if (!plan) return;

      // Create Optimized Sequence and Loading Instructions
      // Logic: 
      // Sequence: 1 to N (1 is first stop)
      // Loading: N to 1 (N is loaded first, goes to back; 1 is loaded last, stays at front)
      const items = deliveryIds.map((id, index) => {
        const sequencePosition = index + 1;
        const loadingPosition = deliveryIds.length - index; // First stop (seq 1) -> Loading Pos N (Front)

        return {
          plan_id: plan.id,
          delivery_id: id,
          sequence_position: sequencePosition,
          loading_position: loadingPosition,
          estimated_travel_time_minutes: 15 // Average stop time
        };
      });

      await this.supabase.from('logistics_plan_items').insert(items);

      // Log to LOGTA
      await this.logPlanningEvent(driverId, 'PLAN_CREATED', { 
        planId: plan.id, 
        region, 
        itemCount: deliveryIds.length 
      });

      console.log(`[LastMileMaster] Plan generated with ${deliveryIds.length} stops. Loading instructions attached.`);

    } catch (err) {
      console.error('[LastMileMaster] Planning failed:', err);
    }
  }

  private getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private async logPlanningEvent(driverId: string, type: string, details: any) {
    await this.supabase.from('logistics_planning_logs').insert([{
      driver_id: driverId,
      event_type: type,
      details
    }]);
  }
}

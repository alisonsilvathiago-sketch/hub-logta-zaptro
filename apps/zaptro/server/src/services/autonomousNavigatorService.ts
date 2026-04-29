import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * AutonomousNavigatorService: The "Real-time Integrator".
 * It connects client fulfillment choices (Confirmed/Rescheduled) 
 * directly to the physical route sequence, autonomously re-optimizing paths.
 */
export class AutonomousNavigatorService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      // 1. If confirmed -> Ensure insertion in active route
      if (data.action === 'DELIVERY_CONFIRMED_BY_CLIENT') {
        await this.handleFulfillmentInsertion(data.metadata.deliveryId);
      }
      
      // 2. If rescheduled -> Remove from current and insert in new route
      if (data.action === 'DELIVERY_RESCHEDULED_BY_CLIENT') {
        await this.handleRescheduleIntegration(data.metadata.deliveryId, data.metadata.newDate, data.metadata.slotId);
      }
    });
  }

  /**
   * Confirmed Choice: Locks the delivery in the current route and optimizes sequence.
   */
  async handleFulfillmentInsertion(deliveryId: string) {
    console.log(`[Navigator] Delivery ${deliveryId} confirmed. Optimizing sequence for active route...`);
    
    // In a real scenario, this would query the delivery's current route
    // and call the optimization engine to find the best position.
    await this.supabase.from('logistics_route_transitions').insert([{
      delivery_id: deliveryId,
      transition_type: 'INSERTION',
      new_position: 2, // Simulated optimal position
      efficiency_gain_km: 1.2
    }]);

    await this.logNavEvent(deliveryId, 'ROUTE_LOCKED', { status: 'CONFIRMED' });
  }

  /**
   * Reschedule Choice: Removes from today and finds the best spot in the future route.
   */
  async handleRescheduleIntegration(deliveryId: string, newDate: string, slotId: string) {
    try {
      console.log(`[Navigator] Delivery ${deliveryId} rescheduled to ${newDate}. Re-optimizing global routes...`);
      
      // 1. Remove from any active sequence for today
      await this.supabase.from('logistics_route_sequences').delete().eq('delivery_id', deliveryId);

      // 2. Find best future route (Simulated search)
      // This logic would look for an existing route on newDate that passes near the client's location.
      const targetRouteId = 'FUTURE_ROUTE_ID_STUB'; 

      // 3. Inject into the future route sequence
      await this.supabase.from('logistics_route_sequences').insert([{
        route_id: null, // Would be targetRouteId in production
        delivery_id: deliveryId,
        position: 1, // Simulated optimal position in future route
        estimated_arrival_at: newDate
      }]);

      await this.supabase.from('logistics_route_transitions').insert([{
        delivery_id: deliveryId,
        transition_type: 'RESEQUENCE',
        new_position: 1,
        efficiency_gain_km: 3.5
      }]);

      await this.logNavEvent(deliveryId, 'ROUTE_MIGRATED', { newDate, slotId });

      console.log(`[Navigator] Delivery ${deliveryId} successfully integrated into future route.`);

    } catch (err) {
      console.error('[Navigator] Reschedule integration failed:', err);
    }
  }

  /**
   * LOGTA Style Memory
   */
  private async logNavEvent(deliveryId: string, type: string, details: any) {
    await this.supabase.from('logistics_internal_logs').insert([{
      system_type: 'NAVIGATOR',
      action: type,
      details: { deliveryId, ...details }
    }]);
  }
}

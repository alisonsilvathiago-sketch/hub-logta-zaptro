import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * ReschedulingIntelligenceService: The "Planner" of the Hub.
 * It calculates available delivery slots, identifies the "Optimal" choice (Fastest/Regional),
 * and manages capacity to avoid operational overload during rescheduling.
 */
export class ReschedulingIntelligenceService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Calculates valid slots for a specific delivery/region.
   */
  async getAvailableSlots(deliveryId: string) {
    console.log(`[Planner] Calculating optimal slots for delivery ${deliveryId}...`);
    
    // In a real scenario, this would query the region of the delivery
    // and find slots with 'current_load < capacity'.
    const { data: slots } = await this.supabase
      .from('logistics_delivery_slots')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(5);

    // Identify the "Optimal" slot (e.g., first available or regional match)
    return (slots || []).map((slot, index) => ({
      ...slot,
      is_optimal: index === 0, // Simplification: first is fastest/optimal
      label: `${slot.date} (${slot.time_window})`
    }));
  }

  /**
   * Reserves a slot when a client reschedules.
   */
  async reserveSlot(slotId: string) {
    const { data: slot } = await this.supabase
      .from('logistics_delivery_slots')
      .select('current_load, capacity')
      .eq('id', slotId)
      .single();

    if (slot && slot.current_load < slot.capacity) {
      await this.supabase
        .from('logistics_delivery_slots')
        .update({ current_load: slot.current_load + 1 })
        .eq('id', slotId);
      
      console.log(`[Planner] Slot ${slotId} reserved. Load: ${slot.current_load + 1}/${slot.capacity}`);
    }
  }
}

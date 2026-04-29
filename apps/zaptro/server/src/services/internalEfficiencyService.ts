import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * InternalEfficiencyService: The "Optimizer" of the Hub.
 * It manages internal operational controls: Reverse Logistics, Dock Queues, and Freight Auditing.
 * This service operates purely on HUB intelligence and LOGTA memory, without external communication.
 */
export class InternalEfficiencyService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      // 1. Reverse Logistics Logic
      if (data.action === 'DELIVERY_REFUSED') {
        await this.handleReverseLogistics(data.metadata.orderId, data.metadata.reason);
      }
      // 2. Dock Queue Logic
      if (data.action === 'VEHICLE_ARRIVED_AT_DOCK') {
        await this.handleVehicleArrival(data.metadata.vehicleId);
      }
      // 3. Freight Audit Logic
      if (data.action === 'FREIGHT_CALCULATED') {
        await this.auditFreight(data.metadata.orderId, data.metadata.chargedValue, data.metadata.expectedValue);
      }
    });
  }

  /**
   * Reverse Logistics: Manages the return flow of goods.
   */
  async handleReverseLogistics(orderId: string, reason: string) {
    console.log(`[Optimizer] Delivery refused for order ${orderId}. Initializing reverse logistics...`);
    
    const { data: ret } = await this.supabase.from('logistics_returns').insert([{
      order_id: orderId,
      reason,
      status: 'PENDING',
      estimated_cost: 25.0 // Base return cost
    }]).select().single();

    await this.logInternal('RETURNS', 'INITIALIZED', { orderId, returnId: ret?.id, reason });
  }

  /**
   * Dock Queue: Manages vehicle arrival and service timing.
   */
  async handleVehicleArrival(vehicleId: string) {
    console.log(`[Optimizer] Vehicle ${vehicleId} arrived. Entering dock queue...`);
    
    const { data: queue } = await this.supabase.from('logistics_dock_queue').insert([{
      vehicle_id: vehicleId,
      status: 'QUEUED'
    }]).select().single();

    await this.logInternal('QUEUE', 'VEHICLE_QUEUED', { vehicleId, queueId: queue?.id });
  }

  /**
   * Freight Audit: Validates billing vs expected values.
   */
  async auditFreight(orderId: string, charged: number, expected: number) {
    const discrepancy = Math.abs(charged - expected);
    const isFlagged = discrepancy > 5.0; // Flag if error > R$ 5

    console.log(`[Optimizer] Auditing freight for ${orderId}. Discrepancy: R$ ${discrepancy.toFixed(2)}`);

    await this.supabase.from('logistics_freight_audit').insert([{
      order_id: orderId,
      charged_value: charged,
      expected_value: expected,
      discrepancy_amount: discrepancy,
      status: isFlagged ? 'FLAGGED' : 'APPROVED'
    }]);

    if (isFlagged) {
      await this.logInternal('FREIGHT', 'DISCREPANCY_DETECTED', { orderId, discrepancy });
    }
  }

  /**
   * Logta Style Internal Logger
   */
  private async logInternal(system: string, action: string, details: any) {
    await this.supabase.from('logistics_internal_logs').insert([{
      system_type: system,
      action,
      details
    }]);
  }
}

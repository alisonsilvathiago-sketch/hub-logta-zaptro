import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * OperationsShieldService: The "Shield & Sword" of the Hub.
 * It monitors critical field operations: Security, Loss Prevention, Driver Performance, and Pickups.
 */
export class OperationsShieldService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      // 1. Security Logic
      if (data.action === 'GPS_DEVIATION_DETECTED') {
        await this.handleSecurityAlert(data.actorId, data.metadata);
      }
      // 2. Pickup Logic
      if (data.action === 'PICKUP_SCHEDULED') {
        await this.monitorPickup(data.metadata.orderId, data.metadata.scheduledAt);
      }
      // 3. Performance Logic
      if (data.action === 'DELIVERY_COMPLETED') {
        await this.updateDriverPerformance(data.metadata.driverId, data.metadata);
      }
    });
  }

  /**
   * Anti-Theft: Handles route deviations and high-risk alerts.
   */
  async handleSecurityAlert(vehicleId: string, metadata: any) {
    console.log(`[Shield] SECURITY ALERT! Route deviation detected for vehicle ${vehicleId}`);
    
    await this.supabase.from('logistics_security').insert([{
      vehicle_id: vehicleId,
      is_route_deviation: true,
      risk_level: 'HIGH',
      last_known_location: metadata.location
    }]);

    this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
      action: 'SECURITY_CRITICAL_ALERT',
      actorId: vehicleId,
      metadata: { ...metadata, risk: 'HIGH' }
    });
  }

  /**
   * Loss Prevention: Monitors package updates.
   */
  async checkPackageIntegrity(deliveryId: string) {
    const { data: pkg } = await this.supabase
      .from('logistics_packages')
      .select('*')
      .eq('delivery_id', deliveryId)
      .single();

    if (pkg && !pkg.is_confirmed) {
      const risk = 75.0; // Simulated risk if not confirmed
      await this.supabase.from('logistics_packages').update({ risk_loss_score: risk }).eq('id', pkg.id);
      
      if (risk > 50) {
        this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
          action: 'PACKAGE_LOSS_RISK_DETECTED',
          actorId: deliveryId,
          metadata: { risk }
        });
      }
    }
  }

  /**
   * Driver Productivity: Calculates efficiency scores.
   */
  async updateDriverPerformance(driverId: string, data: any) {
    const { data: perf } = await this.supabase
      .from('logistics_performance')
      .select('*')
      .eq('driver_id', driverId)
      .eq('recorded_date', new Date().toISOString().split('T')[0])
      .maybeSingle();

    const current = perf || { deliveries_done: 0, delays_count: 0 };
    const newDeliveries = current.deliveries_done + 1;
    const isDelayed = data.delayMinutes > 0;
    const newDelays = current.delays_count + (isDelayed ? 1 : 0);
    
    const score = Math.max(0, 100 - (newDelays * 5) + (newDeliveries * 2));

    await this.supabase.from('logistics_performance').upsert({
      driver_id: driverId,
      deliveries_done: newDeliveries,
      delays_count: newDelays,
      efficiency_score: Math.min(100, score),
      recorded_date: new Date().toISOString().split('T')[0]
    }, { onConflict: 'driver_id, recorded_date' });
  }

  /**
   * Pickup Monitor: Checks if pickup happened on time.
   */
  async monitorPickup(orderId: string, scheduledAt: string) {
    await this.supabase.from('logistics_pickups').insert([{
      order_id: orderId,
      scheduled_at: scheduledAt,
      status: 'PENDING'
    }]);
  }
}

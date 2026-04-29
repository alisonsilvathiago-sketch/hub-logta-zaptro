import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * GeofencingValidationService: The "Geofencing Guardian".
 * It autonomously validates delivery locations using GPS data,
 * preventing deliveries at wrong addresses by blocking completion
 * if the driver is outside the allowed radius.
 */
export class GeofencingValidationService {
  private hub: EventHub;
  private supabase: SupabaseClient;
  private readonly RADIUS_THRESHOLD_METERS = 200; // 200m allowed radius

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      if (data.action === 'DELIVERY_FINISH_ATTEMPTED') {
        await this.validateLocation(data.metadata.deliveryId, data.metadata.actualLat, data.metadata.actualLng);
      }
    });
  }

  /**
   * Validates if the driver is within the allowed radius of the delivery address.
   */
  async validateLocation(deliveryId: string, actualLat: number, actualLng: number) {
    try {
      console.log(`[Geofence] Validating delivery ${deliveryId} location...`);
      
      // 1. Get expected coordinates from delivery/customer
      // For this implementation, we assume we fetch it from the delivery metadata
      const { data: delivery } = await this.supabase
        .from('logistics_deliveries')
        .select('customer_id, metadata')
        .eq('id', deliveryId)
        .single();

      if (!delivery) return;

      const expectedLat = delivery.metadata?.lat;
      const expectedLng = delivery.metadata?.lng;

      if (!expectedLat || !expectedLng) {
        console.warn(`[Geofence] No expected coordinates for ${deliveryId}. Allowing as fallback.`);
        this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, { action: 'DELIVERY_LOCATION_VALIDATED', metadata: { deliveryId } });
        return;
      }

      // 2. Calculate distance using Haversine formula
      const distance = this.calculateDistance(expectedLat, expectedLng, actualLat, actualLng);
      const isValid = distance <= this.RADIUS_THRESHOLD_METERS;

      // 3. Record validation in database
      await this.supabase.from('logistics_delivery_geofencing').insert([{
        delivery_id: deliveryId,
        expected_lat: expectedLat,
        expected_lng: expectedLng,
        actual_lat: actualLat,
        actual_lng: actualLng,
        distance_meters: distance,
        status: isValid ? 'VALIDATED' : 'MISMATCH'
      }]);

      if (isValid) {
        console.log(`[Geofence] Location validated for ${deliveryId} (${distance.toFixed(0)}m).`);
        this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
          action: 'DELIVERY_LOCATION_VALIDATED',
          metadata: { deliveryId, distance }
        });
      } else {
        console.error(`[Geofence] LOCATION MISMATCH! Driver is ${distance.toFixed(0)}m away from ${deliveryId}.`);
        
        // 4. Trigger BLOCK and Alert
        this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
          action: 'DELIVERY_LOCATION_MISMATCH_DETECTED',
          actorId: 'DRIVER_GPS',
          metadata: { deliveryId, distance, threshold: this.RADIUS_THRESHOLD_METERS }
        });
      }

      // 5. Log for Logta Memory
      await this.logGeoEvent(deliveryId, isValid ? 'VALIDATION_SUCCESS' : 'VALIDATION_FAILED', {
        distance,
        isValid
      });

    } catch (err) {
      console.error('[Geofence] Validation failed:', err);
    }
  }

  /**
   * Haversine formula to calculate distance between two coordinates in meters.
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private async logGeoEvent(deliveryId: string, type: string, details: any) {
    await this.supabase.from('logistics_internal_logs').insert([{
      system_type: 'GEOFENCING',
      action: type,
      details: { deliveryId, ...details }
    }]);
  }
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * FuelMonitoringService: The "Economist" of the Hub.
 * It monitors Brazilian fuel prices, detects variations, 
 * and orchestrates ZAPTRO (alerts) and LOGTA (history) automatically.
 */
export class FuelMonitoringService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Daily task to fetch and sync fuel prices.
   * In a real production environment, this would call an external API (ANP, specialized provider, etc.)
   */
  async syncFuelPrices() {
    console.log('[Economist] Syncing fuel prices for Brazil...');
    
    try {
      // 1. Simulate fetching new prices (Mock API)
      const newPrices = [
        { type: 'GASOLINA', price: 5.89 + (Math.random() * 0.4 - 0.2) },
        { type: 'ETANOL', price: 3.79 + (Math.random() * 0.4 - 0.2) },
        { type: 'DIESEL', price: 6.12 + (Math.random() * 0.4 - 0.2) },
      ];

      for (const item of newPrices) {
        // 2. Fetch current price to compare
        const { data: current } = await this.supabase
          .from('system_fuel_prices')
          .select('*')
          .eq('fuel_type', item.type)
          .single();

        if (!current) continue;

        const variation = ((item.price - current.current_price) / current.current_price) * 100;
        
        // 3. Update Current Prices & History
        await this.supabase.from('system_fuel_prices').upsert({
          fuel_type: item.type,
          current_price: item.price,
          previous_price: current.current_price,
          variation_pct: variation,
          last_updated_at: new Date()
        }, { onConflict: 'fuel_type' });

        await this.supabase.from('system_fuel_history').insert([{
          fuel_type: item.type,
          price: item.price
        }]);

        // 4. Trigger Alerts (Zaptro + Logta) if variation >= 3%
        if (Math.abs(variation) >= 3.0) {
          console.log(`[Economist] Significant variation detected for ${item.type}: ${variation.toFixed(2)}%`);
          
          await this.supabase.from('system_fuel_alerts').insert([{
            fuel_type: item.type,
            price_from: current.current_price,
            price_to: item.price,
            variation_pct: variation
          }]);

          // Notify the platform (Cortex will decide who to notify)
          this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
            action: 'FUEL_PRICE_VARIATION_DETECTED',
            actorId: 'SYSTEM',
            metadata: { 
              fuelType: item.type, 
              oldPrice: current.current_price, 
              newPrice: item.price, 
              variation 
            }
          });
        }
      }

      console.log('[Economist] Fuel price synchronization completed.');

    } catch (err) {
      console.error('[Economist] Failed to sync fuel prices:', err);
    }
  }

  /**
   * Helper to get current prices for the UI card
   */
  async getCurrentPrices() {
    const { data } = await this.supabase.from('system_fuel_prices').select('*');
    return data;
  }
}

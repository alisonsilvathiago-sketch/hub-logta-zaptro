import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

type FuelType = 'gasolina' | 'etanol' | 'diesel' | 'gnv';
type ProviderFuelRow = {
  type?: string;
  fuel_type?: string;
  product?: string;
  name?: string;
  price?: number | string;
  average_price?: number | string;
  preco?: number | string;
  valor?: number | string;
};

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

  private normalizeFuelType(raw?: string | null): FuelType | null {
    const value = (raw || '').toLowerCase().trim();
    if (!value) return null;

    if (value.includes('gasolina')) return 'gasolina';
    if (value.includes('etanol') || value.includes('alcool') || value.includes('álcool')) return 'etanol';
    if (value.includes('diesel')) return 'diesel';
    if (value.includes('gnv') || value.includes('gás') || value.includes('gas natural') || value.includes('gas veicular')) return 'gnv';

    return null;
  }

  private parsePrice(raw: unknown): number | null {
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string') {
      const normalized = raw.replace(',', '.').replace(/[^\d.]/g, '');
      const asNumber = Number(normalized);
      if (Number.isFinite(asNumber)) return asNumber;
    }
    return null;
  }

  private normalizeProviderRows(payload: unknown): ProviderFuelRow[] {
    if (Array.isArray(payload)) return payload as ProviderFuelRow[];
    if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as ProviderFuelRow[];
      if (Array.isArray(obj.results)) return obj.results as ProviderFuelRow[];
      if (Array.isArray(obj.items)) return obj.items as ProviderFuelRow[];
    }
    return [];
  }

  private aggregateByFuelType(rows: ProviderFuelRow[]): Array<{ type: FuelType; price: number }> {
    const buckets: Record<FuelType, number[]> = {
      gasolina: [],
      etanol: [],
      diesel: [],
      gnv: [],
    };

    for (const row of rows) {
      const type = this.normalizeFuelType(row.type || row.fuel_type || row.product || row.name);
      if (!type) continue;
      const price = this.parsePrice(row.price ?? row.average_price ?? row.preco ?? row.valor);
      if (price == null) continue;
      buckets[type].push(price);
    }

    return (Object.keys(buckets) as FuelType[])
      .filter((k) => buckets[k].length > 0)
      .map((k) => ({
        type: k,
        price: Number((buckets[k].reduce((acc, v) => acc + v, 0) / buckets[k].length).toFixed(3))
      }));
  }

  private async fetchExternalFuelAverages(): Promise<Array<{ type: FuelType; price: number }>> {
    const providerUrl = process.env.FUEL_MARKET_API_URL || '';
    const providerToken = process.env.FUEL_MARKET_API_TOKEN || '';

    if (!providerUrl) {
      console.warn('[Economist] FUEL_MARKET_API_URL not configured. Skipping external sync.');
      return [];
    }

    const res = await fetch(providerUrl, {
      headers: providerToken ? { Authorization: `Bearer ${providerToken}` } : undefined,
    });

    if (!res.ok) {
      throw new Error(`Provider request failed with status ${res.status}`);
    }

    const payload = await res.json();
    const normalizedRows = this.normalizeProviderRows(payload);
    return this.aggregateByFuelType(normalizedRows);
  }

  /**
   * Daily task to fetch and sync fuel prices.
   * Uses configured external source and updates local market table.
   */
  async syncFuelPrices() {
    console.log('[Economist] Syncing fuel prices for Brazil market...');

    try {
      const newPrices = await this.fetchExternalFuelAverages();
      if (newPrices.length === 0) {
        console.warn('[Economist] No fresh fuel rows received from provider; local prices unchanged.');
        return;
      }

      for (const item of newPrices) {
        const { data: current } = await this.supabase
          .from('fuel_prices')
          .select('*')
          .eq('type', item.type)
          .single();

        const previousPrice = Number(current?.price || 0);
        const variation = previousPrice > 0 ? ((item.price - previousPrice) / previousPrice) * 100 : 0;

        await this.supabase.from('fuel_prices').upsert({
          type: item.type,
          price: item.price,
          variation_percentage: variation,
          last_updated: new Date()
        }, { onConflict: 'type' });

        await this.supabase.from('fuel_history').insert([{
          type: item.type,
          price: item.price
        }]);

        if (Math.abs(variation) >= 3.0) {
          console.log(`[Economist] Significant variation detected for ${item.type}: ${variation.toFixed(2)}%`);

          await this.supabase.from('delivery_exceptions').insert([{
            type: 'FUEL_VARIATION',
            target_id: item.type,
            description: `Variação de preço detectada: ${variation.toFixed(1)}% (De ${previousPrice} para ${item.price})`,
            priority: 'Média'
          }]);

          this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
            action: 'FUEL_PRICE_VARIATION_DETECTED',
            actorId: 'SYSTEM',
            metadata: {
              fuelType: item.type,
              oldPrice: previousPrice,
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
    const { data } = await this.supabase.from('fuel_prices').select('*').order('type');
    return data;
  }
}
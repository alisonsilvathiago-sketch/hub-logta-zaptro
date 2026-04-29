import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * OperationalBrainService: The "Commander" of the Hub.
 * It manages high-level metrics: Operational Score (Health), Predictive Risks, and ROI Savings.
 */
export class OperationalBrainService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      // 1. Prediction Trigger
      if (data.action === 'LOGISTICS_DELAY_DETECTED' || data.action === 'PACKAGE_LOSS_RISK_DETECTED') {
        await this.generateRiskPrediction(data.action, data.actorId, data.metadata);
      }
      // 2. ROI Trigger
      if (data.action === 'DELIVERY_COMPLETED' || data.action === 'PAYMENT_RECEIVED') {
        await this.calculateSavings(data.actorId, data.action, data.metadata);
      }
    });

    // 3. Periodic Health Check (Every 4h)
    setInterval(() => this.updateGlobalOperationsScore(), 4 * 60 * 60 * 1000);
  }

  /**
   * Predictive Risk: Forecasts failures before they happen.
   */
  async generateRiskPrediction(type: string, targetId: string, metadata: any) {
    const probability = metadata.risk || 80.0;
    
    await this.supabase.from('system_risk_predictions').insert([{
      target_id: targetId,
      prediction_type: type,
      risk_probability: probability,
      rationale: `Pattern detected in ${type}. Historical data suggests ${probability}% failure chance.`,
      suggested_action: 'RE-ROUTE_OR_NOTIFY'
    }]);

    console.log(`[OpBrain] PREDICTION: ${type} at ${probability}% risk for ${targetId}`);
  }

  /**
   * ROI & Savings: Proves the value of the platform.
   */
  async calculateSavings(companyId: string, actionType: string, metadata: any) {
    let savings = 0;
    let type = '';

    if (actionType === 'DELIVERY_COMPLETED' && metadata.wasOptimized) {
      savings = 45.0; // Estimated saving per optimized delivery
      type = 'ROUTE_OPTIMIZATION';
    } else if (actionType === 'PAYMENT_RECEIVED' && metadata.wasRecovered) {
      savings = 120.0; // Estimated saving for automated recovery
      type = 'BILLING_RECOVERY';
    }

    if (savings > 0) {
      await this.supabase.from('system_roi_savings').insert([{
        company_id: companyId,
        problem_prevented: type,
        estimated_saving_amount: savings
      }]);
      console.log(`[OpBrain] ROI SAVED: R$ ${savings} for ${companyId} via ${type}`);
    }
  }

  /**
   * Operational Score: The "Thermometer" of the entire operation.
   */
  async updateGlobalOperationsScore() {
    console.log('[OpBrain] Calculating global operational health scores...');
    
    // In a real scenario, we'd aggregate data from all tables
    // For now, we perform a representative update
    const { data: companies } = await this.supabase.from('companies').select('id');
    
    for (const company of companies || []) {
      const score = 85.0 + (Math.random() * 15 - 10); // Simulated dynamic score
      
      await this.supabase.from('system_operation_score').insert([{
        company_id: company.id,
        overall_score: Math.min(100, Math.max(0, score)),
        success_rate: 94.0
      }]);
    }
  }
}

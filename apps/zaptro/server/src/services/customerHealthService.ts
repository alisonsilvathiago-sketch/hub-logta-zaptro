import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * CustomerHealthService: The "Immune System" of the Hub.
 * It monitors engagement, identifies churn risks, and triggers re-engagement flows.
 */
export class CustomerHealthService {
  private hub: EventHub;
  private supabase: SupabaseClient;
  private readonly CRITICAL_HEALTH_THRESHOLD = 40.0;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupObservation();
  }

  private setupObservation() {
    // Watch for activity to refresh "last_active_at"
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      const companyId = data.actorId;
      if (companyId && companyId !== 'system_global') {
        await this.recordActivity(companyId);
      }
    });

    // Watch for critical errors or billing failures (negative health events)
    this.hub.on(SystemEvent.ERROR_CRITICAL, async (data) => {
      if (data.companyId) {
        await this.recordHealthEvent(data.companyId, 'SYSTEM_ERROR', -5.0);
      }
    });
  }

  /**
   * Refreshes the last active timestamp and increases engagement score
   */
  private async recordActivity(companyId: string) {
    try {
      await this.supabase
        .from('companies')
        .update({ last_active_at: new Date() })
        .eq('id', companyId);
      
      // Periodically boost health for active users
      await this.recordHealthEvent(companyId, 'ENGAGEMENT_BOOST', 0.5);
    } catch (err) {
      console.error('[HealthService] Activity update failed:', err);
    }
  }

  /**
   * Records a health event and recalculates the total score
   */
  async recordHealthEvent(companyId: string, type: string, impact: number) {
    try {
      // 1. Log the event
      await this.supabase
        .from('system_health_events')
        .insert([{ company_id: companyId, event_type: type, impact_score: impact }]);

      // 2. Update the company's health score
      const { data: company } = await this.supabase
        .from('companies')
        .select('health_score')
        .eq('id', companyId)
        .single();

      if (company) {
        const newScore = Math.min(100, Math.max(0, company.health_score + impact));
        const riskLevel = this.calculateRiskLevel(newScore);

        await this.supabase
          .from('companies')
          .update({ 
            health_score: newScore, 
            churn_risk_level: riskLevel 
          })
          .eq('id', companyId);

        // 3. Emit alert if health is critical
        if (newScore < this.CRITICAL_HEALTH_THRESHOLD && company.health_score >= this.CRITICAL_HEALTH_THRESHOLD) {
          this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
            action: 'CHURN_RISK_DETECTED',
            actorId: companyId,
            metadata: { current_score: newScore, previous_score: company.health_score }
          });
        }
      }
    } catch (err) {
      console.error('[HealthService] Health event recording failed:', err);
    }
  }

  private calculateRiskLevel(score: number): string {
    if (score > 80) return 'LOW';
    if (score > 60) return 'MEDIUM';
    if (score > 30) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Daily Health Analysis (triggered by MaintenanceService)
   */
  async runDailyHealthCheck() {
    console.log('[HealthMachine] Starting daily customer health analysis...');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      // Find companies with no activity for 7 days
      const { data: inactive } = await this.supabase
        .from('companies')
        .select('id, name, health_score')
        .lt('last_active_at', sevenDaysAgo.toISOString())
        .eq('churn_risk_level', 'LOW');

      if (inactive) {
        for (const company of inactive) {
          console.log(`[HealthMachine] Detected inactivity drop for ${company.name}`);
          await this.recordHealthEvent(company.id, 'INACTIVITY_DROP', -15.0);
        }
      }
    } catch (err) {
      console.error('[HealthMachine] Daily check failed:', err);
    }
  }
}

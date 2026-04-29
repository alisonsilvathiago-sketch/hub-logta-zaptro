import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * TalentScoutService: The Fleet Compliance & Ranking Brain.
 * Manages outsourced driver validation, performance scoring, and trust tiers.
 */
export class TalentScoutService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for new driver registrations to trigger automated document audit
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      if (data.action === 'DRIVER_REGISTERED') {
        await this.runComplianceCheck(data.actorId, data.metadata);
      }

      if (data.action === 'DELIVERY_COMPLETED') {
        await this.updateDriverPerformance(data.actorId, data.metadata);
      }

      if (data.action === 'DELIVERY_PROBLEM_REPORTED') {
        await this.penalizeDriverScore(data.actorId, data.metadata);
      }
    });
  }

  /**
   * Automated Compliance Check
   * Validates documents (CNH, CRLV, etc) and assigns initial trust tier.
   */
  async runComplianceCheck(driverId: string, metadata: any) {
    console.log(`[TalentScout] Starting compliance audit for Driver: ${driverId}`);
    
    // Logic to simulate document validation
    const hasValidDocs = metadata.documentsLoaded === true;
    const initialScore = hasValidDocs ? 85.0 : 0.0;
    const tier = hasValidDocs ? 'CERTIFIED' : 'PENDING_DOCUMENTATION';

    await this.supabase.from('driver_compliance').upsert([{
      driver_id: driverId,
      status: tier,
      trust_score: initialScore,
      last_audit_at: new Date().toISOString(),
      metadata: { ...metadata, autoAudited: true }
    }]);

    if (!hasValidDocs) {
      this.hub.emit(SystemEvent.DECISION_MADE, {
        logic: 'OperationalShield',
        outcome: {
          action: 'BLOCK_DRIVER_ACCESS',
          targetId: driverId,
          reason: 'INCOMPLETE_DOCUMENTATION',
          priority: 'HIGH'
        },
        companyId: metadata.companyId || 'SYSTEM',
        confidence: 1.0
      });
    }
  }

  /**
   * Performance Scoring
   * Increases driver score based on successful deliveries and timing.
   */
  async updateDriverPerformance(driverId: string, metadata: any) {
    const { data: compliance } = await this.supabase
      .from('driver_compliance')
      .select('trust_score')
      .eq('driver_id', driverId)
      .maybeSingle();

    if (compliance) {
      const bonus = metadata.onTime ? 1.5 : 0.5;
      const newScore = Math.min(100, compliance.trust_score + bonus);

      await this.supabase.from('driver_compliance').update({
        trust_score: newScore,
        last_activity_at: new Date().toISOString()
      }).eq('driver_id', driverId);

      console.log(`[TalentScout] Driver ${driverId} performance updated: ${newScore}`);
    }
  }

  /**
   * Penalization Logic
   * Heavily reduces score for critical failures (no-shows, theft risk, etc).
   */
  async penalizeDriverScore(driverId: string, metadata: any) {
    const penalty = metadata.severity === 'CRITICAL' ? 15.0 : 5.0;
    
    const { data: compliance } = await this.supabase
      .from('driver_compliance')
      .select('trust_score')
      .eq('driver_id', driverId)
      .maybeSingle();

    if (compliance) {
      const newScore = Math.max(0, compliance.trust_score - penalty);
      const isBlacklisted = newScore < 30;

      await this.supabase.from('driver_compliance').update({
        trust_score: newScore,
        status: isBlacklisted ? 'BLACKLISTED' : 'UNDER_REVIEW'
      }).eq('driver_id', driverId);

      if (isBlacklisted) {
        this.hub.emit(SystemEvent.DECISION_MADE, {
          logic: 'OperationalShield',
          outcome: {
            action: 'REVOKE_DRIVER_ASSIGNMENTS',
            targetId: driverId,
            reason: 'SCORE_BELOW_THRESHOLD',
            priority: 'CRITICAL'
          },
          companyId: metadata.companyId || 'SYSTEM',
          confidence: 1.0
        });
      }
    }
  }
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * AggregateManagementService: The "Talent Scout" of the Hub.
 * It autonomously manages outsourced drivers (agregados), validating documents,
 * assigning deliveries based on score, and tracking performance with LOGTA memory.
 */
export class AggregateManagementService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      // 1. Delivery Assignment Logic
      if (data.action === 'NEW_DELIVERY_AVAILABLE') {
        await this.assignToBestAggregate(data.metadata.deliveryId, data.actorId);
      }
      // 2. Performance & Payment Logic
      if (data.action === 'DELIVERY_COMPLETED' && data.metadata.aggregateId) {
        await this.finalizeAggregateDelivery(data.metadata.aggregateId, data.metadata.assignmentId, data.metadata);
      }
      // 3. Document/Compliance Check
      if (data.action === 'MAINTENANCE_TICK') {
        await this.auditAggregateCompliance();
      }
    });
  }

  /**
   * Selection: Finds the best aggregate based on score and availability.
   */
  async assignToBestAggregate(deliveryId: string, companyId: string) {
    try {
      console.log(`[TalentScout] Finding best aggregate for delivery ${deliveryId}...`);
      
      const { data: aggregate } = await this.supabase
        .from('logistics_aggregates')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'ACTIVE')
        .order('overall_score', { ascending: false })
        .limit(1)
        .single();

      if (!aggregate) {
        console.log('[TalentScout] No active aggregates found. Waiting...');
        return;
      }

      // Create Assignment
      const { data: assignment } = await this.supabase.from('logistics_aggregate_assignments').insert([{
        aggregate_id: aggregate.id,
        delivery_id: deliveryId,
        amount: 35.0, // Base delivery pay
        status: 'ASSIGNED'
      }]).select().single();

      await this.logAggregateEvent(aggregate.id, 'ASSIGNMENT', { deliveryId, assignmentId: assignment?.id });

      console.log(`[TalentScout] Assigned delivery ${deliveryId} to ${aggregate.name} (Score: ${aggregate.overall_score})`);

    } catch (err) {
      console.error('[TalentScout] Assignment failed:', err);
    }
  }

  /**
   * Performance: Updates score and earnings.
   */
  async finalizeAggregateDelivery(aggregateId: string, assignmentId: string, metadata: any) {
    const isSuccess = metadata.status === 'COMPLETED';
    const bonus = isSuccess ? 1.5 : -5.0;

    const { data: agg } = await this.supabase.from('logistics_aggregates').select('*').eq('id', aggregateId).single();
    if (!agg) return;

    const newScore = Math.min(100, Math.max(0, agg.overall_score + bonus));
    const newEarnings = agg.total_earnings + (isSuccess ? metadata.amount : 0);

    await this.supabase.from('logistics_aggregates').update({
      overall_score: newScore,
      total_earnings: newEarnings,
      total_deliveries: agg.total_deliveries + 1,
      status: newScore < 40 ? 'BLOCKED' : 'ACTIVE'
    }).eq('id', aggregateId);

    await this.supabase.from('logistics_aggregate_assignments').update({
      status: isSuccess ? 'COMPLETED' : 'FAILED',
      completed_at: new Date()
    }).eq('id', assignmentId);

    await this.logAggregateEvent(aggregateId, isSuccess ? 'COMPLETION' : 'DELAY', { 
      assignmentId, 
      newScore, 
      reason: metadata.reason 
    });

    if (newScore < 40) {
      await this.logAggregateEvent(aggregateId, 'BLOCK', { reason: 'Score too low' });
    }
  }

  /**
   * Compliance: Blocks aggregates with expired documents.
   */
  async auditAggregateCompliance() {
    console.log('[TalentScout] Auditing aggregate documents...');
    const today = new Date().toISOString().split('T')[0];

    const { data: expired } = await this.supabase
      .from('logistics_aggregate_documents')
      .select('aggregate_id, doc_type')
      .lt('expiry_date', today)
      .eq('status', 'VALID');

    for (const doc of expired || []) {
      await this.supabase.from('logistics_aggregate_documents')
        .update({ status: 'EXPIRED' })
        .eq('aggregate_id', doc.aggregate_id)
        .eq('doc_type', doc.doc_type);

      await this.supabase.from('logistics_aggregates')
        .update({ status: 'PENDING_DOCS' })
        .eq('id', doc.aggregate_id);

      await this.logAggregateEvent(doc.aggregate_id, 'DOC_EXPIRED', { type: doc.doc_type });
    }
  }

  /**
   * LOGTA Style Memory
   */
  private async logAggregateEvent(aggregateId: string, type: string, details: any) {
    await this.supabase.from('logistics_aggregate_logs').insert([{
      aggregate_id: aggregateId,
      event_type: type,
      details
    }]);
  }
}

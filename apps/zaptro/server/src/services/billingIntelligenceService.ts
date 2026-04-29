import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * BillingIntelligenceService: The "Accountant" of the Hub.
 * It manages autonomous charges, delinquency recovery, and renewals.
 */
export class BillingIntelligenceService {
  private hub: EventHub;
  private supabase: SupabaseClient;
  private asaasKey: string | null = null;
  private readonly ASAAS_URL = 'https://sandbox.asaas.com/api/v3';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.init();
  }

  private async init() {
    await this.loadAsaasKey();
    this.setupListeners();
  }

  private async loadAsaasKey() {
    const { data } = await this.supabase
      .from('master_settings')
      .select('value')
      .eq('key', 'ASAAS_API_KEY')
      .maybeSingle();
    
    if (data?.value) {
      this.asaasKey = data.value;
    }
  }

  private setupListeners() {
    // Watch for payment confirmation to trigger autonomous renewal
    this.hub.on(SystemEvent.PAYMENT_RECEIVED, async (data) => {
      await this.processAutonomousRenewal(data.companyId, data.paymentId);
    });

    // Layer 5: Learning from errors
    this.hub.on(SystemEvent.ERROR_CRITICAL, async (data) => {
      if (data.service === 'BILLING') {
        await this.handleBillingFailure(data);
      }
    });
  }

  /**
   * Daily Billing Check (The Motor)
   */
  async runDailyBillingCycle() {
    console.log('[BillingMachine] Starting daily autonomous billing cycle...');
    
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    try {
      // 1. Identify subscriptions due in 3 days (Pre-billing)
      const { data: upcoming } = await this.supabase
        .from('subscriptions')
        .select('*, companies(name, email, preferred_payment_method)')
        .eq('status', 'active')
        .lte('next_due_date', threeDaysFromNow.toISOString().split('T')[0])
        .gte('next_due_date', today.toISOString().split('T')[0]);

      if (upcoming) {
        for (const sub of upcoming) {
          await this.processAutonomousCharge(sub);
        }
      }

      // 2. Identify overdue subscriptions (Recovery)
      const { data: overdue } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'past_due');

      if (overdue) {
        for (const sub of overdue) {
          await this.triggerRecoveryFlow(sub);
        }
      }
    } catch (err) {
      console.error('[BillingMachine] Cycle failed:', err);
    }
  }

  private async processAutonomousCharge(subscription: any) {
    if (!this.asaasKey) return;

    console.log(`[BillingMachine] Generating autonomous charge for ${subscription.companies.name}...`);
    
    try {
      // Logic: Call Asaas API to generate Pix/Boleto
      const method = subscription.companies.preferred_payment_method || 'PIX';
      
      // Emit event for WorkflowService to send the "Coming Soon" message
      this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
        action: 'BILLING_DUE_SOON',
        actorId: subscription.company_id,
        metadata: { amount: subscription.value, method, dueDate: subscription.next_due_date }
      });

      // Simulation of API call to Asaas
      // const charge = await asaas.createPayment(...)
      
      await this.supabase
        .from('companies')
        .update({ last_billing_attempt_at: new Date() })
        .eq('id', subscription.company_id);

    } catch (err) {
      console.error('[BillingMachine] Charge generation failed:', err);
    }
  }

  private async triggerRecoveryFlow(subscription: any) {
    console.log(`[BillingMachine] Triggering recovery flow for ${subscription.company_id}...`);
    
    this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
      action: 'BILLING_OVERDUE',
      actorId: subscription.company_id,
      metadata: { days_overdue: 1 } // Calculate actual days
    });
  }

  private async processAutonomousRenewal(companyId: string, paymentId: string) {
    console.log(`[BillingMachine] Payment confirmed. Renewing subscription for ${companyId}...`);
    
    try {
      // 1. Update subscription status
      const { data: sub } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (sub) {
        const nextDate = new Date(sub.next_due_date);
        nextDate.setMonth(nextDate.getMonth() + 1);

        await this.supabase
          .from('subscriptions')
          .update({ 
            status: 'active', 
            next_due_date: nextDate.toISOString().split('T')[0],
            updated_at: new Date()
          })
          .eq('id', sub.id);

        // 2. Notify system of evolution
        this.hub.emit(SystemEvent.DECISION_MADE, {
          logic: 'AutonomousRenewal',
          outcome: { companyId, status: 'renewed' },
          confidence: 1.0
        });
      }
    } catch (err) {
      console.error('[BillingMachine] Renewal failed:', err);
    }
  }

  private async handleBillingFailure(data: any) {
    console.warn(`[BillingMachine] Learning from failure: ${data.message}`);
    // Adjust behavior score of the company
    await this.supabase
      .from('companies')
      .update({ billing_behavior_score: 0.5 })
      .eq('id', data.companyId);
  }
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * GrowthEngineService: The "Viral Motor" of the Hub.
 * It identifies promoters, generates referral links, and manages rewards to drive organic growth.
 */
export class GrowthEngineService {
  private hub: EventHub;
  private supabase: SupabaseClient;
  private readonly PROMOTER_HEALTH_THRESHOLD = 85.0;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for high-engagement behaviors to trigger referral invites
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      // If a payment is confirmed and health is high, it's the perfect time to ask for a referral
      if (data.action === 'PAYMENT_CONFIRMED') {
        await this.checkAndInvitePromoter(data.actorId);
      }
    });

    // Listen for new company signups to track conversions
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      if (data.action === 'NEW_SIGNUP' && data.metadata?.referral_slug) {
        await this.processReferralConversion(data.actorId, data.metadata.referral_slug);
      }
    });
  }

  /**
   * Checks if a company is a "Promoter" and sends a referral invite if so.
   */
  async checkAndInvitePromoter(companyId: string) {
    try {
      const { data: company } = await this.supabase
        .from('companies')
        .select('name, health_score, email')
        .eq('id', companyId)
        .single();

      if (company && company.health_score >= this.PROMOTER_HEALTH_THRESHOLD) {
        console.log(`[GrowthMachine] Company ${company.name} identified as Promoter (Health: ${company.health_score})`);
        
        // 1. Generate or get referral link
        const link = await this.getOrCreateReferralLink(companyId, company.name);
        
        // 2. Emit event to send the Referral Invite via Workflow/Decision engine
        this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
          action: 'REFERRAL_INVITE_TRIGGERED',
          actorId: companyId,
          metadata: { 
            referral_link: link,
            email: company.email,
            companyName: company.name
          }
        });
      }
    } catch (err) {
      console.error('[GrowthMachine] Promoter check failed:', err);
    }
  }

  private async getOrCreateReferralLink(companyId: string, name: string): Promise<string> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(7);
    
    const { data: existing } = await this.supabase
      .from('referral_links')
      .select('slug')
      .eq('company_id', companyId)
      .maybeSingle();

    if (existing) return `https://hub.zaptro.com.br/ref/${existing.slug}`;

    await this.supabase
      .from('referral_links')
      .insert([{ company_id: companyId, slug }]);

    return `https://hub.zaptro.com.br/ref/${slug}`;
  }

  /**
   * Processes a successful referral conversion and grants rewards.
   */
  private async processReferralConversion(referredId: string, slug: string) {
    try {
      const { data: link } = await this.supabase
        .from('referral_links')
        .select('id, company_id')
        .eq('slug', slug)
        .single();

      if (link) {
        // 1. Record the referral
        await this.supabase.from('referrals').insert([{
          referrer_company_id: link.company_id,
          referred_company_id: referredId,
          referral_link_id: link.id,
          status: 'CONVERTED'
        }]);

        // 2. Grant Reward to Referrer
        await this.supabase.from('rewards').insert([{
          company_id: link.company_id,
          reward_type: 'CREDIT',
          value: 50.0 // $50 credit for successful referral
        }]);

        // 3. Update stats
        await this.supabase.rpc('increment_referral_stats', { link_id: link.id });

        console.log(`[GrowthMachine] Referral successful! Reward granted to ${link.company_id}`);
      }
    } catch (err) {
      console.error('[GrowthMachine] Referral processing failed:', err);
    }
  }
}

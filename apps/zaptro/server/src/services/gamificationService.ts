import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * GamificationService: The "Game Master" of the Hub.
 * It tracks behaviors, awards points, manages levels, and triggers positive reinforcement.
 */
export class GamificationService {
  private hub: EventHub;
  private supabase: SupabaseClient;

  private readonly LEVEL_CONFIG = [
    { level: 1, name: 'INICIANTE', threshold: 0 },
    { level: 2, name: 'EXPLORADOR', threshold: 1000 },
    { level: 3, name: 'MESTRE', threshold: 5000 },
    { level: 4, name: 'LENDÁRIO', threshold: 15000 },
  ];

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.hub = EventHub.getInstance();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for positive behaviors
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      switch (data.action) {
        case 'PAYMENT_RECEIVED':
          await this.awardPoints(data.actorId, 500, 'PAYMENT_ON_TIME', data.metadata);
          break;
        case 'LEAD_CONVERTED':
          await this.awardPoints(data.actorId, 300, 'GROWTH_MILESTONE', data.metadata);
          break;
        case 'RECURRING_USAGE':
          await this.awardPoints(data.actorId, 50, 'HIGH_ENGAGEMENT', data.metadata);
          break;
      }
    });
  }

  /**
   * Awards points to a company and checks for level-up.
   */
  async awardPoints(companyId: string, points: number, action: string, metadata: any = {}) {
    try {
      // 1. Ensure gamification record exists
      const { data: current } = await this.supabase
        .from('system_gamification')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      const state = current || { points: 0, current_level: 1, badges: [] };
      const newPoints = (state.points || 0) + points;
      
      // 2. Check for Level Up
      let newLevel = state.current_level;
      for (const cfg of this.LEVEL_CONFIG) {
        if (newPoints >= cfg.threshold) {
          newLevel = cfg.level;
        }
      }

      const leveledUp = newLevel > state.current_level;

      // 3. Update State
      await this.supabase
        .from('system_gamification')
        .upsert({
          company_id: companyId,
          points: newPoints,
          current_level: newLevel,
          last_action_at: new Date(),
          updated_at: new Date()
        }, { onConflict: 'company_id' });

      // 4. Log Action
      await this.supabase.from('system_gamification_logs').insert([{
        company_id: companyId,
        action_type: action,
        points_given: points,
        metadata
      }]);

      console.log(`[GameMaster] Points awarded to ${companyId}: +${points} (${action}). Total: ${newPoints}`);

      if (leveledUp) {
        const levelName = this.LEVEL_CONFIG.find(l => l.level === newLevel)?.name || 'NONE';
        console.log(`[GameMaster] LEVEL UP! ${companyId} reached level ${newLevel} (${levelName})`);
        
        // Notify the hub for rewards/congratulations
        this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
          action: 'LEVEL_UP',
          actorId: companyId,
          metadata: { newLevel, levelName, totalPoints: newPoints }
        });
      }

    } catch (err) {
      console.error('[GameMaster] Failed to award points:', err);
    }
  }
}

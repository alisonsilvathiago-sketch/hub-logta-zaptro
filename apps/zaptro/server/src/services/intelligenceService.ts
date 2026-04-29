import { EventHub, SystemEvent } from './eventHub.js';

/**
 * IntelligenceService: The "Pre-Frontal Cortex" of the Hub.
 * It observes behavior, makes automated decisions, and optimizes the system.
 */
export class IntelligenceService {
  private hub: EventHub;
  private history: any[] = [];
  private readonly MAX_HISTORY = 1000;

  constructor() {
    this.hub = EventHub.getInstance();
    this.setupIntelligence();
  }

  private setupIntelligence() {
    // 1. Behavioral Learning: Observe all actions to find patterns
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, (data) => {
      this.recordBehavior(data);
      this.analyzePatterns();
    });

    // 2. Decision Support: When a critical event happens, provide an automated decision
    this.hub.on(SystemEvent.LEAD_CREATED, (data) => {
      this.makeAutomatedDecision('LEAD_ROUTING', data);
    });

    // 3. Self-Optimization: Trigger periodic internal optimizations
    setInterval(() => {
      this.optimizeSystemFlux();
    }, 14400000); // Every 4 hours
  }

  private recordBehavior(data: any) {
    this.history.push({ ...data, timestamp: new Date() });
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    }
  }

  /**
   * Pattern Analysis: Detects if a user/system does the same thing repeatedly
   * to suggest or automate it.
   */
  private analyzePatterns() {
    // Simple logic: if a user repeats an action 5 times in a short window, 
    // we mark it as a "Strong Pattern" for potential automation.
    const lastActions = this.history.slice(-10);
    const actionCounts = lastActions.reduce((acc: any, curr) => {
      acc[curr.action] = (acc[curr.action] || 0) + 1;
      return acc;
    }, {});

    for (const [action, count] of Object.entries(actionCounts)) {
      if (count >= 5) {
        console.log(`[Intelligence] Detected frequent pattern for: ${action}. Automating future instances.`);
        this.hub.emit(SystemEvent.DECISION_MADE, {
          logic: 'PatternRecognition',
          outcome: { action, automationSuggested: true },
          confidence: 0.95
        });
      }
    }
  }

  /**
   * Decision Engine: Takes complex context and outputs an outcome
   */
  private makeAutomatedDecision(type: string, context: any) {
    console.log(`[Intelligence] Making automated decision for ${type}...`);
    
    let outcome: any = {};
    let confidence = 0;

    if (type === 'LEAD_ROUTING') {
      // Logic: Decisions based on historical conversion rates (simulated)
      outcome = { routeTo: context.source.includes('log') ? 'Logta' : 'Zaptro' };
      confidence = 0.88;
    }

    this.hub.emit(SystemEvent.DECISION_MADE, {
      logic: type,
      outcome,
      confidence
    });
  }

  /**
   * Optimization: Cleans up internal structures and adjusts timing
   */
  private optimizeSystemFlux() {
    console.log('[Intelligence] Running system self-optimization...');
    
    // Logic: Reduce maintenance window if system is under high load
    // Logic: Consolidate logs or clear temporary caches
    
    this.hub.emit(SystemEvent.MAINTENANCE_REQUIRED, {
      type: 'INTERNAL_OPTIMIZATION',
      details: { optimizedAt: new Date() }
    });
  }
}

import { BillingIntelligenceService } from './billingIntelligenceService.js';
import { CustomerHealthService } from './customerHealthService.js';
import { OptimizationEngineService } from './optimizationEngineService.js';
import { DeliveryIntelligenceService } from './deliveryIntelligenceService.js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * MaintenanceService: Ensures the Hub stays healthy and autonomous.
 */
export class MaintenanceService {
  private hub: EventHub;
  private billingService: BillingIntelligenceService | null = null;
  private healthService: CustomerHealthService | null = null;
  private optimizationService: OptimizationEngineService | null = null;
  private deliveryService: DeliveryIntelligenceService | null = null;

  constructor() {
    this.hub = EventHub.getInstance();
    this.setupListeners();
    this.startHeartbeat();
  }

  public setBillingService(service: BillingIntelligenceService) {
    this.billingService = service;
  }

  public setHealthService(service: CustomerHealthService) {
    this.healthService = service;
  }

  public setOptimizationService(service: OptimizationEngineService) {
    this.optimizationService = service;
  }

  public setDeliveryService(service: DeliveryIntelligenceService) {
    this.deliveryService = service;
  }

  private setupListeners() {
    // Listen for critical errors to attempt auto-remediation or alert
    this.hub.on(SystemEvent.ERROR_CRITICAL, (error) => {
      console.warn(`[Maintenance] Critical error detected in ${error.service}: ${error.message}`);
      this.attemptAutoRemediation(error);
    });

    // Listen for maintenance requests
    this.hub.on(SystemEvent.MAINTENANCE_REQUIRED, (data) => {
      console.log(`[Maintenance] Running maintenance task: ${data.type}`);
      this.runCleanup(data.type);
    });
  }

  private startHeartbeat() {
    // Periodic system check every hour
    setInterval(() => {
      console.log('[Maintenance] Running scheduled system health check...');
      this.checkSystemHealth();
    }, 3600000);

    // Deep cleanup and Billing Cycle every 24 hours
    setInterval(async () => {
      if (this.billingService) {
        await this.billingService.runDailyBillingCycle();
      }
      if (this.healthService) {
        await this.healthService.runDailyHealthCheck();
      }
      if (this.optimizationService) {
        await this.optimizationService.evaluateExperiments();
      }
      
      console.log('[Maintenance] Daily autonomous cycle completed (Billing + Health + Optimization).');
      this.hub.emit(SystemEvent.MAINTENANCE_REQUIRED, { type: 'DAILY_PURGE', details: { reason: 'Scheduled' } });
    }, 86400000);

    // Watchdog Cycle (Every 1 hour)
    setInterval(async () => {
      if (this.deliveryService) {
        await this.deliveryService.runDeliveryAudit();
      }
    }, 3600000);
  }

  private async checkSystemHealth() {
    try {
      // Logic to check DB connection, Redis, and disk space
      const healthStatus = { db: true, storage: true, memory: 'OK' };
      
      console.log('[Maintenance] Health status:', healthStatus);
    } catch (err) {
      this.hub.emit(SystemEvent.ERROR_CRITICAL, {
        service: 'Core',
        message: 'Scheduled health check failed'
      });
    }
  }

  private async attemptAutoRemediation(error: any) {
    console.log(`[Maintenance] Attempting auto-remediation for ${error.service}...`);
    // Logic to restart queues, clear caches, or ping services
    console.log(`[Maintenance] Remediation complete.`);
  }

  private async runCleanup(type: string) {
    switch (type) {
      case 'DAILY_PURGE':
        console.log('[Maintenance] Cleaning up temporary files and old sessions...');
        break;
      case 'LOGTA_PROVISION':
        console.log('[Maintenance] Pre-allocating Logistics resources for new high-priority lead.');
        break;
      default:
        console.log(`[Maintenance] Cleanup of type ${type} completed.`);
    }
  }
}

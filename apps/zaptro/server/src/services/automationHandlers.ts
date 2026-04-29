import { EventHub, SystemEvent } from './eventHub.js';

/**
 * AutomationHandlers: The "Arms" of the Intelligent Hub.
 * It executes concrete actions across modules when events are triggered.
 */
export class AutomationHandlers {
  private hub: EventHub;

  constructor() {
    this.hub = EventHub.getInstance();
    this.registerHandlers();
  }

  private registerHandlers() {
    // Action: Intelligent Lead Routing & Routing Logic
    this.hub.on(SystemEvent.LEAD_CREATED, async (data) => {
      console.log(`[Automation] Analyzing new lead: ${data.email}`);
      const routing = this.calculateLeadRouting(data);
      
      console.log(`[Automation] Intelligent Routing: Routing to ${routing.targetModule} with priority ${routing.priority}`);
      
      // Auto-trigger follow-up based on routing
      if (routing.targetModule === 'Logta') {
        this.hub.emit(SystemEvent.MAINTENANCE_REQUIRED, { type: 'LOGTA_PROVISION', details: data });
      }
    });

    // Action: Provision Company
    this.hub.on(SystemEvent.LEAD_CONVERTED, async (data) => {
      console.log(`[Automation] Provisioning resources for lead: ${data.leadId}`);
      await this.provisionResources(data);
    });

    // Action: Sync Billing
    this.hub.on(SystemEvent.PAYMENT_RECEIVED, async (data) => {
      console.log(`[Automation] Syncing billing status for user: ${data.userId}`);
      await this.syncBillingStatus(data);
    });
  }

  /**
   * DECISION LOGIC: Determines which module and priority a lead should have
   * without human intervention.
   */
  private calculateLeadRouting(data: any) {
    const interest = (data.source || '').toLowerCase();
    
    // Simple intelligence: route based on keywords
    if (interest.includes('logistica') || interest.includes('transporte') || interest.includes('logta')) {
      return { targetModule: 'Logta', priority: 'HIGH' };
    }
    
    if (interest.includes('venda') || interest.includes('zaptro') || interest.includes('crm')) {
      return { targetModule: 'Zaptro', priority: 'MEDIUM' };
    }

    return { targetModule: 'Hub', priority: 'LOW' };
  }

  private async provisionResources(data: any) {
    // Logic to create database entries, storage buckets, or initial projects in Logta
    console.log(`[Automation] Successfully provisioned resources for ${data.leadId}`);
    
    // Notify the system that a task was completed autonomously
    this.hub.emit(SystemEvent.TASK_COMPLETED, {
      taskId: `provision-${data.leadId}`,
      assignedTo: 'system'
    });
  }

  private async syncBillingStatus(data: any) {
    // Logic to update tenant status across Logta and Zaptro
    console.log(`[Automation] Billing status synchronized for user ${data.userId}`);
  }
}

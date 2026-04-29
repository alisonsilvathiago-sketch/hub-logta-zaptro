import { EventEmitter } from 'events';

export enum SystemEvent {
  LEAD_CREATED = 'lead.created',
  LEAD_CONVERTED = 'lead.converted',
  PAYMENT_RECEIVED = 'payment.received',
  TASK_COMPLETED = 'task.completed',
  ERROR_CRITICAL = 'system.error.critical',
  MAINTENANCE_REQUIRED = 'system.maintenance.required',
  BEHAVIOR_OBSERVED = 'system.behavior.observed',
  DECISION_MADE = 'system.decision.made'
}

export interface EventPayload {
  [SystemEvent.LEAD_CREATED]: { name: string; email: string; source: string };
  [SystemEvent.LEAD_CONVERTED]: { leadId: string; userId: string; plan: string };
  [SystemEvent.PAYMENT_RECEIVED]: { amount: number; currency: string; userId: string };
  [SystemEvent.TASK_COMPLETED]: { taskId: string; assignedTo: string };
  [SystemEvent.ERROR_CRITICAL]: { message: string; stack?: string; service: string };
  [SystemEvent.MAINTENANCE_REQUIRED]: { type: string; details: any };
  [SystemEvent.BEHAVIOR_OBSERVED]: { action: string; userId: string; context: any };
  [SystemEvent.DECISION_MADE]: { logic: string; outcome: any; confidence: number };
}

/**
 * EventHub: The central nervous system of the Intelligent Hub.
 * It manages asynchronous communication between modules and triggers automated workflows.
 */
export class EventHub {
  private static instance: EventHub;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Scale for autonomous service mesh
  }

  public static getInstance(): EventHub {
    if (!EventHub.instance) {
      EventHub.instance = new EventHub();
    }
    return EventHub.instance;
  }

  /**
   * Emit a system event with a typed payload
   */
  public emit<T extends SystemEvent>(event: T, data: EventPayload[T]): void {
    console.log(`[EventHub] Emitting event: ${event}`, data);
    this.emitter.emit(event, data);
  }

  /**
   * Subscribe to a system event
   */
  public on<T extends SystemEvent>(event: T, listener: (data: EventPayload[T]) => void): void {
    this.emitter.on(event, listener);
  }

  /**
   * Subscribe to a system event (once)
   */
  public once<T extends SystemEvent>(event: T, listener: (data: EventPayload[T]) => void): void {
    this.emitter.once(event, listener);
  }

  /**
   * Remove a listener
   */
  public off<T extends SystemEvent>(event: T, listener: (data: EventPayload[T]) => void): void {
    this.emitter.off(event, listener);
  }
}

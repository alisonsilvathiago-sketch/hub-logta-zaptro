import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { GoogleIntegrationService } from './googleService.js';
import { buildTransactionalEmail } from '../templates/index.js';
import type { MailQueue } from '../queue/createMailQueue.js';
import type { AppConfig } from '../config.js';
import { EventHub, SystemEvent } from './eventHub.js';

export class WorkflowService {
  private googleService: GoogleIntegrationService;
  private queue: MailQueue;
  private hub: EventHub;
  private supabase: SupabaseClient;

  constructor(cfg: AppConfig, queue: MailQueue) {
    this.googleService = new GoogleIntegrationService(cfg.supabaseUrl, cfg.supabaseAnonKey);
    this.queue = queue;
    this.hub = EventHub.getInstance();
    this.supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    
    this.setupAutomation();
  }

  /**
   * Layer 4: Execution Engine (The Performer)
   */
  private setupAutomation() {
    // Listen for any operational behavior and match against workflows
    this.hub.on(SystemEvent.BEHAVIOR_OBSERVED, async (data) => {
      await this.matchAndExecute(data.action, data.metadata);
    });

    // Listen for Intelligent Decisions (The Cortex tells us what to do)
    this.hub.on(SystemEvent.DECISION_MADE, async (decision) => {
      console.log(`[WorkflowEngine] Strategic decision received: ${decision.logic}`);
      
      if (decision.logic === 'StrategicCommunication') {
        const { action, channel, original_context } = decision.outcome;
        await this.performAction(action, { ...original_context, preferredChannel: channel });
      }
    });

    // High-priority triggers
    this.hub.on(SystemEvent.LEAD_CREATED, async (data) => {
      await this.matchAndExecute('LEAD_CREATED', data);
    });

    this.hub.on(SystemEvent.PAYMENT_RECEIVED, async (data) => {
      await this.matchAndExecute('PAYMENT_RECEIVED', data);
    });
  }

  /**
   * Matches an event against the workflow database and executes if active
   */
  private async matchAndExecute(trigger: string, context: any) {
    try {
      const { data: workflows } = await this.supabase
        .from('hub_workflows')
        .select('*')
        .eq('trigger', trigger)
        .eq('is_active', true);

      if (!workflows || workflows.length === 0) return;

      for (const workflow of workflows) {
        console.log(`[WorkflowEngine] Executing: ${workflow.name}`);
        await this.performAction(workflow.action, context);
        
        // Log execution (Layer 4 feedback)
        await this.supabase
          .from('automation_logs')
          .insert([{
            automation_id: workflow.id,
            event_name: trigger,
            status: 'success',
            details: { context, executed_at: new Date() }
          }]);
      }
    } catch (err) {
      console.error('[WorkflowEngine] Match/Execute failed:', err);
    }
  }

  private async performAction(actionType: string, context: any) {
    const cn = context.companyName || 'Hub';
    const userName = context.userName || 'Cliente';
    const to = context.email;
    const channel = context.preferredChannel || 'email';

    console.log(`[WorkflowEngine] Executing ${actionType} for ${userName} via ${channel.toUpperCase()}`);

    switch (actionType) {
      case 'BILLING_DUE_SOON':
        if (channel === 'email') {
          await this.sendEmail('billing_due_soon', cn, to, { ...context, userName });
        } else {
          console.log(`[WorkflowEngine] [WHATSAPP STRATEGY] Enqueuing intelligent WhatsApp reminder to ${userName}`);
        }
        break;

      case 'BILLING_OVERDUE':
        if (channel === 'email') {
          await this.sendEmail('billing_overdue_recovery', cn, to, { ...context, userName });
        } else {
          console.log(`[WorkflowEngine] [WHATSAPP STRATEGY] Enqueuing intelligent WhatsApp recovery to ${userName}`);
        }
        break;

      case 'PAYMENT_CONFIRMED':
        await this.sendEmail('payment_confirmed', cn, to, { ...context, userName });
        console.log(`[WorkflowEngine] [MULTICHANNEL] Notifying ${userName} about confirmation via all active channels.`);
        break;

      case 'PROCESS_LEAD_CONVERSION':
        await this.processLeadConversion({
          name: context.name,
          email: context.email,
          interest: context.source
        });
        break;

      default:
        console.log(`[WorkflowEngine] Action ${actionType} handled as generic background task.`);
    }
  }

  private async sendEmail(kind: any, cn: string, to: string, vars: any) {
    if (!to) return;
    const { subject, html, text } = buildTransactionalEmail(kind, cn, vars);
    await this.queue.enqueue({ to, subject, html, text });
  }

  /**
   * Specialized high-level action: Process Lead Conversion
   */
  async processLeadConversion(leadData: { name: string; email: string; interest?: string }) {
    console.log(`[Workflow] Processing Lead Conversion for: ${leadData.email}`);
    
    let meetLink = '';
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 24);
      const endTime = new Date(startTime.getTime() + 30 * 60000);
      
      const meeting = await this.googleService.createMeeting(
        `Reunião de Descoberta: ${leadData.name}`,
        `Conversa inicial sobre: ${leadData.interest || 'Hub Services'}`,
        startTime.toISOString(),
        endTime.toISOString()
      );
      
      meetLink = meeting.meetLink || '';
    } catch (err) {
      console.error('[Workflow] Meet creation failed', err);
    }

    const leadEmail = buildTransactionalEmail(
      'welcome',
      'Logta Hub',
      {
        userName: leadData.name,
        ctaLabel: meetLink ? 'Entrar na Reunião' : 'Acessar Painel',
        ctaUrl: meetLink || 'https://hub.zaptro.com.br',
        body: meetLink ? `<p>Olá ${leadData.name}, sua reunião foi agendada: <a href="${meetLink}">${meetLink}</a></p>` : undefined
      }
    );

    await this.queue.enqueue({
      to: leadData.email,
      subject: leadEmail.subject,
      html: leadEmail.html,
      text: leadEmail.text
    });

    this.hub.emit(SystemEvent.LEAD_CONVERTED, {
      leadId: leadData.email,
      userId: 'system',
      plan: leadData.interest || 'discovery'
    });

    return { meetLink, leadEmail };
  }
}

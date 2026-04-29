import { GoogleIntegrationService } from './googleService.js';
import { buildTransactionalEmail, type TransactionalKind } from '../templates/index.js';
import type { MailQueue } from '../queue/createMailQueue.js';
import type { AppConfig } from '../config.js';

export class WorkflowService {
  private googleService: GoogleIntegrationService;
  private queue: MailQueue;

  constructor(cfg: AppConfig, queue: MailQueue) {
    this.googleService = new GoogleIntegrationService(cfg.supabaseUrl, cfg.supabaseAnonKey);
    this.queue = queue;
  }

  /**
   * Orchestrates the Lead Conversion Workflow:
   * 1. Create Google Meet link
   * 2. Send welcome email to lead
   * 3. Send notification to admin
   */
  async processLeadConversion(leadData: { name: string; email: string; interest?: string }) {
    console.log(`[Workflow] Processing Lead Conversion for: ${leadData.email}`);
    
    let meetLink = '';
    try {
      // 1. Create Google Meet link for a placeholder discovery call
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 24); // 24h from now
      const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 min duration
      
      const meeting = await this.googleService.createMeeting(
        `Reunião de Descoberta: ${leadData.name}`,
        `Conversa inicial sobre interesse em: ${leadData.interest || 'Serviços Logta/Zaptro'}`,
        startTime.toISOString(),
        endTime.toISOString()
      );
      
      meetLink = meeting.meetLink || '';
    } catch (err) {
      console.error('[Workflow] Google Meet creation failed, proceeding with email only', err);
    }

    // 2. Send Welcome Email to Lead
    const leadEmail = buildTransactionalEmail(
      'welcome',
      'Logta Hub',
      {
        userName: leadData.name,
        ctaLabel: meetLink ? 'Entrar na Reunião' : 'Acessar Painel',
        ctaUrl: meetLink || 'https://hub.zaptro.com.br',
        body: meetLink 
          ? `<p>Olá ${leadData.name}, recebemos seu interesse em <strong>${leadData.interest || 'nossos serviços'}</strong>.</p>
             <p>Já agendamos uma reunião de descoberta para amanhã. Você pode acessar o link abaixo:</p>
             <div style="padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <strong>Google Meet:</strong> <a href="${meetLink}">${meetLink}</a>
             </div>`
          : undefined
      }
    );

    await this.queue.enqueue({
      to: leadData.email,
      subject: leadEmail.subject,
      html: leadEmail.html,
      text: leadEmail.text
    });

    // 3. Send Alert to Master Admin
    const adminEmail = buildTransactionalEmail(
      'new_lead',
      'Logta Hub',
      {
        lead_name: leadData.name,
        interest: leadData.interest,
        ctaLabel: 'Ver Lead no CRM',
        ctaUrl: 'https://hub.zaptro.com.br/master/crm'
      }
    );

    // We'll send this to a hardcoded admin or fetch from DB
    // For now, let's assume the notification route provides the target_email
    return { meetLink, leadEmail, adminEmail };
  }
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * WhatsAppService: Handles communication via Evolution API or Twilio.
 * Integrated with the Autonomous Hub for instant driver notifications.
 */
export class WhatsAppService {
  private apiUrl: string | null;
  private apiKey: string | null;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || null;
    this.apiKey = apiKey || null;
  }

  /**
   * Sends a message to a specific number
   */
  async sendMessage(to: string, message: string) {
    console.log(`[WhatsApp] Sending to ${to}: ${message.substring(0, 50)}...`);

    if (!this.apiUrl || !this.apiKey) {
      console.log('[WhatsApp] (MOCK MODE) Message logged to console because API keys are missing.');
      return { status: 'mocked', messageId: `mock_${Date.now()}` };
    }

    try {
      const response = await fetch(`${this.apiUrl}/message/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify({
          number: to,
          text: message
        })
      });

      if (!response.ok) throw new Error('Evolution API failed');
      
      const result = await response.json();
      console.log('[WhatsApp] Real message sent successfully.');
      return result;
    } catch (error: any) {
      console.error('[WhatsApp] Error sending real message:', error.message);
      throw error;
    }
  }

  /**
   * Automated Delivery Confirmation Template
   */
  async sendDeliveryConfirmation(to: string, driverName: string, orderId: string) {
    const text = `Olá! Sou o assistente autônomo da Logta. 🤖\n\nSeu pedido #${orderId} está sendo entregue agora por ${driverName}.\n\nPor favor, confirme o recebimento assim que possível!`;
    return this.sendMessage(to, text);
  }

  /**
   * Security Alert Template
   */
  async sendSecurityAlert(to: string, vehiclePlate: string, location: string) {
    const text = `⚠️ *ALERTA DE SEGURANÇA LOGTA*\n\nO veículo ${vehiclePlate} detectou uma divergência de rota em: ${location}.\n\nProcedimento de segurança ativado. Por favor, responda a esta mensagem para validação de identidade.`;
    return this.sendMessage(to, text);
  }
}

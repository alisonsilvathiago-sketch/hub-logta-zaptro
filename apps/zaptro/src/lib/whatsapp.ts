import { supabase } from './supabase';

/**
 * Advanced WhatsApp Integration Service (Multi-Tenant)
 * This service handles the business logic for the Evolution API integration.
 */

export interface WhatsAppInstance {
  company_id: string;
  instance_id: string;
  phone?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
}

/** Normalizes Evolution / Evolution GO connect payloads (formato varia por versão). */
export function extractQrBase64(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const o = payload as Record<string, unknown>;

  const pick = (v: unknown): string | null => {
    if (typeof v !== 'string' || !v.trim()) return null;
    const s = v.trim();
    if (s.startsWith('data:image')) return s;
    if (s.length > 80) return s;
    return null;
  };

  const fromNested = (q: unknown): string | null => {
    if (!q || typeof q !== 'object') return null;
    const r = q as Record<string, unknown>;
    return pick(r.base64) ?? pick(r.code) ?? pick(r.qrcode);
  };

  const instance = o.instance;
  if (instance && typeof instance === 'object') {
    const fromInst = fromNested((instance as Record<string, unknown>).qrcode);
    if (fromInst) return fromInst;
  }

  const data = o.data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const fromData =
      pick(d.Qrcode) ?? pick(d.qrcode) ?? pick(d.QRCode) ?? fromNested(d.qrcode);
    if (fromData) return fromData;
  }

  return (
    fromNested(o.qrcode) ??
    fromNested(o.qrCode) ??
    pick(o.base64) ??
    pick(o.Qrcode) ??
    pick(o.QRCode)
  );
}

/** Use as `<img src={...}>` when Evolution returns raw base64. */
export function toQrDataUrl(base64OrDataUrl: string | null): string | null {
  if (!base64OrDataUrl) return null;
  if (base64OrDataUrl.startsWith('data:')) return base64OrDataUrl;
  return `data:image/png;base64,${base64OrDataUrl}`;
}

export const whatsapp = {
  /**
   * Creates a new instance for a specific company.
   */
  async createInstance(company_id: string) {
    try {
      // Generate a unique instance name for the company (Consistency with Zaptro purification)
      const instance_id = `instance_${company_id.slice(0, 8)}`;
      
      const { data, error } = await supabase.functions.invoke('evolution-gateway', {
        body: { 
          action: 'create-instance',
          company_id,
          instanceName: instance_id,
          syncHistory: false
        }
      });

      if (error) throw error;

      // Save to database
      await supabase.from('whatsapp_instances').upsert({
        company_id,
        instance_id,
        provider: 'evolution',
        status: 'disconnected'
      });

      return { instance_id, ...data };
    } catch (err: any) {
      console.error('Error in createInstance:', err.message);
      throw err;
    }
  },

  /**
   * Fetches the QR Code for a given instance.
   */
  async getQRCode(instance_id: string) {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-gateway', {
        body: {
          action: 'get-connect',
          instanceName: instance_id,
        },
      });

      if (error) throw error;
      return toQrDataUrl(extractQrBase64(data));
    } catch (err: any) {
      console.error('Error in getQRCode:', err.message);
      throw err;
    }
  },

  /**
   * Sends a text message to a number.
   * Logic for consuming credits can be added here or in the Edge Function.
   */
  async sendMessage(instance_id: string, number: string, message: string) {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-gateway', {
        body: { 
          action: 'send-message',
          instanceName: instance_id,
          number,
          text: message
        }
      });

      if (error) throw error;

      // Log the message in our DB
      // Note: This could also be done via Webhook from Evolution API for better sync
      
      return data;
    } catch (err: any) {
      console.error('Error in sendMessage:', err.message);
      throw err;
    }
  },

  /**
   * Utility to check current status.
   */
  async getStatus() {
    try {
      // Nota: o getStatus herda o nome da instância se soubermos o context, 
      // mas aqui mantemos o gateway correto para a Evolution.
      const { data, error } = await supabase.functions.invoke('evolution-gateway', {
        body: { action: 'status' }
      });

      if (error) throw error;
      return data?.connected ? 'connected' : 'disconnected';
    } catch (err: any) {
      console.error('Error in getStatus:', err.message);
      return 'error';
    }
  },

  /**
   * Process incoming Webhook data (frontend side reflection if needed).
   * Usually handled entirely by Supabase Edge Functions.
   */
  async receiveWebhook(data: any) {
    // This is primarily for local simulation or manual processing
    console.log('Frontend received mock webhook data:', data);
    return true;
  },

  /**
   * Checks if a phone number is registered on WhatsApp.
   */
  async checkWhatsAppNumber(instance_id: string, number: string) {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-gateway', {
        body: {
          action: 'check-number',
          instanceName: instance_id,
          number
        }
      });
      if (error) throw error;
      // Evolution API usually returns { exists: true, jid: '...' }
      return {
        exists: !!(data?.exists || data?.exists === true),
        jid: data?.jid || null
      };
    } catch (err: any) {
      console.error('Error in checkWhatsAppNumber:', err.message);
      return { exists: false, error: err.message };
    }
  }
};

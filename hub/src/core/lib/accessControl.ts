
import { supabase } from './supabase';

/**
 * Hub Access Control Utility
 * Validates if a company has active plan and sufficient credits.
 */

export interface AccessStatus {
  allowed: boolean;
  reason?: string;
  details?: any;
}

export const validateAccess = async (companyId: string): Promise<AccessStatus> => {
  try {
    // 1. Verifica Status Global (Kill Switch)
    const { data: status } = await supabase
      .from('company_status')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (status && !status.is_active) {
      return { allowed: false, reason: status.blocked_reason || 'Sistema Bloqueado pela Administração' };
    }

    // 2. Verifica Assinatura
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (!sub || sub.status !== 'active') {
      return { allowed: false, reason: 'Plano Expirado ou Inativo' };
    }

    const gracePeriodDays = 3;
    const expiryDate = new Date(sub.expires_at);
    const graceDate = new Date(expiryDate);
    graceDate.setDate(graceDate.getDate() + gracePeriodDays);
    const today = new Date();

    if (today > graceDate) {
      // Auto-block se passou da carência
      await supabase.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id);
      return { allowed: false, reason: 'Assinatura Vencida (Período de Carência Encerrado)' };
    }

    if (today > expiryDate) {
      // Avisa mas permite acesso (Carência)
      return { allowed: true, reason: 'Carência: Pagamento Pendente', details: { is_grace_period: true } };
    }

    // 3. Verifica Créditos (Evolution / IA)
    const { data: credits } = await supabase
      .from('credits')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (!credits || credits.balance <= 0) {
      return { allowed: false, reason: 'Saldo de Créditos Insuficiente' };
    }

    return { allowed: true };
  } catch (err) {
    console.error('Access Control Error:', err);
    return { allowed: true }; // Fallback permissivo para evitar travamento total por erro de código
  }
};

export const consumeCredits = async (companyId: string, amount: number = 1) => {
  try {
    const { data: credits } = await supabase
      .from('credits')
      .select('balance')
      .eq('company_id', companyId)
      .single();

    if (credits && credits.balance >= amount) {
      await supabase.from('credits')
        .update({ balance: credits.balance - amount, updated_at: new Date().toISOString() })
        .eq('company_id', companyId);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

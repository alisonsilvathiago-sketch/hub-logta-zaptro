
import { supabase } from './supabase';

export interface AccessStatus {
  allowed: boolean;
  reason?: string;
}

export const validateTenantAccess = async (companyId: string): Promise<AccessStatus> => {
  try {
    // 1. Status Global
    const { data: status } = await supabase
      .from('company_status')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (status && !status.is_active) {
      return { allowed: false, reason: status.blocked_reason || 'Bloqueio Administrativo' };
    }

    // 2. Assinatura
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (!sub) {
      return { allowed: false, reason: 'Assinatura Expirada ou Inativa' };
    }

    // 3. Créditos
    const { data: credits } = await supabase
      .from('credits')
      .select('balance')
      .eq('company_id', companyId)
      .single();

    if (credits && credits.balance <= 0) {
      return { allowed: false, reason: 'Saldo de Créditos Esgotado' };
    }

    return { allowed: true };
  } catch (err) {
    return { allowed: true };
  }
};


import { supabase } from './supabase';
import { validateAccess } from './accessControl';

/**
 * Hub Automated Billing Service
 * Orchestrates invoices, Stripe/PIX flows, and automatic recovery.
 */

export const generateMonthlyInvoices = async () => {
  console.log('[Billing Service] Iniciando geração de faturas mensais...');
  
  try {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, companies(name, email)')
      .eq('status', 'active');

    if (!subs) return;

    for (const sub of subs) {
      const expiresAt = new Date(sub.expires_at);
      const today = new Date();
      
      // Se falta menos de 3 dias para expirar, gera fatura se não houver uma pendente
      const diffDays = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3) {
        const { data: existing } = await supabase
          .from('master_payments')
          .select('id')
          .eq('company_id', sub.company_id)
          .eq('status', 'PENDENTE')
          .limit(1);

        if (!existing || existing.length === 0) {
          console.log(`[Billing Service] Gerando fatura para ${sub.companies.name}`);
          
          // Simula integração com Stripe/Asaas
          const invoiceUrl = `https://checkout.logta.com/pay/${sub.id}`;
          
          await supabase.from('master_payments').insert({
            company_id: sub.company_id,
            client_name: sub.companies.name,
            amount: sub.plan === 'OURO' ? 499 : sub.plan === 'PRATA' ? 299 : 99,
            status: 'PENDENTE',
            method: 'PIX',
            due_date: sub.expires_at,
            invoice_url: invoiceUrl,
            metadata: { auto_generated: true, plan: sub.plan }
          });

          // Notificação de Cobrança (Simulada)
          await supabase.from('audit_logs').insert({
            action: 'INVOICE_GENERATED',
            details: `Fatura automática gerada para ${sub.companies.name}. Link enviado ao e-mail.`,
            module: 'BILLING',
            company_id: sub.company_id
          });
        }
      }
    }
  } catch (err) {
    console.error('Billing Service Error:', err);
  }
};

export const handlePaymentSuccess = async (paymentId: string) => {
  try {
    const { data: payment } = await supabase
      .from('master_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!payment || payment.status === 'PAGO') return;

    // 1. Atualiza Pagamento
    await supabase.from('master_payments')
      .update({ status: 'PAGO', paid_at: new Date().toISOString() })
      .eq('id', paymentId);

    // 2. Renova Assinatura (30 dias)
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);

    await supabase.from('subscriptions')
      .update({ 
        status: 'active', 
        expires_at: newExpiry.toISOString() 
      })
      .eq('company_id', payment.company_id);

    // 3. Desbloqueia Empresa Automaticamente (RECOVERY)
    await supabase.from('company_status')
      .update({ 
        is_active: true, 
        blocked_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', payment.company_id);

    // 4. Log de Sucesso
    await supabase.from('audit_logs').insert({
      action: 'PAYMENT_RECOVERY_SUCCESS',
      details: `Pagamento confirmado. Sistema desbloqueado automaticamente para ${payment.client_name}.`,
      module: 'BILLING',
      company_id: payment.company_id
    });

    console.log(`[Billing Service] Recuperação concluída para ${payment.client_name}`);
    return { success: true };
  } catch (err) {
    console.error('Payment Success Error:', err);
    return { success: false };
  }
};

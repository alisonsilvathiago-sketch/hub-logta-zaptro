import { supabase } from './supabase';
import { generateMonthlyInvoices } from './billingService';

/**
 * Hub Master Intelligence Service
 * Handles background monitoring for Credits, Storage, and AI Anomalies.
 */

export const runMasterAuditSync = async () => {
  try {
    console.log('[Master Intelligence] Iniciando auditoria global...');

    // 0. Automação de Faturamento
    await generateMonthlyInvoices();

    // 1. Auditoria de Créditos, Armazenamento e Faturamento
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, settings, plan');

    if (companies) {
      for (const company of companies) {
        const settings = company.settings || {};
        
        // Cálculo Real de Armazenamento no Banco
        const { data: fileStats } = await supabase
          .from('files')
          .select('size')
          .eq('company_id', company.id)
          .is('deleted_at', null);
        
        const totalBytes = (fileStats || []).reduce((acc, f) => acc + (f.size || 0), 0);
        const totalGB = totalBytes / (1024 * 1024 * 1024);
        
        // Limites por Plano (Exemplo)
        const limits: Record<string, number> = { 'OURO': 50, 'PRATA': 20, 'BRONZE': 5 };
        const planLimit = limits[company.plan as string] || 2;
        const usagePct = (totalGB / planLimit) * 100;

        // Atualiza Metadados de Uso
        await supabase.from('companies').update({ 
          settings: { ...settings, storage_usage_gb: totalGB, storage_usage_pct: usagePct } 
        }).eq('id', company.id);

        // Alerta de Faturamento (Excedeu Limite)
        if (totalGB > planLimit) {
          await supabase.from('audit_logs').insert({
            action: 'STORAGE_OVERLIMIT_BILLING',
            details: `A empresa ${company.name} excedeu o limite de ${planLimit}GB. Cobrança extra gerada.`,
            module: 'BILLING',
            company_id: company.id,
            metadata: { severity: 'high', usage_gb: totalGB, limit_gb: planLimit }
          });
        }

        // Alerta de Créditos Baixos
        if (settings.credits < 30) {
          await supabase.from('audit_logs').insert({
            action: 'LOW_CREDITS_CRITICAL',
            details: `CRÍTICO: ${company.name} atingiu o limite mínimo de créditos (${settings.credits}).`,
            module: 'BILLING',
            company_id: company.id,
            metadata: { severity: 'critical', current: settings.credits }
          });
        }

        // 1.2 Auditoria de Arquivamento (LogDock Compliance)
        const { data: driveDocs } = await supabase
          .from('files')
          .select('id')
          .eq('company_id', company.id)
          .eq('metadata->>entity_type', 'Contrato')
          .limit(1);

        if (!driveDocs || driveDocs.length === 0) {
          await supabase.from('audit_logs').insert({
            action: 'LOGDOCK_MISSING_CONTRACTS',
            details: `ALERTA LOGDOCK: ${company.name} não possui contratos arquivados.`,
            module: 'LOGDOCK',
            company_id: company.id,
            metadata: { severity: 'low', action_required: 'Upload de contratos base' }
          });
        }

        // 1.3 Arquivamento de Conversas (LogDock Integration)
        const { archiveDailyConversations } = await import('./chatArchiver');
        await archiveDailyConversations(company.id);
      }
    }

    // 2. Auditoria de Anomalias de Combustível (IA Strategist)
    const { data: fuelAnomalies } = await supabase
      .from('fuel_prices')
      .select('type, price, variation_percentage')
      .gt('variation_percentage', 5); // Detecta variações acima de 5%

    if (fuelAnomalies && fuelAnomalies.length > 0) {
      for (const fuel of fuelAnomalies) {
        // Verifica se já existe log recente para evitar spam
        const { data: existing } = await supabase
          .from('audit_logs')
          .select('id')
          .eq('action', 'FUEL_ANOMALY_DETECTED')
          .eq('details', `Alerta IA: Variação detectada no ${fuel.type} (${fuel.variation_percentage}%).`)
          .gt('created_at', new Date(Date.now() - 3600000).toISOString()); // Última hora

        if (!existing || existing.length === 0) {
          await supabase.from('audit_logs').insert({
            action: 'FUEL_ANOMALY_DETECTED',
            details: `Alerta IA: Variação detectada no ${fuel.type} (${fuel.variation_percentage}%).`,
            module: 'LOGISTICS',
            metadata: { severity: 'info', variation: fuel.variation_percentage }
          });
        }
      }
    }

    // 3. Monitor de Erro Zero (IA Decision Safeguard)
    const { data: failedAutomations } = await supabase
      .from('automation_logs')
      .select('event_name, details, created_at')
      .eq('status', 'failed')
      .gt('created_at', new Date(Date.now() - 3600000 * 24).toISOString()); // Last 24h

    if (failedAutomations && failedAutomations.length > 0) {
      for (const fail of failedAutomations) {
        await supabase.from('audit_logs').insert({
          action: 'AI_DECISION_FAILURE',
          details: `ERRO ZERO: Falha na automação IA (${fail.event_name}). Detalhes: ${JSON.stringify(fail.details)}`,
          module: 'INTELLIGENCE',
          metadata: { severity: 'high', event: fail.event_name }
        });
      }
    }

    // 4. Saúde das Interações (API Health Check)
    const { data: brokenIntegrations } = await supabase
      .from('integrations')
      .select('id, name, company_id')
      .eq('status', 'error');

    if (brokenIntegrations && brokenIntegrations.length > 0) {
      for (const integration of brokenIntegrations) {
        await supabase.from('audit_logs').insert({
          action: 'INTEGRATION_DOWN',
          details: `INTERAÇÃO CRÍTICA: API ${integration.name} está offline na unidade ${integration.company_id}.`,
          module: 'API',
          company_id: integration.company_id,
          metadata: { severity: 'critical', api: integration.name }
        });
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Master Intelligence Sync Error:', err);
    return { success: false, error: err };
  }
};

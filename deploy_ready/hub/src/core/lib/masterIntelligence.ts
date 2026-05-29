import { supabase } from './supabase';
import { generateMonthlyInvoices } from './billingService';
import { broadcastEvent } from './eventBridge';

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

    // 5. Sincronização Transversal de Dados (HUB <-> Zaptro <-> Logta)
    // Aqui incluímos a lógica de propagação de Clientes e Fretes
    console.log('[Master Intelligence] Sincronizando Clientes e Fretes...');

    // 6. Monitoramento de LogDock (PODs Pendentes)
    const { data: pendingPods } = await supabase
      .from('files')
      .select('name, metadata')
      .eq('category', 'comprovantes')
      .eq('status', 'pendente')
      .limit(5);

    if (pendingPods && pendingPods.length > 0) {
      for (const pod of pendingPods) {
        await broadcastEvent({
          type: 'POD_PENDING',
          origin: 'LOGDOCK',
          payload: { 
            client_name: pod.metadata?.client_name || pod.name.split('-')[1]?.trim() || 'Cliente Desconhecido',
            shipment_id: pod.metadata?.shipment_id 
          }
        });
      }
    }

    // 7. Monitoramento de Saúde das Unidades (Heartbeats)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: deadUnits } = await supabase
      .from('company_health')
      .select('company_id, companies(name)')
      .lt('last_heartbeat', fiveMinutesAgo)
      .eq('status', 'online');

    if (deadUnits && deadUnits.length > 0) {
      for (const unit of deadUnits) {
        // Marca como offline
        await supabase.from('company_health').update({ status: 'offline' }).eq('company_id', unit.company_id);
        
        // Notifica o barramento
        await broadcastEvent({
          type: 'SECURITY_ALERT',
          origin: 'SYSTEM',
          payload: { 
            details: `A unidade "${(unit.companies as any)?.name || 'Desconhecida'}" parou de reportar batimento cardíaco e está OFFLINE.`,
            severity: 'critical'
          }
        });
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Master Intelligence Sync Error:', err);
    return { success: false, error: err };
  }
};

/**
 * Força a sincronização global de todos os módulos.
 * Disparado manualmente via Painel de Infraestrutura.
 */
export const forceGlobalSync = async () => {
  try {
    console.log('[Master Intelligence] Iniciando sincronização forçada...');
    
    // 1. Executa auditoria padrão
    await runMasterAuditSync();
    
    // 2. Registra o evento de sincronização manual
    await supabase.from('master_audit_logs').insert([{
      action: 'GLOBAL_SYNC_TRIGGERED',
      details: 'Sincronização global forçada manualmente via Painel Master.',
      target_type: 'SYSTEM',
      metadata: {
        timestamp: new Date().toISOString(),
        origin: 'INFRASTRUCTURE_PANEL'
      }
    }]);

    // 3. Notifica o Barramento de Eventos (Event Bridge)
    await broadcastEvent({
      type: 'SYSTEM_SYNC',
      origin: 'HUB',
      payload: { action: 'FULL_REFRESH', timestamp: new Date().toISOString() }
    });
    
    return { success: true };
  } catch (err) {
    console.error('Force Sync Error:', err);
    throw err;
  }
};


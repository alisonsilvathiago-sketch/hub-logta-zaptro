import { supabase } from './supabase';
import { supabaseZaptro } from './supabase-zaptro';

/**
 * Hub Connectivity Service
 * Valida a conexão entre o Hub Master e os sub-sistemas.
 */

export type ConnectivityStatus = {
  system: string;
  status: 'online' | 'offline' | 'degraded';
  latency: number;
  lastCheck: string;
  error?: string;
};

export const checkAllSystemsConnectivity = async (): Promise<ConnectivityStatus[]> => {
  const checks: Promise<ConnectivityStatus>[] = [
    checkMainDatabase(),
    checkZaptroDatabase(),
    checkLogtaApi(),
    checkLogDockStorage(),
    checkAsaasGateway(),
  ];

  return Promise.all(checks);
};

const checkMainDatabase = async (): Promise<ConnectivityStatus> => {
  const start = Date.now();
  try {
    const { error } = await supabase.from('master_settings').select('key').limit(1);
    return {
      system: 'HUB Core (Database)',
      status: error ? 'offline' : 'online',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: error?.message
    };
  } catch (err: any) {
    return {
      system: 'HUB Core (Database)',
      status: 'offline',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: err.message
    };
  }
};

const checkZaptroDatabase = async (): Promise<ConnectivityStatus> => {
  const start = Date.now();
  try {
    const { error } = await supabaseZaptro.from('whatsapp_instances').select('id').limit(1);
    return {
      system: 'Zaptro Integration',
      status: error ? 'degraded' : 'online',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: error?.message
    };
  } catch (err: any) {
    return {
      system: 'Zaptro Integration',
      status: 'offline',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: err.message
    };
  }
};

const checkLogtaApi = async (): Promise<ConnectivityStatus> => {
  const start = Date.now();
  try {
    // Simulação de check de API Logta (poderia ser um health endpoint real)
    const { error } = await supabase.from('routes').select('id').limit(1);
    return {
      system: 'Logta Logistics API',
      status: error ? 'degraded' : 'online',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: error?.message
    };
  } catch (err: any) {
    return {
      system: 'Logta Logistics API',
      status: 'offline',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: err.message
    };
  }
};

const checkLogDockStorage = async (): Promise<ConnectivityStatus> => {
  const start = Date.now();
  try {
    const { error } = await supabase.from('files').select('id').limit(1);
    return {
      system: 'LogDock File Manager',
      status: error ? 'degraded' : 'online',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: error?.message
    };
  } catch (err: any) {
    return {
      system: 'LogDock File Manager',
      status: 'offline',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: err.message
    };
  }
};

const checkAsaasGateway = async (): Promise<ConnectivityStatus> => {
  const start = Date.now();
  try {
    // Check de health simples via webhook configuration
    const { data, error } = await supabase.from('master_settings').select('value').eq('key', 'ASAAS_API_KEY').maybeSingle();
    return {
      system: 'Gateway Financeiro (Asaas)',
      status: error || !data ? 'degraded' : 'online',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: error?.message || (!data ? 'Chave Asaas ausente' : undefined)
    };
  } catch (err: any) {
    return {
      system: 'Gateway Financeiro (Asaas)',
      status: 'offline',
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
      error: err.message
    };
  }
};

/**
 * Envia o heartbeat da unidade atual para o HUB Master.
 */
export const sendHeartbeat = async (companyId: string, version: string, metadata: any = {}) => {
  const start = Date.now();
  try {
    const latency = Date.now() - start; // Latência local mínima
    const { error } = await supabase.rpc('report_company_heartbeat', {
      p_company_id: companyId,
      p_latency: latency,
      p_version: version,
      p_metadata: metadata
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[Heartbeat] Falha ao reportar batimento:', err);
    return { success: false, error: err };
  }
};


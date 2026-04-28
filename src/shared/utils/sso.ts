import { supabase } from '../lib/supabase';

/**
 * Gera um token de impersonação (SSO) e retorna a URL de acesso
 * baseada no produto e empresa.
 */
export const generateImpersonationLink = async (companyId: string, companySlug: string, product: 'ZAPTRO' | 'LOGTA' = 'ZAPTRO') => {
  try {
    const { data, error } = await supabase.functions.invoke('hub-core/generate-sso', {
      body: { company_id: companyId },
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (error || !data.success) throw error || new Error(data.error);

    const token = data.token;
    
    // Base URL dependendo do ambiente
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let baseUrl = '';
    if (product === 'ZAPTRO') {
      baseUrl = isDev ? 'http://localhost:5174' : 'https://app.zaptro.com.br';
    } else {
      baseUrl = isDev ? 'http://localhost:5173' : 'https://app.logta.com.br';
    }

    return `${baseUrl}/auth/sso?token=${token}`;
  } catch (err) {
    console.error('Erro ao gerar SSO:', err);
    throw new Error('Falha ao gerar acesso administrativo.');
  }
};

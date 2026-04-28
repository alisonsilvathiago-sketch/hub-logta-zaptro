import { createClient } from '@supabase/supabase-js';

// Conexão com o Cérebro (Master Hub)
const hubUrl = import.meta.env.VITE_HUB_API_URL || 'https://rrjnkmgkhbtapumgmhhr.supabase.co';

// Fallback key para evitar crash de renderização se as envs sumirem
const DEFAULT_FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyam5rbWdraGJ0YXB1bWdtaGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTMyODQsImV4cCI6MjA5MjI4OTI4NH0.placeholder';

const hubKey = import.meta.env.VITE_HUB_API_TOKEN || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_FALLBACK_KEY;

/**
 * Este cliente comunica diretamente com a HUB MASTER (rrjnkmgkhbtapumgmhhr).
 * Usado para:
 * - Buscar planos globais
 * - Validar assinaturas via HubGuard
 * - Processar checkouts centralizados
 */
export const hubSupabase = createClient(hubUrl, hubKey, {
  global: {
    headers: {
      'x-origin': 'zaptro',
      'Authorization': `Bearer ${import.meta.env.VITE_HUB_API_TOKEN || hubKey}`
    }
  }
});

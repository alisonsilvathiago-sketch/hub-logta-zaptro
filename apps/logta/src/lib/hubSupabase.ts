import { createClient } from '@supabase/supabase-js';

// Conexão com o Cérebro (Master Hub)
const hubUrl = import.meta.env.VITE_HUB_API_URL || 'https://rrjnkmgkhbtapumgmhhr.supabase.co';

// Chave Real do Master Hub (Sincronizada)
const MASTER_HUB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyam5rbWdraGJ0YXB1bWdtaGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTI5NTcsImV4cCI6MjA5MjI4ODk1N30.nRyOwEH3Rz13hax8o5T3pQva3i_9px1EXY82F2lsuKQ';

const hubKey = import.meta.env.VITE_HUB_API_TOKEN || import.meta.env.VITE_SUPABASE_ANON_KEY || MASTER_HUB_ANON_KEY;

/**
 * Este cliente comunica diretamente com a HUB MASTER (rrjnkmgkhbtapumgmhhr).
 * O Master Hub comanda as regras de faturamento, planos e acessos.
 */
export const hubSupabase = createClient(hubUrl, hubKey, {
  global: {
    headers: {
      'x-origin': 'logta'
    }
  },
  auth: {
    persistSession: false
  }
});

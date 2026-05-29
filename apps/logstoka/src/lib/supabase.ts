import { supabase, hasRealConfig } from '@shared/lib/supabase';

export { supabase, hasRealConfig };

export function getLogstokaSupabase() {
  return supabase;
}

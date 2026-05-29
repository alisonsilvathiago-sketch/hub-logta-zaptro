import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { LogstokaConfig } from '../config.js';

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(cfg: LogstokaConfig): SupabaseClient | null {
  if (!cfg.supabaseUrl || !cfg.supabaseServiceRoleKey) return null;
  if (!adminClient) {
    adminClient = createClient(cfg.supabaseUrl, cfg.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export async function verifySupabaseJwt(
  cfg: LogstokaConfig,
  authorization?: string,
): Promise<{ userId: string; companyId?: string } | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7);
  const admin = getSupabaseAdmin(cfg);
  if (!admin) return null;

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await admin
    .from('profiles')
    .select('company_id')
    .eq('id', data.user.id)
    .maybeSingle();

  return { userId: data.user.id, companyId: profile?.company_id ?? undefined };
}

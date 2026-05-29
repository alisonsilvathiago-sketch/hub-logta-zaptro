import { supabaseZaptro } from './supabase-zaptro';
import { buildZaptroInstanceName } from '../services/evolution.service';

/** Instância Evolution ligada à empresa (tabela `whatsapp_instances`). */
export async function resolveCompanyWhatsappInstance(
  companyId: string,
  actorId?: string | null,
): Promise<string> {
  const cid = companyId.trim();
  if (!cid) return buildZaptroInstanceName(actorId || 'user', cid);

  const { data } = await supabaseZaptro
    .from('whatsapp_instances')
    .select('instance_id, status')
    .eq('company_id', cid)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.instance_id) return String(data.instance_id);

  const shared = (import.meta.env.VITE_EVOLUTION_INSTANCE as string | undefined)?.trim();
  if (shared) return shared;

  if (actorId) return buildZaptroInstanceName(actorId, cid);

  return `instance_${cid.replace(/-/g, '').slice(0, 8)}`;
}

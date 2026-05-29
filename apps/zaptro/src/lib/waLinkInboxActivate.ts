/**
 * Activa inbox wa-link: webhook Evolution → Supabase Edge + mapa instância → empresa.
 */
import type { Profile } from '../types';
import { resolveZaptroCompanyId } from '../utils/zaptroSession';
import { supabaseZaptro } from './supabase-zaptro';
import { activateGoInboxWebhook } from '../services/evolution';

const DEFAULT_COMPANY_ENV = 'VITE_WA_LINK_DEFAULT_COMPANY_ID';

export function waLinkDefaultCompanyId(): string | null {
  const fromEnv = (import.meta.env[DEFAULT_COMPANY_ENV] as string | undefined)?.trim();
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return 'b1111111-1111-4111-8111-111111111111';
  return null;
}

/** Perfil → sessão (conexão) → env — em produção só a empresa do utilizador logado. */
export function resolveWaLinkInboxCompanyId(
  profile: Profile | null,
  sessionCompanyId: string | null | undefined,
  _userId?: string | null,
): string | null {
  const fromProfile = resolveZaptroCompanyId(profile, null);
  if (fromProfile) return fromProfile;
  const session = sessionCompanyId?.trim();
  if (session) return session;
  if (import.meta.env.DEV) return waLinkDefaultCompanyId();
  return null;
}

/** Em dev, inclui empresa da sessão e default para não “sumir” conversas antigas de teste. */
export function resolveWaLinkInboxCompanyIds(
  profile: Profile | null,
  sessionCompanyId: string | null | undefined,
  userId?: string | null,
): string[] {
  const ids = new Set<string>();
  const primary = resolveWaLinkInboxCompanyId(profile, sessionCompanyId, userId);
  if (primary) ids.add(primary);

  if (!import.meta.env.DEV) return [...ids];

  const session = sessionCompanyId?.trim();
  if (session) ids.add(session);
  const def = waLinkDefaultCompanyId();
  if (def) ids.add(def);
  return [...ids];
}

/** URL que a Evolution GO deve chamar ao receber mensagens. */
export function evolutionWebhookPublicUrl(): string {
  // Prioridade: variável configurável explicitamente pelo usuário.
  const waLink = (import.meta.env.VITE_WA_LINK_WEBHOOK_URL as string | undefined)?.trim();
  if (waLink) return waLink.replace(/\/+$/, '');

  const explicit = (import.meta.env.VITE_EVOLUTION_WEBHOOK_URL as string | undefined)?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  // Fallback: Supabase Edge (Evolution na VPS não alcança localhost sem túnel explícito).
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const base = supabaseUrl?.replace(/\/+$/, '') || 'https://rrjnkmgkhbtapumgmhhr.supabase.co';
  // evolution-webhook: verify_jwt=false no deploy; grava inbox (não só webhook_events).
  return `${base}/functions/v1/evolution-webhook`;
}

export async function bindWaLinkInstanceToCompany(
  instanceId: string,
  companyId: string,
): Promise<void> {
  const cid = companyId.trim();
  const inst = instanceId.trim();
  if (!cid || !inst) return;

  const { error } = await supabaseZaptro.from('whatsapp_instances').upsert(
    {
      company_id: cid,
      instance_id: inst,
      instance_name: inst,
      status: 'connected',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'instance_id' },
  );

  if (error) {
    console.warn('[wa-link] whatsapp_instances upsert:', error.message);
  }
}

/** Regista webhook na Evolution GO e liga instância → empresa (para o Edge gravar mensagens). */
export async function activateWaLinkInboxDirect(
  instanceName: string,
  companyId: string | null,
): Promise<{ webhookUrl: string; companyId: string | null }> {
  const webhookUrl = evolutionWebhookPublicUrl();
  const cid = companyId?.trim() || waLinkDefaultCompanyId();

  await activateGoInboxWebhook(instanceName, webhookUrl);

  if (cid) {
    await bindWaLinkInstanceToCompany(instanceName, cid);
  }

  return { webhookUrl, companyId: cid };
}

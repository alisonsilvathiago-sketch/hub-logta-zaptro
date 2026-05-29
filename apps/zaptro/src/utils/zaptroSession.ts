import type { Profile } from '../types';
import { supabaseZaptro } from '../lib/supabase-zaptro';

/** Tenant em impersonação (Hub Master → Zaptro local). */
export function readImpersonateTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  const fromLs = localStorage.getItem('hub-impersonate-tenant')?.trim();
  if (fromLs) return fromLs;
  const raw = document.cookie;
  const parts = raw.split('; hub-impersonate-tenant=');
  if (parts.length === 2) {
    const v = parts[1]?.split(';')[0]?.trim();
    if (v) return decodeURIComponent(v);
  }
  return null;
}

export function resolveZaptroActorId(user: { id?: string } | null, profile: Profile | null): string | null {
  const id = user?.id?.trim() || profile?.id?.trim();
  return id || null;
}

export function resolveZaptroCompanyId(
  profile: Profile | null,
  companyFromTenant?: { id?: string } | null,
): string | null {
  const fromProfile = profile?.company_id?.trim();
  if (fromProfile) return fromProfile;
  const impersonated = readImpersonateTenantId();
  if (impersonated) return impersonated;
  const fromTenant = companyFromTenant?.id?.trim();
  if (fromTenant) return fromTenant;
  return null;
}

/** Resolve empresa quando o perfil ainda não tem company_id (ex.: conta nova). */
export async function resolveCompanyIdForWhatsapp(
  user: { id?: string } | null,
  profile: Profile | null,
  companyFromTenant?: { id?: string } | null,
  refreshProfile?: () => Promise<void>,
): Promise<string | null> {
  let cid = resolveZaptroCompanyId(profile, companyFromTenant);
  if (cid) return cid;

  const uid = user?.id?.trim();
  if (!uid || uid === 'hub-dev-local-user') {
    return readImpersonateTenantId();
  }

  if (refreshProfile) {
    try {
      await refreshProfile();
    } catch {
      /* ignore */
    }
    cid = profile?.company_id?.trim() || resolveZaptroCompanyId(profile, companyFromTenant);
    if (cid) return cid;
  }

  try {
    const { data: row } = await supabaseZaptro
      .from('profiles')
      .select('company_id')
      .eq('id', uid)
      .maybeSingle();
    cid = row?.company_id?.trim() || null;
    if (cid) return cid;
  } catch {
    /* ignore */
  }

  const impersonated = readImpersonateTenantId();
  if (impersonated) return impersonated;

  try {
    const { data: first } = await supabaseZaptro.from('companies').select('id').limit(1).maybeSingle();
    if (first?.id) return String(first.id);
  } catch {
    /* ignore */
  }

  return null;
}

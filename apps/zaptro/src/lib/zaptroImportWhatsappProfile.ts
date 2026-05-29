import { supabaseZaptro } from './supabase-zaptro';
import { resolveConnectedWhatsappPhone } from './zaptroConnectedWhatsappPhone';
import {
  companyRowToBusinessProfile,
  writeZaptroCompanyBusinessProfile,
  type WaAccountType,
  type ZaptroCompanyBusinessProfile,
} from './zaptroCompanyBusinessProfile';
import {
  fetchConnectedWhatsappProfile,
  mergeWhatsappProfileIntoCompany,
} from './zaptroWhatsappProfileFetch';
import { resolveCompanyWhatsappInstance } from './whatsappInbox';
import { getEvolutionConnectionState, getEvolutionLiveStatus } from '../services/evolution';
import { shouldUseEvolutionEdge } from '../services/evolution.service';
import { isZaptroLocalhost } from './appOrigin';

export type ImportWhatsappProfileResult = {
  imported: boolean;
  profile: ZaptroCompanyBusinessProfile;
  accountType: WaAccountType;
  messages: string[];
};

async function fetchProfileViaEdge(
  instanceName: string,
  phone: string,
): Promise<(ZaptroCompanyBusinessProfile & { accountType: WaAccountType }) | null> {
  const base =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()?.replace(/\/$/, '') ||
    'https://rrjnkmgkhbtapumgmhhr.supabase.co';
  const anon =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
    '';

  const { data: session } = await supabaseZaptro.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return null;

  const res = await fetch(
    `${base}/functions/v1/evolution-api/business/importProfile/${encodeURIComponent(instanceName)}?phone=${encodeURIComponent(phone)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anon,
      },
    },
  );

  if (!res.ok) return null;
  const body = (await res.json().catch(() => ({}))) as {
    profile?: ZaptroCompanyBusinessProfile & { accountType?: WaAccountType };
  };
  return body.profile ?? null;
}

/** Importa perfil WhatsApp (pessoal ou Business) → companies + cache local. */
export async function importWhatsappProfileToCompany(options: {
  companyId: string;
  userId?: string | null;
  setCompany?: (row: unknown) => void;
  silent?: boolean;
}): Promise<ImportWhatsappProfileResult> {
  const { companyId, userId, setCompany } = options;
  const messages: string[] = [];

  const instance = await resolveCompanyWhatsappInstance(companyId, userId);
  const state = await getEvolutionConnectionState(instance);
  if (state !== 'open') {
    return {
      imported: false,
      profile: emptyProfile(),
      accountType: 'unknown',
      messages: ['WhatsApp não está ligado. Conecte em Configurações → WhatsApp.'],
    };
  }

  const waPhone =
    (await resolveConnectedWhatsappPhone({ userId, companyId })) ||
    (await getEvolutionLiveStatus(instance)).phone;

  if (!waPhone) {
    return {
      imported: false,
      profile: emptyProfile(),
      accountType: 'unknown',
      messages: ['Número da linha não encontrado. Aguarde alguns segundos após o QR.'],
    };
  }

  const { data: companyRow } = await supabaseZaptro
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .maybeSingle();

  const current = companyRow
    ? companyRowToBusinessProfile(companyRow as Record<string, unknown>)
    : emptyProfile();

  let fetched =
    shouldUseEvolutionEdge() && !isZaptroLocalhost() && import.meta.env.VITE_EVOLUTION_USE_EDGE !== 'false'
      ? await fetchProfileViaEdge(instance, waPhone)
      : null;

  if (!fetched) {
    fetched = await fetchConnectedWhatsappProfile(instance, waPhone);
  }

  const merged = mergeWhatsappProfileIntoCompany(current, fetched, waPhone);

  const prevSettings =
    companyRow?.settings && typeof companyRow.settings === 'object'
      ? { ...(companyRow.settings as Record<string, unknown>) }
      : {};

  const payload: Record<string, unknown> = {
    name: merged.name.trim() || current.name,
    phone: merged.phone,
    email: merged.email.trim() || null,
    address: merged.address.trim() || null,
    segment: merged.segment || null,
    category: merged.segment || null,
    description: merged.description.trim() || null,
    website: merged.website.trim() || null,
    opening_hours: merged.openingHours.trim() || null,
    logo_url: merged.logoUrl || null,
    settings: {
      ...prevSettings,
      business_city: merged.city.trim() || prevSettings.business_city,
      business_state: merged.state.trim() || prevSettings.business_state,
      wa_account_type: merged.accountType,
      wa_profile_synced_at: new Date().toISOString(),
    },
  };

  const { data: updated, error } = await supabaseZaptro
    .from('companies')
    .update(payload)
    .eq('id', companyId)
    .select()
    .single();

  if (error) {
    messages.push(error.message || 'Erro ao gravar perfil no banco.');
    return { imported: false, profile: merged, accountType: merged.accountType ?? 'unknown', messages };
  }

  if (updated && setCompany) setCompany(updated);
  writeZaptroCompanyBusinessProfile(merged);
  if (merged.logoUrl) {
    try {
      localStorage.setItem('zaptro_company_logo_url', merged.logoUrl);
    } catch {
      /* ignore */
    }
  }

  if (merged.logoUrl) messages.push('Foto de perfil sincronizada.');
  if (merged.name) messages.push('Nome sincronizado.');
  if (merged.description) messages.push('Descrição sincronizada.');
  if (merged.website) messages.push('Site sincronizado.');
  if (merged.address) messages.push('Endereço sincronizado.');
  if (merged.accountType === 'business') messages.push('Conta WhatsApp Business detectada.');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('zaptro:wa-profile-synced', { detail: { profile: merged, companyId } }),
    );
  }

  return {
    imported: true,
    profile: merged,
    accountType: merged.accountType ?? 'unknown',
    messages,
  };
}

function emptyProfile(): ZaptroCompanyBusinessProfile {
  return {
    name: '',
    segment: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    openingHours: '',
    logoUrl: null,
    accountType: 'unknown',
  };
}

import { isZaptroLocalhost } from './appOrigin';
import {
  formatBusinessLocation,
  type ZaptroCompanyBusinessProfile,
} from './zaptroCompanyBusinessProfile';
import { resolveCompanyWhatsappInstance } from './whatsappInbox';
import {
  getEvolutionConnectionState,
  syncEvolutionBusinessProfile,
  type EvolutionBusinessProfileInput,
} from '../services/evolution';
import { shouldUseEvolutionEdge } from '../services/evolution.service';
import { supabaseZaptro } from './supabase-zaptro';

function toEvolutionInput(profile: ZaptroCompanyBusinessProfile): EvolutionBusinessProfileInput {
  const location = formatBusinessLocation(profile);
  const address = [profile.address.trim(), location].filter(Boolean).join(' — ') || location;
  return {
    name: profile.name,
    description: profile.description,
    address,
    email: profile.email,
    website: profile.website,
    category: profile.segment,
    openingHours: profile.openingHours,
    pictureUrl: profile.logoUrl,
  };
}

async function syncViaEdge(
  instanceName: string,
  input: EvolutionBusinessProfileInput,
): Promise<{ synced: boolean; messages: string[] }> {
  const base =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()?.replace(/\/$/, '') ||
    'https://rrjnkmgkhbtapumgmhhr.supabase.co';
  const anon =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
    '';

  const { data: session } = await supabaseZaptro.auth.getSession();
  const token = session.session?.access_token;
  if (!token) {
    return { synced: false, messages: ['Faça login para sincronizar o perfil com o WhatsApp.'] };
  }

  const res = await fetch(
    `${base}/functions/v1/evolution-api/business/syncProfile/${encodeURIComponent(instanceName)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anon,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  const body = (await res.json().catch(() => ({}))) as {
    synced?: boolean;
    messages?: string[];
    error?: string;
  };

  if (!res.ok) {
    return {
      synced: false,
      messages: [body.error || `Edge HTTP ${res.status}`],
    };
  }

  return {
    synced: Boolean(body.synced),
    messages: Array.isArray(body.messages) ? body.messages : [],
  };
}

/** Sincroniza perfil comercial Zaptro → WhatsApp (localhost usa proxy /evolution-api). */
export async function syncCompanyBusinessProfileToWhatsapp(
  companyId: string,
  actorId: string | null | undefined,
  profile: ZaptroCompanyBusinessProfile,
): Promise<{ synced: boolean; messages: string[] }> {
  const instance = await resolveCompanyWhatsappInstance(companyId, actorId);
  const state = await getEvolutionConnectionState(instance);
  if (state !== 'open') {
    return {
      synced: false,
      messages: [
        'WhatsApp não está ligado. Abra Configurações → WhatsApp, escaneie o QR e tente salvar de novo.',
      ],
    };
  }

  const input = toEvolutionInput(profile);
  const useEdge = shouldUseEvolutionEdge() && !isZaptroLocalhost() && import.meta.env.VITE_EVOLUTION_USE_EDGE !== 'false';

  if (useEdge) {
    try {
      return await syncViaEdge(instance, input);
    } catch {
      /* fallback direct */
    }
  }

  return syncEvolutionBusinessProfile(instance, input);
}

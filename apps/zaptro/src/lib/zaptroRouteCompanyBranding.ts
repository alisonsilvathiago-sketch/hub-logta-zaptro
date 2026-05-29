import type { RouteLiveBucket } from '../constants/zaptroRouteLiveStore';
import { readZaptroCompanyBusinessProfile } from './zaptroCompanyBusinessProfile';

export type RouteCompanyBranding = {
  name: string;
  logoUrl: string | null;
};

/** Logo guardado ao actualizar perfil da empresa (mesmo browser que operações / links públicos). */
export function readLocalCompanyLogoUrl(): string | null {
  try {
    const fromKey = localStorage.getItem('zaptro_company_logo_url')?.trim();
    if (fromKey) return fromKey;
    return readZaptroCompanyBusinessProfile()?.logoUrl?.trim() || null;
  } catch {
    return null;
  }
}

export function readLocalCompanyName(): string | null {
  try {
    const cached = readZaptroCompanyBusinessProfile();
    return cached?.name?.trim() || null;
  } catch {
    return null;
  }
}

/** Nome + logo para rastreio público e painel do motorista (live store + cache local). */
export function resolveRouteCompanyBranding(live: RouteLiveBucket | null): RouteCompanyBranding {
  const name =
    live?.publicCompanyName?.trim() ||
    readLocalCompanyName() ||
    'Transportadora';

  const logoUrl =
    live?.publicHeaderLogoUrl?.trim() ||
    readLocalCompanyLogoUrl() ||
    null;

  return { name, logoUrl };
}

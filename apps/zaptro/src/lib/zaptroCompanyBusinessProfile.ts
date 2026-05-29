export type WaAccountType = 'personal' | 'business' | 'unknown';

/** Perfil comercial público (estilo WhatsApp Business) — cache local para conversas e orçamentos. */
export type ZaptroCompanyBusinessProfile = {
  name: string;
  segment: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  openingHours: string;
  logoUrl: string | null;
  accountType?: WaAccountType;
};

const STORAGE_KEY = 'zaptro_company_business_profile_v1';

export function readZaptroCompanyBusinessProfile(): ZaptroCompanyBusinessProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ZaptroCompanyBusinessProfile;
  } catch {
    return null;
  }
}

export function writeZaptroCompanyBusinessProfile(profile: ZaptroCompanyBusinessProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function companyRowToBusinessProfile(row: Record<string, unknown>): ZaptroCompanyBusinessProfile {
  const settings =
    row.settings && typeof row.settings === 'object'
      ? (row.settings as Record<string, unknown>)
      : {};
  const city = String(settings.business_city ?? settings.city ?? '').trim();
  const state = String(settings.business_state ?? settings.state ?? '').trim();

  const accountRaw = String(settings.wa_account_type ?? '').trim().toLowerCase();
  const accountType: WaAccountType =
    accountRaw === 'business' || accountRaw === 'personal' ? accountRaw : 'unknown';

  return {
    name: String(row.name ?? '').trim(),
    segment: String(row.segment ?? row.category ?? '').trim(),
    description: String(row.description ?? '').trim(),
    phone: String(row.phone ?? '').trim(),
    email: String(row.email ?? '').trim(),
    website: String(row.website ?? '').trim(),
    address: String(row.address ?? '').trim(),
    city,
    state,
    openingHours: String(row.opening_hours ?? '').trim(),
    logoUrl: String(row.logo_url ?? '').trim() || null,
    accountType,
  };
}

export function formatBusinessLocation(p: Pick<ZaptroCompanyBusinessProfile, 'address' | 'city' | 'state'>): string {
  const parts = [p.address, [p.city, p.state].filter(Boolean).join(' - ')].filter(Boolean);
  return parts.join(', ');
}

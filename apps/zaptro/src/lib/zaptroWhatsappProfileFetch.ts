import {
  evolutionApiRequest,
  fetchContactProfilePic,
  getEvolutionLiveStatus,
} from '../services/evolution';
import type { WaAccountType, ZaptroCompanyBusinessProfile } from './zaptroCompanyBusinessProfile';

export type EvolutionFetchedWhatsappProfile = ZaptroCompanyBusinessProfile & {
  accountType: WaAccountType;
};

function pickStr(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function unwrapBlocks(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as Record<string, unknown>;
  const candidates: unknown[] = [root, root.data, root.result, root.profile, root.business];

  if (Array.isArray(root.data)) candidates.push(...root.data);
  if (Array.isArray(root.contacts)) candidates.push(...root.contacts);

  const blocks: Record<string, unknown>[] = [];
  for (const c of candidates) {
    if (!c || typeof c !== 'object') continue;
    if (Array.isArray(c)) {
      for (const item of c) {
        if (item && typeof item === 'object') blocks.push(item as Record<string, unknown>);
      }
    } else {
      blocks.push(c as Record<string, unknown>);
    }
  }
  return blocks;
}

function applyBlock(target: EvolutionFetchedWhatsappProfile, raw: Record<string, unknown>): void {
  const business = (raw.business ?? raw.Business ?? raw.businessProfile ?? raw.business_profile) as
    | Record<string, unknown>
    | undefined;
  const nestedProfile = (raw.profile ?? raw.Profile) as Record<string, unknown> | undefined;
  const b =
    business && typeof business === 'object'
      ? business
      : nestedProfile && typeof nestedProfile === 'object'
        ? nestedProfile
        : raw;

  const name = pickStr(
    b.name,
    b.profileName,
    b.pushname,
    b.pushName,
    b.verifiedName,
    b.businessName,
    raw.name,
    raw.pushname,
  );
  if (name) target.name = name;

  const description = pickStr(
    b.description,
    b.about,
    b.status,
    b.bio,
    raw.status,
    raw.about,
  );
  if (description) target.description = description;

  const email = pickStr(b.email, b.businessEmail, raw.email);
  if (email) target.email = email;

  const website = pickStr(b.website, b.businessWebsite, raw.website);
  if (website) target.website = website;

  const address = pickStr(b.address, b.businessAddress, raw.address);
  if (address) target.address = address;

  const segment = pickStr(
    b.category,
    b.categories,
    b.businessCategory,
    b.segment,
    raw.category,
  );
  if (segment) target.segment = segment;

  const hours = pickStr(
    b.openingHours,
    b.businessHours,
    b.hours,
    raw.openingHours,
  );
  if (hours) target.openingHours = hours;

  const pic = pickStr(
    b.picture,
    b.pictureUrl,
    b.profilePictureUrl,
    b.imgUrl,
    b.profilePicUrl,
    raw.pictureUrl,
    raw.profilePictureUrl,
  );
  if (pic) target.logoUrl = pic;

  const isBusiness =
    Boolean(pickStr(b.isBusiness, raw.isBusiness)) ||
    raw.business === true ||
    Boolean(segment) ||
    Boolean(pickStr(b.businessName, b.verifiedName)) ||
    Boolean(email && website);

  if (isBusiness) target.accountType = 'business';
}

async function evolutionFetchProfileAttempt(
  instanceName: string,
  path: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>[]> {
  const res = await evolutionApiRequest(instanceName, path, method, body);
  if (!res.ok) return [];
  return unwrapBlocks(res.data);
}

/** Busca perfil da conta conectada (pessoal ou Business) na Evolution GO. */
export async function fetchConnectedWhatsappProfile(
  instanceName: string,
  ownPhoneDigits: string,
): Promise<EvolutionFetchedWhatsappProfile> {
  const digits = ownPhoneDigits.replace(/\D/g, '');
  const profile: EvolutionFetchedWhatsappProfile = {
    name: '',
    segment: '',
    description: '',
    phone: digits,
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    openingHours: '',
    logoUrl: null,
    accountType: 'unknown',
  };

  if (!digits) return profile;

  profile.logoUrl = await fetchContactProfilePic(instanceName, digits);

  const jid = `${digits}@s.whatsapp.net`;
  const numberBodies = [{ number: digits }, { number: jid }, { numbers: [digits] }, { numbers: [jid] }];

  try {
    const statusRes = await evolutionApiRequest(instanceName, '/instance/status', 'GET');
    if (statusRes.ok) {
      const blocks = unwrapBlocks(statusRes.data);
      for (const block of blocks) applyBlock(profile, block);
    }
  } catch {
    /* ignore */
  }

  const attempts: Array<{ method: 'GET' | 'POST'; path: string; body?: Record<string, unknown> }> = [];
  for (const body of numberBodies) {
    attempts.push(
      { method: 'POST', path: '/chat/fetchBusinessProfile', body },
      { method: 'POST', path: '/chat/fetchProfile', body },
      { method: 'POST', path: '/business/fetchBusinessProfile', body },
      { method: 'POST', path: '/business/fetchProfile', body },
    );
  }
  attempts.push(
    { method: 'GET', path: '/business/profile' },
    { method: 'GET', path: '/profile/fetchProfile' },
    { method: 'POST', path: '/chat/findContacts', body: { numbers: [digits, jid] } },
  );

  for (const att of attempts) {
    const blocks = await evolutionFetchProfileAttempt(instanceName, att.path, att.method, att.body);
    for (const block of blocks) applyBlock(profile, block);
  }

  try {
    const live = await getEvolutionLiveStatus(instanceName);
    if (live.phone && !profile.phone) profile.phone = live.phone.replace(/\D/g, '');
  } catch {
    /* ignore */
  }

  if (profile.accountType === 'unknown') {
    profile.accountType =
      profile.segment || profile.email || profile.website ? 'business' : profile.name ? 'personal' : 'unknown';
  }

  return profile;
}

export function mergeWhatsappProfileIntoCompany(
  current: ZaptroCompanyBusinessProfile,
  fetched: EvolutionFetchedWhatsappProfile,
  waPhone: string | null,
): ZaptroCompanyBusinessProfile {
  const pick = (wa: string, cur: string) => (wa.trim() ? wa.trim() : cur.trim());

  return {
    name: pick(fetched.name, current.name),
    segment: pick(fetched.segment, current.segment),
    description: pick(fetched.description, current.description),
    phone: waPhone?.replace(/\D/g, '') || fetched.phone || current.phone,
    email: pick(fetched.email, current.email),
    website: pick(fetched.website, current.website),
    address: pick(fetched.address, current.address),
    city: pick(fetched.city, current.city),
    state: pick(fetched.state, current.state),
    openingHours: pick(fetched.openingHours, current.openingHours),
    logoUrl: fetched.logoUrl || current.logoUrl,
    accountType: fetched.accountType,
  };
}

import { loadWhatsappConnection } from '../services/evolution.service';
import { getEvolutionLiveStatus } from '../services/evolution';
import { readWaLinkSession, waLinkSharedInstance } from '../modules/wa-link/waLinkConfig';
import { resolveCompanyWhatsappInstance } from './whatsappInbox';

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Número da linha WhatsApp ligada (QR / Evolution). */
export async function resolveConnectedWhatsappPhone(options: {
  userId?: string | null;
  companyId?: string | null;
}): Promise<string | null> {
  const session = readWaLinkSession();
  const fromSession = session.phone?.trim();
  if (fromSession) return digitsOnly(fromSession);

  const instance =
    session.instance?.trim() ||
    (options.companyId
      ? await resolveCompanyWhatsappInstance(options.companyId, options.userId)
      : waLinkSharedInstance());

  if (options.userId) {
    const row = await loadWhatsappConnection(options.userId, instance);
    const fromDb = row?.phone ? String(row.phone).trim() : '';
    if (fromDb) return digitsOnly(fromDb);
  }

  try {
    const live = await getEvolutionLiveStatus(instance);
    if (live.phone) return digitsOnly(live.phone);
  } catch {
    /* ignore */
  }

  return null;
}

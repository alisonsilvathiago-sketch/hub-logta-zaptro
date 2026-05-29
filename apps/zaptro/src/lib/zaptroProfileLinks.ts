import { ZAPTRO_APP_ROUTES } from '../app/zaptroAppRoutes';
import { buildZaptroDemoClients, ZAPTRO_DEMO_COMPANY_ID } from '../constants/zaptroClientsDemo';

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function zaptroInboxUrl(phone: string): string {
  const digits = phoneDigits(phone);
  return `${ZAPTRO_APP_ROUTES.INBOX}?c=${encodeURIComponent(digits)}`;
}

export function zaptroAgendaUrl(opts?: { date?: string; eventId?: string; q?: string }): string {
  const params = new URLSearchParams();
  if (opts?.date) params.set('date', opts.date.slice(0, 10));
  if (opts?.eventId) params.set('event', opts.eventId);
  if (opts?.q?.trim()) params.set('q', opts.q.trim());
  const qs = params.toString();
  return qs ? `${ZAPTRO_APP_ROUTES.AGENDA}?${qs}` : ZAPTRO_APP_ROUTES.AGENDA;
}

export function resolveDemoClientIdByLabel(label: string, companyId?: string): string | null {
  const needle = label.trim().toLowerCase();
  if (!needle) return null;
  const clients = buildZaptroDemoClients(companyId || ZAPTRO_DEMO_COMPANY_ID);
  const hit = clients.find((c) => {
    const company = (c.metadata.company_name || '').toLowerCase();
    const sender = (c.sender_name || '').toLowerCase();
    return company === needle || sender === needle || needle.includes(company) || company.includes(needle);
  });
  return hit?.id ?? null;
}

export function zaptroClientProfileUrl(clientId: string): string {
  return ZAPTRO_APP_ROUTES.clientProfile(clientId);
}

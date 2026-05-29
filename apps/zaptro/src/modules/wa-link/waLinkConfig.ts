import { isZaptroLocalhost } from '../../lib/appOrigin';
import { clearEvolutionInstanceTokenCache } from '../../services/evolution';
export { waLinkDefaultCompanyId } from '../../lib/waLinkInboxActivate';

/**
 * Configuração central do módulo interno de ligação WhatsApp (Evolution GO via Edge).
 */
export const WA_LINK_ROUTES = {
  APP: '/app',
  LOGIN: '/login',
  CONNECT: '/app/configuracoes?tab=config',
  INBOX: '/app/conversas',
  BROADCASTS: '/app/listas-transmissao',
} as const;

const SESSION_CONNECTED_AT = 'wa-link-connected-at';
const SESSION_INSTANCE = 'wa-link-instance';
const SESSION_PHONE = 'wa-link-phone';
const SESSION_COMPANY = 'wa-link-company';

export function markWaLinkSessionConnected(
  instance: string,
  phone?: string | null,
  companyId?: string | null,
): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_CONNECTED_AT, new Date().toISOString());
  sessionStorage.setItem(SESSION_INSTANCE, instance.trim());
  if (phone) sessionStorage.setItem(SESSION_PHONE, phone);
  else sessionStorage.removeItem(SESSION_PHONE);
  if (companyId?.trim()) sessionStorage.setItem(SESSION_COMPANY, companyId.trim());
}

export function clearWaLinkSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_CONNECTED_AT);
  sessionStorage.removeItem(SESSION_INSTANCE);
  sessionStorage.removeItem(SESSION_PHONE);
  sessionStorage.removeItem(SESSION_COMPANY);
  clearEvolutionInstanceTokenCache();
}

export function readWaLinkSession(): {
  connectedAt: string | null;
  instance: string | null;
  phone: string | null;
  companyId: string | null;
} {
  if (typeof window === 'undefined') {
    return { connectedAt: null, instance: null, phone: null, companyId: null };
  }
  return {
    connectedAt: sessionStorage.getItem(SESSION_CONNECTED_AT),
    instance: sessionStorage.getItem(SESSION_INSTANCE),
    phone: sessionStorage.getItem(SESSION_PHONE),
    companyId: sessionStorage.getItem(SESSION_COMPANY),
  };
}

const LIME = '#D9FF00';
const BLACK = '#0a0a0a';

export const WA_LINK_THEME = {
  lime: LIME,
  black: BLACK,
  white: '#ffffff',
  muted: '#949494',
  border: 'rgba(255,255,255,0.1)',
  card: '#111111',
} as const;

export function waLinkUsesEdge(): boolean {
  return import.meta.env.VITE_EVOLUTION_USE_EDGE !== 'false';
}

/** Com JWT: Edge em produção; em dev local usa proxy Vite (endpoints GO correctos). */
export function waLinkShouldUseEdge(hasJwt: boolean): boolean {
  if (!waLinkUsesEdge() || !hasJwt) return false;
  if (import.meta.env.DEV && waLinkHasDirectEvolutionKey()) return false;
  if (isZaptroLocalhost() && waLinkHasDirectEvolutionKey()) return false;
  return true;
}

/** Edge sem secrets, 404 (rota GO errada) ou 5xx — usar proxy Vite → Evolution. */
export function waLinkEdgeUnavailableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /Missing EVOLUTION_API_URL|Missing EVOLUTION_API_KEY|missingSecrets/i.test(msg) ||
    /Evolution API \(Edge\) HTTP 5\d{2}/i.test(msg) ||
    /Evolution API \(Edge\) HTTP 404/i.test(msg) ||
    /404 page not found/i.test(msg)
  );
}

export function waLinkHasDirectEvolutionKey(): boolean {
  const k =
    (import.meta.env.VITE_EVOLUTION_INSTANCE_API_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_EVOLUTION_API_KEY as string | undefined)?.trim() ||
    '';
  return k.length > 0 && !k.includes('?');
}

export function waLinkSharedInstance(): string {
  const fromEnv = (import.meta.env.VITE_EVOLUTION_INSTANCE as string | undefined)?.trim();
  if (fromEnv) return fromEnv;
  return 'zaptro';
}

/** Instância usada no ecrã de QR — por defeito a partilhada (ex.: zaptro no manager). */
export function resolveWaLinkConnectInstance(
  userId: string | null,
  companyId: string | null,
): string {
  const shared = (import.meta.env.VITE_EVOLUTION_INSTANCE as string | undefined)?.trim();
  if (shared) return shared;

  if (import.meta.env.VITE_EVOLUTION_PER_USER_INSTANCE === 'true' && userId) {
    const safeUser = userId.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 24);
    const safeCo = companyId?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) ?? 'co';
    return `zaptro-${safeCo}-${safeUser || 'u'}`;
  }

  return 'zaptro';
}

export function formatWaPhone(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '—';
  if (digits.length >= 12 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    const part =
      rest.length > 8
        ? `${rest.slice(0, 5)}-${rest.slice(5, 9)}`
        : rest.length > 4
          ? `${rest.slice(0, 4)}-${rest.slice(4)}`
          : rest;
    return `+55 (${ddd}) ${part}`;
  }
  return `+${digits}`;
}

/** Formato compacto para lista de conversas (+55 13 99761-2198). */
export function formatWaPhoneLine(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '—';
  if (digits.length >= 12 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (rest.length >= 9) return `+55 ${ddd} ${rest.slice(0, 5)}-${rest.slice(5)}`;
    return `+55 ${ddd} ${rest}`;
  }
  return `+${digits}`;
}

/** IDs internos WhatsApp (LID) — não são telefone real. */
export function isWaLinkOpaqueNumber(phone: string | null | undefined): boolean {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return true;
  if (digits.length >= 12 && digits.startsWith('55')) return false;
  return digits.length >= 13;
}

export function waLinkConversationTitle(
  senderName: string | null | undefined,
  senderNumber: string | null | undefined,
): string {
  const phone = formatWaPhoneLine(senderNumber);
  if (!isWaLinkOpaqueNumber(senderNumber)) return phone;
  const name = senderName?.trim();
  return name || phone;
}

/** Título + subtítulo do cabeçalho da conversa aberta. */
/** Lista: telefone em destaque (estilo WhatsApp). */
export function waLinkListPrimaryLabel(
  senderName: string | null | undefined,
  senderNumber: string | null | undefined,
): string {
  const phone = formatWaPhoneLine(senderNumber);
  if (!isWaLinkOpaqueNumber(senderNumber)) return phone;
  const name = senderName?.trim();
  return name || phone;
}

/** Inicial do avatar — evita «+» quando o título é telefone formatado. */
export function waLinkAvatarInitial(
  label: string | null | undefined,
  phone?: string | null,
): string {
  const text = (label || '').trim();
  for (const ch of text) {
    if (/[a-zA-ZÀ-ÿ]/.test(ch)) return ch.toUpperCase();
  }
  const digits = (phone || text).replace(/\D/g, '');
  if (digits.length >= 2) return digits.slice(-2);
  if (digits.length === 1) return digits;
  return '?';
}

export function waLinkThreadHeadLines(
  senderName: string | null | undefined,
  senderNumber: string | null | undefined,
): { title: string; subtitle: string } {
  const phone = formatWaPhoneLine(senderNumber);
  const name = senderName?.trim();
  const hasRealPhone = !isWaLinkOpaqueNumber(senderNumber);

  if (name && hasRealPhone) {
    const nameDigits = name.replace(/\D/g, '');
    const phoneDigits = (senderNumber ?? '').replace(/\D/g, '');
    if (!nameDigits || nameDigits !== phoneDigits) {
      return { title: name, subtitle: phone };
    }
  }

  if (hasRealPhone) return { title: phone, subtitle: 'Conversa WhatsApp' };
  return { title: name || phone, subtitle: 'Conversa WhatsApp' };
}

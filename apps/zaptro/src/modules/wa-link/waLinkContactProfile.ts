import type { WaLinkMessage } from './useWaLinkInbox';
import type { WaLinkConversation } from './waLinkInboxDb';
import type { WaLinkCustomerContextSnapshot, WaLinkCustomerRouteSummary } from './waLinkCustomerContext';
import {
  formatWaPhoneLine,
  isWaLinkOpaqueNumber,
  waLinkAvatarInitial,
  waLinkThreadHeadLines,
} from './waLinkConfig';
import { waLinkPhonesMatch } from './waLinkPhoneMatch';

function readMetaString(metadata: unknown, key: string): string {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return '';
  const v = (metadata as Record<string, unknown>)[key];
  return typeof v === 'string' ? v.trim() : '';
}

function formatCpf(digits: string): string {
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCnpj(digits: string): string {
  if (digits.length !== 14) return digits;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function resolveDocumentLabel(metadata: unknown): string | null {
  const cpf = readMetaString(metadata, 'cpf').replace(/\D/g, '');
  const cnpj = readMetaString(metadata, 'cnpj').replace(/\D/g, '');
  if (cnpj.length === 14) return `CNPJ ${formatCnpj(cnpj)}`;
  if (cpf.length === 11) return `CPF ${formatCpf(cpf)}`;
  const docType = readMetaString(metadata, 'document_type');
  const rawDoc = readMetaString(metadata, 'document').replace(/\D/g, '');
  if (docType === 'cnpj' && rawDoc.length === 14) return `CNPJ ${formatCnpj(rawDoc)}`;
  if (docType === 'cpf' && rawDoc.length === 11) return `CPF ${formatCpf(rawDoc)}`;
  return null;
}

function resolveLeadId(phone: string, companyId: string): string | null {
  try {
    const raw = localStorage.getItem(`zaptro_crm_kanban_v3_${companyId}`);
    if (!raw) return null;
    const leads = JSON.parse(raw) as Array<{ id?: string; phone?: string }>;
    if (!Array.isArray(leads)) return null;
    const hit = leads.find((l) => l.phone && l.id && waLinkPhonesMatch(l.phone, phone));
    return hit?.id?.trim() || null;
  } catch {
    return null;
  }
}

function shortClientId(conversation: WaLinkConversation, companyId: string): string {
  const metaId = readMetaString(conversation.metadata, 'client_id');
  if (metaId) return metaId;
  const leadId = resolveLeadId(conversation.sender_number, companyId);
  if (leadId) return leadId;
  return conversation.id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function messagePreview(msg: WaLinkMessage): string {
  const type = (msg.message_type || 'text').toLowerCase();
  if (msg.content?.trim()) return msg.content.trim();
  if (type === 'audio') return 'Áudio';
  if (type === 'image') return 'Imagem';
  if (type === 'video') return 'Vídeo';
  if (type === 'document') return msg.file_name?.trim() || 'Documento';
  if (type === 'sticker') return 'Figurinha';
  if (msg.media_url) return 'Mídia';
  return 'Mensagem';
}

function countMediaMessages(messages: WaLinkMessage[]): number {
  return messages.filter((m) => {
    const type = (m.message_type || 'text').toLowerCase();
    return Boolean(m.media_url) || (type !== 'text' && type !== 'chat');
  }).length;
}

export type WaLinkContactProfile = {
  displayName: string;
  phone: string;
  avatarInitial: string;
  clientId: string;
  documentLabel: string | null;
  companyName: string;
  recado: string;
  mediaCount: number;
  messageCount: number;
  operationalMode: 'route' | 'quotes' | 'general';
  operationalSummary: string;
  primaryRoute: WaLinkCustomerRouteSummary | null;
};

export function buildWaLinkContactProfile(input: {
  conversation: WaLinkConversation;
  companyId: string;
  snapshot: WaLinkCustomerContextSnapshot | null;
  messages: WaLinkMessage[];
}): WaLinkContactProfile {
  const { conversation, companyId, snapshot, messages } = input;
  const head = waLinkThreadHeadLines(conversation.sender_name, conversation.sender_number);
  const displayName =
    conversation.sender_name?.trim() && !isWaLinkOpaqueNumber(conversation.sender_number)
      ? conversation.sender_name.trim()
      : head.title;
  const phone = formatWaPhoneLine(conversation.sender_number);
  const avatarInitial = waLinkAvatarInitial(displayName, conversation.sender_number);

  const metadata = conversation.metadata;
  const companyName =
    snapshot?.companyName?.trim() ||
    readMetaString(metadata, 'company_name') ||
    readMetaString(metadata, 'companyName') ||
    '';

  const inbound = [...messages]
    .filter((m) => m.direction === 'inbound' || m.direction === 'incoming')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const lastInbound = inbound[0];
  const notes = readMetaString(metadata, 'notes');
  const metaPreview = readMetaString(metadata, 'last_preview');

  let recado = notes || (lastInbound ? messagePreview(lastInbound) : '');
  if (!recado && metaPreview) recado = metaPreview;
  if (!recado) recado = 'Sem recado';

  const primaryRoute = snapshot?.routes?.[0] ?? null;
  const pendingQuotes = (snapshot?.quotes ?? []).filter((q) => {
    const s = (q.status || '').toLowerCase();
    return s.includes('pend') || s.includes('aguard') || s.includes('open') || s.includes('draft');
  });

  let operationalMode: WaLinkContactProfile['operationalMode'] = 'general';
  let operationalSummary = snapshot?.productsLabel || 'Sem histórico operacional associado';

  if (primaryRoute) {
    operationalMode = 'route';
    const dest = primaryRoute.dest || primaryRoute.origin || primaryRoute.label;
    operationalSummary = `${primaryRoute.statusLabel}${dest ? ` · ${dest}` : ''}`;
  } else if ((snapshot?.quotes?.length ?? 0) > 0) {
    operationalMode = 'quotes';
    const count = snapshot!.quotes.length;
    const pending = pendingQuotes.length;
    operationalSummary =
      pending > 0
        ? `${pending} orçamento${pending > 1 ? 's' : ''} pendente${pending > 1 ? 's' : ''} · financeiro`
        : `${count} orçamento${count > 1 ? 's' : ''} · ${snapshot!.quotes[0]?.label || 'comercial'}`;
  } else if (lastInbound) {
    operationalSummary = `Última mensagem: ${messagePreview(lastInbound).slice(0, 120)}`;
  }

  return {
    displayName,
    phone,
    avatarInitial,
    clientId: shortClientId(conversation, companyId),
    documentLabel: resolveDocumentLabel(metadata),
    companyName,
    recado,
    mediaCount: countMediaMessages(messages),
    messageCount: messages.length,
    operationalMode,
    operationalSummary,
    primaryRoute,
  };
}

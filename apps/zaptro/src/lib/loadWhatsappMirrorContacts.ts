import { ZAPTRO_DEMO_MIRROR_CONTACTS } from '../constants/zaptroContactsDemo';
import { isZaptroPreviewDataEnabled } from './zaptroPreviewMode';
import {
  dispatchWhatsappContactsSynced,
  fetchWhatsappMirrorContacts,
  type LoadMirrorContactsSource,
  type WhatsappMirrorContact,
} from './zaptroWhatsappMirrorContacts';
import { getEvolutionLiveStatus } from '../services/evolution';
import { resolveCompanyWhatsappInstance } from './whatsappInbox';
import { readWaLinkSession } from '../modules/wa-link/waLinkConfig';

export type LoadMirrorContactsResult = {
  contacts: WhatsappMirrorContact[];
  connected: boolean;
  source: LoadMirrorContactsSource;
  hint?: string;
};

/** Carrega contactos espelhados (Evolution). Em dev, exemplos se a API não devolver nada. */
export async function loadWhatsappMirrorContacts(options: {
  companyId: string;
  userId?: string | null;
  /** Dispara evento global após carregar (ex.: pós QR). */
  notify?: boolean;
}): Promise<LoadMirrorContactsResult> {
  const session = readWaLinkSession();
  const instance =
    session.instance?.trim() || (await resolveCompanyWhatsappInstance(options.companyId, options.userId));

  let connected = false;
  try {
    const live = await getEvolutionLiveStatus(instance);
    connected = live.connected;
  } catch {
    connected = Boolean(session.connectedAt);
  }

  if (!connected) {
    return {
      contacts: [],
      connected: false,
      source: 'none',
      hint: 'Ligue o WhatsApp em Configurações → WhatsApp (QR Code).',
    };
  }

  const fromEvolution = await fetchWhatsappMirrorContacts({
    companyId: options.companyId,
    userId: options.userId,
  });

  let result: LoadMirrorContactsResult;

  if (fromEvolution.length > 0) {
    result = { contacts: fromEvolution, connected: true, source: 'evolution' };
  } else if (isZaptroPreviewDataEnabled()) {
    result = {
      contacts: ZAPTRO_DEMO_MIRROR_CONTACTS,
      connected: true,
      source: 'demo',
      hint: 'Pré-visualização — exemplos enquanto a Evolution não devolve a agenda (verifique /chat/findContacts na VPS).',
    };
  } else {
    result = {
      contacts: [],
      connected: true,
      source: 'none',
      hint: 'WhatsApp ligado, mas nenhum contacto devolvido pela Evolution. Confirme a agenda no telemóvel e actualize.',
    };
  }

  if (options.notify) {
    dispatchWhatsappContactsSynced({
      count: result.contacts.length,
      source: result.source,
      companyId: options.companyId,
    });
  }

  return result;
}

/** Após QR / ligação — actualiza espelho de contactos (não grava no CRM). */
export async function syncWhatsappMirrorContactsAfterConnect(options: {
  companyId: string;
  userId?: string | null;
}): Promise<LoadMirrorContactsResult> {
  return loadWhatsappMirrorContacts({ ...options, notify: true });
}
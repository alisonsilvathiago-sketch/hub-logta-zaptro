import type { ZaptroDemoClientRow } from '../constants/zaptroClientsDemo';
import { isZaptroDemoClientId } from '../constants/zaptroClientsDemo';
import { normalizeWaPhoneDigits } from '../modules/wa-link/waLinkRegisterClient';
import { supabaseZaptro } from './supabase-zaptro';

export type ZaptroClientProfileMetadata = {
  company_name: string;
  email?: string;
  notes?: string;
  last_event?: string;
  address?: string;
  cpf?: string | null;
  cnpj?: string | null;
  document_type?: 'cpf' | 'cnpj';
  blocked?: boolean;
};

export type ZaptroClientProfileEditForm = {
  responsibleName: string;
  companyName: string;
  phone: string;
  email: string;
  documentType: 'cpf' | 'cnpj' | '';
  document: string;
  address: string;
  notes: string;
  avatarUrl: string | null;
};

const DEMO_OVERRIDES_KEY = 'zaptro_client_profile_demo_overrides';

type DemoOverride = {
  sender_name?: string;
  sender_number?: string;
  customer_avatar?: string | null;
  metadata?: Partial<ZaptroClientProfileMetadata>;
  blocked?: boolean;
  hidden?: boolean;
};

const DEMO_HIDDEN_KEY = 'zaptro_client_profile_demo_hidden';

function readDemoOverridesMap(): Record<string, DemoOverride> {
  try {
    const raw = localStorage.getItem(DEMO_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, DemoOverride>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeDemoOverridesMap(map: Record<string, DemoOverride>) {
  localStorage.setItem(DEMO_OVERRIDES_KEY, JSON.stringify(map));
}

function readDemoHiddenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DEMO_HIDDEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeDemoHiddenIds(ids: Set<string>) {
  localStorage.setItem(DEMO_HIDDEN_KEY, JSON.stringify([...ids]));
}

export function isDemoClientHidden(clientId: string): boolean {
  return readDemoHiddenIds().has(clientId);
}

export function applyDemoClientOverride(client: ZaptroDemoClientRow): ZaptroDemoClientRow {
  const o = readDemoOverridesMap()[client.id];
  if (!o) return client;
  const blocked = o.blocked ?? o.metadata?.blocked ?? client.metadata.blocked;
  return {
    ...client,
    sender_name: o.sender_name ?? client.sender_name,
    sender_number: o.sender_number ?? client.sender_number,
    customer_avatar: o.customer_avatar !== undefined ? o.customer_avatar : client.customer_avatar,
    metadata: {
      ...client.metadata,
      ...(o.metadata || {}),
      blocked,
    },
  };
}

export function isClientBlocked(client: { metadata: ZaptroClientProfileMetadata }): boolean {
  return Boolean(client.metadata?.blocked);
}

export async function setClientBlocked(
  companyId: string,
  clientId: string,
  blocked: boolean,
  prevMetadata: ZaptroClientProfileMetadata,
): Promise<void> {
  if (isZaptroDemoClientId(clientId)) {
    const map = readDemoOverridesMap();
    const prev = map[clientId] || {};
    map[clientId] = {
      ...prev,
      blocked,
      metadata: { ...(prev.metadata || {}), blocked },
    };
    writeDemoOverridesMap(map);
    return;
  }

  const metadata = { ...prevMetadata, blocked };
  const { error } = await supabaseZaptro
    .from('whatsapp_conversations')
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq('id', clientId)
    .eq('company_id', companyId);
  if (error) throw error;
}

export async function deleteClientProfile(companyId: string, clientId: string): Promise<void> {
  if (isZaptroDemoClientId(clientId)) {
    const hidden = readDemoHiddenIds();
    hidden.add(clientId);
    writeDemoHiddenIds(hidden);
    return;
  }

  const { error } = await supabaseZaptro
    .from('whatsapp_conversations')
    .delete()
    .eq('id', clientId)
    .eq('company_id', companyId);
  if (error) throw error;
}

export function clientToEditForm(client: {
  sender_name: string;
  sender_number: string;
  customer_avatar?: string | null;
  metadata: ZaptroClientProfileMetadata;
}): ZaptroClientProfileEditForm {
  const meta = client.metadata;
  const docType = meta.document_type || (meta.cnpj ? 'cnpj' : meta.cpf ? 'cpf' : '');
  const doc = meta.cnpj || meta.cpf || '';
  return {
    responsibleName: client.sender_name || '',
    companyName: meta.company_name || '',
    phone: client.sender_number || '',
    email: meta.email || '',
    documentType: docType,
    document: doc,
    address: meta.address || '',
    notes: meta.notes || '',
    avatarUrl: client.customer_avatar ?? null,
  };
}

function buildMetadataFromForm(form: ZaptroClientProfileEditForm, prev: ZaptroClientProfileMetadata): ZaptroClientProfileMetadata {
  const docDigits = form.document.replace(/\D/g, '');
  const meta: ZaptroClientProfileMetadata = {
    ...prev,
    company_name: form.companyName.trim(),
    email: form.email.trim() || undefined,
    notes: form.notes.trim() || undefined,
    address: form.address.trim() || undefined,
    document_type: form.documentType === 'cpf' || form.documentType === 'cnpj' ? form.documentType : undefined,
    cpf: null,
    cnpj: null,
  };
  if (docDigits && form.documentType === 'cpf') {
    meta.cpf = docDigits;
    meta.cnpj = null;
  } else if (docDigits && form.documentType === 'cnpj') {
    meta.cnpj = docDigits;
    meta.cpf = null;
  } else if (!docDigits) {
    meta.cpf = null;
    meta.cnpj = null;
  }
  return meta;
}

export async function saveClientProfileEdit(
  companyId: string,
  clientId: string,
  form: ZaptroClientProfileEditForm,
  prevMetadata: ZaptroClientProfileMetadata,
): Promise<void> {
  const name = form.responsibleName.trim();
  const phone = normalizeWaPhoneDigits(form.phone);
  if (!name) throw new Error('Informe o nome do responsável.');
  if (phone.length < 12) throw new Error('Informe um telefone válido com DDD.');

  const metadata = buildMetadataFromForm(form, prevMetadata);
  const now = new Date().toISOString();

  if (isZaptroDemoClientId(clientId)) {
    const map = readDemoOverridesMap();
    map[clientId] = {
      sender_name: name,
      sender_number: phone,
      customer_avatar: form.avatarUrl,
      metadata,
    };
    writeDemoOverridesMap(map);
    return;
  }

  const { error } = await supabaseZaptro
    .from('whatsapp_conversations')
    .update({
      sender_name: name,
      sender_number: phone,
      customer_avatar: form.avatarUrl,
      metadata,
      updated_at: now,
    })
    .eq('id', clientId)
    .eq('company_id', companyId);

  if (error) throw error;
}

/** Tenta obter foto do WhatsApp (coluna customer_avatar) pelo telefone, se ainda não houver. */
export async function fetchContactAvatarByPhone(
  companyId: string,
  phone: string,
): Promise<string | null> {
  const digits = normalizeWaPhoneDigits(phone);
  if (!digits) return null;
  const { data } = await supabaseZaptro
    .from('whatsapp_conversations')
    .select('customer_avatar')
    .eq('company_id', companyId)
    .eq('sender_number', digits)
    .not('customer_avatar', 'is', null)
    .limit(1)
    .maybeSingle();
  const url = data?.customer_avatar;
  return typeof url === 'string' && url.trim() ? url.trim() : null;
}

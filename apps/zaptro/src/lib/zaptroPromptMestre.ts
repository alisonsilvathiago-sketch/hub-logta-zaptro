import {
  buildZaptroPromptMestreSystemPrompt,
  getDefaultZaptroPromptMestreBody,
  getZaptroLlama32MasterSystemPrompt,
  ZAPTRO_PROMPT_MESTRE_SETTINGS_KEY,
  type ZaptroPromptMestreCompanyContext,
  type ZaptroPromptMestreScope,
  type ZaptroPromptMestreTone,
} from '../constants/zaptroPromptMestre';
import { supabaseZaptro } from './supabase-zaptro';

export const ZAPTRO_CHATBOT_PREFS_STORAGE_KEY = 'zaptro_chatbot_prefs_v1';

export type ZaptroPromptMestrePrefs = {
  scope: ZaptroPromptMestreScope;
  systemPrompt: string;
  tone: ZaptroPromptMestreTone;
  quietHours: boolean;
  signOff: string;
  /** Resposta automática no WhatsApp via webhook + Ollama (fase 2). */
  autoReplyWhatsapp?: boolean;
  updatedAt?: string;
};

export const DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS: ZaptroPromptMestrePrefs = {
  scope: 'master',
  systemPrompt: getDefaultZaptroPromptMestreBody('master'),
  tone: 'profissional',
  quietHours: false,
  signOff: '— Equipa comercial',
  autoReplyWhatsapp: true,
};

function chatbotPrefsStorageKey(companyId: string | null | undefined): string {
  return `${ZAPTRO_CHATBOT_PREFS_STORAGE_KEY}_${companyId || 'local'}`;
}

function isScope(v: unknown): v is ZaptroPromptMestreScope {
  return v === 'master' || v === 'zaptro' || v === 'transportadora';
}

function normalizeScope(v: unknown): ZaptroPromptMestreScope {
  if (isScope(v)) return v;
  return 'master';
}

function isTone(v: unknown): v is ZaptroPromptMestreTone {
  return (
    v === 'profissional' ||
    v === 'amigavel' ||
    v === 'direto' ||
    v === 'comercial' ||
    v === 'tecnico' ||
    v === 'corporativo'
  );
}

function normalizePrefs(raw: unknown): ZaptroPromptMestrePrefs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS };
  }
  const j = raw as Record<string, unknown>;
  const scope = normalizeScope(j.scope);
  const systemPrompt =
    typeof j.systemPrompt === 'string' && j.systemPrompt.trim()
      ? j.systemPrompt
      : getDefaultZaptroPromptMestreBody(scope);
  return {
    scope,
    systemPrompt,
    tone: isTone(j.tone) ? j.tone : DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS.tone,
    quietHours: typeof j.quietHours === 'boolean' ? j.quietHours : DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS.quietHours,
    signOff: typeof j.signOff === 'string' ? j.signOff : DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS.signOff,
    autoReplyWhatsapp: j.autoReplyWhatsapp !== false,
    updatedAt: typeof j.updatedAt === 'string' ? j.updatedAt : undefined,
  };
}

/** Lê preferências do localStorage (rascunho / fallback offline). */
export function readZaptroPromptMestreFromStorage(companyId: string | null | undefined): ZaptroPromptMestrePrefs {
  try {
    const raw = localStorage.getItem(chatbotPrefsStorageKey(companyId));
    if (!raw) return { ...DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizePrefs(parsed);
  } catch {
    return { ...DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS };
  }
}

export function writeZaptroPromptMestreToStorage(
  companyId: string | null | undefined,
  prefs: ZaptroPromptMestrePrefs,
): void {
  const payload = { ...prefs, updatedAt: new Date().toISOString() };
  localStorage.setItem(chatbotPrefsStorageKey(companyId), JSON.stringify(payload));
}

/** Lê `companies.settings.zaptro_prompt_mestre` quando existir. */
export function readZaptroPromptMestreFromCompanySettings(
  company: { settings?: unknown } | null | undefined,
): ZaptroPromptMestrePrefs | null {
  const settings = company?.settings;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return null;
  const raw = (settings as Record<string, unknown>)[ZAPTRO_PROMPT_MESTRE_SETTINGS_KEY];
  if (!raw) return null;
  return normalizePrefs(raw);
}

export function companyToPromptMestreContext(
  company: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    opening_hours?: string | null;
    description?: string | null;
  } | null | undefined,
): ZaptroPromptMestreCompanyContext | null {
  if (!company) return null;
  return {
    name: company.name,
    phone: company.phone,
    email: company.email,
    website: company.website,
    openingHours: company.opening_hours,
    description: company.description,
  };
}

/** Preferência efectiva: Supabase → localStorage → defaults. */
export function resolveZaptroPromptMestrePrefs(
  company: { id?: string; settings?: unknown } | null | undefined,
): ZaptroPromptMestrePrefs {
  const fromDb = readZaptroPromptMestreFromCompanySettings(company);
  if (fromDb) return fromDb;
  return readZaptroPromptMestreFromStorage(company?.id);
}

export function buildEffectiveZaptroPromptMestreSystemPrompt(
  company: {
    id?: string;
    settings?: unknown;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    opening_hours?: string | null;
    description?: string | null;
  } | null | undefined,
): string {
  const prefs = resolveZaptroPromptMestrePrefs(company);
  return getZaptroLlama32MasterSystemPrompt(companyToPromptMestreContext(company), {
    scope: prefs.scope,
    systemPrompt: prefs.systemPrompt,
    tone: prefs.tone,
    signOff: prefs.signOff,
    quietHours: prefs.quietHours,
  });
}

export async function saveZaptroPromptMestrePrefs(
  companyId: string,
  prefs: ZaptroPromptMestrePrefs,
  existingSettings: Record<string, unknown> | undefined,
): Promise<ZaptroPromptMestrePrefs> {
  const payload: ZaptroPromptMestrePrefs = {
    ...prefs,
    updatedAt: new Date().toISOString(),
  };

  writeZaptroPromptMestreToStorage(companyId, payload);

  const { error } = await supabaseZaptro
    .from('companies')
    .update({
      settings: {
        ...(existingSettings ?? {}),
        [ZAPTRO_PROMPT_MESTRE_SETTINGS_KEY]: payload,
      },
    })
    .eq('id', companyId);

  if (error) throw error;
  return payload;
}

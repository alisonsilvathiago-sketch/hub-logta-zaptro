/**
 * Assistente Zaptro via Ollama (somente dev em localhost:5174).
 *
 * O browser NUNCA deve chamar `http://127.0.0.1:11434` se o Ollama está na VPS —
 * isso aponta para o seu Mac, não para o servidor.
 *
 * Use sempre `VITE_OLLAMA_BASE_URL=/ollama-api` e configure no `.env.local`:
 * `OLLAMA_PROXY_TARGET=http://IP_DA_VPS:11434`
 */

import { isZaptroLocalhost } from '../utils/zaptroDevBypass';
import {
  ZAPTRO_OLLAMA_DEFAULT_MODEL,
  ZAPTRO_OLLAMA_DEV_PROXY_PATH,
  ZAPTRO_OLLAMA_VPS_BASE_URL,
  ZAPTRO_OLLAMA_VPS_LABEL,
} from '../constants/zaptroOllamaConfig';

const DEFAULT_BASE = ZAPTRO_OLLAMA_DEV_PROXY_PATH;
const DEFAULT_MODEL = ZAPTRO_OLLAMA_DEFAULT_MODEL;
const FALLBACK_MODELS = ['llama3.2', 'llama3.1', 'llama3', 'llama2'] as const;

let cachedWorkingBase: string | null = null;
let cachedResolvedModel: string | null = null;

function ollamaBaseUrlFromEnv(): string {
  const raw = (import.meta.env.VITE_OLLAMA_BASE_URL as string | undefined)?.trim();
  return raw || DEFAULT_BASE;
}

/** Só rotas relativas (proxy Vite). URLs absolutas só se definidas explicitamente. */
function ollamaBaseCandidates(): string[] {
  const fromEnv = ollamaBaseUrlFromEnv().replace(/\/$/, '');
  const list = [cachedWorkingBase, DEFAULT_BASE, fromEnv].filter(Boolean) as string[];
  return [...new Set(list)];
}

export function ollamaModelPrimary(): string {
  return cachedResolvedModel || (import.meta.env.VITE_OLLAMA_MODEL as string | undefined)?.trim() || DEFAULT_MODEL;
}

export function isOllamaCopilotPreferred(): boolean {
  if (import.meta.env.VITE_OLLAMA_ENABLED === 'false') return false;
  if (!import.meta.env.DEV) return false;
  return import.meta.env.VITE_OLLAMA_ENABLED === 'true' || isZaptroLocalhost();
}

function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => window.clearTimeout(timer));
}

type OllamaTagsResponse = { models?: Array<{ name?: string; model?: string }> };

function normalizeModelName(raw: string): string {
  return raw.replace(/^models\//, '').split(':')[0]?.trim() || raw;
}

function pickModelFromTags(models: string[], preferred: string): string {
  if (models.length === 0) return preferred;
  const norm = models.map(normalizeModelName);
  const want = normalizeModelName(preferred);
  const exact = norm.find((m) => m === want);
  if (exact) return exact;
  const partial = norm.find((m) => m.startsWith(want) || want.startsWith(m));
  if (partial) return partial;
  const llama = norm.find((m) => m.includes('llama'));
  if (llama) return llama;
  return norm[0]!;
}

async function fetchTags(base: string): Promise<string[] | null> {
  try {
    const res = await fetchWithTimeout(`${base.replace(/\/$/, '')}/api/tags`, { method: 'GET' });
    if (!res.ok) return null;
    const data = (await res.json()) as OllamaTagsResponse;
    return (data.models ?? []).map((m) => m.name || m.model || '').filter(Boolean);
  } catch {
    return null;
  }
}

export type OllamaPingResult = {
  online: boolean;
  baseUrl: string | null;
  models: string[];
  resolvedModel: string;
};

export async function pingOllamaLocal(): Promise<boolean> {
  const r = await pingOllamaDetailed();
  return r.online;
}

export async function pingOllamaDetailed(): Promise<OllamaPingResult> {
  const preferred =
    (import.meta.env.VITE_OLLAMA_MODEL as string | undefined)?.trim() || DEFAULT_MODEL;

  for (const base of ollamaBaseCandidates()) {
    if (/^https?:\/\//i.test(base) && !import.meta.env.VITE_OLLAMA_ALLOW_REMOTE) {
      continue;
    }
    const models = await fetchTags(base);
    if (models === null) continue;

    cachedWorkingBase = base.replace(/\/$/, '');
    cachedResolvedModel = pickModelFromTags(models, preferred);

    return {
      online: true,
      baseUrl: cachedWorkingBase,
      models: models.map(normalizeModelName),
      resolvedModel: cachedResolvedModel,
    };
  }

  cachedWorkingBase = null;
  return {
    online: false,
    baseUrl: null,
    models: [],
    resolvedModel: preferred,
  };
}

function workingBase(): string {
  return (cachedWorkingBase || ollamaBaseUrlFromEnv()).replace(/\/$/, '');
}

export function ollamaOfflineHelp(): string {
  return (
    `O Zaptro não alcançou o Ollama via ${ZAPTRO_OLLAMA_DEV_PROXY_PATH} (proxy do Vite).\n\n` +
    `VPS (${ZAPTRO_OLLAMA_VPS_LABEL}):\n` +
    `1. Na VPS: curl http://127.0.0.1:11434/api/tags && ollama list\n` +
    '2. No Mac, em apps/zaptro/.env.local:\n' +
    `   OLLAMA_PROXY_TARGET=${ZAPTRO_OLLAMA_VPS_BASE_URL}\n` +
    '   (porta 11434 aberta no firewall da VPS)\n' +
    '3. Reinicie: npm run dev --prefix apps/zaptro\n' +
    '4. Teste: curl http://localhost:5174/ollama-api/api/tags\n' +
    '5. Abra http://localhost:5174/app\n\n' +
    'Se Ollama está no mesmo Mac: OLLAMA_PROXY_TARGET=http://127.0.0.1:11434\n\n' +
    'Documentação: apps/zaptro/OLLAMA_SETUP.md'
  );
}

export type OllamaChatTurn = { role: 'user' | 'assistant'; content: string };

export async function chatOllamaCopilot(opts: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  history?: OllamaChatTurn[];
}): Promise<string> {
  const ping = await pingOllamaDetailed();
  if (!ping.online) {
    throw new Error(ollamaOfflineHelp());
  }

  const base = workingBase();
  const preferred = opts.model || ping.resolvedModel || ollamaModelPrimary();
  const modelsToTry = [
    preferred,
    ...FALLBACK_MODELS.filter((m) => normalizeModelName(m) !== normalizeModelName(preferred)),
  ];

  const history = (opts.history ?? []).filter((m) => m.content.trim());
  const ollamaMessages = [
    { role: 'system' as const, content: opts.systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: opts.userMessage },
  ];

  let lastErr: unknown;
  for (const model of modelsToTry) {
    try {
      const text = await chatOnce(base, model, ollamaMessages);
      if (text.trim()) {
        cachedResolvedModel = model;
        return text.trim();
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Ollama indisponível');
}

async function chatOnce(
  base: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const res = await fetchWithTimeout(
    `${base}/api/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    },
    120000,
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      body.includes('not found') || res.status === 404
        ? `Modelo "${model}" não encontrado. Na VPS: ollama pull ${model}`
        : `Ollama HTTP ${res.status}`,
    );
  }

  const data = (await res.json()) as { message?: { content?: string }; response?: string };
  return data.message?.content ?? data.response ?? '';
}

import type { LogstokaConfig } from '../../config.js';

const DEFAULT_OLLAMA = 'http://108.174.151.98:11434';
const DEFAULT_MODEL = 'llama3.2:latest';

export type OllamaChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };

function ollamaBase(): string {
  return (process.env.LOGSTOKA_OLLAMA_URL?.trim() || DEFAULT_OLLAMA).replace(/\/$/, '');
}

function ollamaModel(): string {
  return process.env.LOGSTOKA_OLLAMA_MODEL?.trim() || DEFAULT_MODEL;
}

export async function pingOllama(): Promise<{ online: boolean; model: string; base: string }> {
  const base = ollamaBase();
  const model = ollamaModel();
  try {
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(8000) });
    return { online: res.ok, model, base };
  } catch {
    return { online: false, model, base };
  }
}

export async function generateOllamaJson<T>(cfg: LogstokaConfig, prompt: string): Promise<T> {
  const base = ollamaBase();
  const model = ollamaModel();
  const res = await fetch(`${base}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, format: 'json' }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Ollama indisponível (${res.status})`);
  const data = (await res.json()) as { response?: string };
  return JSON.parse(data.response ?? '{}') as T;
}

export async function chatOllama(
  _cfg: LogstokaConfig,
  params: {
    systemPrompt: string;
    userMessage: string;
    history?: OllamaChatTurn[];
  },
): Promise<string> {
  const base = ollamaBase();
  const model = ollamaModel();
  const messages: OllamaChatTurn[] = [
    { role: 'system', content: params.systemPrompt },
    ...(params.history ?? []).filter((t) => t.role !== 'system'),
    { role: 'user', content: params.userMessage },
  ];

  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const fallback = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `${params.systemPrompt}\n\nUtilizador: ${params.userMessage}\n\nAssistente:`,
        stream: false,
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (!fallback.ok) throw new Error(`Ollama indisponível (${res.status})`);
    const fb = (await fallback.json()) as { response?: string };
    return (fb.response ?? '').trim();
  }

  const data = (await res.json()) as { message?: { content?: string } };
  return (data.message?.content ?? '').trim();
}

/** Descrição de imagem via Ollama (modelo com suporte a visão). Falha silenciosa se indisponível. */
export async function describeImageWithOllama(
  _cfg: LogstokaConfig,
  base64: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const base = ollamaBase();
  const model = ollamaModel();
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
          images: [base64],
        },
      ],
      stream: false,
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!res.ok) {
    throw new Error(`Visão indisponível (${res.status})`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const text = (data.message?.content ?? '').trim();
  if (!text) throw new Error('Resposta vazia');
  return `[Imagem ${mimeType}] ${text}`;
}

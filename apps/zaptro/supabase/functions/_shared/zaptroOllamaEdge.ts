export type OllamaChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

const DEFAULT_BASE = 'http://108.174.151.98:11434';
const DEFAULT_MODEL = 'llama3.2';

export function ollamaBaseUrl(): string {
  return (Deno.env.get('OLLAMA_BASE_URL')?.trim() || DEFAULT_BASE).replace(/\/+$/, '');
}

export function ollamaModel(): string {
  return Deno.env.get('OLLAMA_MODEL')?.trim() || DEFAULT_MODEL;
}

export function isOllamaConfigured(): boolean {
  return Deno.env.get('ZAPTRO_WA_AUTO_REPLY') !== 'false';
}

export async function chatOllamaWithHistory(opts: {
  systemPrompt: string;
  history: OllamaChatMessage[];
  model?: string;
  timeoutMs?: number;
}): Promise<string> {
  const base = ollamaBaseUrl();
  const model = opts.model || ollamaModel();
  const messages: OllamaChatMessage[] = [
    { role: 'system', content: opts.systemPrompt },
    ...opts.history.filter((m) => m.content.trim()),
  ];

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 90_000);
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({ model, messages, stream: false }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Ollama HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as { message?: { content?: string }; response?: string };
    const text = (data.message?.content ?? data.response ?? '').trim();
    if (!text) throw new Error('Ollama devolveu resposta vazia');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

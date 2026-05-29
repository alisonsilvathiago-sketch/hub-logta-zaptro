function evolutionBaseUrl(): string {
  const url = Deno.env.get('EVOLUTION_API_URL')?.trim();
  if (!url) throw new Error('EVOLUTION_API_URL em falta nos secrets da Edge');
  return url.replace(/\/+$/, '');
}

function evolutionApiKey(): string {
  const instanceKey = Deno.env.get('EVOLUTION_INSTANCE_API_KEY')?.replace(/\s/g, '');
  if (instanceKey) return instanceKey;
  const global = Deno.env.get('EVOLUTION_API_KEY')?.replace(/\s/g, '');
  if (!global) throw new Error('EVOLUTION_API_KEY ou EVOLUTION_INSTANCE_API_KEY em falta');
  return global;
}

function sanitizeInstance(name: string): string {
  const s = name.replace(/[^a-zA-Z0-9-_]/g, '').trim();
  if (!s) throw new Error('Nome de instância inválido');
  return s;
}

function isGoMode(): boolean {
  const mode = (Deno.env.get('EVOLUTION_API_MODE') ?? 'go').toLowerCase();
  return mode !== 'legacy' && mode !== 'evolution-api';
}

/** Envia texto WhatsApp via Evolution GO (ou legacy). */
export async function sendEvolutionText(opts: {
  instanceName: string;
  number: string;
  text: string;
}): Promise<{ ok: boolean; status: number; data: unknown }> {
  const base = evolutionBaseUrl();
  const key = evolutionApiKey();
  const instance = sanitizeInstance(opts.instanceName);
  const go = isGoMode();
  const path = go ? '/send/text' : `/message/sendText/${instance}`;
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    instance,
    instanceName: instance,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ number: opts.number.replace(/\D/g, ''), text: opts.text }),
  });

  const raw = await res.text();
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { raw };
  }

  return { ok: res.ok, status: res.status, data };
}

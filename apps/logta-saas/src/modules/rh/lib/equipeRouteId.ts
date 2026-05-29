import type { ColaboradorRhProfile } from '../ponto/colaboradorRhStorage';

/** Apenas dígitos — usado na URL `/rh/equipe/:id` para evitar confusão entre homônimos. */
export function normalizeEquipeRouteId(raw: string): string {
  const t = decodeURIComponent(raw).trim();
  if (!t) return '';
  if (/^\d{6,14}$/.test(t)) return t;
  if (t.startsWith('colab-')) {
    const d = t.slice(6).replace(/\D/g, '');
    if (d.length >= 6) return d;
  }
  return t;
}

export function cpfDigits(document?: string): string {
  return (document ?? '').replace(/\D/g, '');
}

/** ID estável numérico para rota (prioridade: CPF → matrícula RH → código derivado). */
export function buildEquipeRouteId(profile: Pick<
  ColaboradorRhProfile,
  'id' | 'document' | 'equipeMatricula' | 'email'
>): string {
  const cpf = cpfDigits(profile.document);
  if (cpf.length >= 6) return cpf;

  const mat = (profile.equipeMatricula ?? '').replace(/\D/g, '');
  if (mat.length >= 4) return mat;

  const fromColab = profile.id.startsWith('colab-') ? profile.id.slice(6).replace(/\D/g, '') : '';
  if (fromColab.length >= 6) return fromColab;

  let hash = 0;
  const seed = profile.email || profile.id;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return String(100000 + (hash % 899900));
}

export function formatEquipeDisplayId(routeId: string): string {
  const n = normalizeEquipeRouteId(routeId);
  if (/^\d+$/.test(n)) return `#${n}`;
  return n;
}

export function equipeProfileUrl(routeId: string | undefined | null): string {
  const id = resolveEquipeListRouteId({
    equipeRouteId: routeId ?? undefined,
    id: routeId ?? undefined,
    full_name: 'colaborador',
  });
  return `/rh/equipe/${encodeURIComponent(id)}`;
}

function hashRouteFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return String(100000 + (hash % 899900));
}

/** Garante ID de URL válido (nunca `undefined` na rota). */
export function resolveEquipeListRouteId(item: {
  equipeRouteId?: string;
  id?: string;
  full_name: string;
  email?: string;
  document?: string;
  rhProfileId?: string;
}): string {
  const candidates = [item.equipeRouteId, item.id, item.rhProfileId].filter(
    (v): v is string => Boolean(v) && v !== 'undefined',
  );

  for (const raw of candidates) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 6) return digits;
    if (raw.startsWith('colab-')) {
      const d = raw.slice(6).replace(/\D/g, '');
      if (d.length >= 6) return d;
    }
    if (raw.startsWith('mot-') || raw.startsWith('prof-')) return raw;
  }

  const doc = cpfDigits(item.document);
  if (doc.length >= 6) return doc;

  return hashRouteFromSeed(item.email || item.full_name || item.rhProfileId || 'rh');
}

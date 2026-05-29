/** Ajudantes de campo — podem rodar entre motoristas (demo / pré-visualização). */

export type ZaptroHelperEmployment = 'empresa' | 'agregado';

export type ZaptroHelperDemo = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  photo_url?: string;
  employment: ZaptroHelperEmployment;
  status: 'ativo' | 'inativo' | 'bloqueado';
  joinedAt?: string;
  notes?: string;
};

const HIDDEN_KEY = 'zaptro_demo_helpers_hidden_v1';
const EDITS_KEY = 'zaptro_demo_helpers_edits_v1';

export const ZAPTRO_DEMO_HELPERS: ZaptroHelperDemo[] = [
  {
    id: 'zaptro-helper-1',
    name: 'Ricardo Souza',
    phone: '5511988112233',
    email: 'ricardo@transporte.demo',
    cpf: '123.456.789-01',
    employment: 'empresa',
    status: 'ativo',
    joinedAt: '2024-06-01',
    photo_url: 'https://i.pravatar.cc/150?u=ricardo-helper',
  },
  {
    id: 'zaptro-helper-2',
    name: 'Paulo Mendes',
    phone: '5511977223344',
    cpf: '987.654.321-00',
    employment: 'agregado',
    status: 'ativo',
    joinedAt: '2025-02-10',
    photo_url: 'https://i.pravatar.cc/150?u=paulo-helper',
  },
  {
    id: 'zaptro-helper-3',
    name: 'Lucas Almeida',
    phone: '5511966334455',
    email: 'lucas@transporte.demo',
    employment: 'empresa',
    status: 'ativo',
    joinedAt: '2023-11-20',
    photo_url: 'https://i.pravatar.cc/150?u=lucas-helper',
  },
  {
    id: 'zaptro-helper-4',
    name: 'Diego Rocha',
    phone: '5511955445566',
    employment: 'agregado',
    status: 'inativo',
    joinedAt: '2025-01-05',
    photo_url: 'https://i.pravatar.cc/150?u=diego-helper',
  },
];

export function isZaptroDemoHelperId(id: string): boolean {
  return String(id).startsWith('zaptro-helper-');
}

export function readHiddenZaptroDemoHelperIds(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function hideZaptroDemoHelperId(id: string): void {
  const prev = readHiddenZaptroDemoHelperIds();
  if (prev.includes(id)) return;
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...prev, id]));
}

function readEdits(): Record<string, Partial<ZaptroHelperDemo>> {
  try {
    const raw = localStorage.getItem(EDITS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, Partial<ZaptroHelperDemo>>;
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

export function saveDemoHelperEdit(id: string, patch: Partial<ZaptroHelperDemo>): void {
  const map = readEdits();
  map[id] = { ...map[id], ...patch };
  localStorage.setItem(EDITS_KEY, JSON.stringify(map));
}

function buildHelperRow(id: string, patch: Partial<ZaptroHelperDemo>, base?: ZaptroHelperDemo): ZaptroHelperDemo | null {
  const merged = { ...(base ?? {}), ...patch, id } as ZaptroHelperDemo;
  if (!merged.name?.trim() || !merged.phone?.trim()) return null;
  return {
    id,
    name: merged.name.trim(),
    phone: merged.phone.replace(/\D/g, ''),
    email: merged.email,
    cpf: merged.cpf,
    employment: merged.employment === 'agregado' ? 'agregado' : 'empresa',
    status: merged.status ?? 'ativo',
    joinedAt: merged.joinedAt,
    notes: merged.notes,
    photo_url: merged.photo_url,
  };
}

export function getVisibleDemoHelpers(): ZaptroHelperDemo[] {
  const hidden = new Set(readHiddenZaptroDemoHelperIds());
  const edits = readEdits();
  const base = ZAPTRO_DEMO_HELPERS.filter((h) => !hidden.has(h.id)).map((h) => ({ ...h, ...edits[h.id] }));
  const extraIds = Object.keys(edits).filter((id) => !ZAPTRO_DEMO_HELPERS.some((h) => h.id === id) && !hidden.has(id));
  const extras = extraIds
    .map((id) => buildHelperRow(id, edits[id]))
    .filter((h): h is ZaptroHelperDemo => h != null);
  return [...base, ...extras];
}

export function getZaptroDemoHelper(id: string): ZaptroHelperDemo | undefined {
  if (readHiddenZaptroDemoHelperIds().includes(id)) return undefined;
  const edits = readEdits()[id];
  const base = ZAPTRO_DEMO_HELPERS.find((x) => x.id === id);
  if (base) return { ...base, ...edits };
  if (edits) return buildHelperRow(id, edits) ?? undefined;
  return undefined;
}

export function helperEmploymentLabel(e: ZaptroHelperEmployment): string {
  return e === 'empresa' ? 'Ajudante da empresa' : 'Ajudante do agregado';
}

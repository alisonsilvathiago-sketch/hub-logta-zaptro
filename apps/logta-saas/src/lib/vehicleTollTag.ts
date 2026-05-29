/** Tag de pedágio vinculada à placa — mesma fonte para Fretes, Frota e Financeiro. */

export type VehicleTollTagStatus = 'Ativa' | 'Bloqueada' | 'Pendente';

export type TollTagBrand = 'sem-parar' | 'conectcar' | 'veloe' | 'neutral';

export type VehicleTollTagInfo = {
  plateKey: string;
  hasTag: boolean;
  provider: string;
  plan: string;
  status: VehicleTollTagStatus;
  tagNumber?: string;
  brand: TollTagBrand;
  /** Cor sólida do cartão (estilo tag física). */
  cardBg: string;
  cardFg: string;
  /** Classes legadas para chips/listas. */
  bg: string;
  text: string;
  border: string;
  accent: string;
};

type TagEntry = Omit<VehicleTollTagInfo, 'plateKey' | 'hasTag'> & { tagNumber?: string };

const SEM_PARAR: Omit<TagEntry, 'provider'> = {
  plan: 'Plano Empresa',
  status: 'Ativa',
  brand: 'sem-parar',
  cardBg: '#2563EB',
  cardFg: '#ffffff',
  bg: 'bg-blue-50',
  text: 'text-blue-700',
  border: 'border-blue-200',
  accent: 'bg-[#2563EB]',
};

const CONECTCAR: Omit<TagEntry, 'provider'> = {
  plan: 'Plano Pré-pago',
  status: 'Ativa',
  brand: 'conectcar',
  cardBg: '#1a1a1a',
  cardFg: '#ffffff',
  bg: 'bg-gray-50',
  text: 'text-gray-800',
  border: 'border-gray-300',
  accent: 'bg-gray-900',
};

const VELOE: Omit<TagEntry, 'provider'> = {
  plan: 'Plano Frotas',
  status: 'Ativa',
  brand: 'veloe',
  cardBg: '#2f1f6b',
  cardFg: '#ffffff',
  bg: 'bg-violet-50',
  text: 'text-violet-800',
  border: 'border-violet-200',
  accent: 'bg-[#2f1f6b]',
};

const TAG_BY_PLATE: Record<string, TagEntry & { tagNumber?: string }> = {
  BRA2L22: { ...SEM_PARAR, provider: 'Sem Parar', tagNumber: '009283719-SP' },
  TRK204: { ...CONECTCAR, provider: 'ConectCar', tagNumber: 'CC-882204-01' },
  VAN3341: { ...VELOE, provider: 'Veloe', status: 'Bloqueada', tagNumber: 'VL-3341-FRT' },
  LOG8890: { ...CONECTCAR, provider: 'ConectCar', plan: 'Plano Empresa', tagNumber: 'CC-8890-LOG' },
  SPZ9012: { ...SEM_PARAR, provider: 'Sem Parar', plan: 'Plano Frota', tagNumber: '0099012-SP' },
  SCN5510: { ...VELOE, provider: 'Veloe', plan: 'Plano Básico', tagNumber: 'VL-5510-SCN' },
  CRT7788: { ...CONECTCAR, provider: 'ConectCar', status: 'Pendente', tagNumber: 'CC-7788-CRT' },
  MGC4455: { ...SEM_PARAR, provider: 'Sem Parar', tagNumber: '004455-MGC' },
};

const NO_TAG: TagEntry = {
  provider: 'Sem tag',
  plan: 'Vale-pedágio avulso',
  status: 'Pendente',
  brand: 'neutral',
  cardBg: '#f3f4f6',
  cardFg: '#6b7280',
  bg: 'bg-gray-50',
  text: 'text-gray-600',
  border: 'border-dashed border-gray-300',
  accent: 'bg-gray-400',
};

export function normalizeVehiclePlate(plate?: string) {
  return decodeURIComponent(plate || '')
    .toUpperCase()
    .replace(/[\s.-]/g, '');
}

export function formatVehiclePlateDisplay(plate?: string) {
  const raw = decodeURIComponent(plate || '').toUpperCase().trim();
  if (!raw) return '—';
  const key = normalizeVehiclePlate(raw);
  if (key.length === 7 && /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(key)) {
    return `${key.slice(0, 3)}-${key.slice(3, 4)}${key.slice(4)}`;
  }
  if (key.length >= 7) {
    return `${key.slice(0, 3)}-${key.slice(3)}`;
  }
  return raw;
}

export function getVehicleTollTag(plate?: string): VehicleTollTagInfo {
  const plateKey = normalizeVehiclePlate(plate);
  const entry = plateKey ? TAG_BY_PLATE[plateKey] : undefined;
  if (!entry) {
    return { plateKey, hasTag: false, ...NO_TAG };
  }
  return { plateKey, hasTag: true, ...entry };
}

export function getTollTagProviderForPlate(plate?: string): string {
  const tag = getVehicleTollTag(plate);
  return tag.hasTag ? tag.provider : '—';
}

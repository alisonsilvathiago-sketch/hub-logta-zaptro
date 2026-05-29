import { ZAPTRO_DEMO_DRIVERS, isZaptroDemoDriverId } from '../constants/zaptroDriversDemo';

export type DriverEmploymentType = 'clt' | 'agregado';
export type VehicleOwnershipType = 'empresa' | 'agregado' | 'terceiro';
export type DriverPrimaryIdType = 'phone' | 'email' | 'cpf';
export type DriverOperationalStatus = 'ativo' | 'inativo' | 'bloqueado';

export type ZaptroDriverExtendedProfile = {
  email?: string;
  altPhone?: string;
  address?: string;
  cpf?: string;
  primaryIdType: DriverPrimaryIdType;
  employmentType: DriverEmploymentType;
  joinedAt?: string;
  vehicleOwnership: VehicleOwnershipType;
  hasHelper: boolean;
  helperIds: string[];
  notes?: string;
};

export type ZaptroDriverFullProfile = {
  id: string;
  name: string;
  phone: string;
  vehicle?: string | null;
  status?: string | null;
  photo_url?: string;
  extended: ZaptroDriverExtendedProfile;
};

const STORAGE_KEY = 'zaptro_driver_profile_extended_v1';

const DEMO_DEFAULTS: Record<string, Partial<ZaptroDriverExtendedProfile>> = {
  'zaptro-demo-driver-1': {
    email: 'joao.ferreira@transporte.demo',
    altPhone: '5511987000001',
    address: 'Guarulhos, SP',
    employmentType: 'clt',
    joinedAt: '2024-03-12',
    vehicleOwnership: 'empresa',
    hasHelper: true,
    helperIds: ['zaptro-helper-1'],
    notes: 'Motorista fixo na rota SP → interior.',
  },
  'zaptro-demo-driver-2': {
    email: 'maria.santos@transporte.demo',
    employmentType: 'clt',
    joinedAt: '2023-08-01',
    vehicleOwnership: 'empresa',
    hasHelper: false,
    helperIds: [],
  },
  'zaptro-demo-driver-3': {
    email: 'pedro.costa@agregado.demo',
    employmentType: 'agregado',
    joinedAt: '2025-01-20',
    vehicleOwnership: 'agregado',
    hasHelper: true,
    helperIds: ['zaptro-helper-2', 'zaptro-helper-4'],
    notes: 'Agregado — veículo próprio.',
  },
  'zaptro-demo-driver-4': {
    email: 'ana.oliveira@transporte.demo',
    employmentType: 'clt',
    joinedAt: '2024-11-05',
    vehicleOwnership: 'empresa',
    hasHelper: true,
    helperIds: ['zaptro-helper-3'],
  },
  'zaptro-demo-driver-5': {
    employmentType: 'agregado',
    joinedAt: '2025-06-01',
    vehicleOwnership: 'agregado',
    hasHelper: false,
    helperIds: [],
  },
  'zaptro-demo-driver-6': {
    employmentType: 'agregado',
    joinedAt: '2022-05-18',
    vehicleOwnership: 'terceiro',
    hasHelper: false,
    helperIds: [],
    notes: 'Inactiva — contrato suspenso.',
  },
};

function defaultExtended(driverId?: string): ZaptroDriverExtendedProfile {
  const base = driverId ? DEMO_DEFAULTS[driverId] : undefined;
  return {
    email: base?.email ?? '',
    altPhone: base?.altPhone ?? '',
    address: base?.address ?? '',
    cpf: base?.cpf ?? '',
    primaryIdType: base?.primaryIdType ?? 'phone',
    employmentType: base?.employmentType ?? 'agregado',
    joinedAt: base?.joinedAt ?? new Date().toISOString().slice(0, 10),
    vehicleOwnership: base?.vehicleOwnership ?? 'empresa',
    hasHelper: base?.hasHelper ?? false,
    helperIds: base?.helperIds ? [...base.helperIds] : [],
    notes: base?.notes ?? '',
  };
}

function normPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** ID operacional exibido e usado para validação — telefone, e-mail ou CPF. */
export function resolveDriverOperationalId(row: {
  phone: string;
  extended: ZaptroDriverExtendedProfile;
}): string {
  const ex = row.extended;
  if (ex.primaryIdType === 'cpf' && ex.cpf?.trim()) return ex.cpf.trim();
  if (ex.primaryIdType === 'email' && ex.email?.trim()) return ex.email.trim().toLowerCase();
  return normPhone(row.phone) || row.phone.trim();
}

export function operationalIdTypeLabel(t: DriverPrimaryIdType): string {
  if (t === 'cpf') return 'CPF';
  if (t === 'email') return 'E-mail';
  return 'Telemóvel / WhatsApp';
}

/** Motorista bloqueado não acede a rotas, links nem partilha GPS. */
export function isDriverAccessBlocked(row: {
  status?: string | null;
  phone: string;
}): boolean {
  if (row.status === 'bloqueado') return true;
  return isDriverBlockedByPhone(row.phone);
}

export function isDriverBlockedById(driverId: string): boolean {
  const d = ZAPTRO_DEMO_DRIVERS.find((x) => x.id === driverId);
  if (!d) return false;
  const status = readDemoStatusOverride(driverId) ?? d.status;
  return status === 'bloqueado';
}

function readDemoStatusOverride(driverId: string): string | undefined {
  try {
    const raw = localStorage.getItem('zaptro_demo_driver_edits_v1');
    if (!raw) return undefined;
    const map = JSON.parse(raw) as Record<string, { status?: string }>;
    return map[driverId]?.status;
  } catch {
    return undefined;
  }
}

export function findDriverRecordByPhone(phone: string): { id: string; status: string } | null {
  const digits = normPhone(phone);
  if (!digits) return null;
  for (const d of ZAPTRO_DEMO_DRIVERS) {
    if (normPhone(d.phone) === digits) {
      const status = readDemoStatusOverride(d.id) ?? d.status;
      return { id: d.id, status };
    }
  }
  return null;
}

export function isDriverBlockedByPhone(phone: string): boolean {
  const hit = findDriverRecordByPhone(phone);
  if (hit) return hit.status === 'bloqueado';
  return false;
}

function readAll(): Record<string, ZaptroDriverExtendedProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, ZaptroDriverExtendedProfile>;
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, ZaptroDriverExtendedProfile>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function readDriverExtendedProfile(driverId: string): ZaptroDriverExtendedProfile {
  const stored = readAll()[driverId];
  const defaults = defaultExtended(isZaptroDemoDriverId(driverId) ? driverId : undefined);
  if (!stored) return defaults;
  return {
    ...defaults,
    ...stored,
    helperIds: Array.isArray(stored.helperIds) ? stored.helperIds : defaults.helperIds,
  };
}

export function saveDriverExtendedProfile(driverId: string, patch: Partial<ZaptroDriverExtendedProfile>): void {
  const map = readAll();
  const prev = readDriverExtendedProfile(driverId);
  map[driverId] = {
    ...prev,
    ...patch,
    helperIds: patch.helperIds ?? prev.helperIds,
  };
  writeAll(map);
}

export function employmentTypeLabel(t: DriverEmploymentType): string {
  return t === 'clt' ? 'Motorista da empresa (CLT)' : 'Motorista agregado';
}

export function vehicleOwnershipLabel(t: VehicleOwnershipType): string {
  if (t === 'empresa') return 'Veículo da empresa';
  if (t === 'agregado') return 'Veículo do agregado';
  return 'Veículo terceiro / parceiro';
}

export function mergeDriverBase(
  row: {
    id: string;
    name: string;
    phone: string;
    vehicle?: string | null;
    status?: string | null;
    photo_url?: string;
  },
): ZaptroDriverFullProfile {
  return {
    ...row,
    extended: readDriverExtendedProfile(row.id),
  };
}

/** Defaults from demo seed when loading demo driver. */
export function getDemoDriverRow(id: string) {
  const d = ZAPTRO_DEMO_DRIVERS.find((x) => x.id === id);
  if (!d) return null;
  return mergeDriverBase({ ...d, id });
}

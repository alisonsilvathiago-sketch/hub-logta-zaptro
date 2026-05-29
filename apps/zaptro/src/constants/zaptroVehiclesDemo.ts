import { isZaptroPreviewDataEnabled } from '../lib/zaptroPreviewMode';
import type { VehicleOwnershipType } from '../lib/zaptroDriverProfileExtended';

export function isZaptroVehiclesDemoEnabled(): boolean {
  return isZaptroPreviewDataEnabled();
}

export interface ZaptroVehicleDemo {
  id: string;
  plate: string;
  type: string;
  model: string;
  brand: string;
  year: string;
  status: 'disponivel' | 'em_rota' | 'manutencao' | 'inativo';
  driver?: string | null;
  driverId?: string | null;
  lastMaintenance?: string;
  nextMaintenance?: string;
  fuelType?: string;
  loadCapacity?: string;
  /** Tag pedágio */
  hasTollTag?: boolean;
  tagProvider?: string | null;
  /** Vencimento licenciamento (ISO) */
  licenseDue?: string;
  /** Vencimento seguro (ISO) */
  insuranceDue?: string;
  financed?: boolean;
  financingOverdue?: boolean;
  finesCount?: number;
  finesTotalBrl?: number;
  /** Frota da empresa ou veículo do motorista agregado. */
  vehicleOwnership?: VehicleOwnershipType;
}

export type ZaptroVehicleDriverHistory = {
  driverId: string;
  driverName: string;
  from: string;
  to: string | null;
};

export type ZaptroVehicleMaintenanceRow = {
  id: string;
  at: string;
  title: string;
  status: 'done' | 'scheduled' | 'overdue';
  note?: string;
};

export type ZaptroVehicleProfileDetail = ZaptroVehicleDemo & {
  driverHistory: ZaptroVehicleDriverHistory[];
  maintenanceLog: ZaptroVehicleMaintenanceRow[];
};

const VEHICLE_PROFILE_EXTRAS: Record<
  string,
  Omit<ZaptroVehicleProfileDetail, keyof ZaptroVehicleDemo> & Partial<ZaptroVehicleDemo>
> = {
  v1: {
    vehicleOwnership: 'empresa',
    driverId: 'zaptro-demo-driver-1',
    hasTollTag: true,
    tagProvider: 'Sem Parar',
    licenseDue: '2026-08-15',
    insuranceDue: '2026-06-01',
    financed: true,
    financingOverdue: false,
    finesCount: 0,
    finesTotalBrl: 0,
    driverHistory: [
      { driverId: 'zaptro-demo-driver-1', driverName: 'João Ferreira', from: '2025-11-01', to: null },
      { driverId: 'zaptro-demo-driver-3', driverName: 'Pedro Costa', from: '2025-03-10', to: '2025-10-28' },
    ],
    maintenanceLog: [
      { id: 'm1', at: '2025-11-15', title: 'Troca de óleo e filtros', status: 'done', note: 'Oficina autorizada Volvo' },
      { id: 'm2', at: '2026-06-15', title: 'Revisão freios e suspensão', status: 'scheduled' },
    ],
  },
  v2: {
    vehicleOwnership: 'empresa',
    driverId: 'zaptro-demo-driver-2',
    hasTollTag: true,
    tagProvider: 'Veloe',
    licenseDue: '2026-03-20',
    insuranceDue: '2026-02-10',
    financed: false,
    financingOverdue: false,
    finesCount: 1,
    finesTotalBrl: 195.23,
    driverHistory: [
      { driverId: 'zaptro-demo-driver-2', driverName: 'Maria Santos', from: '2026-01-05', to: null },
    ],
    maintenanceLog: [
      { id: 'm3', at: '2026-01-10', title: 'Revisão 10.000 km', status: 'done' },
      { id: 'm4', at: '2026-07-10', title: 'Próxima revisão programada', status: 'scheduled' },
    ],
  },
  v3: {
    vehicleOwnership: 'agregado',
    driverId: null,
    hasTollTag: false,
    tagProvider: null,
    licenseDue: '2026-04-01',
    insuranceDue: '2025-12-01',
    financed: false,
    financingOverdue: false,
    finesCount: 0,
    finesTotalBrl: 0,
    driverHistory: [
      { driverId: 'zaptro-demo-driver-4', driverName: 'Ana Oliveira', from: '2025-08-01', to: '2026-04-18' },
    ],
    maintenanceLog: [
      { id: 'm5', at: '2026-04-20', title: 'Correia dentada — em oficina', status: 'overdue', note: 'Veículo parado' },
    ],
  },
  v4: {
    vehicleOwnership: 'terceiro',
    driverId: null,
    hasTollTag: false,
    tagProvider: null,
    licenseDue: '2025-09-01',
    insuranceDue: '2025-07-01',
    financed: true,
    financingOverdue: true,
    finesCount: 3,
    finesTotalBrl: 892.5,
    driverHistory: [],
    maintenanceLog: [
      { id: 'm6', at: '2025-08-05', title: 'Última revisão', status: 'done' },
      { id: 'm7', at: '2025-09-01', title: 'Licenciamento vencido', status: 'overdue' },
    ],
  },
};

export const ZAPTRO_DEMO_VEHICLES: ZaptroVehicleDemo[] = [
  { 
    id: 'v1', 
    plate: 'ABC-1234', 
    type: 'Caminhão', 
    model: 'Volvo FH 540', 
    brand: 'Volvo', 
    year: '2022', 
    status: 'disponivel', 
    driver: 'João Ferreira',
    lastMaintenance: '2023-11-15',
    nextMaintenance: '2024-05-15',
    fuelType: 'Diesel S10',
    loadCapacity: '74 Ton'
  },
  { 
    id: 'v2', 
    plate: 'XYZ-9876', 
    type: 'Van', 
    model: 'Sprinter 415', 
    brand: 'Mercedes-Benz', 
    year: '2023', 
    status: 'em_rota', 
    driver: 'Alison Silva',
    lastMaintenance: '2024-01-10',
    nextMaintenance: '2024-07-10',
    fuelType: 'Diesel S10',
    loadCapacity: '1.5 Ton'
  },
  { 
    id: 'v3', 
    plate: 'DEF-5678', 
    type: 'Furgão', 
    model: 'Fiorino Endurance', 
    brand: 'Fiat', 
    year: '2021', 
    status: 'manutencao', 
    driver: null,
    lastMaintenance: '2024-04-20',
    nextMaintenance: '2024-05-01',
    fuelType: 'Flex',
    loadCapacity: '650 Kg'
  },
  { 
    id: 'v4', 
    plate: 'GHI-9012', 
    type: 'Caminhão', 
    model: 'Scania R450', 
    brand: 'Scania', 
    year: '2020', 
    status: 'inativo', 
    driver: null,
    lastMaintenance: '2023-08-05',
    nextMaintenance: 'Vencida',
    fuelType: 'Diesel',
    loadCapacity: '40 Ton'
  }
];

export function isZaptroDemoVehicleId(id: string): boolean {
  return ZAPTRO_DEMO_VEHICLES.some(v => v.id === id);
}

export function getZaptroDemoVehicleProfile(id: string): ZaptroVehicleProfileDetail | null {
  if (readHiddenZaptroDemoVehicleIds().includes(id)) return null;
  const base = ZAPTRO_DEMO_VEHICLES.find((v) => v.id === id);
  if (!base) return null;
  const edits = readVehicleEdits()[id];
  const merged = { ...base, ...edits };
  const extra = VEHICLE_PROFILE_EXTRAS[id];
  return {
    ...merged,
    driverHistory: extra?.driverHistory ?? [],
    maintenanceLog: extra?.maintenanceLog ?? [],
    ...extra,
    ...edits,
  };
}

const EDITS_KEY = 'zaptro_demo_vehicle_edits_v1';
const HIDDEN_KEY = 'zaptro_demo_vehicle_hidden_v1';

function readVehicleEdits(): Record<string, Partial<ZaptroVehicleDemo>> {
  try {
    const raw = localStorage.getItem(EDITS_KEY);
    const p = raw ? JSON.parse(raw) : {};
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

export function saveDemoVehicleEdit(id: string, patch: Partial<ZaptroVehicleDemo>): void {
  const map = readVehicleEdits();
  map[id] = { ...map[id], ...patch };
  localStorage.setItem(EDITS_KEY, JSON.stringify(map));
}

export function readHiddenZaptroDemoVehicleIds(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    const p = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? p.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function hideZaptroDemoVehicleId(id: string): void {
  const prev = readHiddenZaptroDemoVehicleIds();
  if (!prev.includes(id)) {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...prev, id]));
  }
}

export function getVisibleDemoVehicles(): ZaptroVehicleDemo[] {
  const hidden = new Set(readHiddenZaptroDemoVehicleIds());
  const edits = readVehicleEdits();
  const baseIds = new Set(ZAPTRO_DEMO_VEHICLES.map((v) => v.id));
  const base = ZAPTRO_DEMO_VEHICLES.filter((v) => !hidden.has(v.id)).map((v) => ({ ...v, ...edits[v.id] }));
  const imported = Object.entries(edits)
    .filter(([id]) => !baseIds.has(id) && !hidden.has(id))
    .map(([id, patch]) => ({
      id,
      plate: patch.plate ?? '—',
      type: patch.type ?? 'Veículo',
      model: patch.model ?? '—',
      brand: patch.brand ?? '—',
      year: patch.year ?? '—',
      status: (patch.status ?? 'disponivel') as ZaptroVehicleDemo['status'],
      driver: patch.driver ?? null,
      fuelType: patch.fuelType,
      loadCapacity: patch.loadCapacity,
      ...patch,
    }));
  return [...base, ...imported];
}

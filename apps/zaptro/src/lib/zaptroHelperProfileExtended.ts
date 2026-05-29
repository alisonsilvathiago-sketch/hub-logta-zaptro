import type { ZaptroHelperDemo } from '../constants/zaptroHelpersDemo';
import { ZAPTRO_DEMO_DRIVERS } from '../constants/zaptroDriversDemo';
import { ZAPTRO_DEMO_VEHICLES } from '../constants/zaptroVehiclesDemo';

export type HelperPrimaryIdType = 'phone' | 'email' | 'cpf';

export type ZaptroHelperExtendedFields = {
  primaryIdType?: HelperPrimaryIdType;
  altPhone?: string;
  address?: string;
  aggregatorBase?: string;
  notes?: string;
};

export type ZaptroHelperOperation = {
  id: string;
  at: string;
  workDate: string;
  routeLabel: string;
  clientName: string;
  clientId?: string;
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  vehicleModel: string;
  arrivedAt?: string;
  finishedAt?: string;
  status: 'concluida' | 'em_andamento' | 'cancelada';
};

const EXT_KEY = 'zaptro_helper_profile_extended_v1';

const DEMO_EXTENDED: Record<string, ZaptroHelperExtendedFields> = {
  'zaptro-helper-1': {
    primaryIdType: 'phone',
    altPhone: '5511988001122',
    address: 'Osasco, SP — base empresa',
    notes: 'Autorizado em rotas SP capital e Grande ABC.',
  },
  'zaptro-helper-2': {
    primaryIdType: 'cpf',
    address: 'Campinas, SP',
    aggregatorBase: 'Pátio agregado · Rod. Anhanguera km 92',
    notes: 'Ajudante do agregado Pedro Costa — validar documento em cada rota.',
  },
  'zaptro-helper-3': {
    primaryIdType: 'phone',
    altPhone: '5511966007788',
    address: 'Guarulhos, SP',
    notes: 'Fixo com Ana Oliveira em entregas frigoríficas.',
  },
  'zaptro-helper-4': {
    primaryIdType: 'email',
    address: 'Sorocaba, SP',
    aggregatorBase: 'Cooperativa agregados Sorocaba',
    notes: 'Inactivo — última operação jan/2025.',
  },
};

function readExtendedMap(): Record<string, ZaptroHelperExtendedFields> {
  try {
    const raw = localStorage.getItem(EXT_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, ZaptroHelperExtendedFields>;
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

export function getHelperExtended(helperId: string): ZaptroHelperExtendedFields {
  const stored = readExtendedMap()[helperId];
  return { ...DEMO_EXTENDED[helperId], ...stored };
}

export function saveHelperExtended(helperId: string, patch: ZaptroHelperExtendedFields): void {
  const map = readExtendedMap();
  map[helperId] = { ...map[helperId], ...patch };
  localStorage.setItem(EXT_KEY, JSON.stringify(map));
}

export function helperPrimaryIdTypeLabel(t: HelperPrimaryIdType): string {
  if (t === 'email') return 'E-mail';
  if (t === 'cpf') return 'CPF';
  return 'WhatsApp / telemóvel';
}

export function resolveHelperOperationalId(helper: ZaptroHelperDemo): string {
  const ex = getHelperExtended(helper.id);
  const type = ex.primaryIdType ?? 'phone';
  if (type === 'cpf' && helper.cpf?.trim()) return helper.cpf.trim();
  if (type === 'email' && helper.email?.trim()) return helper.email.trim();
  return helper.phone.replace(/\D/g, '') || helper.phone;
}

function isoDaysAgo(days: number, hour = 8, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Histórico operacional demo — rotas, motorista, veículo e cliente. */
export function getDemoHelperOperations(helperId: string): ZaptroHelperOperation[] {
  const byHelper: Record<string, ZaptroHelperOperation[]> = {
    'zaptro-helper-1': [
      {
        id: 'op-h1-1',
        at: isoDaysAgo(1, 6, 15),
        workDate: isoDaysAgo(1, 0, 0),
        routeLabel: 'Rota SP → ABC · entregas 12',
        clientName: 'Distribuidora Norte Ltda',
        clientId: 'demo-1',
        driverId: 'zaptro-demo-driver-1',
        driverName: 'João Ferreira',
        vehiclePlate: 'ABC1D23',
        vehicleModel: 'Mercedes Actros',
        arrivedAt: isoDaysAgo(1, 14, 20),
        finishedAt: isoDaysAgo(1, 18, 45),
        status: 'concluida',
      },
      {
        id: 'op-h1-2',
        at: isoDaysAgo(3, 5, 50),
        workDate: isoDaysAgo(3, 0, 0),
        routeLabel: 'Coleta Guarulhos · hub',
        clientName: 'Logística Express SA',
        clientId: 'demo-1',
        driverId: 'zaptro-demo-driver-1',
        driverName: 'João Ferreira',
        vehiclePlate: 'ABC1D23',
        vehicleModel: 'Mercedes Actros',
        arrivedAt: isoDaysAgo(3, 11, 10),
        finishedAt: isoDaysAgo(3, 16, 30),
        status: 'concluida',
      },
      {
        id: 'op-h1-3',
        at: isoDaysAgo(6, 7, 0),
        workDate: isoDaysAgo(6, 0, 0),
        routeLabel: 'Rota interior · 8 paradas',
        clientName: 'Atacado Sul ME',
        clientId: 'demo-4',
        driverId: 'zaptro-demo-driver-4',
        driverName: 'Ana Oliveira',
        vehiclePlate: 'KJH7L89',
        vehicleModel: 'Iveco Hi-Way',
        arrivedAt: isoDaysAgo(6, 15, 0),
        finishedAt: isoDaysAgo(6, 19, 15),
        status: 'concluida',
      },
    ],
    'zaptro-helper-2': [
      {
        id: 'op-h2-1',
        at: isoDaysAgo(2, 6, 0),
        workDate: isoDaysAgo(2, 0, 0),
        routeLabel: 'Agregado · rota Campinas',
        clientName: 'Frigorífico Central',
        clientId: 'demo-2',
        driverId: 'zaptro-demo-driver-3',
        driverName: 'Pedro Costa',
        vehiclePlate: 'QWE4R56',
        vehicleModel: 'Volvo FH',
        arrivedAt: isoDaysAgo(2, 13, 40),
        finishedAt: isoDaysAgo(2, 17, 55),
        status: 'concluida',
      },
      {
        id: 'op-h2-2',
        at: isoDaysAgo(0, 5, 30),
        workDate: isoDaysAgo(0, 0, 0),
        routeLabel: 'Entrega única · cliente VIP',
        clientName: 'Importadora Leste',
        clientId: 'demo-5',
        driverId: 'zaptro-demo-driver-3',
        driverName: 'Pedro Costa',
        vehiclePlate: 'QWE4R56',
        vehicleModel: 'Volvo FH',
        status: 'em_andamento',
      },
    ],
    'zaptro-helper-3': [
      {
        id: 'op-h3-1',
        at: isoDaysAgo(4, 6, 45),
        workDate: isoDaysAgo(4, 0, 0),
        routeLabel: 'Rota frigorífica · 6 entregas',
        clientName: 'Rede Varejo Premium',
        clientId: 'demo-4',
        driverId: 'zaptro-demo-driver-4',
        driverName: 'Ana Oliveira',
        vehiclePlate: 'KJH7L89',
        vehicleModel: 'Iveco Hi-Way',
        arrivedAt: isoDaysAgo(4, 12, 5),
        finishedAt: isoDaysAgo(4, 17, 0),
        status: 'concluida',
      },
    ],
    'zaptro-helper-4': [
      {
        id: 'op-h4-1',
        at: isoDaysAgo(45, 7, 0),
        workDate: isoDaysAgo(45, 0, 0),
        routeLabel: 'Última rota registada',
        clientName: 'Armazém Sorocaba',
        clientId: 'demo-3',
        driverId: 'zaptro-demo-driver-3',
        driverName: 'Pedro Costa',
        vehiclePlate: 'QWE4R56',
        vehicleModel: 'Volvo FH',
        arrivedAt: isoDaysAgo(45, 14, 0),
        finishedAt: isoDaysAgo(45, 18, 0),
        status: 'concluida',
      },
    ],
  };
  return byHelper[helperId] ?? [];
}

export function getHelperLinkedDrivers(helperId: string): Array<{ id: string; name: string; phone: string; vehicle: string }> {
  const ops = getDemoHelperOperations(helperId);
  const ids = [...new Set(ops.map((o) => o.driverId))];
  return ids
    .map((id) => ZAPTRO_DEMO_DRIVERS.find((d) => d.id === id))
    .filter((d): d is (typeof ZAPTRO_DEMO_DRIVERS)[number] => Boolean(d));
}

export function getHelperUsedVehicles(helperId: string): Array<{ plate: string; model: string; brand: string }> {
  const ops = getDemoHelperOperations(helperId);
  const plates = [...new Set(ops.map((o) => o.vehiclePlate))];
  return plates.map((plate) => {
    const v = ZAPTRO_DEMO_VEHICLES.find((x) => x.plate.replace(/\W/g, '') === plate.replace(/\W/g, ''));
    return v
      ? { plate: v.plate, model: v.model, brand: v.brand }
      : { plate, model: ops.find((o) => o.vehiclePlate === plate)?.vehicleModel ?? '—', brand: '' };
  });
}

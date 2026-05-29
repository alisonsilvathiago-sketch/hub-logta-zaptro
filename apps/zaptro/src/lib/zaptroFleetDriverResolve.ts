import { ZAPTRO_DEMO_DRIVERS } from '../constants/zaptroDriversDemo';
import {
  employmentTypeLabel,
  readDriverExtendedProfile,
  vehicleOwnershipLabel,
  type DriverEmploymentType,
  type VehicleOwnershipType,
} from './zaptroDriverProfileExtended';

const DEMO_EDITS_KEY = 'zaptro_demo_driver_edits_v1';

export type FleetDriverContext = {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  photoUrl: string | null;
  status: string;
  employmentType: DriverEmploymentType;
  vehicleOwnership: VehicleOwnershipType;
};

function normPhone(phone: unknown): string {
  return String(phone ?? '').replace(/\D/g, '');
}

function readDemoEdits(): Record<string, Partial<{ name?: string; phone?: string; vehicle?: string; status?: string; photo_url?: string }>> {
  try {
    const raw = localStorage.getItem(DEMO_EDITS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, Partial<{ name?: string; phone?: string; vehicle?: string; status?: string; photo_url?: string }>>;
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

function rowToContext(
  row: { id: string; name: string; phone: string; vehicle?: string | null; status?: string | null; photo_url?: string },
): FleetDriverContext {
  const ex = readDriverExtendedProfile(row.id);
  return {
    id: row.id,
    name: row.name,
    phone: normPhone(row.phone) || row.phone,
    vehicle: (row.vehicle || '').trim(),
    photoUrl: row.photo_url ?? null,
    status: row.status || 'ativo',
    employmentType: ex.employmentType,
    vehicleOwnership: ex.vehicleOwnership,
  };
}

/** Motorista da frota por ID (demo + edições locais). */
export function resolveFleetDriverById(driverId: string): FleetDriverContext | null {
  const base = ZAPTRO_DEMO_DRIVERS.find((d) => d.id === driverId);
  if (!base) return null;
  const patch = readDemoEdits()[driverId];
  return rowToContext({
    ...base,
    ...patch,
    id: driverId,
    name: patch?.name ?? base.name,
    phone: patch?.phone ?? base.phone,
    vehicle: patch?.vehicle ?? base.vehicle,
    status: patch?.status ?? base.status,
    photo_url: patch?.photo_url ?? base.photo_url,
  });
}

/** Identificação principal: WhatsApp / telemóvel cadastrado na frota. */
export function resolveFleetDriverByPhone(phone: string): FleetDriverContext | null {
  const digits = normPhone(phone);
  if (!digits) return null;
  const edits = readDemoEdits();
  for (const d of ZAPTRO_DEMO_DRIVERS) {
    const mergedPhone = normPhone(edits[d.id]?.phone ?? d.phone);
    if (mergedPhone === digits) {
      const patch = edits[d.id];
      return rowToContext({
        ...d,
        ...patch,
        id: d.id,
        name: patch?.name ?? d.name,
        phone: patch?.phone ?? d.phone,
        vehicle: patch?.vehicle ?? d.vehicle,
        status: patch?.status ?? d.status,
        photo_url: patch?.photo_url ?? d.photo_url,
      });
    }
  }
  return null;
}

export type RouteDriverHints = {
  fleetDriverId?: string | null;
  driverPhone?: string | null;
  driverDisplayName?: string | null;
  driverVehicle?: string | null;
  driverAvatarUrl?: string | null;
};

/** Resolve motorista vinculado à rota: ID da frota → telemóvel → dados já gravados na rota. */
export function resolveFleetDriverForRoute(
  hints: RouteDriverHints,
  urlPhone?: string | null,
): FleetDriverContext | null {
  const urlDigits = urlPhone ? normPhone(urlPhone) : '';
  const liveDigits = hints.driverPhone ? normPhone(hints.driverPhone) : '';

  if (hints.fleetDriverId) {
    const byId = resolveFleetDriverById(hints.fleetDriverId);
    if (byId) return byId;
  }

  if (urlDigits) {
    const byUrl = resolveFleetDriverByPhone(urlDigits);
    if (byUrl) return byUrl;
  }

  if (liveDigits) {
    const byLive = resolveFleetDriverByPhone(liveDigits);
    if (byLive) return byLive;
  }

  if (hints.driverDisplayName?.trim() && (liveDigits || urlDigits)) {
    return {
      id: hints.fleetDriverId || `phone-${liveDigits || urlDigits}`,
      name: hints.driverDisplayName.trim(),
      phone: liveDigits || urlDigits,
      vehicle: (hints.driverVehicle || '').trim(),
      photoUrl: hints.driverAvatarUrl ?? null,
      status: 'ativo',
      employmentType: 'agregado',
      vehicleOwnership: 'agregado',
    };
  }

  return null;
}

export function formatDriverPhoneDisplay(phone: unknown): string {
  const digits = normPhone(phone);
  const raw = String(phone ?? '').trim();
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return raw || '—';
}

export { employmentTypeLabel, vehicleOwnershipLabel };

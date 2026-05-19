import { supabase } from '../../lib/supabase';
import { shipmentStatusForDriver, labelForDriverStatus } from './motoristaStatus';
import type { DriverOperationalStatus, MotoristaLocation, MotoristaRotaSession } from './types';

const STORAGE_PREFIX = 'logta-motorista-rota';

function storageKey(companyId: string) {
  return `${STORAGE_PREFIX}:${companyId}`;
}

function loadAll(companyId: string): MotoristaRotaSession[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(companyId)) ?? '[]') as MotoristaRotaSession[];
  } catch {
    return [];
  }
}

function saveAll(companyId: string, list: MotoristaRotaSession[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(companyId), JSON.stringify(list));
}

export function createMotoristaToken() {
  return `mot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function findMotoristaSessionByToken(token: string): MotoristaRotaSession | null {
  if (typeof window === 'undefined') return null;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    try {
      const list = JSON.parse(localStorage.getItem(key) ?? '[]') as MotoristaRotaSession[];
      const found = list.find((s) => s.token === token);
      if (found) return found;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export type CreateMotoristaLinkInput = {
  companyId: string;
  shipmentId: string;
  numeroFrete: string;
  clienteNome: string;
  origem: string;
  destino: string;
  motoristaId?: string;
  motoristaNome?: string;
  placa?: string;
  observacoes?: string;
  shipmentStatus?: string;
};

export function getOrCreateMotoristaLink(input: CreateMotoristaLinkInput): MotoristaRotaSession {
  const list = loadAll(input.companyId);
  const existing = list.find((s) => s.shipmentId === input.shipmentId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const session: MotoristaRotaSession = {
    token: createMotoristaToken(),
    companyId: input.companyId,
    shipmentId: input.shipmentId,
    numeroFrete: input.numeroFrete,
    clienteNome: input.clienteNome,
    origem: input.origem,
    destino: input.destino,
    motoristaId: input.motoristaId,
    motoristaNome: input.motoristaNome || 'Motorista',
    placa: input.placa,
    observacoes: input.observacoes,
    shipmentStatus: input.shipmentStatus || 'pending',
    operationalStatus: 'pedido_recebido',
    gpsEnabled: false,
    history: [
      {
        id: `ev-${Date.now()}`,
        status: 'pedido_recebido',
        label: 'Link operacional criado',
        at: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  list.push(session);
  saveAll(input.companyId, list);
  return session;
}

export function motoristaPublicUrl(token: string) {
  if (typeof window === 'undefined') return `/motorista/rota/${token}`;
  return `${window.location.origin}/motorista/rota/${token}`;
}

async function syncShipmentStatus(companyId: string, shipmentId: string, status: string) {
  try {
    await supabase
      .from('shipments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', shipmentId)
      .eq('company_id', companyId);
  } catch {
    /* offline / sandbox */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('logta-operational-sync'));
    window.dispatchEvent(new CustomEvent('frete_created'));
  }
}

export async function updateMotoristaOperationalStatus(token: string, status: DriverOperationalStatus) {
  const session = findMotoristaSessionByToken(token);
  if (!session) return null;

  const now = new Date().toISOString();
  const shipmentStatus = shipmentStatusForDriver(status);
  const next: MotoristaRotaSession = {
    ...session,
    operationalStatus: status,
    shipmentStatus,
    updatedAt: now,
    history: [
      ...session.history,
      {
        id: `ev-${Date.now()}`,
        status,
        label: labelForDriverStatus(status),
        at: now,
      },
    ],
  };

  const list = loadAll(session.companyId).map((s) => (s.token === token ? next : s));
  saveAll(session.companyId, list);
  await syncShipmentStatus(session.companyId, session.shipmentId, shipmentStatus);
  return next;
}

export function setMotoristaGpsEnabled(token: string, enabled: boolean) {
  const session = findMotoristaSessionByToken(token);
  if (!session) return null;
  const next = { ...session, gpsEnabled: enabled, updatedAt: new Date().toISOString() };
  const list = loadAll(session.companyId).map((s) => (s.token === token ? next : s));
  saveAll(session.companyId, list);
  return next;
}

export function pushMotoristaLocation(token: string, location: MotoristaLocation) {
  const session = findMotoristaSessionByToken(token);
  if (!session) return null;
  const next = {
    ...session,
    lastLocation: location,
    updatedAt: new Date().toISOString(),
  };
  const list = loadAll(session.companyId).map((s) => (s.token === token ? next : s));
  saveAll(session.companyId, list);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('logta-operational-sync'));
  }
  return next;
}

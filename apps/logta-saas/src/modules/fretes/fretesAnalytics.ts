import type { ShipmentNormalized } from './types';

export const FRETES_STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando coleta',
  loading: 'Carregando',
  in_transit: 'Em rota',
  stopped: 'Parada',
  delayed: 'Atraso detectado',
  unloading: 'Descarregando',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  incident: 'Ocorrência aberta',
};

export function normalizeShipment(s: Record<string, unknown>): ShipmentNormalized {
  const meta = (s.metadata as Record<string, unknown>) || {};
  return {
    id: String(s.id),
    status: String(s.status || ''),
    origin: String(s.origin || ''),
    destination: String(s.destination || ''),
    created_at: s.created_at as string | undefined,
    estimated_at: s.estimated_at as string | undefined,
    driver_id: s.driver_id as string | undefined,
    vehicle_id: s.vehicle_id as string | undefined,
    numero_frete: String(meta.numero_frete || String(s.id).slice(0, 8).toUpperCase()),
    cliente_nome: String(meta.cliente_nome || 'Cliente'),
    valor_frete: Number(meta.valor_frete || 0),
    tipo_carga: String(meta.tipo_carga || 'Normal'),
    peso_kg: Number(meta.peso_kg || s.peso_kg || 0),
    metadata: meta,
    motoristas: s.motoristas as ShipmentNormalized['motoristas'],
    vehicles: s.vehicles as ShipmentNormalized['vehicles'],
  };
}

export function computeFretesAnalytics(shipments: ShipmentNormalized[]) {
  const now = Date.now();
  const day = 86400000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let ativos = 0;
  let emRota = 0;
  let entreguesHoje = 0;
  let atrasados = 0;
  let receita = 0;
  let custoEst = 0;
  let veiculosEmRota = new Set<string>();

  for (const s of shipments) {
    const st = (s.status || '').toLowerCase();
    const v = s.valor_frete || 0;
    receita += v;
    custoEst += v * 0.65;

    const created = s.created_at ? new Date(s.created_at) : null;
    const isToday = created && created >= todayStart;

    if (st === 'delivered' || st.includes('entregue')) {
      if (isToday) entreguesHoje++;
    } else if (st !== 'cancelled' && st !== 'cancelado') {
      ativos++;
    }

    if (st === 'in_transit' || st.includes('transito') || st.includes('rota')) {
      emRota++;
      if (s.vehicle_id) veiculosEmRota.add(s.vehicle_id);
    }
    if (st === 'delayed' || st.includes('atrasad')) atrasados++;
  }

  const lucro = receita - custoEst;
  const margemMedia = receita > 0 ? (lucro / receita) * 100 : 0;

  return {
    fretesAtivos: ativos,
    emRota,
    entreguesHoje,
    atrasados,
    receita,
    custoOperacional: custoEst,
    lucroOperacional: lucro,
    margemMedia,
    veiculosEmRota: veiculosEmRota.size,
    faturamentoDiario: receita,
    total: shipments.length,
  };
}

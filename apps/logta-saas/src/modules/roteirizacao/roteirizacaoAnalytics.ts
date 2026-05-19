import type { ActiveRouteNormalized, RouteDeliveryNormalized } from './types';

const DEFAULT_ROUTE_PATHS = [
  'M 12 76 L 28 62 L 46 52 L 64 40 L 80 30',
  'M 10 72 L 24 64 L 40 54 L 56 42 L 72 34',
  'M 14 78 L 30 68 L 48 56 L 66 38 L 82 24',
];

export function normalizeDeliveryFromShipment(s: Record<string, unknown>, index: number): RouteDeliveryNormalized {
  const meta = (s.metadata as Record<string, unknown>) || {};
  const prioridade = String(meta.prioridade || 'Normal');
  const peso = meta.peso_kg != null ? `${meta.peso_kg}kg` : '—';
  const prioMap: Record<string, RouteDeliveryNormalized['priority']> = {
    Urgente: 'Urgente',
    Alta: 'Alta',
    Normal: 'Normal',
    Baixa: 'Baixa',
  };

  return {
    id: String(meta.numero_frete || s.id).slice(0, 12),
    shipmentId: String(s.id),
    dest: String(s.destination || s.origin || 'Destino não informado'),
    weight: peso,
    priority: prioMap[prioridade] || 'Normal',
    status: String(s.status || ''),
    origin: String(s.origin || ''),
    driver_id: s.driver_id ? String(s.driver_id) : undefined,
    vehicle_id: s.vehicle_id ? String(s.vehicle_id) : undefined,
    valor_frete: meta.valor_frete != null ? Number(meta.valor_frete) : undefined,
    km: 3 + (index % 5) * 2.4,
    minutes: 10 + (index % 4) * 6,
    created_at: s.created_at ? String(s.created_at) : undefined,
  };
}

export function computeRoteirizacaoAnalytics(
  deliveries: RouteDeliveryNormalized[],
  activeRoutes: ActiveRouteNormalized[],
  routeOptimized: boolean,
) {
  const pending = deliveries.filter((d) => {
    const st = (d.status || '').toLowerCase();
    return st === 'pending' || st.includes('aguardando') || !d.status;
  });

  const emRota = deliveries.filter((d) => {
    const st = (d.status || '').toLowerCase();
    return st === 'in_transit' || st.includes('transito') || st.includes('rota');
  });

  const urgentes = deliveries.filter((d) => d.priority === 'Alta' || d.priority === 'Urgente');
  const receita = deliveries.reduce((acc, d) => acc + (d.valor_frete || 0), 0);
  const kmTotal = deliveries.reduce((acc, d) => acc + (d.km || 5), 0);
  const kmOtimizado = routeOptimized ? kmTotal * 0.83 : kmTotal;
  const minTotal = deliveries.reduce((acc, d) => acc + (d.minutes || 15), 0);
  const minOtimizado = routeOptimized ? Math.round(minTotal * 0.78) : minTotal;

  const custoPorKm = 2.65;
  const custo = kmOtimizado * custoPorKm + pending.length * 12;
  const lucro = receita * 0.32 - custo * 0.15;
  const margem = receita > 0 ? ((receita - custo) / receita) * 100 : 28;

  const rotasCriticas = activeRoutes.filter((r) => r.progress < 50 && r.status.includes('Rota')).length + urgentes.length;

  return {
    entregasPendentes: pending.length || deliveries.length,
    entregasEmRota: emRota.length,
    entregasUrgentes: urgentes.length,
    rotasAtivas: activeRoutes.length,
    rotasCriticas,
    kmTotal: kmOtimizado,
    minTotal: minOtimizado,
    receita,
    custoOperacional: custo,
    lucroProjetado: Math.max(lucro, receita * 0.22),
    margemOperacional: margem,
    custoPorKm,
    custoPorEntrega: deliveries.length > 0 ? custo / deliveries.length : 0,
    veiculosAtivos: new Set(deliveries.map((d) => d.vehicle_id).filter(Boolean)).size,
    motoristasAtivos: new Set(deliveries.map((d) => d.driver_id).filter(Boolean)).size,
    economiaKm: routeOptimized ? kmTotal - kmOtimizado : 0,
    economiaPercent: routeOptimized ? 17 : 0,
  };
}

export function buildActiveRoutesFromDeliveries(deliveries: RouteDeliveryNormalized[]): ActiveRouteNormalized[] {
  const byDriver = new Map<string, RouteDeliveryNormalized[]>();
  for (const d of deliveries) {
    const st = (d.status || '').toLowerCase();
    if (st !== 'in_transit' && !st.includes('transito') && !st.includes('rota')) continue;
    const key = d.driver_id || 'sem-motorista';
    if (!byDriver.has(key)) byDriver.set(key, []);
    byDriver.get(key)!.push(d);
  }

  let idx = 0;
  return [...byDriver.entries()].map(([driverId, stops]) => {
    idx++;
    const progress = Math.min(95, 20 + stops.length * 12);
    return {
      id: `RT-${2200 + idx}`,
      driver: driverId === 'sem-motorista' ? 'Aguardando alocação' : `Motorista ${driverId.slice(0, 6)}`,
      stops: stops.length,
      progress,
      status: progress >= 100 ? 'Concluído' : 'Em Rota',
      shipmentIds: stops.map((s) => s.shipmentId || s.id),
    };
  });
}

export function deliveryToMapConfig(d: RouteDeliveryNormalized, index: number) {
  const path = DEFAULT_ROUTE_PATHS[index % DEFAULT_ROUTE_PATHS.length];
  return {
    km: (d.km || 5).toFixed(1).replace('.', ','),
    minutes: String(d.minutes || 15),
    routePathD: path,
  };
}

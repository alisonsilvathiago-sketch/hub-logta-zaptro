import { buildFretesAlerts } from '../modules/fretes/fretesIntelligence';
import { buildFinanceiroAlerts } from '../modules/financeiro/financeiroIntelligence';
import { buildRoteirizacaoAlerts } from '../modules/roteirizacao/roteirizacaoIntelligence';
import type { ShipmentNormalized } from '../modules/fretes/types';
import type { MotoristaRow, TransactionRow, VehicleRow } from '../contexts/OperationalDataContext';
import type { RouteDeliveryNormalized } from '../modules/roteirizacao/types';
import { buildActiveRoutesFromDeliveries } from '../modules/roteirizacao/roteirizacaoAnalytics';

export type GlobalAlert = {
  id: string;
  module: 'fretes' | 'financeiro' | 'roteirizacao';
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionPath: string;
  actionLabel: string;
};

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function buildGlobalOperationalAlerts(input: {
  shipments: ShipmentNormalized[];
  deliveries: RouteDeliveryNormalized[];
  motoristas: MotoristaRow[];
  vehicles: VehicleRow[];
  transactions: TransactionRow[];
  routeOptimized?: boolean;
}) {
  const { shipments, deliveries, motoristas, vehicles, transactions, routeOptimized = false } = input;
  const activeRoutes = buildActiveRoutesFromDeliveries(deliveries);

  const fretes = buildFretesAlerts({ shipments, motoristas, vehicles });
  const financeiro = buildFinanceiroAlerts({
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      category: t.category,
      paid_at: t.paid_at,
      created_at: t.created_at,
    })),
    shipments: shipments.map((s) => ({
      id: s.id,
      origin: s.origin,
      destination: s.destination,
      status: s.status,
      metadata: s.metadata,
    })),
    motoristas,
  });
  const roteirizacao = buildRoteirizacaoAlerts({
    deliveries,
    activeRoutes,
    routeOptimized,
    motoristas,
    vehicles,
  });

  const all: GlobalAlert[] = [
    ...fretes.map((a) => ({
      id: `fretes-${a.id}`,
      module: 'fretes' as const,
      title: a.title,
      message: a.message,
      priority: a.priority,
      actionPath: a.actionPath,
      actionLabel: a.actionLabel,
    })),
    ...financeiro.map((a) => ({
      id: `fin-${a.id}`,
      module: 'financeiro' as const,
      title: a.title,
      message: a.message,
      priority: a.priority,
      actionPath: a.actionPath,
      actionLabel: a.actionLabel,
    })),
    ...roteirizacao.map((a) => ({
      id: `rot-${a.id}`,
      module: 'roteirizacao' as const,
      title: a.title,
      message: a.message,
      priority: a.priority,
      actionPath: a.actionPath,
      actionLabel: a.actionLabel,
    })),
  ];

  return all.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

export function getGlobalMonitoringSummary(alerts: GlobalAlert[]) {
  const critical = alerts.filter((a) => a.priority === 'critical').length;
  const high = alerts.filter((a) => a.priority === 'high').length;
  return {
    total: alerts.length,
    critical,
    high,
    nivel: critical > 0 ? 'critico' : high > 0 ? 'atencao' : 'normal',
  } as const;
}

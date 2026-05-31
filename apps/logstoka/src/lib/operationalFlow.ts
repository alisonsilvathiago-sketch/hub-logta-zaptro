import { getDemoSalesDashboard, type SalesOrderRow } from '@/lib/salesDashboard';
import {
  dueProcessWeekdayFromProfile,
  getTodayFlowPlan,
  isOrderLateByProfile,
  loadOperationalProfile,
  saleDayLabel,
  type DayFlowPlan,
  type OperationalProfileConfig,
} from '@/lib/operationalProfile';
import { MARKETPLACE_LABELS, type Marketplace } from '@/types';

export type OperationalStage =
  | 'awaiting_report'
  | 'separation'
  | 'conference'
  | 'expedition'
  | 'carrier'
  | 'in_transit'
  | 'completed';

export type ReportSource = 'api' | 'bling' | 'excel' | 'pdf' | 'photo';

export type OperationalOrder = {
  id: string;
  orderRef: string;
  marketplace: string;
  marketplaceLabel: string;
  productName: string;
  sku?: string;
  quantity: number;
  soldAt: string;
  saleWeekday: number;
  saleDayLabel: string;
  stage: OperationalStage;
  dueProcessWeekday: number;
  dueDayLabel: string;
  reportReceived: boolean;
  isLate: boolean;
  isBacklog: boolean;
  source: ReportSource;
};

export type OperationalQueueSummary = {
  awaitingReport: number;
  separation: number;
  conference: number;
  expedition: number;
  carrier: number;
  inTransit: number;
  late: number;
  todayFocus: number;
  backlog: number;
  notSent: number;
};

const STAGE_LABELS: Record<OperationalStage, string> = {
  awaiting_report: 'Aguardando relatório',
  separation: 'Separação',
  conference: 'Conferência',
  expedition: 'Expedição',
  carrier: 'Transportadora',
  in_transit: 'Em trânsito',
  completed: 'Concluído',
};

export function operationalStageLabel(stage: OperationalStage): string {
  return STAGE_LABELS[stage];
}

function hashStage(id: string, status: string): OperationalStage {
  const n = id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
  if (status === 'cancelled') return 'completed';
  if (status === 'fulfilled') {
    const stages: OperationalStage[] = ['carrier', 'in_transit', 'completed'];
    return stages[n % stages.length]!;
  }
  const openStages: OperationalStage[] = ['awaiting_report', 'separation', 'conference', 'expedition'];
  return openStages[n % openStages.length]!;
}

function demoSource(id: string): ReportSource {
  const sources: ReportSource[] = ['bling', 'excel', 'api', 'pdf', 'photo'];
  const n = id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return sources[n % sources.length]!;
}

export function buildDemoOperationalOrders(
  referenceDate = new Date(),
  profile: OperationalProfileConfig = loadOperationalProfile(null),
): OperationalOrder[] {
  const orders = getDemoSalesDashboard(14).orders;
  const todayPlan = getTodayFlowPlan(profile, referenceDate);
  const focusSet = new Set(todayPlan.processSaleDayNumbers);

  return orders.map((order: SalesOrderRow, index: number) => {
    const sold = new Date(order.soldAt);
    if (Number.isNaN(sold.getTime())) sold.setTime(referenceDate.getTime() - index * 86_400_000);

    const saleWeekday = sold.getDay();
    const due = dueProcessWeekdayFromProfile(saleWeekday, profile);
    const stage = hashStage(order.id, order.status);
    const isOpen = order.status === 'open';
    const isBacklog = focusSet.has(saleWeekday) && saleWeekday !== referenceDate.getDay();
    const isLate = isOrderLateByProfile(saleWeekday, due, profile, referenceDate, isOpen);

    return {
      id: order.id,
      orderRef: order.orderRef,
      marketplace: order.marketplace,
      marketplaceLabel:
        order.marketplaceLabel || MARKETPLACE_LABELS[order.marketplace as Marketplace] || order.marketplace,
      productName: order.productName,
      sku: order.sku,
      quantity: order.quantity,
      soldAt: sold.toISOString(),
      saleWeekday,
      saleDayLabel: saleDayLabel(saleWeekday),
      stage,
      dueProcessWeekday: due,
      dueDayLabel: saleDayLabel(due),
      reportReceived: stage !== 'awaiting_report',
      isLate,
      isBacklog,
      source: demoSource(order.id),
    };
  });
}

export function summarizeOperationalQueue(
  orders: OperationalOrder[],
  todayPlan: DayFlowPlan,
): OperationalQueueSummary {
  const focusSet = new Set(todayPlan.processSaleDayNumbers);
  const notSent = orders.filter((o) => !['carrier', 'in_transit', 'completed'].includes(o.stage)).length;

  const today = todayPlan.weekday;

  return {
    awaitingReport: orders.filter((o) => o.stage === 'awaiting_report').length,
    separation: orders.filter((o) => o.stage === 'separation').length,
    conference: orders.filter((o) => o.stage === 'conference').length,
    expedition: orders.filter((o) => o.stage === 'expedition').length,
    carrier: orders.filter((o) => o.stage === 'carrier').length,
    inTransit: orders.filter((o) => o.stage === 'in_transit').length,
    late: orders.filter((o) => o.isLate).length,
    notSent,
    backlog: orders.filter(
      (o) => focusSet.has(o.saleWeekday) && o.saleWeekday !== today && o.stage !== 'completed',
    ).length,
    todayFocus: orders.filter(
      (o) =>
        focusSet.has(o.saleWeekday) &&
        o.stage !== 'completed' &&
        o.stage !== 'in_transit' &&
        o.stage !== 'carrier',
    ).length,
  };
}

export type OrderListFilter = 'now' | 'late' | 'backlog' | 'all';

export function filterOperationalOrders(
  orders: OperationalOrder[],
  todayPlan: DayFlowPlan,
  filter: OrderListFilter,
): OperationalOrder[] {
  const focusSet = new Set(todayPlan.processSaleDayNumbers);
  const today = todayPlan.weekday;

  if (filter === 'late') return orders.filter((o) => o.isLate);
  if (filter === 'backlog')
    return orders.filter(
      (o) => focusSet.has(o.saleWeekday) && o.saleWeekday !== today && o.stage !== 'completed',
    );
  if (filter === 'now')
    return orders.filter(
      (o) =>
        focusSet.has(o.saleWeekday) &&
        !['completed', 'in_transit', 'carrier'].includes(o.stage),
    );

  if (filter === 'all') {
    return orders.filter((o) => !['carrier', 'in_transit', 'completed'].includes(o.stage));
  }

  return orders;
}

export type OperationalListMeta = {
  title: string;
  subtitle: string;
  docTitle: string;
  docKind: string;
  primaryActionLabel: string;
  primaryActionPath: string;
  secondaryActionLabel?: string;
  secondaryActionPath?: string;
};

export const OPERATIONAL_LIST_META: Record<OrderListFilter, OperationalListMeta> = {
  now: {
    title: 'Separar / conferir hoje',
    subtitle: 'Lista pronta para o estoquista — separe, confira e marque na operação.',
    docTitle: 'LISTA DE SEPARAÇÃO E CONFERÊNCIA',
    docKind: 'Operação do dia',
    primaryActionLabel: 'Ir separar',
    primaryActionPath: '/app/picking',
    secondaryActionLabel: 'Conferir',
    secondaryActionPath: '/app/conference',
  },
  backlog: {
    title: 'Acumulados',
    subtitle: 'Vendas de dias anteriores ainda na operação — priorize antes do corte.',
    docTitle: 'LISTA DE ACUMULADOS',
    docKind: 'Pendências anteriores',
    primaryActionLabel: 'Ir separar',
    primaryActionPath: '/app/picking',
  },
  late: {
    title: 'Atrasados',
    subtitle: 'Pedidos fora do prazo — resolver agora.',
    docTitle: 'LISTA DE ATRASADOS',
    docKind: 'Urgente',
    primaryActionLabel: 'Ver movimentações',
    primaryActionPath: '/app/movements',
  },
  all: {
    title: 'Não enviados',
    subtitle: 'Tudo que ainda não saiu para transportadora.',
    docTitle: 'LISTA DE NÃO ENVIADOS',
    docKind: 'Em operação',
    primaryActionLabel: 'Ver movimentações',
    primaryActionPath: '/app/movements',
  },
};

export const PIPELINE_STAGES: OperationalStage[] = [
  'awaiting_report',
  'separation',
  'conference',
  'expedition',
  'carrier',
  'in_transit',
];

export const REPORT_SOURCE_LABELS: Record<ReportSource, string> = {
  api: 'API',
  bling: 'Bling / ERP',
  excel: 'Excel',
  pdf: 'PDF',
  photo: 'Foto / OCR',
};

/** @deprecated use getTodayFlowPlan from operationalProfile */
export function getWeeklyOperationalPlan(date = new Date()) {
  const profile = loadOperationalProfile(null);
  const plan = getTodayFlowPlan(profile, date);
  return {
    weekday: plan.weekday,
    weekdayLabel: plan.weekdayLabel,
    title: plan.note || plan.weekdayLabel,
    summary: `Processar: ${plan.processSaleDays.join(', ')} · saída até ${plan.dailyCutoff}`,
    processSaleDays: plan.processSaleDays,
    tips: [
      `Pendências anteriores até ${plan.backlogCutoff}`,
      `Saída do dia até ${plan.dailyCutoff}`,
    ],
  };
}

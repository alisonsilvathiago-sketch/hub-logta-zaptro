import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import type { LsStore } from '@/types';
import {
  saleDayLabel,
  WEEKDAY_FULL,
  type DayFlowPlan,
  type FlowDayRule,
  type OperationalProfileConfig,
} from '@/lib/operationalProfile';

export type FlowDayDetail = {
  weekday: number;
  weekdayLabel: string;
  isToday: boolean;
  processSaleDays: string[];
  dailyCutoff: string;
  backlogCutoff: string;
  deliveryWindow?: string;
  note?: string;
  productFocus?: string;
  storeLabels: string[];
  allStores: boolean;
  productLabels: string[];
  allProducts: boolean;
};

export function buildFlowDayDetail(
  rule: FlowDayRule,
  plan: DayFlowPlan,
  stores: LsStore[],
): FlowDayDetail {
  const storeLabels =
    rule.storeIds?.length
      ? rule.storeIds
          .map((id) => stores.find((s) => s.id === id)?.name)
          .filter((name): name is string => Boolean(name))
      : [];

  const productLabels =
    rule.productSkus?.length
      ? rule.productSkus.map(
          (sku) => DEMO_PRODUCTS.find((p) => p.sku === sku)?.name ?? sku,
        )
      : rule.productFocus
        ? [rule.productFocus]
        : [];

  return {
    weekday: rule.weekday,
    weekdayLabel: WEEKDAY_FULL[rule.weekday] ?? plan.weekdayLabel,
    isToday: plan.isToday,
    processSaleDays: rule.processSaleDays.map(saleDayLabel),
    dailyCutoff: rule.dailyCutoff,
    backlogCutoff: rule.backlogCutoff,
    deliveryWindow: rule.deliveryWindow,
    note: rule.note,
    productFocus: rule.productFocus,
    storeLabels,
    allStores: !rule.storeIds?.length,
    productLabels,
    allProducts: !rule.productSkus?.length && !rule.productFocus,
  };
}

export function flowSyncModeLabel(mode: OperationalProfileConfig['flowSyncMode']): string {
  if (mode === 'api') return 'Sincronizado via API';
  if (mode === 'hybrid') return 'Manual + API (híbrido)';
  return 'Configuração manual';
}

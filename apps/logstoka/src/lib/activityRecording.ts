import type { GuidedOperationItem } from '@/lib/guidedOperationItem';
import { recordActivity, type ActivityDomain, type ActivityEventKind } from '@/lib/operationalActivityLog';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import type { DivergenceReason } from '@/lib/conferenceDivergences';
import { DIVERGENCE_REASON_LABELS } from '@/lib/conferenceDivergences';

type RecordCtx = {
  companyId: string | null;
  actorName: string;
  actorId?: string;
};

export function recordGuidedConferenceItem(ctx: RecordCtx, item: GuidedOperationItem): void {
  recordActivity(ctx.companyId, {
    kind: 'conference',
    domain: 'conference',
    actorName: ctx.actorName,
    title: 'Conferência guiada',
    description: `Item conferido · ${item.productName} · ${item.quantityLabel} · ${item.subtitle}`,
    reference: item.orderRef ?? item.subtitle ?? item.id,
    orderRef: item.orderRef,
    productSku: item.sku,
    status: 'Conferido',
    href: LOGSTOKA_ROUTES.PICKING_HISTORY,
    meta: {
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      referenceCode: item.orderRef,
      warehouseName: item.marketplaceLabel ?? item.subtitle,
    },
  });
}

export function recordGuidedConferenceComplete(ctx: RecordCtx, count: number): void {
  recordActivity(ctx.companyId, {
    kind: 'conference',
    domain: 'conference',
    actorName: ctx.actorName,
    title: 'Conferência guiada',
    description: `Lista conferida · ${count} item(ns) processado(s)`,
    reference: 'Conferência',
    status: 'Concluído',
    href: LOGSTOKA_ROUTES.OPERATIONAL_WORK,
  });
}

export function recordGuidedDivergenceActivity(
  ctx: RecordCtx,
  item: GuidedOperationItem,
  reason: DivergenceReason,
  context: 'operation' | 'inventory',
): void {
  recordActivity(ctx.companyId, {
    kind: context === 'inventory' ? 'inventory' : 'conference',
    domain: context === 'inventory' ? 'inventory' : 'conference',
    actorName: ctx.actorName,
    title: 'Divergência',
    description: `${DIVERGENCE_REASON_LABELS[reason]} · ${item.productName} · ${item.subtitle}`,
    reference: item.orderRef ?? item.id,
    status: 'Pendência',
    result: 'warning',
    href: LOGSTOKA_ROUTES.CONFERENCE_PENDING,
  });
}

export function recordInventoryCount(ctx: RecordCtx, item: GuidedOperationItem): void {
  recordActivity(ctx.companyId, {
    kind: 'inventory',
    domain: 'inventory',
    actorName: ctx.actorName,
    title: 'Inventário',
    description: `Contagem registrada · ${item.productName} · ${item.quantityLabel}`,
    reference: item.subtitle,
    status: 'Contado',
    href: '/app/inventory',
  });
}

export function recordInventoryComplete(ctx: RecordCtx, count: number): void {
  recordActivity(ctx.companyId, {
    kind: 'inventory',
    domain: 'inventory',
    actorName: ctx.actorName,
    title: 'Inventário',
    description: `Contagem guiada concluída · ${count} SKU(s)`,
    reference: 'Inventário',
    status: 'Concluído',
    href: '/app/inventory',
  });
}

export function recordInventoryItemConference(
  ctx: RecordCtx,
  payload: {
    inventoryId: string;
    warehouseName: string;
    sku: string;
    productName: string;
    systemQty: number;
    countedQty: number;
    matched: boolean;
    justification?: string;
  },
): void {
  const diff = payload.countedQty - payload.systemQty;
  const matched = payload.matched && diff === 0;
  recordActivity(ctx.companyId, {
    kind: 'inventory',
    domain: 'inventory',
    actorName: ctx.actorName,
    actorId: ctx.actorId,
    title: matched ? 'Inventário · conferência OK' : 'Inventário · divergência',
    description: matched
      ? `${payload.productName} · ${payload.sku} · contado ${payload.countedQty} un. = sistema ${payload.systemQty} un.`
      : `${payload.productName} · ${payload.sku} · contado ${payload.countedQty} vs sistema ${payload.systemQty} (Δ ${diff > 0 ? '+' : ''}${diff})${payload.justification ? ` · ${payload.justification}` : ''}`,
    reference: payload.warehouseName,
    productSku: payload.sku,
    entityType: 'inventory',
    entityId: payload.inventoryId,
    status: matched ? 'Conferido' : 'Divergência',
    result: matched ? 'success' : 'warning',
    href: `/app/inventory/${payload.inventoryId}`,
    meta: {
      systemQty: payload.systemQty,
      countedQty: payload.countedQty,
      diff,
      justification: payload.justification,
    },
  });
}

export function recordInventoryApproved(
  ctx: RecordCtx,
  payload: { inventoryId: string; warehouseName: string; adjusted?: number },
): void {
  recordActivity(ctx.companyId, {
    kind: 'inventory',
    domain: 'inventory',
    actorName: ctx.actorName,
    actorId: ctx.actorId,
    title: 'Inventário aprovado',
    description: `${payload.warehouseName} · estoque WMS ajustado${payload.adjusted != null ? ` · ${payload.adjusted} diferença(s)` : ''}`,
    reference: payload.warehouseName,
    entityType: 'inventory',
    entityId: payload.inventoryId,
    status: 'Aprovado',
    result: 'success',
    href: `/app/inventory/${payload.inventoryId}`,
  });
}

export function recordPrintListActivity(
  ctx: RecordCtx,
  listTitle: string,
  orderCount: number,
  unitCount: number,
): void {
  recordActivity(ctx.companyId, {
    kind: 'print_document',
    domain: 'conference',
    actorName: ctx.actorName,
    title: 'Lista impressa',
    description: `${listTitle} · ${orderCount} pedido(s) · ${unitCount} un. · documento A4`,
    reference: 'Impressão',
    status: 'Gerado',
    href: LOGSTOKA_ROUTES.PRINT_CONFERENCE,
  });
}

export function recordFlowProfileSaved(ctx: RecordCtx, syncMode: string): void {
  recordActivity(ctx.companyId, {
    kind: 'flow_update',
    domain: 'flow',
    actorName: ctx.actorName,
    title: 'Fluxo operacional',
    description: `Fluxo de saída atualizado · origem ${syncMode}`,
    reference: 'Fluxo semanal',
    status: 'Salvo',
    href: LOGSTOKA_ROUTES.OPERATIONAL_FLOW,
  });
}

export function recordOperationalExit(
  ctx: RecordCtx,
  payload: { productName: string; quantity: number; orderRef?: string; reference?: string },
): void {
  recordActivity(ctx.companyId, {
    kind: 'exit',
    domain: 'operation',
    actorName: ctx.actorName,
    title: 'Saída',
    description: `Saída de ${payload.quantity} un. · ${payload.productName}${payload.orderRef ? ` · pedido ${payload.orderRef}` : ''}`,
    reference: payload.reference ?? payload.orderRef ?? 'Saída',
    orderRef: payload.orderRef,
    status: 'Expedido',
    href: '/app/movements',
  });
}

export function recordGenericActivity(
  ctx: RecordCtx,
  input: {
    kind: ActivityEventKind;
    domain: ActivityDomain;
    title: string;
    description: string;
    reference: string;
    status: string;
    href?: string;
    result?: 'success' | 'warning' | 'error' | 'pending';
  },
): void {
  recordActivity(ctx.companyId, { ...input, actorName: ctx.actorName });
}

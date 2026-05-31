import { loadConferenceHistory } from '@/lib/conferenceHistory';
import { DEMO_MOVEMENTS, DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import {
  activityDomainLabel,
  activityKindLabel,
  formatActivityClock,
  formatActivityDayLabel,
  type OperationalActivityEvent,
} from '@/lib/operationalActivityLog';

export type ActivityEventPreviewMeta = {
  productName?: string;
  sku?: string;
  quantity?: number;
  valueBrl?: number;
  warehouseName?: string;
  referenceCode?: string;
  conferenceKind?: string;
  actorEmail?: string;
};

export type ActivityEventPreview = {
  actionLabel: string;
  dateLabel: string;
  timeLabel: string;
  productName: string;
  quantityLabel: string;
  valueLabel: string;
  status: string;
  reference: string;
  actorName: string;
  /** Colaborador que conduziu a conferência / inventário */
  responsibleName: string;
  responsibleLabel: string;
  responsibleHint?: string;
  storeOrChannel?: string;
  description: string;
  domainLabel: string;
  href?: string;
  showResponsible: boolean;
};

const fmtBrl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

function parseQtyToken(token: string): number | undefined {
  const m = token.match(/([\d.,]+)/);
  if (!m) return undefined;
  const n = Number(m[1]!.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function movementValueBrl(movementId: string): number | null {
  const m = DEMO_MOVEMENTS.find((row) => row.id === movementId);
  if (!m?.sku) return null;
  const prod = DEMO_PRODUCTS.find((p) => p.sku === m.sku);
  const unit = prod?.sale_price ?? prod?.cost ?? 0;
  return m.total_quantity * unit;
}

function parseFromDescription(description: string): Partial<ActivityEventPreviewMeta> {
  const confItem = description.match(/^Item conferido · (.+?) · ([^·]+?) · (.+)$/i);
  if (confItem) {
    return {
      productName: confItem[1]!.trim(),
      quantity: parseQtyToken(confItem[2]!),
      warehouseName: confItem[3]!.trim(),
    };
  }

  const invItem = description.match(/^Contagem registrada · (.+?) · (.+)$/i);
  if (invItem) {
    return {
      productName: invItem[1]!.trim(),
      quantity: parseQtyToken(invItem[2]!),
    };
  }

  const dotParts = description.split('·').map((s) => s.trim());
  if (dotParts.length >= 2) {
    const qtyMatch = dotParts.find((p) => /\d+\s*un/i.test(p));
    const productPart = dotParts.find(
      (p) => p !== qtyMatch && !/^item conferido$/i.test(p) && !/^contagem registrada$/i.test(p),
    );
    const qty = qtyMatch ? parseQtyToken(qtyMatch) : undefined;
    return {
      productName: productPart,
      quantity: qty,
    };
  }

  const entryMatch = description.match(/(?:Entrada|Saída|Saida) de (\d+) un\.?\s*·\s*(.+?)(?:\s*·|$)/i);
  if (entryMatch) {
    return { quantity: Number(entryMatch[1]), productName: entryMatch[2]?.trim() };
  }

  return {};
}

function metaFromEvent(event: OperationalActivityEvent): ActivityEventPreviewMeta {
  const raw = event.meta as ActivityEventPreviewMeta | undefined;
  if (raw?.productName || raw?.quantity != null || raw?.sku) return raw;

  const parsed = parseFromDescription(event.description);
  const entityId = event.entityId ?? (event.href?.match(/\/([^/]+)$/)?.[1] ?? '');

  if (entityId.startsWith('mov-')) {
    const m = DEMO_MOVEMENTS.find((row) => row.id === entityId);
    if (m) {
      return {
        productName: m.product_name ?? parsed.productName,
        sku: m.sku,
        quantity: m.total_quantity,
        warehouseName: m.warehouse_name,
        referenceCode: m.reference_code ?? undefined,
        valueBrl: movementValueBrl(entityId) ?? undefined,
      };
    }
  }

  return parsed;
}

function findConferenceMatch(
  event: OperationalActivityEvent,
  companyId: string | null,
): { actorName: string; actorEmail?: string; productName?: string; quantity?: number; store?: string } | null {
  if (!companyId) return null;
  const history = loadConferenceHistory(companyId);
  const eventTime = new Date(event.time).getTime();
  const sku = event.productSku ?? (event.meta as ActivityEventPreviewMeta | undefined)?.sku;

  for (const row of history) {
    const rowTime = new Date(row.at).getTime();
    const closeInTime = Math.abs(rowTime - eventTime) < 3 * 60 * 60 * 1000;
    const refMatch =
      (event.reference && (row.orderRef === event.reference || row.store === event.reference)) ||
      (event.orderRef && row.orderRef === event.orderRef);
    const skuMatch = sku && row.sku === sku;

    if (closeInTime && (refMatch || skuMatch)) {
      return {
        actorName: row.actorName,
        actorEmail: row.actorEmail,
        productName: row.productName,
        quantity: row.quantityRegistered ?? row.quantityExpected,
        store: row.store ?? undefined,
      };
    }
  }
  return null;
}

function isConferenceLike(event: OperationalActivityEvent): boolean {
  return event.domain === 'conference' || event.kind === 'conference' || event.kind === 'separation';
}

function isInventoryLike(event: OperationalActivityEvent): boolean {
  return event.domain === 'inventory' || event.kind === 'inventory';
}

export function resolveActivityEventPreview(
  event: OperationalActivityEvent,
  companyId?: string | null,
): ActivityEventPreview {
  const meta = metaFromEvent(event);
  const confMatch = findConferenceMatch(event, companyId ?? event.companyId);

  const productName =
    meta.productName ??
    confMatch?.productName ??
    event.productSku ??
    (isConferenceLike(event) ? undefined : event.title) ??
    '—';

  const quantity =
    meta.quantity ?? confMatch?.quantity ?? undefined;

  const quantityLabel =
    quantity != null ? `${quantity.toLocaleString('pt-BR')} un.` : '—';

  const valueLabel =
    meta.valueBrl != null && meta.valueBrl > 0 ? fmtBrl(meta.valueBrl) : '—';

  const actorFromEvent = event.actorName?.trim() && event.actorName !== 'Sistema' ? event.actorName : null;
  const responsibleName = actorFromEvent ?? confMatch?.actorName ?? event.actorName ?? '—';

  const storeOrChannel =
    meta.warehouseName ??
    confMatch?.store ??
    (event.reference && !event.reference.startsWith('conf-') ? event.reference : undefined);

  const showResponsible = isConferenceLike(event) || isInventoryLike(event) || Boolean(confMatch);

  let responsibleLabel = 'Operador';
  let responsibleHint: string | undefined;
  if (isConferenceLike(event)) {
    responsibleLabel = 'Responsável pela conferência';
    responsibleHint = confMatch?.actorEmail
      ? `${confMatch.actorEmail} · conferência guiada`
      : 'Colaborador que marcou conferido ou divergência';
  } else if (isInventoryLike(event)) {
    responsibleLabel = 'Responsável pela contagem';
    responsibleHint = 'Colaborador que registrou a contagem física';
  } else if (showResponsible) {
    responsibleLabel = 'Responsável';
  }

  let href = event.href;
  if (showResponsible && (!href || href === LOGSTOKA_ROUTES.OPERATIONAL_WORK)) {
    href = LOGSTOKA_ROUTES.PICKING_HISTORY;
  }

  return {
    actionLabel: event.title || activityKindLabel(event.kind),
    dateLabel: formatActivityDayLabel(event.time),
    timeLabel: formatActivityClock(event.time),
    productName: productName === 'Item conferido' && confMatch?.productName ? confMatch.productName : productName,
    quantityLabel,
    valueLabel,
    status: event.status,
    reference: meta.referenceCode ?? event.orderRef ?? event.reference,
    actorName: responsibleName,
    responsibleName,
    responsibleLabel,
    responsibleHint,
    storeOrChannel,
    description: event.description,
    domainLabel: activityDomainLabel(event.domain),
    href,
    showResponsible,
  };
}

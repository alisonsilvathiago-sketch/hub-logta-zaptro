import { DEMO_MOVEMENTS, DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
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
  description: string;
  domainLabel: string;
  href?: string;
};

const fmtBrl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

function movementValueBrl(movementId: string): number | null {
  const m = DEMO_MOVEMENTS.find((row) => row.id === movementId);
  if (!m?.sku) return null;
  const prod = DEMO_PRODUCTS.find((p) => p.sku === m.sku);
  const unit = prod?.sale_price ?? prod?.cost ?? 0;
  return m.total_quantity * unit;
}

function parseFromDescription(description: string): Partial<ActivityEventPreviewMeta> {
  const dotParts = description.split('·').map((s) => s.trim());
  if (dotParts.length >= 2) {
    const qtyMatch = dotParts.find((p) => /^\d+(\s*un)?/i.test(p) || /\d+\s*un/i.test(p));
    const productPart = dotParts.find((p) => !/\d+\s*un/i.test(p) && p !== qtyMatch);
    const qty = qtyMatch?.match(/(\d+)/)?.[1];
    return {
      productName: productPart,
      quantity: qty ? Number(qty) : undefined,
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
  if (raw?.productName || raw?.quantity != null) return raw;

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

export function resolveActivityEventPreview(event: OperationalActivityEvent): ActivityEventPreview {
  const meta = metaFromEvent(event);
  const productName =
    meta.productName ?? event.productSku ?? event.title ?? '—';
  const quantityLabel =
    meta.quantity != null ? `${meta.quantity.toLocaleString('pt-BR')} un.` : '—';
  const valueLabel =
    meta.valueBrl != null && meta.valueBrl > 0 ? fmtBrl(meta.valueBrl) : '—';

  return {
    actionLabel: event.title || activityKindLabel(event.kind),
    dateLabel: formatActivityDayLabel(event.time),
    timeLabel: formatActivityClock(event.time),
    productName,
    quantityLabel,
    valueLabel,
    status: event.status,
    reference: meta.referenceCode ?? event.reference,
    actorName: event.actorName,
    description: event.description,
    domainLabel: activityDomainLabel(event.domain),
    href: event.href,
  };
}

import type { SupabaseClient } from '@supabase/supabase-js';
import { createMovementWithStock, checkLowStockAlerts } from './stockService.js';
import { parseNfeXml, parseReportCsv, type ReportRow } from './importParser.js';
import { logstokaQueue } from '../queue/inMemoryQueue.js';

const SALE_EVENTS = new Set([
  'order.created',
  'order.paid',
  'order.confirmed',
  'sale.created',
  'venda.realizada',
]);

const CANCEL_EVENTS = new Set(['order.cancelled', 'order.canceled', 'pedido.cancelado']);

export async function processNfeXmlImport(
  admin: SupabaseClient,
  params: {
    companyId: string;
    userId: string;
    warehouseId?: string;
    xml: string;
    importId?: string;
  },
) {
  const parsed = parseNfeXml(params.xml);

  let supplierId: string | undefined;
  if (parsed.supplierName) {
    const { data: existing } = await admin
      .from('ls_suppliers')
      .select('id')
      .eq('company_id', params.companyId)
      .eq('name', parsed.supplierName)
      .maybeSingle();

    if (existing?.id) {
      supplierId = existing.id;
    } else {
      const { data: created } = await admin
        .from('ls_suppliers')
        .insert({
          company_id: params.companyId,
          name: parsed.supplierName,
          document: parsed.supplierDocument,
        })
        .select('id')
        .single();
      supplierId = created?.id;
    }
  }

  const result = await createMovementWithStock(admin, {
    companyId: params.companyId,
    userId: params.userId,
    movementType: 'entry',
    subType: 'factory',
    warehouseId: params.warehouseId ?? '',
    supplierId,
    invoiceNumber: parsed.invoiceNumber,
    invoiceXml: params.xml.slice(0, 50000),
    notes: `Importação NF-e${parsed.supplierName ? ` — ${parsed.supplierName}` : ''}`,
    items: parsed.items.map((item) => ({
      sku: item.sku,
      barcode: item.barcode,
      quantity: item.quantity,
    })),
  });

  if (params.importId) {
    await admin
      .from('ls_reports_imports')
      .update({
        status: 'completed',
        rows_total: parsed.items.length,
        rows_processed: parsed.items.length,
        ocr_payload: { invoiceNumber: parsed.invoiceNumber, supplier: parsed.supplierName },
      })
      .eq('id', params.importId);
  }

  await checkLowStockAlerts(admin, params.companyId);
  await dispatchStockChangedWebhook(admin, params.companyId, result.movement.id);

  return { parsed, ...result };
}

export async function processReportImport(
  admin: SupabaseClient,
  params: {
    companyId: string;
    userId: string;
    warehouseId?: string;
    content?: string;
    rows?: ReportRow[];
    fileType: 'csv' | 'xlsx';
    importId?: string;
  },
) {
  const rows = params.rows ?? (params.content ? parseReportCsv(params.content) : []);
  if (rows.length === 0) throw new Error('Nenhuma linha válida no relatório');

  const grouped = new Map<string, ReportRow[]>();
  for (const row of rows) {
    const key = `${row.marketplace ?? 'geral'}::${row.store ?? 'default'}`;
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
  }

  const movements = [];
  for (const [, groupRows] of grouped) {
    const first = groupRows[0];
    const result = await createMovementWithStock(admin, {
      companyId: params.companyId,
      userId: params.userId,
      movementType: 'exit',
      subType: 'sale',
      warehouseId: params.warehouseId ?? '',
      marketplace: first.marketplace,
      referenceCode: first.store,
      notes: `Importação relatório — ${groupRows.length} itens`,
      items: groupRows.map((r) => ({ sku: r.sku, quantity: r.quantity })),
    });
    movements.push(result.movement);
  }

  if (params.importId) {
    await admin
      .from('ls_reports_imports')
      .update({
        status: 'completed',
        rows_total: rows.length,
        rows_processed: rows.length,
      })
      .eq('id', params.importId);
  }

  await checkLowStockAlerts(admin, params.companyId);

  return { rowsProcessed: rows.length, movements };
}

export async function processOrderWebhook(
  admin: SupabaseClient,
  companyId: string,
  payload: Record<string, unknown>,
) {
  const event = String(payload.event ?? payload.type ?? 'order.created').toLowerCase();
  const items = normalizeOrderItems(payload);
  const marketplace = String(payload.marketplace ?? payload.channel ?? '').toLowerCase() || undefined;
  const store = String(payload.store ?? payload.loja ?? payload.shop ?? '') || undefined;
  const orderId = String(payload.order_id ?? payload.id ?? payload.reference ?? '');

  if (CANCEL_EVENTS.has(event)) {
    if (items.length === 0) return { action: 'ignored', reason: 'no_items' };
    const result = await createMovementWithStock(admin, {
      companyId,
      userId: String(payload.user_id ?? payload.operator_id ?? ''),
      movementType: 'entry',
      subType: 'order_cancelled',
      warehouseId: String(payload.warehouse_id ?? ''),
      marketplace,
      referenceCode: orderId,
      notes: `Estorno por cancelamento — ${store ?? marketplace ?? 'pedido'}`,
      items,
    });
    return { action: 'restocked', movementId: result.movement.id };
  }

  if (!SALE_EVENTS.has(event)) {
    return { action: 'logged', event };
  }

  if (items.length === 0) {
    return { action: 'ignored', reason: 'no_items' };
  }

  const result = await createMovementWithStock(admin, {
    companyId,
    userId: String(payload.user_id ?? payload.operator_id ?? ''),
    movementType: 'exit',
    subType: 'sale',
    warehouseId: String(payload.warehouse_id ?? ''),
    marketplace,
    referenceCode: orderId,
    notes: `Venda automática — ${store ?? marketplace ?? event}`,
    items,
  });

  await checkLowStockAlerts(admin, companyId);
  await dispatchStockChangedWebhook(admin, companyId, result.movement.id);

  return { action: 'stock_deducted', movementId: result.movement.id, items: result.items.length };
}

function normalizeOrderItems(payload: Record<string, unknown>) {
  const raw = payload.items ?? payload.products ?? payload.lines ?? [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((row) => {
      const item = row as Record<string, unknown>;
      return {
        sku: String(item.sku ?? item.cProd ?? item.product_code ?? item.code ?? ''),
        barcode: item.barcode ? String(item.barcode) : undefined,
        product_id: item.product_id ? String(item.product_id) : undefined,
        quantity: Number(item.quantity ?? item.qty ?? item.qCom ?? 0),
      };
    })
    .filter((i) => i.quantity > 0 && (i.sku || i.barcode || i.product_id));
}

async function dispatchStockChangedWebhook(
  admin: SupabaseClient,
  companyId: string,
  movementId: string,
) {
  const { data: endpoints } = await admin
    .from('ls_webhook_endpoints')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true);

  for (const endpoint of endpoints ?? []) {
    const events = (endpoint.events ?? []) as string[];
    if (events.length > 0 && !events.includes('stock.changed')) continue;

    await logstokaQueue.enqueue('webhook.outbound', {
      url: endpoint.url,
      secret: endpoint.secret,
      payload: {
        event: 'stock.changed',
        company_id: companyId,
        movement_id: movementId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

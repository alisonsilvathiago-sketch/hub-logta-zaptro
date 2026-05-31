import { loadConferenceHistory } from '@/lib/conferenceHistory';
import { loadCompanyMovements } from '@/lib/movementLoader';
import { formatOverdueLabel, computeMovementOverdue, getMaxOverdueDaysBySku } from '@/lib/movementOverdue';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { getDemoStockQty, DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import { buildDemoOperationalOrders } from '@/lib/operationalFlow';
import {
  getTodayFlowPlan,
  loadOperationalProfile,
  WEEKDAY_SHORT,
  type DayFlowPlan,
} from '@/lib/operationalProfile';
import { countPublishedStores, PUBLICATION_STATUS_LABELS } from '@/lib/productPublication';
import type { XRayDiagnosticItem } from '@/modules/ai/auditor/xrayAuditor';
import { supabase } from '@/lib/supabase';
import type { LsProduct, ProductPublicationStatus } from '@/types';

const MAX_PER_PRODUCT = 24;

type ProductRow = Pick<
  LsProduct,
  | 'id'
  | 'sku'
  | 'name'
  | 'barcode'
  | 'internal_code'
  | 'min_stock'
  | 'status'
  | 'publication_status'
  | 'main_image_url'
  | 'description'
  | 'description_short'
  | 'brand'
>;

function pushItem(items: XRayDiagnosticItem[], item: XRayDiagnosticItem): void {
  items.push(item);
}

async function loadProductsForCatalogAudit(companyId: string, demo: boolean): Promise<ProductRow[]> {
  if (demo) {
    return DEMO_PRODUCTS.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      barcode: p.barcode,
      internal_code: p.internal_code,
      min_stock: p.min_stock,
      status: p.status,
      publication_status: p.publication_status,
      main_image_url: p.main_image_url,
      description: p.description,
      description_short: p.description_short,
      brand: p.brand,
    }));
  }
  const { data } = await supabase
    .from('ls_products')
    .select(
      'id, sku, name, barcode, internal_code, min_stock, status, publication_status, main_image_url, description, description_short, brand',
    )
    .eq('company_id', companyId)
    .limit(500);
  return (data ?? []) as ProductRow[];
}

function stockQty(companyId: string, demo: boolean, productId: string): number | null {
  if (!demo) return null;
  return getDemoStockQty(productId);
}

function parseCutoffMinutes(cutoff: string): number {
  const [h, m] = cutoff.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function isPastCutoff(plan: DayFlowPlan, now = new Date()): boolean {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin > parseCutoffMinutes(plan.dailyCutoff);
}

function productMatchesFlowSku(p: ProductRow, plan: DayFlowPlan): boolean {
  if (!plan.productSkus?.length) return true;
  return plan.productSkus.some(
    (sku) => sku === p.sku || sku === p.internal_code || p.sku.includes(sku) || sku.includes(p.sku),
  );
}

/** Auditoria completa do catálogo — espelha linhas vermelhas e pendências reais. */
export async function auditProductCatalog(companyId: string): Promise<XRayDiagnosticItem[]> {
  const demo = isLogstokaDemoCompany(companyId);
  const products = await loadProductsForCatalogAudit(companyId, demo);
  const movements = await loadCompanyMovements(companyId);
  const profile = loadOperationalProfile(companyId);
  const todayPlan = getTodayFlowPlan(profile);
  const overdueList = computeMovementOverdue(movements);
  const overdueBySku = getMaxOverdueDaysBySku(movements);
  const productBySku = new Map(products.map((p) => [p.sku, p]));

  const items: XRayDiagnosticItem[] = [];
  let productIssueCount = 0;

  // —— Saídas em atraso (linha vermelha na lista) ——
  for (const o of overdueList.slice(0, MAX_PER_PRODUCT)) {
    const prod = productBySku.get(o.sku);
    pushItem(items, {
      id: `prod-move-overdue-${o.sku}-${o.entryDate}`,
      status: o.daysOverdue >= 2 ? 'error' : 'warning',
      title: `Entrada sem saída · ${o.sku}`,
      message: `${o.productName}: ${o.pendingQuantity} un. pendentes desde ${o.entryDate} (${formatOverdueLabel(o.daysOverdue)}) — mesmo alerta da linha vermelha.`,
      priority: 'high',
      canResolve: false,
      targetUrl: prod ? `/app/products/${prod.id}` : '/app/movements?tab=overdue',
      sku: o.sku,
    });
    productIssueCount += 1;
  }
  if (overdueList.length > MAX_PER_PRODUCT) {
    pushItem(items, {
      id: 'prod-move-overdue-batch',
      status: 'error',
      title: `Mais ${overdueList.length - MAX_PER_PRODUCT} SKU(s) com atraso de saída`,
      message: 'Abra Movimentações → Atrasos ou filtre o catálogo pelas linhas vermelhas.',
      priority: 'high',
      canResolve: false,
      targetUrl: '/app/movements?tab=overdue',
    });
  }

  // —— Fluxo do dia: após horário de saída ——
  if (isPastCutoff(todayPlan)) {
    const lateOrders = buildDemoOperationalOrders(new Date(), profile).filter((o) => o.isLate && o.sku);
    const seenSku = new Set<string>();
    for (const order of lateOrders) {
      if (!order.sku || seenSku.has(order.sku)) continue;
      const prod = productBySku.get(order.sku);
      if (prod && !productMatchesFlowSku(prod, todayPlan)) continue;
      seenSku.add(order.sku);
      pushItem(items, {
        id: `prod-flow-late-${order.sku}`,
        status: 'error',
        title: `Fluxo do dia · saída atrasada · ${order.sku}`,
        message: `${order.productName}: deveria sair hoje (${todayPlan.weekdayLabel}) até ${todayPlan.dailyCutoff} — pedido ${order.orderRef} ainda em ${order.stage}.`,
        priority: 'high',
        canResolve: false,
        targetUrl: prod ? `/app/products/${prod.id}` : '/app/operacao',
        sku: order.sku,
      });
      productIssueCount += 1;
      if (seenSku.size >= 12) break;
    }

    if (todayPlan.productSkus?.length) {
      const missingExit = todayPlan.productSkus.filter((sku) => {
        const hadEntry = movements.some(
          (m) =>
            m.movement_type === 'entry' &&
            m.sku === sku &&
            new Date(m.created_at).toDateString() === new Date().toDateString(),
        );
        const hadExit = movements.some(
          (m) =>
            m.movement_type === 'exit' &&
            m.sku === sku &&
            new Date(m.created_at).toDateString() === new Date().toDateString(),
        );
        return hadEntry && !hadExit;
      });
      for (const sku of missingExit.slice(0, 8)) {
        const prod = productBySku.get(sku);
        pushItem(items, {
          id: `prod-flow-cutoff-${sku}`,
          status: 'error',
          title: `Corte ${todayPlan.dailyCutoff} · sem saída hoje · ${sku}`,
          message: `SKU no fluxo de ${todayPlan.weekdayLabel} (${todayPlan.processSaleDays.join(' + ')}) entrou hoje e ainda não teve baixa após ${todayPlan.dailyCutoff}.`,
          priority: 'high',
          canResolve: false,
          targetUrl: prod ? `/app/products/${prod.id}` : '/app/movements?tab=exit',
          sku,
        });
        productIssueCount += 1;
      }
    }
  }

  // —— Divergências de conferência por SKU ——
  const confHistory = loadConferenceHistory(companyId);
  const confBySku = new Map<string, typeof confHistory>();
  for (const row of confHistory) {
    if (row.kind !== 'item_divergence' || !row.sku) continue;
    const list = confBySku.get(row.sku) ?? [];
    list.push(row);
    confBySku.set(row.sku, list);
  }
  for (const [sku, rows] of confBySku) {
    const last = rows[0]!;
    const prod = productBySku.get(sku);
    const qty =
      last.quantityExpected != null && last.quantityRegistered != null
        ? ` Sistema ${last.quantityExpected} · contado ${last.quantityRegistered}.`
        : '';
    pushItem(items, {
      id: `prod-conf-div-${sku}`,
      status: 'error',
      title: `Divergência na conferência · ${sku}`,
      message: `${last.productName ?? sku} — ${last.actorName}.${qty}`,
      priority: 'high',
      canResolve: false,
      targetUrl: '/app/picking/historico',
      sku,
    });
    productIssueCount += 1;
  }

  // —— Duplicidade global ——
  const skuCounts = new Map<string, number>();
  const barcodeCounts = new Map<string, number>();
  for (const p of products) {
    skuCounts.set(p.sku, (skuCounts.get(p.sku) ?? 0) + 1);
    const bc = p.barcode?.trim();
    if (bc) barcodeCounts.set(bc, (barcodeCounts.get(bc) ?? 0) + 1);
  }

  for (const p of products) {
    if ((skuCounts.get(p.sku) ?? 0) > 1) {
      pushItem(items, {
        id: `prod-dup-sku-${p.id}`,
        status: 'error',
        title: `SKU duplicado · ${p.sku}`,
        message: `${p.name} — o mesmo SKU aparece mais de uma vez no catálogo.`,
        priority: 'high',
        canResolve: false,
        targetUrl: `/app/products/${p.id}`,
        sku: p.sku,
      });
      productIssueCount += 1;
    }
    const bc = p.barcode?.trim();
    if (bc && (barcodeCounts.get(bc) ?? 0) > 1) {
      pushItem(items, {
        id: `prod-dup-ean-${p.id}`,
        status: 'error',
        title: `EAN duplicado · ${p.sku}`,
        message: `${p.name} — código ${bc} usado em outro produto.`,
        priority: 'high',
        canResolve: false,
        targetUrl: `/app/products/${p.id}`,
        sku: p.sku,
      });
      productIssueCount += 1;
    }
  }

  // —— Cadastro, publicação, estoque (por produto) ——
  for (const p of products) {
    const qty = stockQty(companyId, demo, p.id);
    const pubStatus = (p.publication_status ?? 'draft') as ProductPublicationStatus;
    const storeCount = companyId ? countPublishedStores(companyId, p.id) : 0;
    const overdueDays = overdueBySku.get(p.sku) ?? (p.internal_code ? overdueBySku.get(p.internal_code) : undefined);

    if (
      overdueDays &&
      !items.some(
        (i) =>
          i.sku === p.sku &&
          (i.id.startsWith('prod-move-overdue') || i.id.startsWith('prod-list-overdue')),
      )
    ) {
      pushItem(items, {
        id: `prod-list-overdue-${p.id}`,
        status: overdueDays >= 2 ? 'error' : 'warning',
        title: `Lista vermelha · atraso · ${p.sku}`,
        message: `${p.name} — ${formatOverdueLabel(overdueDays)} (entrada sem saída completa).`,
        priority: 'high',
        canResolve: false,
        targetUrl: `/app/products/${p.id}`,
        sku: p.sku,
      });
      productIssueCount += 1;
    }

    if (!p.main_image_url?.trim()) {
      pushItem(items, {
        id: `prod-no-img-${p.id}`,
        status: 'warning',
        title: `Sem imagem · ${p.sku}`,
        message: `${p.name} — cadastro incompleto para publicação e etiqueta.`,
        priority: 'medium',
        canResolve: false,
        targetUrl: `/app/products/${p.id}`,
        sku: p.sku,
      });
      productIssueCount += 1;
    }

    if (!p.description?.trim() && !p.description_short?.trim()) {
      pushItem(items, {
        id: `prod-no-desc-${p.id}`,
        status: 'warning',
        title: `Sem descrição · ${p.sku}`,
        message: `${p.name} — descrição curta ou longa ausente.`,
        priority: 'medium',
        canResolve: false,
        targetUrl: `/app/products/${p.id}`,
        sku: p.sku,
      });
      productIssueCount += 1;
    }

    if (!p.barcode?.trim()) {
      pushItem(items, {
        id: `prod-no-ean-${p.id}`,
        status: 'warning',
        title: `Sem EAN/GTIN · ${p.sku}`,
        message: `${p.name} — bipagem e etiquetas podem falhar.`,
        priority: 'medium',
        canResolve: false,
        targetUrl: `/app/products/${p.id}`,
        sku: p.sku,
      });
      productIssueCount += 1;
    }

    if (pubStatus !== 'published') {
      pushItem(items, {
        id: `prod-not-pub-${p.id}`,
        status: pubStatus === 'draft' ? 'warning' : 'error',
        title: `Não publicado · ${p.sku}`,
        message: `${p.name} — status «${PUBLICATION_STATUS_LABELS[pubStatus]}». Canais não recebem estoque automático.`,
        priority: pubStatus === 'ready' ? 'high' : 'medium',
        canResolve: false,
        targetUrl: `/app/products/publicacao`,
        sku: p.sku,
      });
      productIssueCount += 1;
    } else if (storeCount === 0) {
      pushItem(items, {
        id: `prod-no-store-${p.id}`,
        status: 'warning',
        title: `Sem loja vinculada · ${p.sku}`,
        message: `${p.name} — publicado no mestre mas nenhuma loja/marketplace ativo.`,
        priority: 'medium',
        canResolve: false,
        targetUrl: `/app/products/${p.id}`,
        sku: p.sku,
      });
      productIssueCount += 1;
    }

    if (p.status !== 'active') {
      pushItem(items, {
        id: `prod-inactive-${p.id}`,
        status: 'warning',
        title: `Produto inativo · ${p.sku}`,
        message: `${p.name} — status inativo no catálogo mestre.`,
        priority: 'low',
        canResolve: false,
        targetUrl: `/app/products/${p.id}`,
        sku: p.sku,
      });
      productIssueCount += 1;
    }

    if (qty != null && qty < p.min_stock) {
      pushItem(items, {
        id: `prod-low-stock-${p.id}`,
        status: qty <= 0 ? 'error' : 'warning',
        title: qty <= 0 ? `Sem estoque · ${p.sku}` : `Estoque abaixo do mínimo · ${p.sku}`,
        message: `${p.name} — ${qty} un. no WMS · mínimo ${p.min_stock} un.`,
        priority: qty <= 0 ? 'high' : 'medium',
        canResolve: false,
        targetUrl: `/app/products/${p.id}`,
        sku: p.sku,
      });
      productIssueCount += 1;
    }
  }

  // Resumo do fluxo de hoje (informativo se sem erros de horário)
  if (items.length === 0) {
    pushItem(items, {
      id: 'prod-ok-all',
      status: 'ok',
      title: 'Catálogo alinhado ao WMS e ao fluxo',
      message: `${products.length} produto(s) verificados · fluxo ${todayPlan.weekdayLabel} (saída ${todayPlan.dailyCutoff}) · sem pendências com evidência.`,
      priority: 'low',
      canResolve: false,
    });
  }

  return items
    .filter((i) => i.status !== 'ok' || items.filter((x) => x.status !== 'ok').length === 0)
    .sort((a, b) => {
    const rank = (s: XRayDiagnosticItem['status']) => (s === 'error' ? 0 : s === 'warning' ? 1 : 2);
      return rank(a.status) - rank(b.status);
    });
}

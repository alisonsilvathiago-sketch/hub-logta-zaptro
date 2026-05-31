import { loadConferenceHistory } from '@/lib/conferenceHistory';
import { computeMovementOverdue } from '@/lib/movementOverdue';
import { loadCompanyMovements } from '@/lib/movementLoader';
import { auditProductCatalog } from '@/lib/xray/productCatalogAudit';
import type { XRayDiagnosticItem } from '@/modules/ai/auditor/xrayAuditor';
import type { XRayPageContext } from '@/modules/ai/auditor/LogstokaXRayContext';

/** Diagnósticos com evidência real por contexto de página. */
export async function buildLiveXRayDiagnostics(
  context: XRayPageContext,
  companyId: string | null,
): Promise<XRayDiagnosticItem[]> {
  if (!companyId) return [];

  if (context === 'products') {
    return auditProductCatalog(companyId);
  }

  const items: XRayDiagnosticItem[] = [];

  if (context === 'movements' || context === 'global') {
    const movements = await loadCompanyMovements(companyId);
    const overdue = computeMovementOverdue(movements);
    if (overdue.length > 0) {
      const worst = overdue[0]!;
      items.push({
        id: 'move-overdue',
        status: 'error',
        title: 'Entradas sem saída (atrasos)',
        message: `${overdue.length} SKU(s) — pior: ${worst.productName} (${worst.pendingQuantity} un. · ${worst.daysOverdue} dia(s)).`,
        priority: 'high',
        canResolve: false,
        targetUrl: '/app/movements?tab=overdue',
      });
    }
  }

  if (context === 'conference' || context === 'picking' || context === 'global') {
    const history = loadConferenceHistory(companyId);
    const divergences = history.filter((r) => r.kind === 'item_divergence');
    if (divergences.length > 0) {
      const last = divergences[0]!;
      const qtyNote =
        last.quantityExpected != null && last.quantityRegistered != null
          ? ` Sistema ${last.quantityExpected} · registrado ${last.quantityRegistered}.`
          : '';
      items.push({
        id: 'conf-divergence',
        status: 'error',
        title: 'Divergências de conferência',
        message: `${divergences.length} registro(s) — último: ${last.productName ?? last.sku} (${last.actorName}).${qtyNote}`,
        priority: 'high',
        canResolve: false,
        targetUrl: '/app/picking/historico',
      });
    }
  }

  if (items.length === 0 && context !== 'global') {
    items.push({
      id: `${context}-ok`,
      status: 'ok',
      title: 'Seção sem pendências críticas',
      message: 'Nenhum alerta com evidência nesta varredura.',
      priority: 'low',
      canResolve: false,
    });
  }

  if (context === 'global' && items.length > 0) {
    const productItems = await auditProductCatalog(companyId);
    const issues = productItems.filter((i) => i.status !== 'ok');
    if (issues.length > 0) {
      items.push({
        id: 'global-products',
        status: 'error',
        title: `Catálogo: ${issues.length} alerta(s)`,
        message: 'Abra Raio-X em Produtos para a lista completa por SKU.',
        priority: 'high',
        canResolve: false,
        targetUrl: '/app/products',
      });
    }
  }

  return items;
}

import type { DemoMovementRow } from '@/lib/logstokaDemoSeed';
import { appendDemoMovements, loadMergedDemoMovements } from '@/lib/demoMovementStore';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import type { GuidedOperationItem } from '@/lib/guidedOperationItem';
import { logstokaApi } from '@/lib/logstokaApi';
import { recordOperationalExit } from '@/lib/activityRecording';
import type { Marketplace } from '@/types';

export { loadMergedDemoMovements };

function resolveSku(item: GuidedOperationItem): string {
  if (item.sku) return item.sku;
  const slug = item.productName
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
    .toUpperCase();
  return slug || `SKU-${item.id.slice(0, 8).toUpperCase()}`;
}

function buildDemoExitRow(
  companyId: string,
  item: GuidedOperationItem,
  actorName: string,
  index: number,
): DemoMovementRow {
  const now = new Date();
  now.setSeconds(now.getSeconds() - index);
  const sku = resolveSku(item);
  const marketplace = (item.marketplace ?? null) as Marketplace | null;

  return {
    id: `mov-conf-${Date.now()}-${index}`,
    company_id: companyId,
    movement_type: 'exit',
    sub_type: 'sale',
    status: 'completed',
    warehouse_id: 'wh-1',
    marketplace,
    reference_code: item.orderRef ?? `Conf. ${actorName.split(' ')[0] ?? 'Op'}`,
    total_quantity: item.quantity,
    created_at: now.toISOString(),
    sku,
    product_name: item.productName,
    warehouse_name: 'CD Principal',
  };
}

export type RegisterGuidedExitsResult = {
  count: number;
  movementIds: string[];
};

export async function registerGuidedConferenceExits(
  companyId: string | null,
  actorName: string,
  items: GuidedOperationItem[],
): Promise<RegisterGuidedExitsResult> {
  if (!companyId || items.length === 0) {
    return { count: 0, movementIds: [] };
  }

  const operationItems = items.filter((item) => item.context === 'operation');
  if (operationItems.length === 0) {
    return { count: 0, movementIds: [] };
  }

  const demo = isLogstokaDemoCompany(companyId);
  const movementIds: string[] = [];

  if (demo) {
    const rows = operationItems.map((item, index) => buildDemoExitRow(companyId, item, actorName, index));
    appendDemoMovements(companyId, rows);
    rows.forEach((row, index) => {
      const item = operationItems[index]!;
      movementIds.push(row.id);
      recordOperationalExit(
        { companyId, actorName },
        {
          productName: item.productName,
          quantity: item.quantity,
          orderRef: item.orderRef,
          reference: row.reference_code ?? row.id,
        },
      );
    });
    return { count: rows.length, movementIds };
  }

  for (const item of operationItems) {
    const sku = resolveSku(item);
    const res = (await logstokaApi.createOutput({
      sub_type: 'sale',
      items: [{ sku, quantity: item.quantity }],
      reference_code: item.orderRef,
      notes: `Saída pós-conferência guiada · ${actorName}`,
    })) as { id?: string; movement_id?: string };

    const movementId = res?.id ?? res?.movement_id ?? `exit-${item.id}`;
    movementIds.push(movementId);
    recordOperationalExit(
      { companyId, actorName },
      {
        productName: item.productName,
        quantity: item.quantity,
        orderRef: item.orderRef,
        reference: item.orderRef ?? movementId,
      },
    );
  }

  return { count: operationItems.length, movementIds };
}

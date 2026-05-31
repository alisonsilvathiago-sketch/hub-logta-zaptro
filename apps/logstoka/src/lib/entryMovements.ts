import type { DemoMovementRow } from '@/lib/logstokaDemoSeed';
import { getDemoStockQty } from '@/lib/logstokaDemoSeed';
import {
  appendDemoMovements,
  findTodayEntryBySku,
  updateDemoMovement,
} from '@/lib/demoMovementStore';
import { cacheMovementRow } from '@/lib/movementLoader';
import type { ProductLookupResult } from '@/lib/productLookup';
import { logstokaApi } from '@/lib/logstokaApi';
import type { Marketplace } from '@/types';

export type RegisterEntryOpts = {
  companyId: string;
  demo: boolean;
  product: ProductLookupResult;
  quantity: number;
  referenceCode?: string;
  marketplace?: Marketplace | null;
  warehouseName?: string;
  actorName?: string;
  existingEntries: DemoMovementRow[];
};

export function getProductStockQty(product: ProductLookupResult, demo: boolean): number | null {
  if (!demo) return null;
  return getDemoStockQty(product.id);
}

export function buildDemoEntryRow(
  companyId: string,
  product: ProductLookupResult,
  quantity: number,
  opts?: { referenceCode?: string; marketplace?: Marketplace | null; warehouseName?: string },
): DemoMovementRow {
  return {
    id: `mov-entry-${Date.now()}`,
    company_id: companyId,
    movement_type: 'entry',
    sub_type: 'purchase',
    status: 'completed',
    warehouse_id: 'wh-1',
    marketplace: opts?.marketplace ?? null,
    reference_code: opts?.referenceCode ?? 'Recebimento manual',
    total_quantity: quantity,
    created_at: new Date().toISOString(),
    sku: product.sku,
    product_name: product.name,
    warehouse_name: opts?.warehouseName ?? 'CD Principal',
  };
}

export async function registerEntryMovement(opts: RegisterEntryOpts): Promise<{
  movement: DemoMovementRow;
  merged: boolean;
}> {
  const {
    companyId,
    demo,
    product,
    quantity,
    referenceCode,
    marketplace,
    warehouseName,
    existingEntries,
  } = opts;

  const duplicate = findTodayEntryBySku(existingEntries, product.sku);
  if (duplicate) {
    const newQty = duplicate.total_quantity + quantity;
    if (demo) {
      updateDemoMovement(companyId, duplicate.id, { total_quantity: newQty });
      return { movement: { ...duplicate, total_quantity: newQty }, merged: true };
    }
    return { movement: { ...duplicate, total_quantity: newQty }, merged: true };
  }

  if (demo) {
    const row = buildDemoEntryRow(companyId, product, quantity, {
      referenceCode,
      marketplace,
      warehouseName,
    });
    appendDemoMovements(companyId, [row]);
    return { movement: row, merged: false };
  }

  const res = (await logstokaApi.createEntry({
    sub_type: 'purchase',
    items: [{ sku: product.sku, quantity }],
    reference_code: referenceCode,
    notes: warehouseName ? `Depósito: ${warehouseName}` : undefined,
  })) as { id?: string; movement_id?: string };

  const row = buildDemoEntryRow(companyId, product, quantity, {
    referenceCode,
    marketplace,
    warehouseName,
  });
  row.id = res?.id ?? res?.movement_id ?? row.id;
  cacheMovementRow(companyId, row);
  return { movement: row, merged: false };
}

export { findTodayEntryBySku };

export function buildDemoExitRow(
  companyId: string,
  product: ProductLookupResult,
  quantity: number,
  opts?: { referenceCode?: string; marketplace?: Marketplace | null; warehouseName?: string },
): DemoMovementRow {
  return {
    id: `mov-exit-${Date.now()}`,
    company_id: companyId,
    movement_type: 'exit',
    sub_type: 'sale',
    status: 'completed',
    warehouse_id: 'wh-1',
    marketplace: opts?.marketplace ?? null,
    reference_code: opts?.referenceCode ?? 'Saída manual',
    total_quantity: quantity,
    created_at: new Date().toISOString(),
    sku: product.sku,
    product_name: product.name,
    warehouse_name: opts?.warehouseName ?? 'CD Principal',
  };
}

export type RegisterExitOpts = Omit<RegisterEntryOpts, 'existingEntries'> & {
  existingExits: DemoMovementRow[];
};

export async function registerExitMovement(opts: RegisterExitOpts): Promise<{
  movement: DemoMovementRow;
  merged: boolean;
}> {
  const { companyId, demo, product, quantity, referenceCode, marketplace, warehouseName, existingExits } = opts;
  const duplicate = existingExits.find(
    (m) =>
      m.movement_type === 'exit' &&
      m.sku === product.sku &&
      new Date(m.created_at).toDateString() === new Date().toDateString(),
  );

  if (duplicate) {
    const newQty = duplicate.total_quantity + quantity;
    if (demo) {
      updateDemoMovement(companyId, duplicate.id, { total_quantity: newQty });
      return { movement: { ...duplicate, total_quantity: newQty }, merged: true };
    }
    return { movement: { ...duplicate, total_quantity: newQty }, merged: true };
  }

  if (demo) {
    const row = buildDemoExitRow(companyId, product, quantity, { referenceCode, marketplace, warehouseName });
    appendDemoMovements(companyId, [row]);
    return { movement: row, merged: false };
  }

  const res = (await logstokaApi.createOutput({
    sub_type: 'sale',
    items: [{ sku: product.sku, quantity }],
    reference_code: referenceCode,
    notes: warehouseName ? `Depósito: ${warehouseName}` : undefined,
  })) as { id?: string; movement_id?: string };

  const row = buildDemoExitRow(companyId, product, quantity, { referenceCode, marketplace, warehouseName });
  row.id = res?.id ?? res?.movement_id ?? row.id;
  cacheMovementRow(companyId, row);
  return { movement: row, merged: false };
}

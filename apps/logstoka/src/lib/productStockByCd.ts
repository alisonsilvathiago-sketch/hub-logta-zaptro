import { loadMergedDemoWarehouses } from '@/lib/demoWarehouseStore';
import { DEMO_PRODUCTS, DEMO_STOCK } from '@/lib/logstokaDemoSeed';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import type { LsWarehouse } from '@/types';

export type ProductCdStockLine = {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  city: string | null;
  state: string | null;
  address_line: string | null;
  manager_name: string | null;
  manager_role: string | null;
  manager_phone: string | null;
  quantity: number;
  reserved: number;
  available: number;
};

export type WarehouseProductLine = {
  product_id: string;
  sku: string;
  internal_code: string | null;
  name: string;
  quantity: number;
  reserved: number;
  available: number;
};

function warehouseMeta(warehouse: LsWarehouse): Omit<ProductCdStockLine, 'quantity' | 'reserved' | 'available'> {
  return {
    warehouse_id: warehouse.id,
    warehouse_name: warehouse.name,
    warehouse_code: warehouse.code,
    city: warehouse.city ?? null,
    state: warehouse.state ?? null,
    address_line: warehouse.address_line ?? null,
    manager_name: warehouse.manager_name ?? null,
    manager_role: warehouse.manager_role ?? null,
    manager_phone: warehouse.manager_phone ?? null,
  };
}

function filterWarehouseIds(warehouseId: string, allowed?: string[] | null): boolean {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(warehouseId);
}

/** Estoque do produto fracionado por CD (demo). Respeita CDs visíveis ao usuário. */
export function getProductStockByCd(
  productId: string,
  companyId: string | null,
  allowedWarehouseIds?: string[] | null,
): ProductCdStockLine[] {
  if (!companyId || !isLogstokaDemoCompany(companyId)) return [];

  const warehouses = loadMergedDemoWarehouses(companyId);
  const whById = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));

  return DEMO_STOCK.filter(
    (row) => row.product_id === productId && filterWarehouseIds(row.warehouse_id, allowedWarehouseIds),
  )
    .map((row) => {
      const warehouse = whById.get(row.warehouse_id);
      if (!warehouse || warehouse.type !== 'physical') return null;
      const quantity = row.quantity;
      const reserved = row.reserved_quantity ?? 0;
      return {
        ...warehouseMeta(warehouse),
        quantity,
        reserved,
        available: quantity - reserved,
      };
    })
    .filter((line): line is ProductCdStockLine => line != null && line.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);
}

export function getProductStockAtWarehouse(
  productId: string,
  warehouseId: string,
  companyId: string | null,
): number {
  if (!companyId || !isLogstokaDemoCompany(companyId)) return 0;
  const row = DEMO_STOCK.find(
    (item) => item.product_id === productId && item.warehouse_id === warehouseId,
  );
  return row?.quantity ?? 0;
}

export function getProductStockTotalByCd(lines: ProductCdStockLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Resumo compacto para células de tabela — ex.: "Cotia 120 · Osasco 35" */
export function formatProductCdStockSummary(lines: ProductCdStockLine[], maxParts = 3): string {
  if (lines.length === 0) return 'Sem estoque';
  const parts = lines.slice(0, maxParts).map((line) => {
    const label = line.city ?? line.warehouse_name.replace(/^CD\s+/i, '');
    return `${label} ${line.quantity.toLocaleString('pt-BR')}`;
  });
  if (lines.length > maxParts) parts.push(`+${lines.length - maxParts}`);
  return parts.join(' · ');
}

export function formatProductCdManagers(lines: ProductCdStockLine[]): string {
  const names = [...new Set(lines.map((line) => line.manager_name).filter(Boolean))] as string[];
  if (names.length === 0) return '—';
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
}

/** Produtos com saldo em um CD — raio-X do galpão. */
export function getWarehouseProductLines(
  warehouseId: string,
  companyId: string | null,
): WarehouseProductLine[] {
  if (!companyId || !isLogstokaDemoCompany(companyId)) return [];

  return DEMO_STOCK.filter((row) => row.warehouse_id === warehouseId && row.quantity > 0)
    .map((row) => {
      const product = DEMO_PRODUCTS.find((item) => item.id === row.product_id);
      if (!product) return null;
      const quantity = row.quantity;
      const reserved = row.reserved_quantity ?? 0;
      return {
        product_id: product.id,
        sku: product.sku,
        internal_code: product.internal_code ?? null,
        name: product.name,
        quantity,
        reserved,
        available: quantity - reserved,
      };
    })
    .filter((line): line is WarehouseProductLine => line != null)
    .sort((a, b) => b.quantity - a.quantity);
}

export function productCdLocationLabel(line: ProductCdStockLine): string {
  const loc =
    line.city && line.state ? `${line.city} · ${line.state}` : line.city ?? line.warehouse_name;
  return line.address_line ? `${loc} · ${line.address_line}` : loc;
}

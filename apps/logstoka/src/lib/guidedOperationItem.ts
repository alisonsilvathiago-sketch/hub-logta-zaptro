import type { Marketplace } from '@/types';
import type { OperationalOrder } from '@/lib/operationalFlow';
import type { DemoInventoryRow } from '@/lib/logstokaDemoSeed';
import {
  buildConferenceGuidance,
  getOperationalProductLocation,
  getProductLocationByKey,
} from '@/lib/operationalProductLocation';

export type GuidedOperationContext = 'operation' | 'inventory';

export type GuidedOperationItem = {
  id: string;
  context: GuidedOperationContext;
  productName: string;
  quantity: number;
  quantityLabel: string;
  subtitle: string;
  locationLabel: string;
  voiceText: string;
  orderRef?: string;
  marketplace?: Marketplace;
  marketplaceLabel?: string;
  sku?: string;
  inventoryId?: string;
  systemQuantity?: number;
};

export function operationalOrdersToGuidedItems(orders: OperationalOrder[]): GuidedOperationItem[] {
  return orders.map((order) => {
    const location = getOperationalProductLocation(order);
    return {
      id: order.id,
      context: 'operation',
      productName: order.productName,
      quantity: order.quantity,
      quantityLabel: `${order.quantity.toLocaleString('pt-BR')} un.`,
      subtitle: `Pedido ${order.orderRef}`,
      locationLabel: location.label,
      voiceText: buildConferenceGuidance(order, location),
      orderRef: order.orderRef,
      marketplace: order.marketplace as Marketplace,
      marketplaceLabel: order.marketplaceLabel,
      sku: order.sku,
    };
  });
}

type InventoryItem = DemoInventoryRow['ls_inventory_items'][number];

export function inventoryItemsToGuidedItems(
  inventoryId: string,
  items: InventoryItem[],
): GuidedOperationItem[] {
  return items.map((item) => {
    const sku = item.ls_products?.sku ?? item.product_id;
    const name = item.ls_products?.name ?? 'Produto';
    const location = getProductLocationByKey(sku);
    const systemQty = item.system_quantity;

    return {
      id: item.id,
      context: 'inventory',
      productName: name,
      quantity: systemQty,
      quantityLabel: `${systemQty.toLocaleString('pt-BR')} no sistema`,
      subtitle: `SKU ${sku}`,
      locationLabel: location.label,
      voiceText: `Inventário: vá até ${location.label}, conte fisicamente ${name}. O sistema indica ${systemQty.toLocaleString('pt-BR')} un. Confira e marque.`,
      sku,
      inventoryId,
      systemQuantity: systemQty,
    };
  });
}

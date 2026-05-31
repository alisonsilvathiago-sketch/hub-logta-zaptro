import type { OperationalOrder } from '@/lib/operationalFlow';

export type ProductLocation = {
  aisle: string;
  shelf: string;
  level: string;
  label: string;
};

export function getOperationalProductLocation(order: OperationalOrder): ProductLocation {
  return getProductLocationByKey(order.id);
}

export function getProductLocationByKey(key: string): ProductLocation {
  const n = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const aisles = ['A', 'B', 'C', 'D', 'E'];
  const aisle = aisles[n % aisles.length]!;
  const shelf = String((n % 12) + 1).padStart(2, '0');
  const level = String((n % 5) + 1).padStart(2, '0');

  return {
    aisle: `Corredor ${aisle}`,
    shelf: `Prateleira ${shelf}`,
    level: `Nível ${level}`,
    label: `Corredor ${aisle} · Prateleira ${shelf} · Nível ${level}`,
  };
}

export function buildConferenceGuidance(order: OperationalOrder, location: ProductLocation): string {
  return `Pedido ${order.orderRef}: vá até ${location.label}, separe ${order.quantity} un. de ${order.productName} e confira antes de marcar.`;
}

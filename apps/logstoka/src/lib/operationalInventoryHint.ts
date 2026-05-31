import { logstokaApi } from '@/lib/logstokaApi';
import type { GuidedOperationItem } from '@/lib/guidedOperationItem';

/** Dica curta em background — inventário (Aiato). */
export async function fetchInventoryHint(item: GuidedOperationItem): Promise<string | null> {
  try {
    const res = await logstokaApi.aiChat({
      screen: 'inventory_guided',
      message: [
        'Responda em 1 frase curta em português, tom operacional direto.',
        `Inventário SKU ${item.sku ?? '—'}. Produto: ${item.productName}.`,
        `Quantidade no sistema: ${item.systemQuantity ?? item.quantity}. Local: ${item.locationLabel}.`,
        'Oriente o estoquista a ir ao endereço, contar fisicamente e confirmar.',
      ].join(' '),
    });
    const reply = res.reply?.trim();
    return reply && reply.length < 220 ? reply : null;
  } catch {
    return null;
  }
}

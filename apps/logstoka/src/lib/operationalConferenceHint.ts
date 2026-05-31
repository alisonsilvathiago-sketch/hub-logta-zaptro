import { logstokaApi } from '@/lib/logstokaApi';
import type { OperationalOrder } from '@/lib/operationalFlow';
import type { ProductLocation } from '@/lib/operationalProductLocation';

/** Dica curta em background — sem UI de IA exposta ao operador. */
export async function fetchConferenceHint(
  order: OperationalOrder,
  location: ProductLocation,
): Promise<string | null> {
  try {
    const res = await logstokaApi.aiChat({
      screen: 'conference_guided',
      message: [
        'Responda em 1 frase curta em português, tom operacional direto.',
        `Produto: ${order.productName}. Quantidade: ${order.quantity}. Pedido: ${order.orderRef}.`,
        `Local: ${location.label}. Canal: ${order.marketplaceLabel}.`,
        'Oriente o estoquista a conferir no endereço e contar as unidades.',
      ].join(' '),
    });
    const reply = res.reply?.trim();
    return reply && reply.length < 220 ? reply : null;
  } catch {
    return null;
  }
}

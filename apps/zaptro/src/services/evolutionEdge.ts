/** Compat: importe de `evolution.service.ts` em código novo. */
export {
  buildZaptroInstanceName,
  createInstanceForQr as createInstanceEdge,
  disconnect as disconnectWhatsappEdge,
  getConnectionState as getConnectionStateEdge,
  loadWhatsappConnection as loadWhatsappConnectionRow,
  sendMessage as sendWhatsappTextEdge,
  shouldUseEvolutionEdge as useEvolutionEdge,
} from './evolution.service';

import { connectWhatsapp } from './evolution.service';

/** Retorna só o data URL do QR (compat com hook legado). */
export async function connectWhatsappEdge(instanceName: string): Promise<string | null> {
  const result = await connectWhatsapp(instanceName);
  return result.qrDataUrl;
}

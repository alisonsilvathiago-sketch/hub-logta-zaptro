import type { DemoTransferRow } from '@/lib/logstokaDemoSeed';

export function transferStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente',
    in_transit: 'Em trânsito',
    completed: 'Concluída',
    cancelled: 'Cancelada',
  };
  return map[status] ?? status;
}

export function transferStatusBadgeClass(status: string): string {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'in_transit') return 'bg-amber-50 text-amber-700';
  if (status === 'cancelled') return 'bg-rose-50 text-rose-700';
  return 'bg-orange-50 text-orange-700';
}

/** Explica o que falta / o que está pendente na transferência. */
export function transferStatusExplain(transfer: Pick<DemoTransferRow, 'status' | 'notes' | 'release_approval'>): string {
  if (transfer.status === 'completed') {
    return 'Transferência recebida e concluída no CD de destino.';
  }
  if (transfer.status === 'cancelled') {
    return 'Operação cancelada — nenhuma ação pendente.';
  }
  if (transfer.status === 'in_transit') {
    return 'Carga saiu da origem e aguarda conferência e assinatura no CD de destino.';
  }

  const notes = transfer.notes?.toLowerCase() ?? '';
  if (notes.includes('separa')) {
    return 'Aguardando separação física no CD de origem antes de liberar o envio.';
  }
  if (transfer.release_approval) {
    return 'Aprovação e assinatura registradas na origem. Falta liberar o envio / retirada.';
  }
  return 'Falta registrar responsável, motorista e assinatura na origem.';
}

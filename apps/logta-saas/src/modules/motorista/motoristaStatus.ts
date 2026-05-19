import type { DriverOperationalStatus } from './types';

export const DRIVER_STATUS_STEPS: {
  id: DriverOperationalStatus;
  label: string;
  shipmentStatus: string;
  kanbanHint: string;
}[] = [
  { id: 'pedido_recebido', label: 'Pedido recebido', shipmentStatus: 'pending', kanbanHint: 'pedido' },
  { id: 'coleta_iniciada', label: 'Coleta iniciada', shipmentStatus: 'loading', kanbanHint: 'agendado' },
  { id: 'coleta_concluida', label: 'Coleta concluída', shipmentStatus: 'loading', kanbanHint: 'agendado' },
  { id: 'em_transito', label: 'Em trânsito', shipmentStatus: 'in_transit', kanbanHint: 'transito' },
  { id: 'parada_operacional', label: 'Parada operacional', shipmentStatus: 'stopped', kanbanHint: 'transito' },
  { id: 'saiu_entrega', label: 'Saiu para entrega', shipmentStatus: 'unloading', kanbanHint: 'entrega' },
  { id: 'chegada_cliente', label: 'Chegada no cliente', shipmentStatus: 'unloading', kanbanHint: 'entrega' },
  { id: 'entrega_realizada', label: 'Entrega realizada', shipmentStatus: 'delivered', kanbanHint: 'concluido' },
  { id: 'entrega_recusada', label: 'Entrega recusada', shipmentStatus: 'incident', kanbanHint: 'problema' },
  { id: 'ocorrencia', label: 'Ocorrência aberta', shipmentStatus: 'incident', kanbanHint: 'problema' },
  { id: 'rota_finalizada', label: 'Rota finalizada', shipmentStatus: 'delivered', kanbanHint: 'concluido' },
];

export function labelForDriverStatus(status: DriverOperationalStatus) {
  return DRIVER_STATUS_STEPS.find((s) => s.id === status)?.label ?? status;
}

export function shipmentStatusForDriver(status: DriverOperationalStatus) {
  return DRIVER_STATUS_STEPS.find((s) => s.id === status)?.shipmentStatus ?? 'in_transit';
}

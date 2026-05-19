export type DriverOperationalStatus =
  | 'pedido_recebido'
  | 'coleta_iniciada'
  | 'coleta_concluida'
  | 'em_transito'
  | 'parada_operacional'
  | 'saiu_entrega'
  | 'chegada_cliente'
  | 'entrega_realizada'
  | 'entrega_recusada'
  | 'ocorrencia'
  | 'rota_finalizada';

export type MotoristaLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  at: string;
};

export type MotoristaStatusEvent = {
  id: string;
  status: DriverOperationalStatus;
  label: string;
  at: string;
};

export type MotoristaRotaSession = {
  token: string;
  companyId: string;
  shipmentId: string;
  numeroFrete: string;
  clienteNome: string;
  origem: string;
  destino: string;
  motoristaId?: string;
  motoristaNome: string;
  placa?: string;
  observacoes?: string;
  shipmentStatus: string;
  operationalStatus: DriverOperationalStatus;
  gpsEnabled: boolean;
  lastLocation?: MotoristaLocation;
  history: MotoristaStatusEvent[];
  createdAt: string;
  updatedAt: string;
};

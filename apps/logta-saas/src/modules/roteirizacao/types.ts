export type RouteDeliveryNormalized = {
  id: string;
  shipmentId?: string;
  dest: string;
  weight: string;
  priority: 'Alta' | 'Normal' | 'Baixa' | 'Urgente';
  status?: string;
  origin?: string;
  driver_id?: string;
  vehicle_id?: string;
  valor_frete?: number;
  km?: number;
  minutes?: number;
  created_at?: string;
};

export type ActiveRouteNormalized = {
  id: string;
  driver: string;
  stops: number;
  progress: number;
  status: string;
  shipmentIds: string[];
};

export type RoteirizacaoAlertPriority = 'critical' | 'high' | 'medium' | 'low';

export type RoteirizacaoAlert = {
  id: string;
  title: string;
  message: string;
  priority: RoteirizacaoAlertPriority;
  category: 'transito' | 'rota' | 'motorista' | 'veiculo' | 'entrega' | 'custo' | 'carga' | 'ia';
  actionPath: string;
  actionLabel: string;
  impacto?: string;
  impactoFinanceiro?: string;
  recomendacao?: string;
  entityId?: string;
  createdAt: number;
};

export type RoteirizacaoIaInsight = {
  id: string;
  title: string;
  description: string;
  type: 'risk' | 'opportunity' | 'warning' | 'info';
  actions?: { label: string; path: string }[];
};

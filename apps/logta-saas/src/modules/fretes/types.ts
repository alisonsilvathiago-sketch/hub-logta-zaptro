export type ShipmentNormalized = {
  id: string;
  status?: string;
  origin?: string;
  destination?: string;
  created_at?: string;
  estimated_at?: string;
  driver_id?: string;
  vehicle_id?: string;
  numero_frete?: string;
  cliente_nome?: string;
  valor_frete?: number;
  tipo_carga?: string;
  peso_kg?: number;
  metadata?: Record<string, unknown>;
  motoristas?: { id?: string; nome?: string };
  vehicles?: { plate?: string; modelo?: string; status?: string };
};

export type FretesAlertPriority = 'critical' | 'high' | 'medium' | 'low';

export type FretesAlert = {
  id: string;
  title: string;
  message: string;
  priority: FretesAlertPriority;
  category: 'atraso' | 'veiculo' | 'motorista' | 'custo' | 'rota' | 'entrega' | 'ia' | 'manutencao';
  actionPath: string;
  actionLabel: string;
  impacto?: string;
  recomendacao?: string;
  entityId?: string;
  createdAt: number;
};

export type FretesIaInsight = {
  id: string;
  title: string;
  description: string;
  type: 'risk' | 'opportunity' | 'warning' | 'info';
  actions?: { label: string; path: string }[];
};

export type FrotaAlertPriority = 'critical' | 'high' | 'medium' | 'low';

export type FrotaAlertCategory =
  | 'ipva'
  | 'licenciamento'
  | 'multa'
  | 'financiamento'
  | 'manutencao'
  | 'pneu'
  | 'combustivel'
  | 'documento'
  | 'seguro'
  | 'ia'
  | 'operacional';

export type FrotaAlert = {
  id: string;
  title: string;
  message: string;
  priority: FrotaAlertPriority;
  category: FrotaAlertCategory;
  actionPath: string;
  actionLabel: string;
  impacto?: string;
  recomendacao?: string;
  vehiclePlate?: string;
  createdAt: number;
};

export type FrotaIaInsight = {
  id: string;
  title: string;
  description: string;
  type: 'risk' | 'opportunity' | 'warning' | 'info';
};

export type FrotaVehicleRow = {
  id: string;
  plate?: string;
  model?: string;
  brand?: string;
  status?: string;
  year?: number;
  type?: string;
};

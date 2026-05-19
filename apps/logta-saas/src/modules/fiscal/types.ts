export type FiscalAlertPriority = 'critical' | 'high' | 'medium' | 'low';

export type FiscalAlertCategory =
  | 'certificado'
  | 'mdfe'
  | 'cte'
  | 'sefaz'
  | 'imposto'
  | 'manifesto'
  | 'risco'
  | 'ia'
  | 'operacional';

export type FiscalAlert = {
  id: string;
  title: string;
  message: string;
  priority: FiscalAlertPriority;
  category: FiscalAlertCategory;
  actionPath: string;
  actionLabel: string;
  impacto?: string;
  impactoFinanceiro?: string;
  prazo?: string;
  createdAt: number;
};

export type FiscalIaInsight = {
  id: string;
  title: string;
  description: string;
  type: 'risk' | 'opportunity' | 'warning' | 'info';
};

export type FiscalDocStats = {
  cteEmitidos: number;
  mdfeAtivos: number;
  pendentesSefaz: number;
  rejeitados: number;
};

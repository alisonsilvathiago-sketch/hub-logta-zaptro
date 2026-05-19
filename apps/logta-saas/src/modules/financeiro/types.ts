import type { LucideIcon } from 'lucide-react';

export type FinanceiroModuleCategory = 'operacional' | 'gestao';

export type FinanceiroIntegrationKey = 'frota' | 'rh' | 'logistica' | 'fiscal' | 'bancario' | 'crm';

export type FinanceiroModuleSection = {
  id: string;
  title: string;
};

export type FinanceiroModuleDef = {
  slug: string;
  title: string;
  description: string;
  category: FinanceiroModuleCategory;
  sectionId: string;
  icon: LucideIcon;
  iaEnabled?: boolean;
  externalPath?: string;
  integrations?: FinanceiroIntegrationKey[];
  kpis?: { label: string; value: string; tone?: 'primary' | 'success' | 'danger' }[];
};

export type FinanceiroStats = {
  receita: number;
  despesas: number;
  saldo: number;
  transacoes: number;
  lucroOperacional: number;
  inadimplenciaEst: number;
  alertasVencimento: number;
};

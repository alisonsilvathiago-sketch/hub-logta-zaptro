import type { LucideIcon } from 'lucide-react';

export type RhModuleCategory = 'admin' | 'operational';

export type RhIntegrationKey = 'frota' | 'financeiro' | 'logdock' | 'logistica' | 'rastreamento';

export type RhModuleSection = {
  id: string;
  title: string;
};

export type RhModuleDef = {
  slug: string;
  title: string;
  description: string;
  category: RhModuleCategory;
  sectionId: string;
  icon: LucideIcon;
  integrations?: RhIntegrationKey[];
  iaEnabled?: boolean;
  externalPath?: string;
  kpis?: { label: string; value: string; tone?: 'primary' | 'danger' | 'success' }[];
};

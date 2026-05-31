import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import type { OperationalTenantMode } from '@/lib/operationalProfile';

export type InicioMegaLink = {
  label: string;
  to?: string;
  action?: 'open-ai';
  badge?: 'new' | 'ai';
  modes?: OperationalTenantMode[];
};

export type InicioMegaColumn = {
  title: string;
  links: InicioMegaLink[];
};

export type InicioMegaSection = {
  id: string;
  label: string;
  columns: InicioMegaColumn[];
  footerLink?: { label: string; to: string };
  modes?: OperationalTenantMode[];
};

/** Menu enxuto — operação primeiro, não clone de ERP. */
export const INICIO_MEGA_MENU: InicioMegaSection[] = [
  {
    id: 'operacao',
    label: 'Operação',
    columns: [
      {
        title: 'Seu dia',
        links: [
          { label: 'O que fazer agora', to: LOGSTOKA_ROUTES.OPERATIONAL_WORK },
          { label: 'Central de Atividades', to: LOGSTOKA_ROUTES.ACTIVITY_CENTER, badge: 'new' },
          { label: 'Controle de fluxo', to: LOGSTOKA_ROUTES.OPERATIONAL_FLOW },
          { label: 'Pendências de conferência', to: LOGSTOKA_ROUTES.CONFERENCE_PENDING },
          { label: 'Conferência do dia', to: '/app/picking' },
          { label: 'Conferir material', to: '/app/conference' },
          { label: 'Expedir / saídas', to: '/app/movements' },
          { label: 'Transferências', to: LOGSTOKA_ROUTES.TRANSFERS },
          { label: 'Portaria motoristas', to: LOGSTOKA_ROUTES.DRIVER_GATE },
          { label: 'Importar relatório', to: '/app/imports' },
        ],
      },
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque',
    columns: [
      {
        title: 'Essencial',
        links: [
          { label: 'Produtos', to: LOGSTOKA_ROUTES.PRODUCTS },
          { label: 'Movimentações', to: '/app/movements' },
          { label: 'Inventário', to: '/app/inventory' },
          { label: 'Depósitos', to: '/app/warehouses' },
        ],
      },
    ],
  },
  {
    id: 'canais',
    label: 'Canais',
    modes: ['full'],
    columns: [
      {
        title: 'Marketplaces',
        links: [
          { label: 'Conectar lojas', to: LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL },
          { label: 'Publicar produtos', to: LOGSTOKA_ROUTES.PRODUCT_PUBLICATION },
          { label: 'Pedidos de venda', to: LOGSTOKA_ROUTES.SALES },
        ],
      },
    ],
  },
  {
    id: 'config',
    label: 'Conta',
    columns: [
      {
        title: 'Empresa',
        links: [
          { label: 'Meu fluxo operacional', to: LOGSTOKA_ROUTES.OPERATIONAL_WORK },
          { label: 'Configurações', to: LOGSTOKA_ROUTES.SETTINGS_COMPANY },
          { label: 'Equipe', to: LOGSTOKA_ROUTES.SETTINGS_TEAM },
          { label: 'Assistente IA', action: 'open-ai', badge: 'ai' },
        ],
      },
    ],
  },
];

export function getMegaMenuForMode(mode: OperationalTenantMode): InicioMegaSection[] {
  return INICIO_MEGA_MENU.filter((section) => !section.modes || section.modes.includes(mode)).map(
    (section) => ({
      ...section,
      columns: section.columns.map((column) => ({
        ...column,
        links: column.links.filter((link) => !link.modes || link.modes.includes(mode)),
      })),
    }),
  );
}

export type FavoriteShortcut = {
  id: string;
  label: string;
  to: string;
};

export const DEFAULT_FAVORITE_SHORTCUTS: FavoriteShortcut[] = [
  { id: 'operacao', label: 'Operação', to: LOGSTOKA_ROUTES.OPERATIONAL_WORK },
  { id: 'atividades', label: 'Atividades', to: LOGSTOKA_ROUTES.ACTIVITY_CENTER },
  { id: 'picking', label: 'Conferir dia', to: LOGSTOKA_ROUTES.PICKING },
  { id: 'products', label: 'Produtos', to: LOGSTOKA_ROUTES.PRODUCTS },
  { id: 'imports', label: 'Importar', to: '/app/imports' },
];

/** Catálogo completo — escolha no + do menu lateral da home. */
export const SHORTCUT_CATALOG: FavoriteShortcut[] = [
  { id: 'operacao', label: 'Operação', to: LOGSTOKA_ROUTES.OPERATIONAL_WORK },
  { id: 'atividades', label: 'Atividades', to: LOGSTOKA_ROUTES.ACTIVITY_CENTER },
  { id: 'entry', label: 'Entrada', to: '/app/movements?tab=entry' },
  { id: 'exit', label: 'Saída', to: '/app/movements?tab=exit' },
  { id: 'movements', label: 'Movimentações', to: LOGSTOKA_ROUTES.MOVEMENTS },
  { id: 'picking', label: 'Conferir dia', to: LOGSTOKA_ROUTES.PICKING },
  { id: 'conference', label: 'Conferir material', to: '/app/conference' },
  { id: 'transfers', label: 'Transferências', to: LOGSTOKA_ROUTES.TRANSFERS },
  { id: 'driver_gate', label: 'Portaria motoristas', to: LOGSTOKA_ROUTES.DRIVER_GATE },
  { id: 'products', label: 'Produtos', to: LOGSTOKA_ROUTES.PRODUCTS },
  { id: 'inventory', label: 'Inventário', to: '/app/inventory' },
  { id: 'warehouses', label: 'Depósitos', to: LOGSTOKA_ROUTES.WAREHOUSES },
  { id: 'sales', label: 'Pedidos de venda', to: LOGSTOKA_ROUTES.SALES },
  { id: 'imports', label: 'Importar relatório', to: '/app/imports' },
  { id: 'integrations', label: 'Canais / lojas', to: LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL },
  { id: 'dashboard', label: 'Dashboard', to: LOGSTOKA_ROUTES.DASHBOARD },
  { id: 'interactions', label: 'Interações / auditoria', to: LOGSTOKA_ROUTES.SETTINGS_AUDIT },
  { id: 'settings', label: 'Configurações', to: LOGSTOKA_ROUTES.SETTINGS },
];

import type { LucideIcon } from 'lucide-react';
import type { PermissionCode } from '@/lib/permissions';
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  FileUp,
  LayoutDashboard,
  MessageCircle,
  Package,
  Plug,
  ScanLine,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trophy,
  Truck,
  Undo2,
  Users,
  Wrench,
} from 'lucide-react';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

export type LogstokaNavItem = {
  to?: string;
  end?: boolean;
  label: string;
  icon: LucideIcon;
  perm?: PermissionCode;
};

export type LogstokaNavChild = {
  to: string;
  label: string;
  end?: boolean;
};

export type LogstokaNavGroupItem = {
  type: 'group';
  label: string;
  icon: LucideIcon;
  perm?: PermissionCode;
  children: LogstokaNavChild[];
};

export type LogstokaNavLinkItem = LogstokaNavItem & {
  type: 'link';
  to: string;
};

export type LogstokaHubNavEntry = LogstokaNavGroupItem | LogstokaNavLinkItem;

/** Hub comercial — adicionado ao menu lateral (não substitui o WMS) */
export const LOGSTOKA_HUB_NAV: LogstokaHubNavEntry[] = [
  {
    type: 'group',
    label: 'Dashboard',
    icon: LayoutDashboard,
    children: [
      { to: '/app/dashboard?period=mensal', label: 'Mensal' },
      { to: '/app/dashboard?period=diario', label: 'Diário' },
    ],
  },
  { type: 'link', to: LOGSTOKA_ROUTES.SALES, label: 'Vendas', icon: ShoppingCart, perm: 'sales.read' },
  {
    type: 'link',
    to: LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL,
    label: 'Gestão de Marketplaces',
    icon: Store,
    perm: 'settings.read',
  },
  { type: 'link', to: LOGSTOKA_ROUTES.PRODUCTS, label: 'Produtos', icon: Tag, perm: 'products.read' },
  { type: 'link', to: '/app/reports', label: 'Clientes', icon: Users, perm: 'reports.read' },
  { type: 'link', to: LOGSTOKA_ROUTES.SETTINGS_TEAM_RANKING, label: 'Desempenho', icon: Trophy },
  { type: 'link', to: `${LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL}?channel=whatsapp`, label: 'Acompanhe no WhatsApp', icon: MessageCircle },
  { type: 'link', to: LOGSTOKA_ROUTES.SETTINGS, label: 'Ajustes', icon: Wrench, perm: 'settings.read' },
];

export const LOGSTOKA_NAV: LogstokaNavItem[] = [
  { to: '/app', label: 'Início', icon: Sparkles, end: true },
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'reports.read' },
  { to: '/app/products', label: 'Produtos', icon: Package, perm: 'products.read' },
  { to: '/app/movements', label: 'Entradas / Saídas', icon: ArrowLeftRight, perm: 'movements.read' },
  { to: '/app/transfers', label: 'Transferências', icon: ArrowLeftRight, perm: 'movements.read' },
  { to: LOGSTOKA_ROUTES.DRIVER_GATE, label: 'Portaria motoristas', icon: Truck, perm: 'movements.read' },
  { to: '/app/inventory', label: 'Inventários', icon: Boxes, perm: 'inventory.read' },
  { to: '/app/returns', label: 'Devoluções', icon: Undo2, perm: 'movements.read' },
  { to: '/app/picking', label: 'Conferência do dia', icon: ScanLine, perm: 'picking.read' },
  { to: '/app/conference', label: 'Conferência', icon: ScanLine, perm: 'picking.read' },
  { to: '/app/imports', label: 'Importações', icon: FileUp, perm: 'movements.write' },
  { to: '/app/reports', label: 'Relatórios', icon: BarChart3, perm: 'reports.read' },
  { to: '/app/integrations', label: 'Integrações', icon: Plug, perm: 'settings.read' },
  { to: '/app/configuracoes', label: 'Configurações', icon: Settings, perm: 'settings.read' },
];

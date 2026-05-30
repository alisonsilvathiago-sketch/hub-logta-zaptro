import type { LucideIcon } from 'lucide-react';
import type { PermissionCode } from '@/lib/permissions';
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  FileUp,
  LayoutDashboard,
  Package,
  Plug,
  ScanLine,
  Settings,
  Sparkles,
  Undo2,
} from 'lucide-react';

export type LogstokaNavItem = {
  to?: string;
  end?: boolean;
  label: string;
  icon: LucideIcon;
  perm?: PermissionCode;
};

export const LOGSTOKA_NAV: LogstokaNavItem[] = [
  { to: '/app', label: 'Início', icon: Sparkles, end: true },
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/products', label: 'Produtos', icon: Package, perm: 'products.read' },
  { to: '/app/movements', label: 'Entradas / Saídas', icon: ArrowLeftRight, perm: 'movements.read' },
  { to: '/app/transfers', label: 'Transferências', icon: ArrowLeftRight, perm: 'movements.read' },
  { to: '/app/inventory', label: 'Inventários', icon: Boxes, perm: 'inventory.read' },
  { to: '/app/returns', label: 'Devoluções', icon: Undo2 },
  { to: '/app/picking', label: 'Separação', icon: ScanLine },
  { to: '/app/conference', label: 'Conferência', icon: ScanLine },
  { to: '/app/imports', label: 'Importações', icon: FileUp },
  { to: '/app/reports', label: 'Relatórios', icon: BarChart3, perm: 'reports.read' },
  { to: '/app/integrations', label: 'Integrações', icon: Plug, perm: 'settings.read' },
  { to: '/app/configuracoes', label: 'Configurações', icon: Settings, perm: 'settings.read' },
];

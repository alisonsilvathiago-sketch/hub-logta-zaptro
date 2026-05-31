import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ClipboardList,
  History,
  LayoutDashboard,
  Package,
  Plug,
  Settings,
  Shield,
  ShoppingBag,
  Truck,
  Upload,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';

export const FAVORITE_SHORTCUT_ICONS: Record<string, LucideIcon> = {
  operacao: ClipboardList,
  atividades: ClipboardList,
  entry: ArrowDownToLine,
  exit: ArrowUpFromLine,
  movements: ArrowLeftRight,
  picking: ClipboardList,
  conference: ClipboardList,
  transfers: ArrowLeftRight,
  driver_gate: Truck,
  products: Package,
  inventory: Package,
  warehouses: Warehouse,
  sales: ShoppingBag,
  imports: Upload,
  integrations: Plug,
  dashboard: LayoutDashboard,
  interactions: History,
  settings: Settings,
  reports: LayoutDashboard,
  portaria: Shield,
};

export function favoriteShortcutIcon(id: string): LucideIcon {
  return FAVORITE_SHORTCUT_ICONS[id] ?? ClipboardList;
}

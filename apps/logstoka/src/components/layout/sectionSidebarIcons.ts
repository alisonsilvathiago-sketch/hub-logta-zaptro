import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  FileUp,
  Clock3,
  Home,
  Layers,
  LayoutDashboard,
  Megaphone,
  Package,
  Palette,
  Plug,
  RefreshCw,
  ScanLine,
  ScrollText,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  Undo2,
  User,
  Users,
  Warehouse,
  Webhook,
} from 'lucide-react';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import {
  getSectionSidebar,
  type SectionSidebarLink,
  type SectionSidebarDef,
} from './sectionSidebarCatalog';
import type { AppSectionId } from './resolveAppSection';

export type SectionIconNavItem = SectionSidebarLink & {
  icon: LucideIcon;
};

const ROUTE_ICONS: Record<string, LucideIcon> = {
  '/app': Home,
  [LOGSTOKA_ROUTES.DASHBOARD]: LayoutDashboard,
  [LOGSTOKA_ROUTES.OPERATIONAL_WORK]: ScanLine,
  [LOGSTOKA_ROUTES.ACTIVITY_CENTER]: Clock3,
  [LOGSTOKA_ROUTES.SALES]: ShoppingCart,
  [LOGSTOKA_ROUTES.PRODUCTS]: Package,
  [LOGSTOKA_ROUTES.PRODUCT_GROUPS]: Layers,
  [LOGSTOKA_ROUTES.PRODUCT_PUBLICATION]: Megaphone,
  [LOGSTOKA_ROUTES.PRODUCT_SYNC]: RefreshCw,
  '/app/warehouses': Warehouse,
  '/app/movements': ArrowLeftRight,
  '/app/transfers': ArrowLeftRight,
  '/app/returns': Undo2,
  '/app/inventory': Boxes,
  '/app/picking': ScanLine,
  '/app/conference': ScanLine,
  '/app/imports': FileUp,
  '/app/reports': BarChart3,
  [LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL]: Plug,
  [LOGSTOKA_ROUTES.SETTINGS]: Settings,
  [LOGSTOKA_ROUTES.SETTINGS_PROFILE]: User,
  [LOGSTOKA_ROUTES.SETTINGS_COMPANY]: Building2,
  [LOGSTOKA_ROUTES.SETTINGS_TEAM]: Users,
  [LOGSTOKA_ROUTES.SETTINGS_API]: Webhook,
  [LOGSTOKA_ROUTES.SETTINGS_NOTIFICATIONS]: Bell,
  [LOGSTOKA_ROUTES.SETTINGS_AUDIT]: ScrollText,
  [LOGSTOKA_ROUTES.SETTINGS_SECURITY]: Shield,
  [LOGSTOKA_ROUTES.SETTINGS_WHITE_LABEL]: Palette,
  [LOGSTOKA_ROUTES.SETTINGS_TEAM_RANKING]: BarChart3,
};

function iconForRoute(to: string): LucideIcon {
  const path = to.split('?')[0] ?? to;
  return ROUTE_ICONS[path] ?? Store;
}

function flattenSectionIcons(def: SectionSidebarDef | null): SectionIconNavItem[] {
  if (!def) return [];

  const seen = new Set<string>();
  const items: SectionIconNavItem[] = [];

  for (const group of def.groups) {
    for (const link of group.links) {
      if (seen.has(link.to)) continue;
      seen.add(link.to);
      items.push({ ...link, icon: iconForRoute(link.to) });
    }
  }

  if (def.footerLink && !seen.has(def.footerLink.to)) {
    items.push({
      label: def.footerLink.label,
      to: def.footerLink.to,
      icon: BarChart3,
    });
  }

  return items;
}

export function getSectionIconNav(sectionId: AppSectionId, companyId?: string | null): SectionIconNavItem[] {
  if (sectionId === 'home') {
    return flattenSectionIcons(getSectionSidebar('operacao', companyId));
  }
  return flattenSectionIcons(getSectionSidebar(sectionId, companyId));
}

export function getSectionNavLabel(sectionId: AppSectionId): string {
  if (sectionId === 'home') return 'Início';
  return getSectionSidebar(sectionId)?.label ?? 'Menu';
}

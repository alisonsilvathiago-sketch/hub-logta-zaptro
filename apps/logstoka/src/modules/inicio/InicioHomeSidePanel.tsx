import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Plug,
  Settings,
  ShoppingBag,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import SidebarTooltip from '@/components/layout/SidebarTooltip';
import { useFavoriteShortcuts } from '@/hooks/useFavoriteShortcuts';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

const SHORTCUT_ICONS: Record<string, LucideIcon> = {
  operacao: ClipboardList,
  sales: ShoppingBag,
  products: Package,
  movements: ArrowLeftRight,
  integrations: Plug,
  imports: Upload,
  dashboard: LayoutDashboard,
  inventory: Package,
  picking: ClipboardList,
  conference: ClipboardList,
  returns: ArrowLeftRight,
  reports: LayoutDashboard,
  settings: Settings,
};

function shortcutIcon(id: string): LucideIcon {
  return SHORTCUT_ICONS[id] ?? ShoppingBag;
}

const InicioHomeSidePanel: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { shortcuts } = useFavoriteShortcuts();

  const displayName = profile?.full_name?.trim() || 'Operador LogStoka';
  const initials =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ||
    profile?.email?.trim()?.[0]?.toUpperCase() ||
    'L';

  return (
    <aside className="logstoka-app-sidebar ls-section-sidebar-float" aria-label="Menu lateral">
      <SidebarTooltip label={`${displayName} · Meu perfil`}>
        <button
          type="button"
          className="logstoka-app-nav-item logstoka-app-nav-item--avatar"
          onClick={() => navigate(LOGSTOKA_ROUTES.SETTINGS_PROFILE)}
          aria-label="Meu perfil"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="logstoka-app-nav-avatar" />
          ) : (
            <span className="logstoka-app-nav-avatar logstoka-app-nav-avatar--initials">{initials}</span>
          )}
        </button>
      </SidebarTooltip>

      <nav className="logstoka-app-nav" aria-label="Atalhos favoritos">
        {shortcuts.map((item) => {
          const Icon = shortcutIcon(item.id);
          return (
            <SidebarTooltip key={item.id} label={item.label}>
              <button
                type="button"
                className="logstoka-app-nav-item"
                onClick={() => navigate(item.to)}
                aria-label={item.label}
              >
                <Icon size={18} strokeWidth={1.65} />
              </button>
            </SidebarTooltip>
          );
        })}
      </nav>

      <footer className="logstoka-app-sidebar-foot">
        <SidebarTooltip label="Configurações">
          <button
            type="button"
            className="logstoka-app-nav-item"
            onClick={() => navigate(LOGSTOKA_ROUTES.SETTINGS)}
            aria-label="Configurações"
          >
            <Settings size={18} strokeWidth={1.65} />
          </button>
        </SidebarTooltip>
        <SidebarTooltip label="Sair">
          <button
            type="button"
            className="logstoka-app-nav-item logstoka-app-nav-item--logout"
            onClick={() => void signOut()}
            aria-label="Sair"
          >
            <LogOut size={18} strokeWidth={1.65} />
          </button>
        </SidebarTooltip>
      </footer>
    </aside>
  );
};

export default InicioHomeSidePanel;

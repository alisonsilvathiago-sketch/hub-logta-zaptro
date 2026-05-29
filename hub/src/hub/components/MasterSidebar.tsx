import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Users,
  CreditCard,
  LogOut,
  Home,
  Building2,
  Truck,
  Contact,
  Calendar,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import HubLogo from './HubLogo';
import { getPlatform } from '@core/lib/platform';

type MenuItem = {
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; color?: string; strokeWidth?: number }>;
  path: string;
  shortcut?: string;
};

/** Grupos com separador estilo Supabase. Sem Infraestrutura no menu. */
const NAV_ICON_STROKE = 1.25;
const NAV_ICON_SIZE = 18;

const menuGroups: MenuItem[][] = [
  [{ label: 'Início', icon: Home, path: '/master', shortcut: 'H' }],
  [
    { label: 'Clientes Hub', icon: Users, path: '/master/clientes' },
    { label: 'Financeiro', icon: CreditCard, path: '/master/billing', shortcut: 'F' },
    { label: 'Operações', icon: Truck, path: '/master/logistica', shortcut: 'O' },
    { label: 'Empresas', icon: Building2, path: '/master/companies', shortcut: 'E' },
  ],
  [
    { label: 'Leads', icon: Contact, path: '/master/crm' },
    { label: 'Agenda', icon: Calendar, path: '/master/agenda' },
  ],
  [
    { label: 'HubChat', icon: MessageSquare, path: '/master/hubchat' },
    { label: 'Configurações', icon: Settings, path: '/master/settings' },
  ],
];

function SidebarSeparator() {
  return <div className="hub-master-sidebar-separator" role="separator" aria-hidden />;
}

const MasterSidebar: React.FC<{ variant?: 'rail' | 'drawer' }> = ({ variant = 'rail' }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const platform = getPlatform();
  const isDrawer = variant === 'drawer';
  const expanded = isDrawer || isHovered;

  return (
    <aside
      className="hub-sidebar-enterprise master-sidebar-aside"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: isDrawer ? '100%' : expanded ? 240 : 64,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden',
      }}
      onMouseEnter={() => !isDrawer && setIsHovered(true)}
      onMouseLeave={() => !isDrawer && setIsHovered(false)}
    >
      <div
        className="hub-master-sidebar-brand"
        style={{
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 56,
          minHeight: 56,
          flexShrink: 0,
          justifyContent: expanded ? 'flex-start' : 'center',
          borderBottom: '1px solid var(--hub-border)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: expanded ? 6 : 0 }}>
          <HubLogo height={18} color="var(--hub-brand, #0061FF)" />
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--hub-text-main)',
            letterSpacing: '-0.01em',
            opacity: expanded ? 1 : 0,
            visibility: expanded ? 'visible' : 'hidden',
            transition: 'opacity 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          Hub Master
        </span>
      </div>

      <nav className="hub-master-sidebar-nav">
        {menuGroups.map((group, groupIdx) => (
          <React.Fragment key={`nav-group-${groupIdx}`}>
            {groupIdx > 0 && <SidebarSeparator />}
            <div className="hub-master-sidebar-group">
              {group.map((item) => (
                <MenuLink
                  key={item.path}
                  item={item}
                  expanded={expanded}
                  location={location}
                  platform={platform}
                />
              ))}
            </div>
          </React.Fragment>
        ))}
      </nav>

      <div className="hub-master-sidebar-footer">
        <button
          type="button"
          className="hub-sidebar-item hub-master-nav-link hub-master-nav-link--supabase collapsed"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            padding: expanded ? '0 14px' : 0,
            borderRadius: 8,
            margin: '0 auto',
            width: expanded ? '100%' : 36,
            height: 36,
            boxSizing: 'border-box',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            textAlign: 'left',
          }}
          onClick={signOut}
        >
          <div className="hub-master-nav-link__icon">
            <LogOut size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginLeft: 8,
              flex: 1,
              opacity: expanded ? 1 : 0,
              visibility: expanded ? 'visible' : 'hidden',
              transition: 'opacity 0.2s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            Sair do Painel
          </span>
        </button>
      </div>
    </aside>
  );
};

const MenuLink = ({
  item,
  expanded,
  location,
  platform,
}: {
  item: MenuItem;
  expanded: boolean;
  location: ReturnType<typeof useLocation>;
  platform: ReturnType<typeof getPlatform>;
}) => {
  const isActive = (() => {
    const [pathBase, hashPart] = item.path.split('#');
    if (hashPart) {
      return location.pathname === pathBase && location.hash === `#${hashPart}`;
    }
    if (pathBase === '/master') {
      return location.pathname === '/master' && !location.hash;
    }
    return location.pathname === pathBase || location.pathname.startsWith(`${pathBase}/`);
  })();

  return (
    <NavLink
      to={item.path}
      className={`hub-sidebar-item hub-master-nav-link hub-master-nav-link--supabase${
        isActive ? ' active hub-master-nav-link--active' : ''
      } ${expanded ? 'expanded' : 'collapsed'}`}
      title={!expanded ? item.label : ''}
    >
      <div className="hub-master-nav-link__icon">
        <item.icon size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
      </div>
      <div className="hub-master-nav-link__label">
        <span>{item.label}</span>
        {item.shortcut && expanded && (
          <span className="hub-master-nav-link__shortcut">
            <span>{platform.cmd}</span>
            <span>{item.shortcut}</span>
          </span>
        )}
      </div>
    </NavLink>
  );
};

export default MasterSidebar;

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  CreditCard,
  LogOut,
  Box,
  Sparkles,
  Building2,
  Shield,
  HardDrive,
  Workflow,
  Truck,
  Cpu,
  Plug,
  Activity,
  Anchor,
  Library,
  MessageSquare,
  PackageSearch,
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';

import Kbd from '@shared/components/Kbd';
import { getPlatform } from '@core/lib/platform';

type MenuItem = {
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; color?: string; strokeWidth?: number }>;
  path: string;
  shortcut?: string;
};

type MenuBlock =
  | { type: 'items'; items: MenuItem[] }
  | { type: 'divider' }
  | { type: 'section'; title: string; items: MenuItem[] };

/** IA do Hub: categorias separadas (clientes/CRM, operações, financeiro, empresas, automação, infra) sem alterar o sistema visual da sidebar. */
const menuBlocks: MenuBlock[] = [
  {
    type: 'section',
    title: 'Painel',
    items: [
      { label: 'Início', icon: Sparkles, path: '/master', shortcut: 'H' },
      { label: 'Resultados', icon: LayoutDashboard, path: '/master/resultados' },
    ],
  },
  {
    type: 'section',
    title: 'Clientes & CRM',
    items: [
      { label: 'CRM & Expansão', icon: TrendingUp, path: '/master/crm', shortcut: 'C' },
      { label: 'Clientes Hub', icon: Users, path: '/master/clientes' },
    ],
  },
  {
    type: 'section',
    title: 'Operações',
    items: [{ label: 'Logística', icon: Truck, path: '/master/logistica', shortcut: 'L' }],
  },
  {
    type: 'section',
    title: 'Financeiro',
    items: [{ label: 'Financeiro', icon: CreditCard, path: '/master/billing', shortcut: 'F' }],
  },
  {
    type: 'section',
    title: 'Empresas & SaaS',
    items: [{ label: 'Empresas', icon: Building2, path: '/master/companies', shortcut: 'E' }],
  },
  {
    type: 'section',
    title: 'Produtos',
    items: [
      { label: 'LogDock', icon: HardDrive, path: '/master/logdock-admin' },
      { label: 'Zaptro', icon: MessageSquare, path: '/master/zaptro-admin' },
      { label: 'Logta', icon: PackageSearch, path: '/master/logta-admin' },
    ],
  },

];

const MasterSidebar: React.FC<{ variant?: 'rail' | 'drawer' }> = ({ variant = 'rail' }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const platform = getPlatform();
  const isDrawer = variant === 'drawer';
  const expanded = isDrawer || isHovered;

  return (
    <aside
      className="master-sidebar-aside"
      style={{
        ...styles.sidebar,
        width: isDrawer ? '100%' : expanded ? 280 : 80,
        ...(isDrawer
          ? { position: 'relative', height: '100%', boxShadow: 'none', borderRight: 'none' }
          : {}),
      }}
      onMouseEnter={() => !isDrawer && setIsHovered(true)}
      onMouseLeave={() => !isDrawer && setIsHovered(false)}
    >
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <Box size={24} color="#FFF" strokeWidth={2} />
        </div>
        <div style={{ ...styles.logoTextContainer, opacity: expanded ? 1 : 0, pointerEvents: expanded ? 'auto' : 'none' }}>
          <div style={styles.logoText}>hub.logta</div>
        </div>
      </div>

      <nav style={styles.nav} aria-label="Navegação principal">
        {menuBlocks.map((block, idx) => {
          if (block.type === 'divider') {
            return <div key={`d-${idx}`} style={styles.navDividerWrap} aria-hidden="true"><div style={styles.navDivider} /></div>;
          }
          if (block.type === 'section') {
            return (
              <div key={`s-${idx}`} style={styles.navSection}>
                <div style={styles.groupItems}>
                  {block.items.map((item, i) => (
                    <MenuLink key={i} item={item} expanded={expanded} location={location} platform={platform} />
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={`i-${idx}`} style={styles.navSectionFlat}>
              <div style={styles.groupItems}>
                {block.items.map((item, i) => (
                  <MenuLink key={i} item={item} expanded={expanded} location={location} platform={platform} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <button type="button" className="master-sidebar-logout" style={styles.logoutBtn} onClick={signOut}>
          <LogOut size={20} strokeWidth={2} />
          <span style={{ ...styles.logoutLabel, opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0, overflow: 'hidden' }}>
            Sair do Painel
          </span>
        </button>
      </div>
    </aside>
  );
};

const MenuLink = ({ item, expanded, location, platform }: { item: MenuItem; expanded: boolean; location: ReturnType<typeof useLocation>; platform: ReturnType<typeof getPlatform> }) => {
  const isActive =
    location.pathname === item.path ||
    (item.path !== '/master' && location.pathname.startsWith(item.path));

  return (
    <NavLink
      to={item.path}
      className={'hub-master-nav-link' + (isActive ? ' hub-master-nav-link--active' : '')}
      style={{
        ...styles.menuItem,
        ...(isActive ? styles.menuItemActive : {}),
        justifyContent: expanded ? 'flex-start' : 'center',
        paddingLeft: 12,
        paddingRight: 12,
      }}
      title={!expanded ? item.label : ''}
    >
      <item.icon
        size={20}
        strokeWidth={2}
        style={{ flexShrink: 0 }}
        color={isActive ? '#0061FF' : '#64748B'}
      />
      {expanded && (
        <div style={styles.menuItemMeta}>
          <span style={{ ...styles.menuLabel, color: isActive ? '#0F172A' : '#475569' }}>{item.label}</span>
          {item.shortcut && (
            <div style={styles.kbdRow}>
              <Kbd style={styles.kbdSmall}>{platform.cmd}</Kbd>
              <Kbd style={styles.kbdSmall}>{item.shortcut}</Kbd>
            </div>
          )}
        </div>
      )}
      {isActive && !expanded && <div style={styles.activeDot} />}
    </NavLink>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    background: '#FFFFFF',
    color: '#64748B',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #E2E8F0',
    transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.28s ease',
    zIndex: 1000,
    overflow: 'hidden',
    boxShadow: 'none',
  },
  logoContainer: {
    padding: '20px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
    borderBottom: '1px solid #F1F5F9',
    flexShrink: 0,
  },
  logoIcon: {
    width: 48,
    height: 48,
    background: 'linear-gradient(145deg, #0061FF 0%, #0052D9 100%)',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'none',
    flexShrink: 0,
  },
  logoTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    transition: 'opacity 0.2s ease',
    whiteSpace: 'nowrap',
  },
  logoText: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  nav: {
    flex: 1,
    minHeight: 63,
    maxHeight: 1000,
    height: 459,
    padding: '0 12px',
    marginTop: -10,
    marginBottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    scrollbarColor: '#CBD5E1 transparent',
    alignItems: 'stretch',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 13,
  },
  navDividerWrap: {
    padding: '2px 0',
    flexShrink: 0,
    width: '100%',
  },
  navDivider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.25) 20%, rgba(0, 97, 255, 0.35) 50%, rgba(148, 163, 184, 0.25) 80%, transparent 100%)',
    borderRadius: 1,
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    width: '100%',
  },
  navSectionFlat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#94A3B8',
    padding: '8px 10px 4px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    lineHeight: 1.3,
    transition: 'opacity 0.2s ease, height 0.2s ease, margin 0.2s ease',
  },
  groupItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    width: '100%',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
    borderRadius: 10,
    color: '#64748B',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
    transition: 'background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease',
    whiteSpace: 'nowrap',
    position: 'relative',
    letterSpacing: '-0.01em',
    border: '1px solid transparent',
    width: '100%',
    boxSizing: 'border-box',
  },
  menuItemActive: {
    backgroundColor: 'rgba(0, 97, 255, 0.07)',
    border: '1px solid rgba(0, 97, 255, 0.12)',
    boxShadow: 'none',
  },
  menuItemMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: 0,
    marginLeft: 4,
    gap: 8,
  },
  menuLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: 13,
    fontWeight: 600,
  },
  kbdRow: {
    display: 'flex',
    gap: 2,
    opacity: 0.65,
    flexShrink: 0,
  },
  kbdSmall: {
    height: 16,
    minWidth: 16,
    fontSize: 8,
    padding: '0 4px',
    background: '#F1F5F9',
    border: '1px solid #E2E8F0',
    color: '#64748B',
  },
  activeDot: {
    position: 'absolute',
    right: 10,
    width: 5,
    height: 5,
    backgroundColor: '#0061FF',
    borderRadius: '50%',
  },
  footer: {
    padding: '16px 12px',
    borderTop: '1px solid #F1F5F9',
    flexShrink: 0,
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    padding: '12px 12px',
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    border: '1px solid rgba(244, 63, 94, 0.2)',
    color: '#FB7185',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    transition: 'background-color 0.18s ease, border-color 0.18s ease, transform 0.15s ease',
  },
  logoutLabel: {
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s ease',
  },
};

const hoverStyleId = 'master-sidebar-nav-hover';

if (typeof document !== 'undefined' && !document.getElementById(hoverStyleId)) {
  const el = document.createElement('style');
  el.id = hoverStyleId;
  el.textContent = `
    .master-sidebar-aside nav::-webkit-scrollbar { width: 5px; }
    .master-sidebar-aside nav::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 10px;
    }
    .master-sidebar-aside .hub-master-nav-link:hover:not(.hub-master-nav-link--active) {
      background-color: #F8FAFC;
      border-color: #E2E8F0;
    }
    .master-sidebar-aside .master-sidebar-logout:hover {
      background-color: rgba(244, 63, 94, 0.14);
      border-color: rgba(244, 63, 94, 0.35);
    }
  `;
  document.head.appendChild(el);
}

export default MasterSidebar;

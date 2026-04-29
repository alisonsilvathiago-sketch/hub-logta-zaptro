import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, TrendingUp, MessageSquare, Truck,
  Building2, Users, CreditCard, FileText,
  Link, Zap, HardDrive, Database, Shield,
  LogOut, Box, ChevronRight, UserCircle, CalendarDays
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';

const MasterSidebar: React.FC = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const menuStructure = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/master' },
    { label: 'CRM & Vendas', icon: TrendingUp, path: '/master/crm' },
    { label: 'Clientes', icon: UserCircle, path: '/master/clientes' },
    { label: 'Agenda Hub', icon: CalendarDays, path: '/master/agenda' },
    { label: 'HubChat', icon: MessageSquare, path: '/master/hubchat' },
    { label: 'Logística', icon: Truck, path: '/master/logistica' },
    {
      title: 'OPERAÇÕES',
      items: [
        { label: 'Empresas', icon: Building2, path: '/master/companies' },
        { label: 'Faturamento', icon: CreditCard, path: '/master/billing' },
        { label: 'Relatórios', icon: FileText, path: '/master/reports' },
      ]
    }
  ];

  return (
    <aside 
      style={{
        ...styles.sidebar,
        width: isHovered ? '280px' : '80px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}><Box size={24} color="#FFF" /></div>
        <div style={{...styles.logoTextContainer, opacity: isHovered ? 1 : 0}}>
          <div style={styles.logoText}>hub.logta</div>
          <div style={styles.logoSubtext}>MASTER CONTROL</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {menuStructure.map((section, idx) => {
          if ('title' in section) {
            return (
              <div key={idx} style={styles.group}>
                {isHovered && <div style={styles.groupTitle}>{section.title}</div>}
                <div style={styles.groupItems}>
                  {section.items.map((item, i) => (
                    <MenuLink key={i} item={item} isHovered={isHovered} location={location} />
                  ))}
                </div>
              </div>
            );
          }
          return <MenuLink key={idx} item={section} isHovered={isHovered} location={location} />;
        })}
      </nav>

      <div style={styles.footer}>
        <button style={styles.logoutBtn} onClick={signOut}>
          <LogOut size={22} />
          {isHovered && <span style={{ marginLeft: '12px' }}>Sair do Painel</span>}
        </button>
      </div>
    </aside>
  );
};

const MenuLink = ({ item, isHovered, location }: any) => {
  const isActive = location.pathname === item.path || (item.path !== '/master' && location.pathname.startsWith(item.path));
  return (
    <NavLink
      to={item.path}
      style={{
        ...styles.menuItem,
        ...(isActive ? styles.menuItemActive : {}),
        justifyContent: isHovered ? 'flex-start' : 'center',
      }}
      title={!isHovered ? item.label : ''}
    >
      <item.icon size={22} style={{ flexShrink: 0 }} />
      {isHovered && <span style={styles.menuLabel}>{item.label}</span>}
      {isActive && !isHovered && <div style={styles.activeDot} />}
    </NavLink>
  );
};

const styles: Record<string, any> = {
  sidebar: {
    position: 'fixed', left: 0, top: 0, height: '100vh',
    backgroundColor: '#FFFFFF', color: '#64748B', display: 'flex', flexDirection: 'column',
    borderRight: '1px solid #E2E8F0', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 1000, overflow: 'hidden', boxShadow: '4px 0 25px -5px rgba(0,0,0,0.05)',
  },
  logoContainer: { padding: '24px 16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', minHeight: '80px' },
  logoIcon: { width: '48px', height: '48px', backgroundColor: '#6366F1', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)', flexShrink: 0 },
  logoTextContainer: { display: 'flex', flexDirection: 'column', transition: 'opacity 0.2s', whiteSpace: 'nowrap' },
  logoText: { color: '#0F172A', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.8px' },
  logoSubtext: { color: '#94A3B8', fontSize: '10px', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase' },
  nav: { flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', overflowX: 'hidden' },
  group: { display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px' },
  groupTitle: { fontSize: '10px', fontWeight: '800', color: '#94A3B8', padding: '0 12px', letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' },
  groupItems: { display: 'flex', flexDirection: 'column', gap: '4px' },
  menuItem: { display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '24px', color: '#64748B', textDecoration: 'none', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s', whiteSpace: 'nowrap', position: 'relative', letterSpacing: '-0.4px' },
  menuItemActive: { backgroundColor: '#F3F4F6', color: '#6366F1' },
  menuLabel: { marginLeft: '12px', fontSize: '14px' },
  activeDot: { position: 'absolute', right: '8px', width: '4px', height: '4px', backgroundColor: '#6366F1', borderRadius: '50%' },
  footer: { padding: '20px 12px', borderTop: '1px solid #E2E8F0' },
  logoutBtn: { width: '100%', display: 'flex', alignItems: 'center', borderRadius: '24px', backgroundColor: 'transparent', border: 'none', color: '#F43F5E', cursor: 'pointer', fontSize: '14px', fontWeight: '700', transition: 'all 0.2s', letterSpacing: '-0.4px' }
};

export default MasterSidebar;

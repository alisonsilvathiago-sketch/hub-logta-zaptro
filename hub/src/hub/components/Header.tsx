import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Search, Bell, User, ChevronDown, 
  Settings, LogOut, Menu, Globe, ChevronRight,
  Shield, Database, Link as LinkIcon, Zap, HardDrive, Users
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import SyncIndicator from '../components/SyncIndicator';

const Header: React.FC<{ onMenuClick?: () => void; isMobile?: boolean }> = ({ onMenuClick, isMobile }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Mapeamento de rotas para nomes amigáveis
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    const breadcrumbs = [];
    
    // Base "Início" sempre presente se estiver no /master
    if (paths.includes('master')) {
      breadcrumbs.push({ label: 'Início', path: '/master' });
    }

    // Mapeamento de nomes
    const routeNames: Record<string, string> = {
      'crm': 'CRM & Vendas',
      'clientes': 'Clientes',
      'companies': 'Empresas',
      'billing': 'Financeiro',
      'team': 'Equipe Master',
      'reports': 'Relatórios',
      'settings': 'Configurações',
      'infrastructure': 'Infraestrutura',
      'backup': 'Backups',
      'security': 'Segurança',
      'analytics': 'Analytics',
      'account': 'Meu Perfil',
      'agenda': 'Agenda Hub',
      'chat': 'HubChat',
      'logistica': 'A Logística'
    };

    paths.forEach((p, i) => {
      if (p !== 'master' && routeNames[p]) {
        breadcrumbs.push({ label: routeNames[p], path: '/' + paths.slice(0, i + 1).join('/') });
      } else if (p !== 'master' && !routeNames[p] && isNaN(Number(p)) && p.length > 5) {
        // Fallback para IDs ou nomes dinâmicos (simplificado)
        breadcrumbs.push({ label: 'Detalhes', path: location.pathname });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        {isMobile && (
          <button style={styles.menuBtn} onClick={onMenuClick}>
            <Menu size={24} color="#0F172A" />
          </button>
        )}
        
        {/* BREADCRUMBS (Substituindo Pesquisa) */}
        <div style={styles.breadcrumbWrapper}>
          <div style={styles.breadcrumbSeparator} />
          <div style={styles.breadcrumbContainer}>
            <span style={styles.slash}>/</span>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <Link to={b.path} style={{
                  ...styles.breadcrumbLink,
                  fontWeight: i === breadcrumbs.length - 1 ? '800' : '700',
                  color: i === breadcrumbs.length - 1 ? '#0F172A' : '#64748B'
                }}>
                  {b.label}
                </Link>
                {i < breadcrumbs.length - 1 && <ChevronRight size={14} color="#CBD5E1" style={{ margin: '0 8px' }} />}
              </React.Fragment>
            ))}
            <div style={{ marginLeft: '16px' }}>
              <SyncIndicator />
            </div>
          </div>
        </div>
      </div>

      <div style={styles.rightSection}>
        <div style={styles.iconAction} onClick={() => (window as any).toggleSpotlight?.()}>
          <Search size={20} />
          <div style={styles.kbdHint}>⌘K</div>
        </div>

        <div style={styles.iconAction} onClick={() => navigate('/master/settings')}>
          <Settings size={20} />
        </div>
        <div style={styles.iconAction}>
          <Bell size={20} />
          <div style={styles.notificationBadge} />
        </div>
        
        <div 
          style={styles.userProfile} 
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(!dropdownOpen);
          }}
        >
          <div style={styles.avatar}>
            {profile?.full_name ? profile.full_name[0] : <User size={18} />}
          </div>
          {!isMobile && (
            <div style={styles.userInfo}>
              <span style={styles.userName}>{profile?.full_name?.split(' ')[0] || 'Admin'}</span>
              <ChevronDown size={14} color="#64748B" />
            </div>
          )}
          
          {dropdownOpen && (
            <div style={styles.dropdown} onClick={e => e.stopPropagation()}>
              <div style={styles.dropdownSection}>
                <div style={styles.dropdownSectionTitle}>CONTA</div>
                <div style={styles.dropdownItem} onClick={() => { setDropdownOpen(false); navigate('/master/profile'); }}>
                  <User size={14} /> Meu Perfil
                </div>
                <div style={styles.dropdownItem} onClick={() => { setDropdownOpen(false); navigate('/master/settings'); }}>
                  <Settings size={14} /> Configuração Master
                </div>
              </div>

              <div style={styles.divider} />

              <div style={styles.dropdownSection}>
                <div style={styles.dropdownSectionTitle}>ADMINISTRAÇÃO</div>
                <div style={styles.dropdownItem} onClick={() => { setDropdownOpen(false); navigate('/master/automacoes'); }}>
                  <Zap size={14} /> Automações & Integrações
                </div>
                <div style={styles.dropdownItem} onClick={() => { setDropdownOpen(false); navigate('/master/admins'); }}>
                  <Users size={14} /> Usuários Hub
                </div>
              </div>

              <div style={styles.divider} />

              <div style={styles.dropdownSection}>
                <div style={styles.dropdownSectionTitle}>SISTEMA</div>
                <div style={styles.dropdownItem} onClick={() => { setDropdownOpen(false); navigate('/master/infrastructure'); }}>
                  <Database size={14} /> Infraestrutura
                </div>
                <div style={styles.dropdownItem} onClick={() => { setDropdownOpen(false); navigate('/master/backup'); }}>
                  <HardDrive size={14} /> Backups do Ecossistema
                </div>
                <div style={styles.dropdownItem} onClick={() => { setDropdownOpen(false); navigate('/master/security'); }}>
                  <Shield size={14} /> Segurança
                </div>
              </div>
              
              <div style={styles.divider} />
              
              <div style={{ ...styles.dropdownItem, color: '#EF4444' }} onClick={() => { setDropdownOpen(false); signOut(); }}>
                <LogOut size={14} /> Sair do Painel
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, any> = {
  header: {
    height: '80px',
    backgroundColor: 'transparent',
    borderBottom: 'none',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky' as const,
    top: 0,
    zIndex: 900,
    width: '100%',
  },
  leftSection: { display: 'flex', alignItems: 'center', gap: '24px', flex: 1 },
  
  breadcrumbWrapper: { display: 'flex', alignItems: 'center', gap: '20px' },
  breadcrumbSeparator: { width: '1px', height: '24px', backgroundColor: '#E2E8F0' },
  breadcrumbContainer: { display: 'flex', alignItems: 'center' },
  slash: { color: '#94A3B8', fontSize: '18px', fontWeight: '500', marginRight: '12px' },
  breadcrumbLink: { textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' },

  rightSection: { display: 'flex', alignItems: 'center', gap: '20px' },
  iconAction: { 
    width: '44px', height: '44px', borderRadius: '22px', 
    backgroundColor: '#F6F7F8', color: '#64748B', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #E5E7EB',
    position: 'relative'
  },
  notificationBadge: { position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', backgroundColor: '#EF4444', borderRadius: '50%', border: '2px solid white' },
  kbdHint: { 
    position: 'absolute', 
    bottom: '-20px', 
    fontSize: '9px', 
    fontWeight: '800', 
    color: '#94A3B8',
    backgroundColor: '#F1F5F9',
    padding: '2px 4px',
    borderRadius: '4px',
    border: '1px solid #E2E8F0'
  },
  
  userProfile: {
    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
    padding: '4px', borderRadius: '24px', transition: 'all 0.2s',
    position: 'relative' as const,
  },
  avatar: {
    width: '44px', height: '44px', borderRadius: '22px',
    backgroundColor: '#6366F1', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', fontSize: '16px', boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)'
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
  userName: { fontSize: '14px', fontWeight: '700', color: '#0F172A' },
  
  dropdown: {
    position: 'absolute' as const, top: '100%', right: 0, backgroundColor: '#FFFFFF',
    width: '240px', borderRadius: '24px', border: '1px solid #E2E8F0',
    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)', padding: '12px', marginTop: '12px',
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
  },
  dropdownSection: { display: 'flex', flexDirection: 'column', gap: '2px' },
  dropdownSectionTitle: { fontSize: '10px', fontWeight: '800', color: '#94A3B8', padding: '8px 12px', letterSpacing: '1px' },
  dropdownItem: {
    padding: '10px 12px', borderRadius: '24px', fontSize: '13px', fontWeight: '600',
    color: '#64748B', display: 'flex', alignItems: 'center', gap: '10px',
    transition: 'all 0.2s', cursor: 'pointer'
  },
  divider: { height: '1px', backgroundColor: '#F1F5F9', margin: '6px 0' },
  menuBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }
};

export default Header;

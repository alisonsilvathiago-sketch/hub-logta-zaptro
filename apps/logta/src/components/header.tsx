import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Bell, User, ChevronDown, 
  Sun, Moon, Settings, Building, LogOut, UserCircle, Shield, Menu,
  Users, ShieldCheck, PieChart, Calendar, Calendar as CalIcon,
  Calculator, MessageSquare, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import NotificationCenter from './NotificationCenter';
import { canAccessPath, hasGlobalCompanyAccess } from '../utils/logtaRbac';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '../lib/toast';

// 🎨 ESTILOS NO TOPO PARA ESTABILIDADE TOTAL
const styles: Record<string, any> = {
  header: {
    height: 'var(--header-height, 70px)',
    backgroundColor: 'var(--bg-card, #FFF)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid var(--border)',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky' as const,
    top: 0,
    zIndex: 900,
    width: '100%',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  hamburger: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '8px',
    transition: 'background 0.2s',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-app)',
    borderRadius: '12px',
    padding: '0 16px',
    width: '300px',
    height: '40px',
    border: '1px solid var(--border)',
  },
  searchIcon: { display: 'flex', alignItems: 'center', marginRight: '12px' },
  searchInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '14px',
    color: 'var(--text-main)',
    fontWeight: '500',
  },
  rightSection: { display: 'flex', alignItems: 'center', gap: '8px' },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'transparent',
    transition: 'all 0.2s',
  },
  divider: { width: '1px', height: '24px', backgroundColor: 'var(--border)', margin: '0 8px' },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '12px',
    position: 'relative' as const,
  },
  userInfo: { display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end' },
  userName: { fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' },
  userRole: { fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '10px',
    backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', border: '1px solid var(--border)',
  },
  dropdown: {
    position: 'absolute' as const,
    top: '100%', right: 0, backgroundColor: 'var(--bg-card)',
    width: '260px', borderRadius: '12px', border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)', padding: '6px', marginTop: '8px',
    display: 'flex', flexDirection: 'column' as const, gap: '2px',
  },
  dropdownLabel: { padding: '12px 12px 6px 12px', fontSize: '9px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '1px' },
  dropdownItem: {
    padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px',
    transition: 'all 0.2s', cursor: 'pointer'
  },
  authButtons: { display: 'flex', gap: '12px' },
  btnPrimary: { padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  logoIcon: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary)', position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoInnerIcon: { width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'white' },
  logoText: { fontSize: '20px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-1px' },
};

interface HeaderProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
  onCalcClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isMobile, onCalcClick }) => {
  const { user, profile, signOut, isMaster } = useAuth();
  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'MASTER' || profile?.role === 'MASTER_ADMIN';
  const { company } = useTenant();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark');
  const isPublic = window.location.pathname === '/' || ['/login', '/planos', '/faq', '/blog'].includes(window.location.pathname);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        {isMobile && user && (
          <button style={styles.hamburger} onClick={onMenuClick}>
            <Menu size={24} color="var(--text-main)" />
          </button>
        )}
        
        {!isMobile && user && !isPublic && (
          <div style={styles.searchContainer}>
            <div style={styles.searchIcon}>
              <Search size={18} color="var(--text-muted)" />
            </div>
            <input type="text" placeholder="Buscar..." style={styles.searchInput} />
          </div>
        )}

        {isPublic && !isMobile && (
          <div style={styles.logo} onClick={() => navigate('/')}>
             <div style={styles.logoIcon}><div style={styles.logoInnerIcon} /></div>
          </div>
        )}
      </div>

      <div style={styles.rightSection}>
        {isMobile && <div style={styles.iconButton}><Search size={20} color="var(--text-secondary)" /></div>}
        {profile?.role && hasGlobalCompanyAccess(profile.role) && !isMobile && (
          <div style={styles.iconButton} onClick={onCalcClick} title="Calculadora Financeira"><Calculator size={20} color="#10B981" /></div>
        )}
        {profile?.role && canAccessPath(profile.role, '/usuarios') && !isMobile && (
          <div style={styles.iconButton} onClick={() => navigate('/usuarios')} title="Gestão de Equipe"><Users size={20} color="var(--text-secondary)" /></div>
        )}
        <div style={styles.iconButton} onClick={toggleTheme}><Sun size={20} color={isDark ? "#F59E0B" : "var(--text-secondary)"} /></div>
        <NotificationCenter />
        <div style={styles.divider} />
        {user ? (
          <div style={styles.userProfile} onClick={() => setDropdownOpen(!dropdownOpen)}>
            {!isMobile && (
              <div style={styles.userInfo}>
                <span style={styles.userName}>{profile?.full_name?.split(' ')[0] || 'Usuário'}</span>
                <span style={styles.userRole}>{profile?.role || 'Membro'}</span>
              </div>
            )}
            <div style={{...styles.avatar, overflow: 'hidden'}}>
              {profile?.avatar_url ? <img src={profile.avatar_url} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="Avatar" /> : (profile?.full_name ? profile.full_name[0] : <User size={18} />)}
            </div>
            {dropdownOpen && (
              <div style={styles.dropdown}>
                  <div style={styles.dropdownItem} onClick={() => navigate('/perfil')}>Meu Perfil</div>
                  <div style={styles.dropdownItem} onClick={signOut} style={{color: '#EF4444'}}>Sair</div>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.authButtons}>
             {!isMobile && <button style={styles.btnPrimary} onClick={() => navigate('/login')}>Acessar Terminal</button>}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

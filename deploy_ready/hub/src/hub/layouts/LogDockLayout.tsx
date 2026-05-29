import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  LogOut, User, Settings, Grid, 
  HelpCircle, ChevronLeft, Bell,
  LayoutDashboard, Box
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import { toastSuccess } from '@core/lib/toast';

const LogDockLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toastSuccess('Sessão encerrada com sucesso.');
    navigate('/auth/logdock');
  };

  return (
    <div style={styles.container}>
      {/* Top Bar Especial do LogDock */}
      <header style={styles.header}>
        <div style={styles.left}>
          <div style={styles.logoBox} onClick={() => navigate('/master')}>
            <div style={styles.logoIcon}>
              <Box size={24} color="white" />
            </div>
            <div style={styles.logoTextWrapper}>
              <span style={styles.logoMain}>LOGDOCK</span>
              <span style={styles.logoSub}>.COM.BR</span>
            </div>
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.searchMock}>
             <span style={{color: '#94A3B8'}}>Pesquisar em containers, notas, clientes...</span>
          </div>
          
          <div style={styles.actions}>
            <button style={styles.actionBtn}><HelpCircle size={20} /></button>
            <button style={styles.actionBtn}><Bell size={20} /></button>
            
            <div style={styles.profileDropdown}>
              <div style={styles.avatar}>
                {profile?.full_name?.[0] || 'U'}
                <div style={styles.dropdownContent}>
                  <div style={styles.dropdownHeader}>
                    <p style={styles.userName}>{profile?.full_name}</p>
                    <p style={styles.userEmail}>{profile?.email}</p>
                  </div>
                  <div style={styles.dropdownDivider} />
                  
                  {/* SELETOR INTELIGENTE DE PRODUTOS */}
                  <div style={styles.productSwitcher}>
                    <p style={styles.switcherLabel}>Acessar outros serviços</p>
                    <button style={styles.productBtn} onClick={() => navigate('/master')}>
                      <LayoutDashboard size={16} /> Hub Master
                    </button>
                    <button style={styles.productBtn}>
                      <Grid size={16} /> CRM Pipeline
                    </button>
                  </div>

                  <div style={styles.dropdownDivider} />
                  <button style={styles.dropdownItem} onClick={() => navigate('/master/profile')}><User size={16} /> Perfil</button>
                  <button style={styles.dropdownItem} onClick={() => navigate('/master/settings')}><Settings size={16} /> Configurações</button>
                  <button style={{...styles.dropdownItem, color: '#EF4444'}} onClick={handleSignOut}><LogOut size={16} /> Sair</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Full Screen */}
      <main style={styles.main}>
        <Outlet />
      </main>

      <style>{`
        .profileDropdown:hover .dropdownContent { display: block; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', overflow: 'hidden', fontFamily: '"Inter", sans-serif' },
  header: { height: '72px', backgroundColor: '#FFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  left: { display: 'flex', alignItems: 'center', gap: '16px' },
  logoBox: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  logoIcon: { width: '36px', height: '36px', backgroundColor: '#2563EB', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)' },
  logoTextWrapper: { display: 'flex', alignItems: 'baseline', gap: '2px' },
  logoMain: { fontSize: '20px', fontWeight: '900', color: '#1E1B4B', letterSpacing: '-0.8px' },
  logoSub: { fontSize: '12px', fontWeight: '700', color: '#2563EB', opacity: 0.8 },
  right: { display: 'flex', alignItems: 'center', gap: '32px' },
  searchMock: { width: '400px', backgroundColor: '#F1F5F9', padding: '10px 20px', borderRadius: '12px', fontSize: '14px', border: '1px solid #E2E8F0' },
  actions: { display: 'flex', alignItems: 'center', gap: '12px' },
  actionBtn: { background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '8px', borderRadius: '10px', transition: 'all 0.2s' },
  profileDropdown: { position: 'relative', cursor: 'pointer' },
  avatar: { width: '40px', height: '40px', backgroundColor: '#0F172A', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' },
  dropdownContent: { position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '280px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #E2E8F0', padding: '12px', zIndex: 1000, display: 'none', animation: 'fadeIn 0.2s ease-out' },
  dropdownHeader: { padding: '12px 16px' },
  userName: { margin: 0, fontSize: '15px', fontWeight: '800', color: '#1E1B4B' },
  userEmail: { margin: '2px 0 0', fontSize: '13px', color: '#64748B', fontWeight: '500' },
  dropdownDivider: { height: '1px', backgroundColor: '#F1F5F9', margin: '8px 0' },
  dropdownItem: { width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' },
  productSwitcher: { padding: '12px 8px' },
  switcherLabel: { margin: '0 0 12px 8px', fontSize: '11px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  productBtn: { width: '100%', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '13px', fontWeight: '700', color: '#1E1B4B', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.2s' },
  main: { flex: 1, overflow: 'hidden' }
};

export default LogDockLayout;

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import MasterSidebar from '../components/MasterSidebar';
import SpotlightSearch from '../components/SpotlightSearch';
import SyncIndicator from '../components/SyncIndicator';
import GlobalActivityTicker from '../components/GlobalActivityTicker';
import { supabase } from '@core/lib/supabase';
import { AlertCircle, WifiOff } from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';

const MasterLayout: React.FC = () => {
  const { user, profile, isLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const location = useLocation();

  // Monitoramento Inteligente de Conexão - TOP LEVEL
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        setConnectionError(!!error);
      } catch {
        setConnectionError(true);
      }
    };

    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    (window as any).toggleSpotlight = () => setIsSpotlightOpen(prev => !prev);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      delete (window as any).toggleSpotlight;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' 
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '24px', backgroundColor: '#6366F1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse 1.5s infinite ease-in-out', boxShadow: '0 0 40px rgba(99,102,241,0.3)'
        }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '4px' }} />
        </div>
        <p style={{ marginTop: '24px', color: '#94A3B8', fontSize: '13px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Sincronizando Matriz Master...
        </p>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  // Refined Auth Protection Logic
  const isMaster = profile?.role === 'MASTER' || profile?.role === 'MASTER_ADMIN' || profile?.role === 'ADMIN';

  // Wait for profile if user exists but profile doesn't yet
  if (user && !profile) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        color: '#64748B',
        fontSize: '13px',
        fontWeight: '800',
        letterSpacing: '1px',
        textTransform: 'uppercase'
      }}>
        Sincronizando perfil master...
      </div>
    );
  }

  if (!user && !isLoading) {
    return <Navigate to="/" replace />;
  }

  if (user && !isMaster && !isLoading) {
    // If user is logged in but not master, we might want to show an error or logout
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#F8FAFC',
      fontFamily: "'Inter', sans-serif",
      position: 'relative'
    }}>
      {/* Alerta de Conexão Inteligente */}
      {connectionError && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#EF4444', color: 'white', padding: '12px 24px', borderRadius: '24px',
          zIndex: 10001, fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 20px 40px rgba(239, 68, 68, 0.4)', letterSpacing: '0.5px', textTransform: 'uppercase',
          animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <style>{`
            @keyframes slideDown {
              from { transform: translate(-50%, -100%); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
          <WifiOff size={18} /> Instabilidade detectada na rede master. 
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        :root {
          --primary: #6366F1;
          --primary-dark: #4F46E5;
          --bg-main: #F8FAFC;
          --bg-card: #ffffff;
          --text-title: #111827;
          --text-subtitle: #6B7280;
          --text-body: #374151;
          --border: #f1f5f9;
        }

        * {
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background-color: var(--bg-main);
          color: var(--text-body);
          -webkit-font-smoothing: antialiased;
          font-size: 16px;
          line-height: 1.6;
          letter-spacing: 0.2px;
        }

        h1, .h1-style, .page-title, .title-main {
          font-size: 32px !important;
          font-weight: 800 !important;
          color: #000000 !important;
          letter-spacing: -1.2px !important;
          line-height: 1.2 !important;
          margin-bottom: 4px !important;
        }

        h2, .h2-style {
          font-size: 22px !important;
          font-weight: 800 !important;
          color: var(--text-title) !important;
          line-height: 1.25 !important;
          margin-bottom: 12px !important;
          letter-spacing: -0.6px !important;
        }

        h3, .h3-style {
          font-size: 16px !important;
          font-weight: 700 !important;
          color: var(--text-title) !important;
          line-height: 1.25 !important;
          margin-bottom: 8px !important;
          letter-spacing: -0.2px !important;
        }

        p, span, div {
          color: var(--text-body);
        }

        .text-subtitle {
          color: var(--text-subtitle) !important;
          font-size: 14px !important;
          font-weight: 400 !important;
          margin-top: 0px !important;
          line-height: 1.5 !important;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .kpi-value, .stat-value, .metric-value {
          font-size: 20px !important;
          font-weight: 800 !important;
          color: #000000 !important;
          letter-spacing: -0.2px !important;
          line-height: 1 !important;
          margin: 2px 0 !important;
        }

        .kpi-label, .stat-label, .metric-label {
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #94A3B8 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>

      {/* SIDEBAR FIXED (80px wide base) */}
      {!isMobile && <MasterSidebar />}
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflow: 'hidden',
        marginLeft: isMobile ? 0 : '80px',
        transition: 'margin-left 0.3s ease'
      }}>
        <Header 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          isMobile={isMobile} 
        />
        
        <main style={{ 
          flex: 1, 
          overflowY: location.pathname.includes('/hubchat') ? 'hidden' : 'auto',
          backgroundColor: '#F8FAFC',
          padding: location.pathname.includes('/hubchat') ? '0' : (isMobile ? '20px' : '40px'),
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(217, 255, 0, 0.03) 0%, transparent 50%)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* CENTERED CONTENT WRAPPER */}
          <div style={{
            maxWidth: location.pathname.includes('/hubchat') ? '100%' : '1400px',
            margin: location.pathname.includes('/hubchat') ? '0' : '0 auto',
            width: '100%',
            height: location.pathname.includes('/hubchat') ? '100%' : 'auto',
            padding: '0',
            position: 'relative'
          }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* MOBILE OVERLAY MENU */}
      {isMobile && isMobileMenuOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1100 }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            style={{ width: '280px', height: '100%', backgroundColor: '#FFFFFF', boxShadow: '10px 0 30px rgba(0,0,0,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <MasterSidebar />
          </div>
        </div>
      )}

      {/* GLOBAL SEARCH */}
      <SpotlightSearch 
        isOpen={isSpotlightOpen} 
        onClose={() => setIsSpotlightOpen(false)} 
      />

      {/* GLOBAL ACTIVITY TICKER */}
      <GlobalActivityTicker />
    </div>
  );
};

export default MasterLayout;

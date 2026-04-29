import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import MasterSidebar from '../components/MasterSidebar';
import SpotlightSearch from '../components/SpotlightSearch';
import SyncIndicator from '../components/SyncIndicator';
import GlobalActivityTicker from '../components/GlobalActivityTicker';
import { useAuth } from '@core/context/AuthContext';

const MasterLayout: React.FC = () => {
  const { user, profile, isLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const location = useLocation();

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

  if (isLoading) return null;

  const isMaster = profile?.role === 'MASTER' || profile?.role === 'MASTER_ADMIN' || profile?.role === 'ADMIN';

  // Protect Master route
  if (!user || !isMaster) {
    if (location.pathname.startsWith('/master')) {
      return <Navigate to="/" replace />;
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#F8FAFC',
      fontFamily: "'Inter', sans-serif"
    }}>
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
          font-size: 14px;
          line-height: 1.5;
          letter-spacing: 0.3px;
        }

        h1, .h1-style, .page-title, .title-main {
          font-size: 36px !important;
          font-weight: 800 !important;
          color: #000000 !important;
          letter-spacing: -1.2px !important;
          line-height: 1.25 !important;
          margin-bottom: 4px !important;
        }

        h2, .h2-style {
          font-size: 20px !important;
          font-weight: 800 !important;
          color: var(--text-title) !important;
          line-height: 1.25 !important;
          margin-bottom: 12px !important;
          letter-spacing: -0.5px !important;
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
          overflowY: 'auto',
          backgroundColor: '#F8FAFC',
          padding: isMobile ? '20px' : '40px',
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(217, 255, 0, 0.03) 0%, transparent 50%)'
        }}>
          {/* CENTERED CONTENT WRAPPER */}
          <div style={{
            maxWidth: location.pathname.includes('/agenda') ? '100%' : '1400px',
            margin: '0 auto',
            width: '100%',
            padding: location.pathname.includes('/agenda') ? '0 20px' : '0'
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

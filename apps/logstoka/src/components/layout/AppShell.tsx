import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import LogstokaAppTopbar from './LogstokaAppTopbar';
import { LogstokaAiDrawer } from '@/modules/ai';
import './logstokaAppShell.css';
import './logstokaTopbar.css';
import './logstokaBranding.css';
import './logstokaMobile.css';

const AppShell: React.FC = () => {
  const { signOut } = useAuth();
  const { cssVars } = useLogstokaBranding();
  const location = useLocation();
  const isInicio = location.pathname === '/app' || location.pathname === '/app/';
  const isProductsSection = location.pathname.startsWith('/app/products');
  const isMovementsSection =
    location.pathname.startsWith('/app/movements') ||
    location.pathname.startsWith('/app/returns') ||
    location.pathname.startsWith('/app/transfers') ||
    location.pathname.startsWith('/app/picking') ||
    location.pathname.startsWith('/app/inventory') ||
    location.pathname.startsWith('/app/conference') ||
    location.pathname.startsWith('/app/imports') ||
    location.pathname.startsWith('/app/reports');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitial, setAiInitial] = useState('');

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      setAiInitial(detail?.message?.trim() ?? '');
      setAiOpen(true);
    };
    window.addEventListener('logstoka:open-ai-drawer', onOpen);
    return () => window.removeEventListener('logstoka:open-ai-drawer', onOpen);
  }, []);

  const openAi = useCallback(() => {
    setAiInitial('');
    setAiOpen(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="logstoka-app-shell" style={cssVars as React.CSSProperties}>
      <Sidebar onSignOut={() => void handleSignOut()} />

      <div className="logstoka-app-main">
        <LogstokaAppTopbar onOpenAi={openAi} onSignOut={() => void handleSignOut()} />
        <div
          className={`logstoka-app-content-gutter${isInicio ? ' logstoka-app-content-gutter--inicio' : ''}${isProductsSection ? ' logstoka-app-content-gutter--products' : ''}${isMovementsSection ? ' logstoka-app-content-gutter--movements' : ''}`}
        >
          <Outlet />
        </div>
      </div>

      <MobileNav />

      {!isInicio && (
        <button
          type="button"
          className="ls-ai-fab logstoka-mobile-only"
          onClick={openAi}
          aria-label="IA operacional"
        >
          <Sparkles size={22} />
        </button>
      )}

      <LogstokaAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        initialMessage={aiInitial}
        onInitialMessageConsumed={() => setAiInitial('')}
      />
    </div>
  );
};

export default AppShell;

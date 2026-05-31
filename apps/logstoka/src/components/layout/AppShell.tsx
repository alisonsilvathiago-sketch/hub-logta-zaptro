import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import AppSectionSidebar from './AppSectionSidebar';
import MobileNav from './MobileNav';
import LogstokaAppTopbar from './LogstokaAppTopbar';
import LogstokaGlobalNotificationBanner from './LogstokaGlobalNotificationBanner';
import { LogstokaAiDrawer } from '@/modules/ai';
import IntelligentScanFab from '@/components/scanner/IntelligentScanFab';
import IntelligentScanGlobalModal from '@/modules/scanner/IntelligentScanGlobalModal';
import '@/modules/scanner/intelligentScanGlobal.css';
import './logstokaAppShell.css';
import './logstokaTopbar.css';
import './logstokaBranding.css';
import './logstokaTheme.css';
import './logstokaMegaMenu.css';
import './sectionSidebar.css';
import './logstokaMobile.css';

const AppShell: React.FC = () => {
  const { signOut } = useAuth();
  const { cssVars } = useLogstokaBranding();
  const location = useLocation();
  const isInicio = location.pathname === '/app' || location.pathname === '/app/';
  const isActivities = location.pathname.startsWith('/app/atividades');
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
  const [scanOpen, setScanOpen] = useState(false);
  const [systemPulseKey, setSystemPulseKey] = useState(0);

  useEffect(() => {
    const onPulse = () => setSystemPulseKey((k) => k + 1);
    window.addEventListener('logstoka:system-pulse', onPulse);
    return () => window.removeEventListener('logstoka:system-pulse', onPulse);
  }, []);

  useEffect(() => {
    const onOpenScan = () => setScanOpen(true);
    window.addEventListener('logstoka:open-intelligent-scan', onOpenScan);
    return () => window.removeEventListener('logstoka:open-intelligent-scan', onOpenScan);
  }, []);

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

  return (
    <div
      className={`logstoka-app-shell logstoka-app-shell--mega-nav${isInicio ? ' logstoka-app-shell--inicio-home' : ''}`}
      style={cssVars as React.CSSProperties}
    >
      <div className="logstoka-app-main">
        <LogstokaAppTopbar onOpenAi={openAi} onSignOut={() => void signOut()} />
        <div className="logstoka-app-body">
          <AppSectionSidebar />
          <div
            className={`logstoka-app-content-gutter${isInicio ? ' logstoka-app-content-gutter--inicio' : ''}${isProductsSection ? ' logstoka-app-content-gutter--products' : ''}${isMovementsSection ? ' logstoka-app-content-gutter--movements' : ''}${isActivities ? ' logstoka-app-content-gutter--activities' : ''}`}
          >
            <LogstokaGlobalNotificationBanner />
            <Outlet key={systemPulseKey} />
          </div>
        </div>
      </div>

      <MobileNav />

      <IntelligentScanFab onClick={() => setScanOpen(true)} />

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

      <IntelligentScanGlobalModal open={scanOpen} onClose={() => setScanOpen(false)} />

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

import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ArrowLeftRight, LayoutGrid, Package, ScanLine, ShoppingBag, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { canViewMarketplaceNav, isMarketplaceModuleActive } from '@/lib/marketplaceModule';
import { loadOperationalProfile } from '@/lib/operationalProfile';
import MobileMoreMenu from './MobileMoreMenu';

const CONFERENCE_PATHS = ['/app/conference', '/app/picking', '/app/operacao'];

function openIntelligentScan(): void {
  window.dispatchEvent(new CustomEvent('logstoka:open-intelligent-scan'));
}

const MobileNav: React.FC = () => {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const operationalProfile = useMemo(() => loadOperationalProfile(companyId), [companyId]);
  const marketplaceActive = isMarketplaceModuleActive(companyId, operationalProfile);
  const showMarketplaceTab = canViewMarketplaceNav(profile?.role, companyId, operationalProfile);

  const sideItems = useMemo(() => {
    const fourth = showMarketplaceTab
      ? marketplaceActive
        ? { to: '/app/integrations', label: 'Integrações', icon: ShoppingBag }
        : { to: LOGSTOKA_ROUTES.MARKETPLACE_HUB, label: 'Marketplace', icon: ShoppingBag }
      : { to: '/app/movements', label: 'Movimentos', icon: ArrowLeftRight };

    return {
      left: [
        { to: '/app', label: 'Início', icon: Sparkles, end: true as const },
        { to: '/app/products', label: 'Produtos', icon: Package },
      ],
      right: [fourth],
    };
  }, [marketplaceActive, showMarketplaceTab]);

  const conferirActive = CONFERENCE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const quickPaths = useMemo(
    () =>
      new Set([
        '/app',
        '/app/products',
        '/app/conference',
        '/app/integrations',
        LOGSTOKA_ROUTES.MARKETPLACE_HUB,
        '/app/movements',
        ...sideItems.right.map((item) => item.to),
      ]),
    [sideItems.right],
  );

  const moreActive =
    pathname !== '/app' &&
    pathname !== '/app/' &&
    !quickPaths.has(pathname) &&
    !CONFERENCE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const renderSideItem = (item: (typeof sideItems.left)[number]) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={'end' in item ? item.end : false}
        className={({ isActive }) =>
          `logstoka-mobile-nav__item${isActive ? ' logstoka-mobile-nav__item--active' : ''}`
        }
      >
        <Icon size={20} strokeWidth={1.75} />
        {item.label}
      </NavLink>
    );
  };

  return (
    <>
      <nav className="logstoka-mobile-nav logstoka-mobile-only" aria-label="Navegação mobile">
        <div className="logstoka-mobile-nav__grid">
          {sideItems.left.map(renderSideItem)}

          <button
            type="button"
            className={`logstoka-mobile-nav__conferir${conferirActive ? ' logstoka-mobile-nav__conferir--active' : ''}`}
            onClick={openIntelligentScan}
            aria-label="Conferir — scanner inteligente"
            title="Conferir"
          >
            <span className="logstoka-mobile-nav__conferir-icon">
              <ScanLine size={24} strokeWidth={2.25} />
            </span>
            <span className="logstoka-mobile-nav__conferir-label">Conferir</span>
          </button>

          {sideItems.right.map(renderSideItem)}

          <button
            type="button"
            className={`logstoka-mobile-nav__item${moreActive ? ' logstoka-mobile-nav__item--active' : ''}`}
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
          >
            <LayoutGrid size={20} strokeWidth={1.75} />
            Mais
          </button>
        </div>
      </nav>
      <MobileMoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} showMarketplace={showMarketplaceTab} />
    </>
  );
};

export default MobileNav;

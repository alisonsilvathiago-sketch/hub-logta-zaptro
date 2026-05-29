import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  FileSpreadsheet,
  Kanban,
  LayoutGrid,
  LineChart,
  LogOut,
  Navigation,
  Radio,
  Settings,
  Truck,
  Users,
  UserPlus,
  Zap,
} from 'lucide-react';
import {
  isZaptroAppEdgeToEdgePath,
  isZaptroAppInicioPath,
  isZaptroAppInboxPath,
  isZaptroAppPageSectionCompactPath,
  isZaptroAppSettingsPath,
  ZAPTRO_APP_ROUTES,
} from './zaptroAppRoutes';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { ZaptroThemeProvider } from '../context/ZaptroThemeContext';
import { isZaptroBrandingEntitledByPlan } from '../utils/zaptroBrandingEntitlement';
import { hasZaptroGranularPermission, isZaptroTenantAdminRole } from '../utils/zaptroPermissions';
import './appShell.css';
import './zaptroFormFields.css';
import './zaptroAppPageLayout.css';
import './zaptroAppPageSection.css';
import './zaptroPageTitle.css';
import './zaptroAppDashboard.css';
import ZaptroAppTopbar from './ZaptroAppTopbar';
import ZaptroAppCompanyDrawer from './ZaptroAppCompanyDrawer';
import ZaptroAiDrawer from './ZaptroAiDrawer';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `zaptro-app-nav-item${isActive ? ' active' : ''}`;

const ZaptroAppShell: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const edgeToEdge = isZaptroAppEdgeToEdgePath(pathname);
  const inicioPage = isZaptroAppInicioPath(pathname);
  const settingsPage = isZaptroAppSettingsPath(pathname);
  const inboxPage = isZaptroAppInboxPath(pathname);
  const sectionCompact = isZaptroAppPageSectionCompactPath(pathname);
  const { profile, isMaster } = useAuth();
  const { company } = useTenant();
  const [companyDrawerOpen, setCompanyDrawerOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState('');

  useEffect(() => {
    const onOpen = () => setCompanyDrawerOpen(true);
    window.addEventListener('zaptro:open-company-drawer', onOpen);
    return () => window.removeEventListener('zaptro:open-company-drawer', onOpen);
  }, []);

  useEffect(() => {
    const onOpenAi = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      const message = detail?.message?.trim() || '';
      setAiInitialMessage(message);
      setAiDrawerOpen(true);
    };
    window.addEventListener('zaptro:open-ai-drawer', onOpenAi);
    return () => window.removeEventListener('zaptro:open-ai-drawer', onOpenAi);
  }, []);

  const handleSignOut = async () => {
    await supabaseZaptro.auth.signOut();
    navigate(ZAPTRO_APP_ROUTES.LOGIN, { replace: true });
  };

  const initials =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ||
    profile?.email?.trim()?.[0]?.toUpperCase() ||
    'U';

  const avatarUrl = profile?.avatar_url?.trim() || null;

  const companyLogoUrl =
    company?.logo_url?.trim() ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('zaptro_company_logo_url')?.trim() || null
      : null);

  const companyInitial =
    company?.name?.trim()?.[0]?.toUpperCase() ||
    initials;

  const canCustomizeTenant = useMemo(() => {
    if (isMaster) return true;
    if (!isZaptroBrandingEntitledByPlan(company)) return false;
    if (isZaptroTenantAdminRole(profile?.role)) return true;
    return hasZaptroGranularPermission(profile?.role, profile?.permissions, 'cfg_marca');
  }, [isMaster, profile?.role, profile?.permissions, company]);

  return (
    <div className="zaptro-app-shell">
      <div className="zaptro-app-sidebar-wrap">
        <aside className="zaptro-app-sidebar" aria-label="Menu principal">
          <NavLink to={ZAPTRO_APP_ROUTES.INBOX} className="zaptro-app-brand" title="Zaptro">
            <Zap size={22} strokeWidth={2.5} className="zaptro-app-brand-icon" />
          </NavLink>

          <span className="zaptro-app-nav-divider" aria-hidden />

          <nav className="zaptro-app-nav">
            <NavLink to={ZAPTRO_APP_ROUTES.HOME} end className={navClass} title="Início">
              <LayoutGrid size={18} strokeWidth={1.65} />
            </NavLink>
            <NavLink to={ZAPTRO_APP_ROUTES.RESULTS} className={navClass} title="Resultados">
              <LineChart size={18} strokeWidth={1.65} />
            </NavLink>
            <NavLink to={ZAPTRO_APP_ROUTES.CLIENTS} className={navClass} title="Clientes">
              <Users size={18} strokeWidth={1.65} />
            </NavLink>
            <NavLink to={ZAPTRO_APP_ROUTES.CRM} className={navClass} title="CRM">
              <Kanban size={18} strokeWidth={1.65} />
            </NavLink>
            <NavLink to={ZAPTRO_APP_ROUTES.AGENDA} className={navClass} title="Agenda (CRM)">
              <CalendarClock size={18} strokeWidth={1.65} />
            </NavLink>
            <NavLink to={ZAPTRO_APP_ROUTES.QUOTES} className={navClass} title="Orçamentos">
              <FileSpreadsheet size={18} strokeWidth={1.65} />
            </NavLink>
            <NavLink to={ZAPTRO_APP_ROUTES.ROUTES} className={navClass} title="Rotas">
              <Navigation size={18} strokeWidth={1.65} />
            </NavLink>
            <NavLink to={ZAPTRO_APP_ROUTES.DRIVERS} className={navClass} title="Motoristas">
              <Truck size={18} strokeWidth={1.65} />
            </NavLink>
            <NavLink
              to={ZAPTRO_APP_ROUTES.INBOX}
              className={(args) => `${navClass(args)} zaptro-app-nav-item--inbox`}
              title="Conversas"
            >
              <Zap size={18} strokeWidth={1.9} />
            </NavLink>
            <NavLink to={ZAPTRO_APP_ROUTES.CONTACTS} className={navClass} title="Contatos">
              <UserPlus size={18} strokeWidth={1.65} />
            </NavLink>
            <NavLink to={ZAPTRO_APP_ROUTES.BROADCASTS} className={navClass} title="Listas de transmissão">
              <Radio size={18} strokeWidth={1.65} />
            </NavLink>
          </nav>

          <span className="zaptro-app-nav-divider" aria-hidden />

          <div className="zaptro-app-sidebar-foot">
            <NavLink to={ZAPTRO_APP_ROUTES.SETTINGS} className={navClass} title="Configurações">
              <Settings size={18} strokeWidth={1.65} />
            </NavLink>
            <button
              type="button"
              className="zaptro-app-nav-item zaptro-app-nav-btn zaptro-app-nav-btn--logout"
              title="Sair"
              onClick={() => void handleSignOut()}
            >
              <LogOut size={18} strokeWidth={1.65} />
            </button>

            <span className="zaptro-app-nav-divider" aria-hidden />

            <button
              type="button"
              className="zaptro-app-nav-profile zaptro-app-nav-btn"
              title="Perfil da empresa"
              aria-label="Perfil da empresa"
              aria-haspopup="dialog"
              aria-expanded={companyDrawerOpen}
              onClick={() => setCompanyDrawerOpen(true)}
            >
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt="" className="zaptro-app-avatar-img" />
              ) : (
                <span className="zaptro-app-avatar">{companyInitial}</span>
              )}
            </button>
          </div>
        </aside>

        <ZaptroAppCompanyDrawer
          open={companyDrawerOpen}
          onClose={() => setCompanyDrawerOpen(false)}
        />
      </div>

      <div
        className={`zaptro-company-drawer-main-backdrop${companyDrawerOpen ? ' is-open' : ''}`}
        role="presentation"
        aria-hidden={!companyDrawerOpen}
        onClick={() => setCompanyDrawerOpen(false)}
      />

      <main className="zaptro-app-main">
        <ZaptroAppTopbar onOpenAi={() => setAiDrawerOpen(true)} />
        <div
          className={[
            'zaptro-app-content',
            inicioPage ? 'zaptro-app-content--inicio' : '',
            inboxPage ? 'zaptro-app-content--inbox' : '',
            edgeToEdge ? 'zaptro-app-content--edge-to-edge' : '',
            settingsPage ? 'zaptro-app-content--settings' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <section
            className={[
              'zaptro-app-page-section',
              inicioPage ? 'zaptro-app-page-section--inicio' : '',
              sectionCompact && !inicioPage ? 'zaptro-app-page-section--compact' : '',
              edgeToEdge ? 'zaptro-app-page-section--edge' : '',
              settingsPage ? 'zaptro-app-page-section--settings' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label="Conteúdo da página"
          >
            <div
              className={[
                'zaptro-app-content-gutter',
                inboxPage ? 'zaptro-app-content-gutter--inbox' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <ZaptroThemeProvider canCustomizeTenant={canCustomizeTenant}>
                <Outlet />
              </ZaptroThemeProvider>
            </div>
          </section>
        </div>
      </main>

      <ZaptroAiDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        initialMessage={aiInitialMessage}
        onInitialMessageConsumed={() => setAiInitialMessage('')}
      />
    </div>
  );
};

export default ZaptroAppShell;

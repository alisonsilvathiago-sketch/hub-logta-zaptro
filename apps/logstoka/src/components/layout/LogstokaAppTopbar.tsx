import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  ChevronRight,
  HelpCircle,
  LogOut,
  Settings,
  Sparkles,
  Users,
  Webhook,
} from 'lucide-react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { resolveMarketplaceHubSlug } from '@/lib/marketplaceHub';
import { MARKETPLACE_LABELS } from '@/types';
import { settingsSectionLabel } from '@/modules/settings/settingsNav';
import TopbarIntegrationStrip from './TopbarIntegrationStrip';

function resolveCrumbs(pathname: string): { strong: string; muted: string } {
  const hubSlug = pathname.replace(/^\/app\/?/, '').split('/')[0] ?? '';
  const hubMp = hubSlug ? resolveMarketplaceHubSlug(hubSlug) : null;
  if (hubMp) {
    return { strong: MARKETPLACE_LABELS[hubMp], muted: 'Interação · Dashboard WMS' };
  }
  if (pathname === '/app' || pathname === '/app/') {
    return { strong: 'LogStoka IA', muted: 'Pergunte sobre o estoque' };
  }
  if (pathname.startsWith('/app/integrations')) {
    return { strong: 'Integrações', muted: 'Central multicanal · OAuth & sync' };
  }
  if (pathname.startsWith('/app/configuracoes')) {
    return { strong: 'Configurações', muted: settingsSectionLabel(pathname) };
  }
  if (pathname.startsWith('/app/dashboard')) return { strong: 'Dashboard', muted: 'Operação WMS' };
  if (pathname.startsWith('/app/products')) return { strong: 'Produtos', muted: 'Catálogo & SKUs' };
  if (pathname.startsWith('/app/warehouses')) return { strong: 'Depósitos', muted: 'CD & Full' };
  if (pathname.startsWith('/app/movements')) return { strong: 'Movimentações', muted: 'Entradas & saídas' };
  if (pathname.startsWith('/app/inventory')) return { strong: 'Inventário', muted: 'Contagens' };
  if (pathname.startsWith('/app/reports')) return { strong: 'Relatórios', muted: 'Análises' };
  if (pathname.startsWith('/app/configuracoes/notificacoes')) {
    return { strong: 'Configurações', muted: pathname.includes('/notificacoes/') ? 'Notificações · Alerta' : 'Notificações' };
  }
  if (pathname.startsWith('/app/alerts')) return { strong: 'Configurações', muted: 'Notificações · Alertas' };
  return { strong: 'LogStoka', muted: 'WMS multicanal' };
}

type Props = {
  onOpenAi?: () => void;
  onSignOut?: () => void;
};

const LogstokaAppTopbar: React.FC<Props> = ({ onOpenAi, onSignOut }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const crumbs = useMemo(() => resolveCrumbs(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const initials =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ||
    profile?.email?.trim()?.[0]?.toUpperCase() ||
    'L';

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open || !ref.current) return;
      if (e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <header className="lsdash-topbar">
      <div className="lsdash-topbar-left">
        <div className="lsdash-crumbs">
          <span className="lsdash-crumb-strong">{crumbs.strong}</span>
          <ChevronRight size={14} strokeWidth={2} className="text-gray-300" />
          <span className="lsdash-crumb-muted">{crumbs.muted}</span>
        </div>
      </div>

      <div className="lsdash-topbar-right">
        <TopbarIntegrationStrip />

        <div className="lsdash-topbar-actions">
        <NavLink
          to={LOGSTOKA_ROUTES.ALERTS}
          className={({ isActive }) => `lsdash-icon-btn lsdash-icon-btn--notify${isActive ? ' active' : ''}`}
          title="Alertas"
        >
          <Bell size={18} strokeWidth={2} />
          <span className="lsdash-notify-dot" aria-hidden />
        </NavLink>
        <button type="button" className="lsdash-icon-btn" title="Ajuda">
          <HelpCircle size={18} strokeWidth={2} />
        </button>
        <span className="lsdash-pill lsdash-pill--ok">ATIVO</span>
        <button
          type="button"
          className="lsdash-icon-btn active"
          title="IA operacional"
          onClick={() => onOpenAi?.()}
        >
          <Sparkles size={18} strokeWidth={2} />
        </button>

        <div className="lsdash-profile-wrap" ref={ref}>
          <button
            type="button"
            className="lsdash-avatar-btn"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            title="Conta"
          >
            <span className="lsdash-avatar-fallback">{initials}</span>
          </button>

          {open ? (
            <div className="lsdash-menu" role="menu" aria-label="Conta">
              <button type="button" className="lsdash-menu-hero" onClick={() => go(LOGSTOKA_ROUTES.SETTINGS_PROFILE)}>
                <span className="lsdash-menu-avatar">{initials}</span>
                <span className="lsdash-menu-hero-text">
                  <strong>Meu perfil</strong>
                  <em>{profile?.email || '—'}</em>
                </span>
              </button>

              <div className="lsdash-menu-items">
                <button type="button" role="menuitem" onClick={() => go(LOGSTOKA_ROUTES.SETTINGS_COMPANY)}>
                  <Building2 size={18} strokeWidth={2.2} />
                  Empresa
                </button>
                <button type="button" role="menuitem" onClick={() => go(LOGSTOKA_ROUTES.SETTINGS_TEAM)}>
                  <Users size={18} strokeWidth={2.2} />
                  Equipe
                </button>
                <button type="button" role="menuitem" onClick={() => go(`${LOGSTOKA_ROUTES.SETTINGS_AUDIT}?tab=interacoes`)}>
                  <Webhook size={18} strokeWidth={2.2} />
                  Interações
                </button>
                <button type="button" role="menuitem" onClick={() => go(LOGSTOKA_ROUTES.SETTINGS)}>
                  <Settings size={18} strokeWidth={2.2} />
                  Configurações
                </button>
              </div>

              <div className="lsdash-menu-sep" />
              <button
                type="button"
                className="lsdash-menu-link--logout"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSignOut?.();
                }}
              >
                <LogOut size={18} strokeWidth={2.2} />
                Sair
              </button>
            </div>
          ) : null}
        </div>
        </div>
      </div>
    </header>
  );
};

export default LogstokaAppTopbar;

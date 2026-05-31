import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  ChevronRight,
  HelpCircle,
  LogOut,
  RefreshCw,
  Settings,
  Sparkles,
  Users,
  Webhook,
} from 'lucide-react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import { useLogstokaTheme } from '@/context/LogstokaThemeContext';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { resolveMarketplaceHubSlug } from '@/lib/marketplaceHub';
import { MARKETPLACE_LABELS } from '@/types';
import { settingsSectionLabel } from '@/modules/settings/settingsNav';
import InicioMegaMenu from './InicioMegaMenu';
import LogstokaDataModeBadge from './LogstokaDataModeBadge';
import LogstokaStoreSwitcher from './LogstokaStoreSwitcher';
import LogstokaTopbarNotify from './LogstokaTopbarNotify';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';
import { formatReleaseLabel, pulseLogstokaSystem } from '@/lib/logstokaSystemPulse';
import { toast } from 'react-hot-toast';

function resolveCrumbs(pathname: string): { strong: string; muted: string } {
  const hubSlug = pathname.replace(/^\/app\/?/, '').split('/')[0] ?? '';
  const hubMp = hubSlug ? resolveMarketplaceHubSlug(hubSlug) : null;
  if (hubMp) {
    return { strong: MARKETPLACE_LABELS[hubMp], muted: 'Interação · Dashboard WMS' };
  }
  if (pathname === '/app' || pathname === '/app/') {
    return { strong: 'Início', muted: 'Visão geral da operação' };
  }
  if (pathname.startsWith('/app/integrations')) {
    return { strong: 'Integrações', muted: 'Central multicanal · OAuth & sync' };
  }
  if (pathname.startsWith('/app/configuracoes')) {
    return { strong: 'Configurações', muted: settingsSectionLabel(pathname) };
  }
  if (pathname.startsWith('/app/atividades')) {
    return { strong: 'Central de Atividades', muted: 'Linha do tempo operacional' };
  }
  if (pathname.startsWith('/app/marketplace')) {
    return { strong: 'Marketplace', muted: 'Central de canais · Publicação & sync' };
  }
  if (pathname.startsWith('/app/operacao')) {
    return { strong: 'Operação', muted: 'Centro operacional WMS' };
  }
  if (pathname.startsWith('/app/vendas')) return { strong: 'Vendas', muted: 'Pedidos · Canais · Estados' };
  if (pathname.startsWith('/app/products')) return { strong: 'Produtos', muted: 'Catálogo & SKUs' };
  if (pathname.startsWith('/app/warehouses')) return { strong: 'Depósitos', muted: 'CD & Full' };
  if (pathname.startsWith('/app/movements')) return { strong: 'Movimentações', muted: 'Entradas & saídas' };
  if (pathname.startsWith('/app/picking')) return { strong: 'Expedição', muted: 'Conferência do dia · separados hoje' };
  if (pathname.startsWith('/app/conference')) return { strong: 'Conferência', muted: 'Centro por canal' };
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
  const { branding } = useLogstokaBranding();
  const { isDark, toggleTheme } = useLogstokaTheme();
  const isInicioHome = pathname === '/app' || pathname === '/app/';
  const hubSlug = pathname.replace(/^\/app\/?/, '').split('/')[0] ?? '';
  const hubMp = hubSlug ? resolveMarketplaceHubSlug(hubSlug) : null;
  const showMegaNav = !hubMp;
  const crumbs = useMemo(() => resolveCrumbs(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const initials =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ||
    profile?.email?.trim()?.[0]?.toUpperCase() ||
    'L';

  const displayName = profile?.full_name?.trim() || 'Operador';

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

  const syncSystem = () => {
    if (syncing) return;
    setSyncing(true);
    const { release } = pulseLogstokaSystem();
    toast.success(`Sistema atualizado · build ${formatReleaseLabel(release)}`, { duration: 3500 });
    window.setTimeout(() => setSyncing(false), 800);
  };

  const hardSyncSystem = () => {
    pulseLogstokaSystem({ hardReload: true });
  };

  return (
    <header
      className={`lsdash-topbar${showMegaNav ? ' lsdash-topbar--mega-nav' : ''}${isInicioHome ? ' lsdash-topbar--inicio-home' : ''}`}
    >
      <div className={`lsdash-topbar-left${showMegaNav ? ' lsdash-topbar-left--mega' : ''}`}>
        {showMegaNav ? (
          <>
            <Link to={LOGSTOKA_ROUTES.HOME} className="lsdash-topbar-brand" aria-label="LogStoka início">
              <img
                src={branding.logoUrl || '/logstoka-mark.svg'}
                alt="LogStoka"
                className="lsdash-topbar-brand-logo-img"
              />
              <span className="lsdash-topbar-brand-text">{branding.companyName || 'LogStoka'}</span>
            </Link>
            <InicioMegaMenu onOpenAi={onOpenAi} />
          </>
        ) : (
          <div className="lsdash-crumbs">
            <span className="lsdash-crumb-strong">{crumbs.strong}</span>
            <ChevronRight size={14} strokeWidth={2} className="text-gray-300" />
            <LogstokaStoreSwitcher />
            <ChevronRight size={14} strokeWidth={2} className="text-gray-300" />
            <span className="lsdash-crumb-muted">{crumbs.muted}</span>
          </div>
        )}
      </div>

      <div className="lsdash-topbar-right">
        <div className="lsdash-topbar-actions">
          <LogstokaIconTooltip label="Atualizar sistema (sync)">
            <button
              type="button"
              className={`lsdash-icon-btn${syncing ? ' active' : ''}`}
              aria-label="Atualizar sistema"
              disabled={syncing}
              onClick={syncSystem}
            >
              <RefreshCw size={18} strokeWidth={2} className={syncing ? 'animate-spin' : undefined} />
            </button>
          </LogstokaIconTooltip>
          <LogstokaTopbarNotify />
          <LogstokaIconTooltip label="Central de Atividades">
            <Link
              to={LOGSTOKA_ROUTES.ACTIVITY_CENTER}
              className={`lsdash-icon-btn${pathname.startsWith('/app/atividades') ? ' active' : ''}`}
              aria-label="Central de Atividades"
            >
              <CalendarDays size={18} strokeWidth={2} />
            </Link>
          </LogstokaIconTooltip>
          <LogstokaIconTooltip label="Ajuda">
            <button type="button" className="lsdash-icon-btn" aria-label="Ajuda">
              <HelpCircle size={18} strokeWidth={2} />
            </button>
          </LogstokaIconTooltip>
          {!isInicioHome ? <LogstokaDataModeBadge /> : null}
          <LogstokaIconTooltip label="Assistente IA Global">
            <button
              type="button"
              className="lsdash-icon-btn active"
              aria-label="Assistente IA Global"
              onClick={() => onOpenAi?.()}
            >
              <Sparkles size={18} strokeWidth={2} />
            </button>
          </LogstokaIconTooltip>

          <div className="lsdash-profile-wrap" ref={ref}>
            <button
              type="button"
              className="lsdash-avatar-btn"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              title="Conta"
            >
              {isInicioHome ? (
                <span className="lsdash-topbar-inicio-profile">
                  <span className="lsdash-avatar-fallback">{initials}</span>
                  <span>
                    <strong>{displayName}</strong>
                    <em>{profile?.email || '—'}</em>
                  </span>
                </span>
              ) : (
                <span className="lsdash-avatar-fallback">{initials}</span>
              )}
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
                  <button type="button" role="menuitem" onClick={syncSystem}>
                    <RefreshCw size={18} strokeWidth={2.2} />
                    Sincronizar telas
                  </button>
                  <button type="button" role="menuitem" onClick={hardSyncSystem}>
                    <RefreshCw size={18} strokeWidth={2.2} />
                    Recarregar app (hard)
                  </button>
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

                <div className="lsdash-menu-theme">
                  <span>Tema escuro</span>
                  <button
                    type="button"
                    className="ls-theme-switch"
                    role="switch"
                    aria-checked={isDark}
                    aria-label="Alternar tema escuro"
                    onClick={toggleTheme}
                  >
                    <span className="ls-theme-switch__thumb" />
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

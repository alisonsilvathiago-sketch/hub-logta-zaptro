import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarClock,
  ChevronRight,
  CreditCard,
  Sparkles,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ZAPTRO_APP_ROUTES } from './zaptroAppRoutes';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { isZaptroLocalhost } from '../lib/appOrigin';

function resolveCrumbs(pathname: string, search: string): { strong: string; muted: string } {
  if (pathname === '/app') return { strong: 'Zaptro AI', muted: 'Pergunte que eu te guio' };
  if (pathname.startsWith('/app/resultados')) return { strong: 'Resultados', muted: 'Performance & Resultados' };
  if (pathname.startsWith('/app/listas-transmissao')) {
    return { strong: 'Listas de Transmissão', muted: 'Envio em massa' };
  }
  if (pathname.startsWith('/app/conversas')) return { strong: 'Conversas', muted: 'Caixa de Entrada' };
  if (pathname.startsWith('/app/clientes')) return { strong: 'Clientes', muted: 'Contatos ativos' };
  if (pathname.startsWith('/app/contatos')) return { strong: 'Contatos', muted: 'Clientes & Base' };
  if (pathname.startsWith('/app/crm')) return { strong: 'CRM', muted: 'Pipeline Comercial' };
  if (pathname.startsWith('/app/agenda')) return { strong: 'Agenda', muted: 'Timeline do CRM' };
  if (pathname.startsWith('/app/orcamentos')) return { strong: 'Orçamentos', muted: 'Propostas & Frete' };
  if (pathname.startsWith('/app/rotas')) return { strong: 'Rotas', muted: 'Central Logística' };
  if (pathname.startsWith('/app/motoristas/frota')) return { strong: 'Frota', muted: 'Veículos & ativos' };
  if (pathname.startsWith('/app/motoristas')) return { strong: 'Motoristas', muted: 'Frota de Campo' };
  if (pathname.startsWith('/app/logistica')) return { strong: 'Logística', muted: 'Operação' };
  if (pathname.startsWith('/app/arquivos')) return { strong: 'Arquivos', muted: 'Documentos' };
  if (pathname.startsWith('/app/configuracoes')) {
    const tab = new URLSearchParams(search).get('tab');
    if (!tab || tab === 'config') {
      return { strong: 'WhatsApp', muted: 'Ligar & QR Code' };
    }
    return { strong: 'Ajustes', muted: 'Configurações' };
  }
  if (pathname.startsWith('/app/perfil')) return { strong: 'Conta', muted: 'Meu perfil' };
  return { strong: 'Zaptro', muted: 'Área interna' };
}

const ZaptroAppTopbar: React.FC<{ onOpenAi?: () => void }> = ({ onOpenAi }) => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const crumbs = useMemo(() => resolveCrumbs(pathname, search), [pathname, search]);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const avatarUrl = profile?.avatar_url?.trim() || null;
  const initials =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ||
    profile?.email?.trim()?.[0]?.toUpperCase() ||
    'U';

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const doSignOut = async () => {
    setOpen(false);
    await supabaseZaptro.auth.signOut();
    navigate(ZAPTRO_APP_ROUTES.LOGIN, { replace: true });
  };

  return (
    <header className="zapdash-topbar">
      <div className="zapdash-crumbs">
        <span className="zapdash-crumb-strong">{crumbs.strong}</span>
        <ChevronRight size={14} strokeWidth={2} />
        <span className="zapdash-crumb-muted">{crumbs.muted}</span>
      </div>

      <div className="zapdash-topbar-actions">
        <NavLink
          to={ZAPTRO_APP_ROUTES.AGENDA}
          className={({ isActive }) => `zapdash-icon-btn zapdash-icon-btn--link${isActive ? ' active' : ''}`}
          title="Agenda"
        >
          <CalendarClock size={18} strokeWidth={2} />
        </NavLink>
        <NavLink
          to={ZAPTRO_APP_ROUTES.INBOX}
          className={({ isActive }) =>
            `zapdash-icon-btn zapdash-icon-btn--link zapdash-icon-btn--inbox${isActive ? ' active' : ''}`
          }
          title="Conversas"
        >
          <Zap size={18} strokeWidth={2.2} />
        </NavLink>
        <button type="button" className="zapdash-icon-btn" title="Notificações">
          <Bell size={18} strokeWidth={2} />
        </button>
        <span className="zapdash-pill zapdash-pill--ok">ATIVO</span>
        <button
          type="button"
          className="zapdash-icon-btn zapdash-ai-btn"
          title="IA"
          aria-haspopup="dialog"
          onClick={() => onOpenAi?.()}
        >
          <Sparkles size={18} strokeWidth={2} />
        </button>

        <div className="zapdash-profile" ref={ref}>
          <button
            type="button"
            className="zapdash-avatar-btn"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            title="Conta"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="zapdash-avatar-img" />
            ) : (
              <span className="zapdash-avatar-fallback">{initials}</span>
            )}
          </button>

          {open ? (
            <div className="zapdash-menu" role="menu" aria-label="Conta">
              <button type="button" className="zapdash-menu-hero" onClick={() => go(ZAPTRO_APP_ROUTES.PROFILE)}>
                <span className="zapdash-menu-avatar">
                  {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
                </span>
                <span className="zapdash-menu-hero-text">
                  <strong>Meu perfil</strong>
                  <em>{profile?.email || '—'}</em>
                </span>
              </button>

              <div className="zapdash-menu-items">
                <button type="button" role="menuitem" onClick={() => go(ZAPTRO_APP_ROUTES.SETTINGS)}>
                  <CreditCard size={18} strokeWidth={2.2} />
                  Meu plano
                </button>
                <button type="button" role="menuitem" onClick={() => go(ZAPTRO_APP_ROUTES.COMPANY)}>
                  <Building2 size={18} strokeWidth={2.2} />
                  Minha Empresa
                </button>
                <button type="button" role="menuitem" onClick={() => go(ZAPTRO_APP_ROUTES.TEAM('members'))}>
                  <Users size={18} strokeWidth={2.2} />
                  Membros
                </button>
                <button type="button" role="menuitem" onClick={() => go(ZAPTRO_APP_ROUTES.TEAM('ranking'))}>
                  <Trophy size={18} strokeWidth={2.2} />
                  Ranking
                </button>
                <button type="button" role="menuitem" onClick={() => go(ZAPTRO_APP_ROUTES.TEAM('permissions'))}>
                  <ShieldCheck size={18} strokeWidth={2.2} />
                  Acessos
                </button>
                <button type="button" role="menuitem" onClick={() => go(ZAPTRO_APP_ROUTES.SETTINGS)}>
                  <Settings size={18} strokeWidth={2.2} />
                  Configurações
                </button>
                <button type="button" role="menuitem" onClick={() => go(ZAPTRO_APP_ROUTES.SETTINGS)}>
                  <LayoutDashboard size={18} strokeWidth={2.2} />
                  Integrações
                </button>
              </div>

              {isZaptroLocalhost() ? (
                <>
                  <div className="zapdash-menu-sep" />
                  <button
                    type="button"
                    className="zapdash-menu-link zapdash-menu-link--hub"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      window.location.href = 'http://localhost:5175/master';
                    }}
                  >
                    <LayoutDashboard size={18} strokeWidth={2.2} />
                    Painel Master (Hub)
                  </button>
                </>
              ) : null}

              <div className="zapdash-menu-sep" />
              <button
                type="button"
                className="zapdash-menu-link zapdash-menu-link--logout"
                role="menuitem"
                onClick={() => void doSignOut()}
              >
                <LogOut size={18} strokeWidth={2.2} />
                Sair
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default ZaptroAppTopbar;

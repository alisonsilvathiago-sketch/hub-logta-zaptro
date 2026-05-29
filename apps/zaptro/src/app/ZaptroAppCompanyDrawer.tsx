import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Building2,
  ChevronRight,
  Eye,
  HelpCircle,
  Keyboard,
  Lightbulb,
  LogOut,
  MessageSquare,
  Search,
  Shield,
  Store,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { ZAPTRO_APP_ROUTES } from './zaptroAppRoutes';
import { useZaptroCompanyBusinessProfile } from '../hooks/useZaptroCompanyBusinessProfile';
import {
  ZaptroCompanyProfileAvatar,
  ZaptroCompanyProfileForm,
  ZaptroCompanyProfilePreview,
  ZaptroCompanyNotifSettings,
} from '../components/Zaptro/ZaptroCompanyProfileSections';
import './zaptroAppCompanyDrawer.css';

type DrawerScreen =
  | 'home'
  | 'profile'
  | 'preview'
  | 'notifications'
  | 'account'
  | 'shortcuts'
  | 'help';

const SCREEN_TITLES: Record<DrawerScreen, string> = {
  home: '',
  profile: 'Perfil comercial',
  preview: 'Como clientes veem',
  notifications: 'Notificações',
  account: 'Conta',
  shortcuts: 'Atalhos do teclado',
  help: 'Ajuda e feedback',
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const ZaptroAppCompanyDrawer: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const api = useZaptroCompanyBusinessProfile({ syncActive: open });

  const [screen, setScreen] = useState<DrawerScreen>('home');
  const [search, setSearch] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScreen('home');
    setSearch('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const { displayName, waAccountLabel, waProfileSyncing } = api;

  const menuItems = useMemo(
    () => [
      {
        id: 'profile' as const,
        icon: Store,
        title: 'Perfil comercial',
        subtitle: 'Nome, foto, segmento, endereço e horários',
      },
      {
        id: 'preview' as const,
        icon: Eye,
        title: 'Como clientes veem',
        subtitle: 'Prévia do perfil ao clicar na sua foto no WhatsApp',
      },
      {
        id: 'notifications' as const,
        icon: Bell,
        title: 'Notificações',
        subtitle: 'Mensagens, grupos e alertas sonoros',
      },
      {
        id: 'account' as const,
        icon: Shield,
        title: 'Conta',
        subtitle: 'Segurança e dados da organização',
      },
      {
        id: 'shortcuts' as const,
        icon: Keyboard,
        title: 'Atalhos do teclado',
        subtitle: 'Ações rápidas',
      },
      {
        id: 'help' as const,
        icon: HelpCircle,
        title: 'Ajuda e feedback',
        subtitle: 'Suporte e políticas',
      },
    ],
    [],
  );

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter(
      (m) => m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q),
    );
  }, [menuItems, search]);

  const goScreen = (id: DrawerScreen) => setScreen(id);
  const goBack = () => setScreen('home');

  const handleSignOut = async () => {
    onClose();
    await supabaseZaptro.auth.signOut();
    navigate(ZAPTRO_APP_ROUTES.LOGIN, { replace: true });
  };

  const renderHome = () => (
    <div className="zaptro-company-drawer-pad">
      <div className="zaptro-company-drawer-search">
        <Search size={16} color="#949494" />
        <input
          type="search"
          placeholder="Pesquisar configurações"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!bannerDismissed ? (
        <div className="zaptro-company-drawer-banner">
          <Lightbulb size={20} color="#d9ff00" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>Complete seu perfil comercial</strong>
            <p>
              Telefone, endereço, segmento e horário aparecem quando o cliente clica na sua foto na conversa.
            </p>
            <button type="button" className="zaptro-company-drawer-link" onClick={() => goScreen('profile')}>
              Configurar agora
            </button>
          </div>
          <button
            type="button"
            className="zaptro-company-drawer-close-x"
            aria-label="Fechar aviso"
            onClick={() => setBannerDismissed(true)}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <div className="zaptro-company-drawer-hero">
        <ZaptroCompanyProfileAvatar api={api} onPick={() => goScreen('profile')} />
        <div className="zaptro-company-drawer-hero-text">
          <h2 className="zaptro-company-drawer-hero-name">{displayName || 'Sua empresa'}</h2>
          <p className="zaptro-company-drawer-hero-sub">
            Perfil comercial • {waAccountLabel}
            {waProfileSyncing ? ' • sincronizando…' : ''}
          </p>
        </div>
      </div>

      <nav className="zaptro-company-drawer-menu" aria-label="Configurações da empresa">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="zaptro-company-drawer-item"
              onClick={() => goScreen(item.id)}
            >
              <span className="zaptro-company-drawer-item-ico">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="zaptro-company-drawer-item-text">
                <strong>{item.title}</strong>
                <em>{item.subtitle}</em>
              </span>
              <ChevronRight className="zaptro-company-drawer-item-chev" size={18} />
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className="zaptro-company-drawer-link"
        style={{ marginTop: 8 }}
        onClick={() => {
          onClose();
          navigate(`${ZAPTRO_APP_ROUTES.PROFILE}?tab=company`);
        }}
      >
        Abrir tudo em Meu Perfil
      </button>
    </div>
  );

  const renderAccount = () => (
    <div className="zaptro-company-drawer-sub">
      <button type="button" className="zaptro-company-drawer-link-row">
        <span>
          <strong>Notificações de segurança</strong>
        </span>
        <ChevronRight size={18} color="#949494" />
      </button>
      <button type="button" className="zaptro-company-drawer-link-row">
        <span>
          <strong>Dados da organização</strong>
        </span>
        <ChevronRight size={18} color="#949494" />
      </button>
      <button
        type="button"
        className="zaptro-company-drawer-link"
        onClick={() => {
          onClose();
          navigate(ZAPTRO_APP_ROUTES.COMPANY);
        }}
      >
        Abrir Minha Empresa
      </button>
    </div>
  );

  const renderShortcuts = () => (
    <div className="zaptro-company-drawer-sub">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', fontSize: 13 }}>
        {[
          ['Nova conversa', '⌘ N'],
          ['Pesquisar', '⌘ F'],
          ['Conversas', '⌘ ⇧ C'],
          ['Configurações', '⌘ ,'],
        ].map(([label, keys]) => (
          <div key={label}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{label}</div>
            <div style={{ color: '#949494', fontWeight: 650 }}>{keys}</div>
          </div>
        ))}
      </div>
      <button type="button" className="zaptro-company-drawer-save" style={{ marginTop: 20 }} onClick={goBack}>
        OK
      </button>
    </div>
  );

  const renderHelp = () => (
    <div className="zaptro-company-drawer-sub">
      {[
        { icon: HelpCircle, title: 'Central de ajuda', sub: 'Perguntas frequentes' },
        { icon: MessageSquare, title: 'Fale conosco', sub: 'Suporte Zaptro' },
      ].map((row) => {
        const Icon = row.icon;
        return (
          <button key={row.title} type="button" className="zaptro-company-drawer-item">
            <span className="zaptro-company-drawer-item-ico">
              <Icon size={20} />
            </span>
            <span className="zaptro-company-drawer-item-text">
              <strong>{row.title}</strong>
              <em>{row.sub}</em>
            </span>
          </button>
        );
      })}
    </div>
  );

  const body =
    screen === 'home'
      ? renderHome()
      : screen === 'profile'
        ? (
            <ZaptroCompanyProfileForm
              api={api}
              onOpenPreview={() => goScreen('preview')}
              onCloseDrawer={onClose}
            />
          )
        : screen === 'preview'
          ? <ZaptroCompanyProfilePreview api={api} onEdit={() => goScreen('profile')} />
          : screen === 'notifications'
            ? <ZaptroCompanyNotifSettings api={api} />
            : screen === 'account'
              ? renderAccount()
              : screen === 'shortcuts'
                ? renderShortcuts()
                : renderHelp();

  if (!open) return null;

  return (
    <aside
      className="zaptro-company-drawer-panel is-open"
      role="dialog"
      aria-modal="true"
      aria-label={screen === 'home' ? 'Perfil da empresa' : SCREEN_TITLES[screen]}
    >
      <header className="zaptro-company-drawer-head">
        {screen !== 'home' ? (
          <button type="button" className="zaptro-company-drawer-back" onClick={goBack} aria-label="Voltar">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <button type="button" className="zaptro-company-drawer-back" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        )}
        <h2>{screen === 'home' ? 'Perfil da empresa' : SCREEN_TITLES[screen]}</h2>
      </header>

      <div className="zaptro-company-drawer-scroll">{body}</div>

      {screen === 'home' ? (
        <footer className="zaptro-company-drawer-foot">
          <button type="button" className="zaptro-company-drawer-logout" onClick={() => void handleSignOut()}>
            <LogOut size={18} />
            Desconectar
          </button>
        </footer>
      ) : null}
    </aside>
  );
};

export default ZaptroAppCompanyDrawer;

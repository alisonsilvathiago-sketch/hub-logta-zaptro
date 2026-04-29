import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Users,
  User,
  MessageSquare,
  History,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
  Zap,
  CreditCard,
  LayoutDashboard,
  Kanban,
  FileSpreadsheet,
  Truck,
  HelpCircle,
  Clock,
  X,
  Bell,
  Moon,
  Sun,
  Palette,
  ChevronDown,
  Navigation,
  Plus,
  TrendingUp,
  LayoutGrid,
  MapPin,
  Building2,
  FileText,
  BarChart3,
  Car,
  Trophy,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import { ZAPTRO_ROUTES } from '../../constants/zaptroRoutes';
import { ZAPTRO_SHADOW } from '../../constants/zaptroShadows';
import { zaptroCardSurfaceStyle } from '../../constants/zaptroCardSurface';
import { ZAPTRO_FIELD_BG, ZAPTRO_SECTION_BORDER, ZAPTRO_SOFT_NEUTRAL_MUTED } from '../../constants/zaptroUi';
import { ZaptroThemeProvider, useZaptroTheme } from '../../context/ZaptroThemeContext';
import { hasZaptroGranularPermission, isZaptroTenantAdminRole } from '../../utils/zaptroPermissions';
import { zaptroMenuPathToPageId } from '../../utils/zaptroPagePermissionMap';
import { isZaptroBrandingEntitledByPlan } from '../../utils/zaptroBrandingEntitlement';
import { resolveMemberAvatarUrl, resolveSessionAvatarUrl } from '../../utils/zaptroAvatar';
import { isZaptroAccessEnabled } from '../../utils/zaptroSubscription';
import { getZaptroPlanVerifiedTier } from '../../utils/zaptroPlanVerifiedSeal';
import ZaptroPlanGateModal from './ZaptroPlanGateModal';
import { ZaptroPlanVerifiedSealBubble } from './ZaptroPlanVerifiedSealBubble';
import { WhatsAppActivationModal } from './WhatsAppActivationModal';
import { playWaIncomingMessageSound, showWaDesktopNotificationIfAllowed } from '../../lib/zaptroWaMessageNotifications';
import NotificationCenter from '../NotificationCenter';

import { getContext, isZaptroProductPath } from '../../utils/domains';

interface ZaptroLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
  hideTopbar?: boolean;
  /** Esconde só o `<header>` de desktop; o header móvel (menu / logo) mantém-se. */
  hideDesktopTopbar?: boolean;
  /** Coluna principal sem cap 1320px (ex.: Kanban em `/comercial`). */
  contentFullWidth?: boolean;
  /** Conteúdo opcional como primeiro filho de `.zaptro-scroll-area` (acima do wrapper da página). */
  scrollAreaTop?: React.ReactNode;
  breadcrumb?: string;
}

type MenuEntry = {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  path: string;
  adminOnly?: boolean;
};

type TeamPresenceRow = { id: string; full_name: string | null; avatar_url?: string | null };

/** Marca Zaptro: fundo preto + raio lima (favicon / header / rail). */
function ZaptroBrandMark({ size = 36 }: { size?: number }) {
  const iconSize = Math.max(14, Math.round(size * 0.52));
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(8, Math.round(size * 0.24)),
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <Zap
        size={iconSize}
        color="rgba(217, 255, 0, 1)"
        strokeWidth={2}
        fill="rgba(217, 255, 0, 1)"
        style={{ filter: 'drop-shadow(0 0 8px rgba(217, 255, 0, 0.32))' }}
      />
    </div>
  );
}

/** Só quem está online — fila fixa no topbar, avatares sobrepostos, sem scroll. */
function SidebarTeamPresence({
  companyId,
  selfId,
  sessionProfile,
  onlineUserIds,
  /** Cor de fundo por trás do indicador de estado (ex.: `palette.topbarBg`). */
  ringBg,
  maxAvatars = 32,
}: {
  companyId?: string | null;
  selfId?: string | null;
  sessionProfile: { id: string; avatar_url?: string | null } | null;
  onlineUserIds: string[];
  ringBg: string;
  maxAvatars?: number;
}) {
  const [members, setMembers] = useState<TeamPresenceRow[]>([]);

  const load = useCallback(async () => {
    if (!companyId) {
      setMembers([]);
      return;
    }
    const { data, error } = await supabaseZaptro
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('company_id', companyId)
      .order('full_name', { ascending: true })
      .limit(48);
    if (error) {
      setMembers([]);
      return;
    }
    setMembers((data as TeamPresenceRow[]) || []);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isOnline = (id: string) => id === selfId || onlineUserIds.includes(id);

  if (!companyId || members.length === 0) return null;

  const onlineMembers = members.filter((m) => isOnline(m.id)).slice(0, maxAvatars);
  if (onlineMembers.length === 0) return null;

  const n = onlineMembers.length;
  const overlap = n > 14 ? 12 : n > 10 ? 10 : n > 6 ? 9 : 8;
  const size = n > 16 ? 26 : n > 12 ? 28 : n > 8 ? 30 : 32;
  const dotSize = n > 16 ? 7 : 8;

  const dotStyle = (): React.CSSProperties => ({
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: dotSize,
    height: dotSize,
    borderRadius: '50%',
    backgroundColor: 'rgba(75, 231, 8, 1)',
    border: `1.5px solid ${ringBg}`,
    boxSizing: 'border-box',
    pointerEvents: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  });

  return (
    <div
      role="group"
      aria-label="Equipa online"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        minWidth: 0,
        overflow: 'visible',
        paddingTop: 0,
        paddingBottom: 0,
      }}
    >
      {onlineMembers.map((m, i) => {
        const av = resolveMemberAvatarUrl(m, selfId, sessionProfile);
        const displayName = m.full_name?.trim() || 'Usuário';
        const tip = `${displayName} — online`;
        return (
          <div
            key={m.id}
            title={tip}
            style={{
              position: 'relative',
              width: size,
              height: size,
              marginLeft: i === 0 ? 0 : 4,
              zIndex: n - i,
              flexShrink: 0,
            }}
          >
            {av ? (
              <img
                src={av}
                alt={displayName}
                title={tip}
                style={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                  border: `2px solid ${ringBg}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
            ) : (
              <div
                title={tip}
                style={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  backgroundColor: '#0f172a',
                  color: '#D9FF00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: Math.max(10, Math.round(size * 0.35)),
                  fontWeight: 700,
                  border: `2px solid ${ringBg}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                {(m.full_name || '?')[0].toUpperCase()}
              </div>
            )}
            <span style={dotStyle()} aria-hidden />
          </div>
        );
      })}
    </div>
  );
}

function canAccessZaptroRoutesPage(
  role: string | null | undefined,
  permissions: string[] | null | undefined,
  isMaster: boolean
): boolean {
  if (isMaster || isZaptroTenantAdminRole(role)) return true;
  return (
    hasZaptroGranularPermission(role, permissions, 'rotas') ||
    hasZaptroGranularPermission(role, permissions, 'crm') ||
    hasZaptroGranularPermission(role, permissions, 'motoristas')
  );
}

function canAccessZaptroMapPage(
  role: string | null | undefined,
  permissions: string[] | null | undefined,
  isMaster: boolean
): boolean {
  if (isMaster || isZaptroTenantAdminRole(role)) return true;
  return (
    hasZaptroGranularPermission(role, permissions, 'mapa') ||
    hasZaptroGranularPermission(role, permissions, 'rotas') ||
    hasZaptroGranularPermission(role, permissions, 'crm') ||
    hasZaptroGranularPermission(role, permissions, 'operacoes')
  );
}

function roleBadgeLabel(role?: string): string {
  if (!role) return 'USER';
  if (role === 'ADMIN') return 'ADM';
  if (role.startsWith('MASTER')) return 'MST';
  if (role.length <= 6) return role;
  return `${role.slice(0, 5)}…`;
}

const ZaptroLayoutChrome: React.FC<ZaptroLayoutProps> = ({
  children,
  hideSidebar = false,
  hideTopbar = false,
  hideDesktopTopbar = false,
  contentFullWidth = false,
  scrollAreaTop,
  breadcrumb,
}) => {
  const { signOut, profile, onlineUsers, user, refreshProfile, isMaster, stopImpersonating } = useAuth();
  const { company, isLoading: tenantLoading, fetchCompanyData } = useTenant();
  
  const isImpersonating = !!localStorage.getItem('hub-impersonate-tenant');
  const [planRechecking, setPlanRechecking] = useState(false);
  const { palette, toggleMode, canCustomizeTenant } = useZaptroTheme();
  




  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [railHover, setRailHover] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

  // --- LÓGICA DE ATIVAÇÃO DO WHATSAPP (Atraso solicitado: 2-5 min) ---
  useEffect(() => {
    console.log('[DEBUG WA] Verificando condições para o pop-up:', {
      dismissed: sessionStorage.getItem('zaptro_wa_activation_dismissed'),
      companyId: company?.id,
      connected: company?.whatsapp_connected
    });

    if (sessionStorage.getItem('zaptro_wa_activation_dismissed') === 'true') {
      console.log('[DEBUG WA] Modal cancelado: Já dispensado nesta sessão.');
      return;
    }
    if (!company?.id) {
      console.log('[DEBUG WA] Modal cancelado: Empresa ainda não carregada.');
      return;
    }
    
    // Se quiser testar mesmo se já estiver conectado, comente a linha abaixo:
    // if (company.whatsapp_connected) return;

    const delayMs = 10000; // 10 segundos para teste rápido
    
    console.log(`[DEBUG WA] Timer iniciado: O pop-up aparecerá em ${delayMs/1000} segundos...`);
    const timer = setTimeout(() => {
      console.log('[DEBUG WA] DISPARANDO MODAL AGORA!');
      setIsActivationModalOpen(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [company?.id, company?.whatsapp_connected]);

  // Listener Global de Mensagens (Notificações Estilo WhatsApp Web)
  useEffect(() => {
    if (!company?.id) return;

    const channel = supabaseZaptro
      .channel(`global_wa_notifs_${company.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `direction=eq.in`, 
        },
        async (payload) => {
          const msg = payload.new;
          
          const { data: conv } = await supabaseZaptro
            .from('whatsapp_conversations')
            .select('sender_name, sender_number, customer_avatar')
            .eq('id', msg.conversation_id)
            .maybeSingle();

          if (conv) {
            playWaIncomingMessageSound();
            showWaDesktopNotificationIfAllowed({
              title: `Nova mensagem — ${conv.sender_name || conv.sender_number}`,
              body: msg.content || 'Mídia recebida',
              senderName: conv.sender_name || conv.sender_number,
              avatarUrl: conv.customer_avatar,
              onClick: () => navigate(ZAPTRO_ROUTES.CHAT)
            });
          }
        }
      )
      .subscribe();

    return () => {
      void supabaseZaptro.removeChannel(channel);
    };
  }, [company?.id, navigate]);

  const handleDismissActivation = () => {
    setIsActivationModalOpen(false);
    if (company?.id) {
      localStorage.setItem(`zaptro_wa_dismissed_${company.id}`, Date.now().toString());
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMenuOpen(false);
      if (mobile) setRailHover(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /** Marca / Conexão WhatsApp: menu do perfil (topo) e `/configuracao` — não duplicar na sidebar. */
  const menuItems = useMemo<MenuEntry[]>(() => {
    const all: MenuEntry[] = [
      { icon: LayoutDashboard, label: 'Início', path: ZAPTRO_ROUTES.DASHBOARD },
      { icon: BarChart3, label: 'Resultados', path: ZAPTRO_ROUTES.RESULTADOS },
      { icon: Kanban, label: 'CRM', path: ZAPTRO_ROUTES.COMMERCIAL_CRM },
      { icon: FileSpreadsheet, label: 'Orçamentos', path: ZAPTRO_ROUTES.COMMERCIAL_QUOTES },
      { icon: Navigation, label: 'Rotas', path: ZAPTRO_ROUTES.ROUTES },
      { icon: Truck, label: 'Motoristas', path: ZAPTRO_ROUTES.DRIVERS },
      { icon: Car, label: 'Frota', path: ZAPTRO_ROUTES.FLEET },
      { icon: MessageSquare, label: 'WhatsApp', path: ZAPTRO_ROUTES.CHAT },
      { icon: Users, label: 'Clientes', path: ZAPTRO_ROUTES.CLIENTS },
      { icon: Settings, label: 'Ajustes', path: `${ZAPTRO_ROUTES.SETTINGS_ALIAS}?tab=config` },
    ];
    if (isMaster || isZaptroTenantAdminRole(profile?.role)) return all;
    return all.filter((item) => {
      if (item.path === ZAPTRO_ROUTES.ROUTES) {
        return canAccessZaptroRoutesPage(profile?.role, profile?.permissions, isMaster);
      }
      const id = zaptroMenuPathToPageId(item.path);
      if (!id) return true;
      return hasZaptroGranularPermission(profile?.role, profile?.permissions, id);
    });
  }, [profile?.role, profile?.permissions, isMaster]);

  /** «Ajustes» fica no rodapé, por cima de «Sair» — não repetir no meio da lista. */
  const sidebarNavItems = useMemo(
    () => menuItems.filter((item) => item.label !== 'Ajustes'),
    [menuItems],
  );
  const sidebarSettingsItem = useMemo(
    () => menuItems.find((item) => item.label === 'Ajustes') ?? null,
    [menuItems],
  );

  /** Rail fixo só com ícones (desktop); ao hover expande à direita (labels); drawer largo no telemóvel. */
  const RAIL_WIDTH = 76;
  const RAIL_WIDTH_EXPANDED = 232;
  const RAIL_MARGIN = 12;
  const RAIL_AFTER_GAP = 20;
  const mainMarginDesktop = hideSidebar ? 0 : RAIL_MARGIN + RAIL_WIDTH + RAIL_AFTER_GAP;
  const railExpandedLabels = isMobile || railHover;

  const railDivider = (key: string) => (
    <div
      key={key}
      aria-hidden
      style={{
        height: 1,
        background: palette.mode === 'dark' ? 'rgba(148,163,184,0.22)' : '#e8e8ea',
        margin: '8px 10px',
        flexShrink: 0,
      }}
    />
  );

  const renderSidebarNavButton = useCallback(
    (item: MenuEntry) => {
      const [pathBase, pathQuery] = item.path.split('?');
      const isActive =
        location.pathname === pathBase &&
        (pathQuery
          ? (() => {
              const want = new URLSearchParams(pathQuery);
              const have = new URLSearchParams(location.search);
              if (pathBase === ZAPTRO_ROUTES.SETTINGS_ALIAS) {
                const wt = want.get('tab') || 'config';
                const ht = have.get('tab') || 'config';
                return wt === ht;
              }
              return [...want].every(([k, v]) => have.get(k) === v);
            })()
          : true);
      const Icon = item.icon;
      const expanded = railExpandedLabels;
      const activeFg =
        isActive && palette.mode === 'light' ? '#000000' : isActive ? palette.text : palette.mode === 'light' ? '#374151' : palette.textMuted;
      return (
        <button
          key={item.path}
          type="button"
          className="zaptro-sidebar-nav-btn"
          title={item.label}
          aria-label={item.label}
          aria-current={isActive ? 'page' : undefined}
          onClick={() => {
            navigate(item.path);
            if (isMobile) setIsMenuOpen(false);
          }}
          style={{
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: expanded ? 14 : 0,
            width: expanded ? '100%' : 44,
            height: expanded ? 'auto' : 44,
            minHeight: expanded ? 48 : 44,
            padding: expanded ? '12px 14px' : 0,
            marginLeft: expanded ? 0 : 'auto',
            marginRight: expanded ? 0 : 'auto',
            borderRadius: 12,
            background: item.label === 'WhatsApp' ? '#000000' : 'unset',
            backgroundColor: item.label === 'WhatsApp' ? '#000000' : isActive ? palette.navActiveBg : 'transparent',
            color: item.label === 'WhatsApp' ? palette.lime : activeFg,
            flexShrink: 0,
            boxSizing: 'border-box',
            transition: 'background-color 0.2s ease, color 0.2s ease',
            boxShadow: item.label === 'WhatsApp' ? '0 4px 12px rgba(217, 255, 0, 0.15)' : 'none',
          }}
        >
          {item.label === 'WhatsApp' ? (
            <Zap 
              size={20} 
              strokeWidth={2.4} 
              fill={palette.lime} 
              color={palette.lime} 
              style={{ filter: 'drop-shadow(0 0 6px rgba(217, 255, 0, 0.4))' }} 
            />
          ) : (
            <Icon size={20} strokeWidth={isActive ? 2.35 : 2} color="currentColor" />
          )}
          {expanded && (
            <span style={{ 
              ...styles.navLabel, 
              color: item.label === 'WhatsApp' ? '#FFFFFF' : 'inherit',
              fontWeight: item.label === 'WhatsApp' ? 900 : 'inherit'
            }}>
              {item.label}
            </span>
          )}
        </button>
      );
    },
    [
      location.pathname,
      location.search,
      navigate,
      palette.mode,
      palette.navActiveBg,
      palette.text,
      palette.textMuted,
      isMobile,
      railExpandedLabels,
    ],
  );

  const toggleMobileMenu = () => setIsMenuOpen(!isMenuOpen);

  const isDark = palette.mode === 'dark';
  const sessionAvatarSrc = useMemo(() => resolveSessionAvatarUrl(profile), [profile]);

  const planVerifiedTier = useMemo(() => getZaptroPlanVerifiedTier(company), [company]);

  const planGateOpen = useMemo(() => {
    // Disabled as requested: remover sobreposição de cobrança
    return false;
  }, []);

  const handlePlanRecheck = async () => {
    setPlanRechecking(true);
    try {
      await refreshProfile();
      await fetchCompanyData();
    } finally {
      setPlanRechecking(false);
    }
  };

  const handleSignOutFromHub = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsHubOpen(false);
      void signOut();
    },
    [signOut],
  );

  const showSettingsMenuLink = useMemo(() => {
    if (isMaster || isZaptroTenantAdminRole(profile?.role)) return true;
    return ['cfg', 'cfg_api', 'cfg_marca'].some((id) =>
      hasZaptroGranularPermission(profile?.role, profile?.permissions, id),
    );
  }, [isMaster, profile?.role, profile?.permissions]);

  const showBillingMenuLink = useMemo(() => {
    const isMaster = profile?.role?.toUpperCase() === 'MASTER' || profile?.role?.toUpperCase() === 'ADMIN';
    if (isMaster || isZaptroTenantAdminRole(profile?.role)) return true;
    return hasZaptroGranularPermission(profile?.role, profile?.permissions, 'faturamento');
  }, [isMaster, profile?.role, profile?.permissions]);

  const showHistoryMenuLink = useMemo(() => {
    if (isMaster || isZaptroTenantAdminRole(profile?.role)) return true;
    return hasZaptroGranularPermission(profile?.role, profile?.permissions, 'historico');
  }, [isMaster, profile?.role, profile?.permissions]);

  const showBrandingMenuLink = useMemo(() => {
    if (!isZaptroBrandingEntitledByPlan(company)) return false;
    if (isMaster || isZaptroTenantAdminRole(profile?.role)) return true;
    return hasZaptroGranularPermission(profile?.role, profile?.permissions, 'cfg_marca');
  }, [isMaster, profile?.role, profile?.permissions, company]);

  const showIntegrationsMenuLink = useMemo(() => {
    if (isMaster || isZaptroTenantAdminRole(profile?.role)) return true;
    return hasZaptroGranularPermission(profile?.role, profile?.permissions, 'cfg_api');
  }, [isMaster, profile?.role, profile?.permissions]);

  const showProfileAdvancedLinks =
    showSettingsMenuLink || showBillingMenuLink || showBrandingMenuLink || showIntegrationsMenuLink;

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const onDocMouseDown = (ev: MouseEvent) => {
      const el = profileMenuRef.current;
      if (el && !el.contains(ev.target as Node)) setIsProfileMenuOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setIsProfileMenuOpen(false);
    };
    /** Adia o listener para o próximo tick: evita o mesmo clique que abre o menu ser tratado como “fora” em alguns casos (touch / stacking). */
    const attachId = window.setTimeout(() => {
      document.addEventListener('mousedown', onDocMouseDown);
      document.addEventListener('keydown', onKey);
    }, 0);
    return () => {
      window.clearTimeout(attachId);
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isProfileMenuOpen]);

  const goProfileMenu = useCallback(
    (path: string) => {
      setIsProfileMenuOpen(false);
      navigate(path);
    },
    [navigate],
  );

  const handleProfileMenuSignOut = useCallback(() => {
    setIsProfileMenuOpen(false);
    void signOut();
  }, [signOut]);

  const hubPopupBody = (
    <>
      <div style={styles.hubHeader}>
        <ShieldCheck size={20} color="#10B981" />
        <div>
          <h4 style={{ ...styles.hubTitle, color: palette.text }}>Nível de Proteção Ativo</h4>
          <p style={styles.hubDesc}>Criptografia ponta-a-ponta ativada.</p>
        </div>
      </div>
      <div style={{ ...styles.hubFooter, borderTopColor: palette.searchBorder }}>
        <button
          type="button"
          style={{
            ...styles.supportBtn,
            backgroundColor: palette.mode === 'dark' ? palette.searchBg : ZAPTRO_FIELD_BG,
            color: palette.text,
          }}
        >
          <HelpCircle size={16} /> Suporte
        </button>
        <button type="button" style={styles.logoutBtnHub} onClick={handleSignOutFromHub}>
          <LogOut size={16} /> Sair
        </button>
      </div>
    </>
  );

  return (
    <div
      className="zaptro-layout-chrome"
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: palette.pageBg,
        color: palette.text,
        // Injeção de cores da empresa
        ['--zaptro-primary' as any]: company?.primary_color || palette.lime,
        ['--zaptro-secondary' as any]: company?.secondary_color || (isDark ? '#000' : '#000'),
      }}
    >
      {/* Modal de Ativação do WhatsApp (Agora com atraso de 2 minutos para não interromper o início) */}
      {isActivationModalOpen && (
        <WhatsAppActivationModal 
          companyId={company?.id || ''} 
          onClose={handleDismissActivation} 
        />
      )}

      <style>{`
        :root {
          --z-p: ${company?.primary_color || palette.lime};
          --z-s: ${company?.secondary_color || '#000'};
        }
      `}</style>
      {!hideTopbar && isMobile && (
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '70px',
            backgroundColor: palette.mobileHeaderBg,
            borderBottom: `1px solid ${palette.mobileHeaderBorder}`,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
          }}
        >
          <button type="button" style={styles.hamburger} onClick={toggleMobileMenu}>
            <Menu size={24} color={palette.text} />
          </button>
          <div style={styles.mobileLogo}>
            <ZaptroBrandMark size={36} />
            <span style={{ ...styles.logoTextMainMobile, color: palette.text }}>ZAPTRO</span>
          </div>
          <div style={{ ...styles.mobileActions, gap: 10 }}>
            <button
              type="button"
              style={styles.hubBtnMobile}
              onClick={() => {
                setIsHubOpen(false);
                navigate(ZAPTRO_ROUTES.PROFILE);
              }}
              aria-label="Minha conta"
              title="Minha conta"
            >
              <User size={20} color={palette.text} />
            </button>
            <button type="button" style={styles.hubBtnMobile} onClick={() => setIsHubOpen(!isHubOpen)}>
              <ShieldCheck size={20} color={palette.text} />
            </button>
          </div>
        </header>
      )}

      {isMobile && isHubOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar painel de ambiente seguro"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 220,
              border: 'none',
              margin: 0,
              padding: 0,
              cursor: 'default',
              backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(15, 23, 42, 0.2)',
            }}
            onClick={() => setIsHubOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: 74,
              right: 16,
              width: 300,
              borderRadius: 25,
              boxShadow: ZAPTRO_SHADOW.lg,
              padding: 25,
              zIndex: 230,
              backgroundColor: palette.hubPopupBg,
              border: `1px solid ${palette.searchBorder}`,
            }}
          >
            {hubPopupBody}
          </div>
        </>
      )}

      {isMobile && isMenuOpen && <div style={styles.overlay} onClick={toggleMobileMenu} />}

      {!hideSidebar && (
        <aside
          onMouseEnter={() => {
            if (!isMobile) setRailHover(true);
          }}
          onMouseLeave={() => setRailHover(false)}
          style={{
            position: 'fixed',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            transition: isMobile
              ? 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'width 0.28s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.28s ease',
            ...(isMobile
              ? {
                  top: 0,
                  bottom: 0,
                  left: isMenuOpen ? 0 : '-280px',
                  width: '280px',
                  backgroundColor: palette.sidebarBg,
                  borderRight: `1px solid ${palette.sidebarBorder}`,
                }
              : {
                  top: RAIL_MARGIN,
                  bottom: RAIL_MARGIN,
                  left: RAIL_MARGIN,
                  width: railHover ? RAIL_WIDTH_EXPANDED : RAIL_WIDTH,
                  borderRadius: 22,
                  backgroundColor: palette.sidebarBg,
                  border: `1px solid ${palette.sidebarBorder}`,
                  boxShadow: isDark
                    ? railHover
                      ? '0 16px 48px rgba(0,0,0,0.55)'
                      : '0 12px 40px rgba(0,0,0,0.5)'
                    : railHover
                      ? '0 12px 36px rgba(15, 23, 42, 0.14)'
                      : '0 4px 28px rgba(15, 23, 42, 0.09)',
                  overflow: 'hidden',
                }),
          }}
        >
          <style>{`
            .zaptro-sidebar-nav-btn { transition: transform 0.2s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.2s ease; }
            .zaptro-sidebar-nav-btn:hover { transform: translateY(-3px) scale(1.06); box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12); }
            .zaptro-sidebar-nav-btn:active { transform: translateY(-1px) scale(1.03); }
          `}</style>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              padding: isMobile ? '20px 20px 16px' : railHover ? '12px 12px 14px' : '12px 8px 14px',
              boxSizing: 'border-box',
              transition: isMobile ? undefined : 'padding 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: isMobile || railHover ? 'flex-start' : 'center',
                alignItems: 'center',
                paddingBottom: 4,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                className={!isMobile ? 'zaptro-sidebar-nav-btn' : undefined}
                onClick={() => {
                  navigate(ZAPTRO_ROUTES.DASHBOARD);
                  if (isMobile) setIsMenuOpen(false);
                }}
                aria-label="Início Zaptro"
                title="Início"
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 14,
                  backgroundColor: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isMobile || railHover ? 'flex-start' : 'center',
                  padding: isMobile ? '10px 16px' : railHover ? '10px 12px' : 0,
                  gap: isMobile || railHover ? 10 : 0,
                  width: isMobile ? '100%' : railHover ? '100%' : 44,
                  height: isMobile ? 'auto' : 44,
                  minHeight: isMobile ? 48 : 44,
                  boxSizing: 'border-box',
                }}
              >
                <Zap
                  size={22}
                  color="rgba(217, 255, 0, 1)"
                  strokeWidth={2}
                  fill="rgba(217, 255, 0, 1)"
                  aria-hidden
                  style={{ filter: 'drop-shadow(0 0 10px rgba(217, 255, 0, 0.35))' }}
                />
                {(isMobile || railHover) && <span style={{ ...styles.logoMain, color: '#ffffff', fontSize: 18 }}>ZAPTRO</span>}
              </button>
            </div>

            {railDivider('rail-1')}

            <div style={{ ...styles.navColumn, padding: 0 }}>
              <div style={{ ...styles.navCenterWrap, alignItems: isMobile || railHover ? 'stretch' : 'center' }}>
                <div
                  style={{
                    ...styles.nav,
                    alignItems: isMobile || railHover ? 'stretch' : 'center',
                    gap: 6,
                    padding: '8px 0',
                  }}
                >
                  {sidebarNavItems.map(renderSidebarNavButton)}
                </div>
              </div>
            </div>

            {railDivider('rail-2')}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 2, flexShrink: 0 }}>
              {sidebarSettingsItem ? renderSidebarNavButton(sidebarSettingsItem) : null}
              <button
                type="button"
                className="zaptro-sidebar-nav-btn"
                title="Sair do sistema"
                aria-label="Sair do sistema"
                onClick={() => void signOut()}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isMobile || railHover ? 'flex-start' : 'center',
                  gap: isMobile || railHover ? 14 : 0,
                  width: isMobile ? '100%' : railHover ? '100%' : 44,
                  height: isMobile ? 'auto' : 44,
                  minHeight: isMobile ? 48 : railHover ? 48 : 44,
                  padding: isMobile ? '12px 14px' : railHover ? '12px 14px' : 0,
                  marginLeft: isMobile || railHover ? 0 : 'auto',
                  marginRight: isMobile || railHover ? 0 : 'auto',
                  borderRadius: 12,
                  background: 'transparent',
                  color: '#EF4444',
                  boxSizing: 'border-box',
                }}
              >
                <LogOut size={20} strokeWidth={2} />
                {(isMobile || railHover) && <span style={{ fontWeight: 700, fontSize: 15 }}>Sair do Sistema</span>}
              </button>
            </div>

            {!isMobile && railDivider('rail-3')}

            {!isMobile && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: railHover ? 'flex-start' : 'center',
                  paddingTop: 6,
                  flexShrink: 0,
                  width: '100%',
                }}
              >
                <button
                  type="button"
                  className="zaptro-sidebar-nav-btn"
                  title="Minha conta"
                  aria-label="Abrir perfil"
                  onClick={() => navigate(ZAPTRO_ROUTES.PROFILE)}
                  style={{
                    border: 'none',
                    padding: railHover ? '6px 8px 6px 6px' : 0,
                    cursor: 'pointer',
                    width: railHover ? '100%' : 44,
                    height: railHover ? 'auto' : 44,
                    minHeight: 44,
                    borderRadius: railHover ? 14 : 999,
                    overflow: 'hidden',
                    background: palette.profileBg,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    borderColor: palette.sidebarBorder,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: railHover ? 'flex-start' : 'center',
                    gap: railHover ? 12 : 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'block',
                    }}
                  >
                    {sessionAvatarSrc ? (
                      <img src={sessionAvatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          fontSize: 16,
                          fontWeight: 700,
                          color: palette.text,
                          background: palette.profileBg,
                        }}
                      >
                        {profile?.full_name?.[0] ?? 'U'}
                      </span>
                    )}
                  </span>
                  {railHover && (
                    <span style={{ fontWeight: 700, fontSize: 13, color: palette.text, textAlign: 'left', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Minha conta
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      <main
        style={{
          ...styles.main,
          marginLeft: hideSidebar || isMobile ? '0' : `${mainMarginDesktop}px`,
          backgroundColor: palette.pageBg,
        }}
      >
        {!hideTopbar && !hideDesktopTopbar && !isMobile && (
          <header
            style={{
              ...styles.topbarShell,
              backgroundColor: 'transparent',
              borderBottom: 'none',
            }}
          >
            <div style={styles.topbarInner}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ height: 24, width: 1, background: 'rgba(0,0,0,0.1)' }} />
                <h1 style={{ 
                  margin: 0, 
                  fontSize: 20, 
                  fontWeight: 900, 
                  color: palette.text,
                  letterSpacing: '-0.03em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <span style={{ opacity: 0.3, fontWeight: 300, fontSize: 24 }}>/</span>
                  {menuItems.find(i => location.pathname === i.path.split('?')[0])?.label || 'Início'}
                  {breadcrumb && (
                    <>
                      <span style={{ opacity: 0.2, fontWeight: 300, fontSize: 18 }}>{'>'}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: palette.textMuted, marginTop: 2 }}>
                        {breadcrumb}
                      </span>
                    </>
                  )}
                </h1>
              </div>
              <div style={styles.topbarRight}>
              <SidebarTeamPresence
                companyId={profile?.company_id}
                selfId={profile?.id}
                sessionProfile={profile ? { id: profile.id, avatar_url: profile.avatar_url } : null}
                onlineUserIds={onlineUsers}
                ringBg={palette.pageBg}
              />
              <NotificationCenter isDark={isDark} pageBg={palette.pageBg} />


              <div style={{ position: 'relative' }}>
                {/* ── SISTEMA STATUS BUTTON ── */}
                {(() => {
                  const status: 'ativo' | 'suspenso' | 'bloqueado' =
                    !company ? 'bloqueado' :
                    company.billing_status === 'blocked' || company.billing_status === 'overdue' ? 'bloqueado' :
                    company.status === 'suspended' || company.status === 'SUSPENSO' ? 'suspenso' :
                    company.status === 'blocked'   || company.status === 'BLOQUEADO' ? 'bloqueado' : 'ativo';

                  const statusCfg = {
                    ativo:    { color: '#fff', bg: '#22c55e', dot: '#fff', label: 'SISTEMA ATIVO', pulse: 'zaptro-layout-pulse' },
                    suspenso: { color: '#000', bg: '#fbbf24', dot: '#b45309', label: 'PENDENTE',   pulse: 'zaptro-layout-pulse' },
                    bloqueado:{ color: '#fff', bg: '#ef4444', dot: '#fff',    label: 'BLOQUEADO',  pulse: '' },
                  }[status];

                  // Simulated credit data — would come from Supabase billing table
                  const credits = { total: 1000, usado: 350, disponivel: 650 };

                  return (
                    <>
                      <button
                        type="button"
                        style={{
                          ...styles.hubBtn,
                          backgroundColor: '#000000',
                          color: '#FFFFFF',
                          border: '1px solid rgba(255,255,255,0.1)',
                          padding: '10px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                        onClick={() => setIsHubOpen(!isHubOpen)}
                      >
                        <div style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: statusCfg.bg,
                          boxShadow: `0 0 10px ${statusCfg.bg}`,
                          animation: status === 'ativo' ? 'zaptro-pulse 1.8s infinite' : 'none',
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' }}>
                          {statusCfg.label}
                        </span>
                      </button>
                      <style>{`
                        @keyframes zaptro-pulse {
                          0% { transform: scale(0.95); opacity: 1; }
                          50% { transform: scale(1.15); opacity: 0.7; }
                          100% { transform: scale(0.95); opacity: 1; }
                        }
                      `}</style>

                      {isHubOpen && (
                        <>
                          <div
                            onClick={() => setIsHubOpen(false)}
                            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 10px)',
                            right: 0,
                            width: 300,
                            borderRadius: 20,
                            background: '#fff',
                            border: '1px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.14)',
                            zIndex: 999,
                            overflow: 'hidden',
                            animation: 'zaptroSlideUp 0.18s ease-out',
                          }}>
                            {/* Header */}
                            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: statusCfg.bg }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusCfg.dot }} />
                                <span style={{ fontSize: 12, fontWeight: 800, color: statusCfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{statusCfg.label}</span>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: statusCfg.color, opacity: 0.7 }}>
                                {company?.name || 'Sua Empresa'}
                              </div>
                            </div>

                            {/* Credits */}
                            <div style={{ padding: '16px 20px' }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>📊 Créditos do Plano</div>

                              {/* Progress bar */}
                              <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Utilizados</span>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{credits.usado} / {credits.total}</span>
                                </div>
                                <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${(credits.usado / credits.total) * 100}%`,
                                    borderRadius: 999,
                                    background: credits.disponivel < 200 ? '#ef4444' : '#D9FF00',
                                    transition: 'width 0.6s ease',
                                  }} />
                                </div>
                              </div>

                              {/* Stats row */}
                              {[
                                { label: 'Total', value: credits.total, color: '#374151' },
                                { label: 'Usados', value: credits.usado, color: '#10b981' },
                                { label: 'Disponíveis', value: credits.disponivel, color: '#D9FF00' },
                              ].map(({ label, value, color }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>{label}</span>
                                  <span style={{ fontSize: 14, fontWeight: 800, color }}>{value.toLocaleString()}</span>
                                </div>
                              ))}

                              {/* Plan info */}
                              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>PLANO ATUAL</div>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                                    {(company as any)?.plan || 'Starter'}
                                  </div>
                                </div>
                                <button
                                  onClick={() => { setIsHubOpen(false); navigate(ZAPTRO_ROUTES.BILLING ?? '/conta?tab=plano'); }}
                                  style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: '#0f172a', color: '#D9FF00', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Upgrade
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>


              <div ref={profileMenuRef} style={styles.profileMenuWrap}>
                <div
                  style={{
                    ...styles.profileArea,
                    backgroundColor: palette.profileBg,
                    border: `1px solid ${palette.profileBorder}`,
                  }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-haspopup="menu"
                    aria-expanded={isProfileMenuOpen}
                    style={styles.profileNameZone}
                    onClick={() => setIsProfileMenuOpen((o) => !o)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsProfileMenuOpen((o) => !o);
                      }
                    }}
                  >
                    <div style={styles.profileInfo}>
                      <span style={{ ...styles.profileName, color: palette.text }}>
                        {profile?.full_name?.split(' ')[0]}
                      </span>
                      <div style={styles.roleBadgeHeader}>{roleBadgeLabel(profile?.role)}</div>
                    </div>
                    <ChevronDown
                      size={18}
                      color={palette.textMuted}
                      strokeWidth={2.4}
                      style={{
                        marginRight: 4,
                        transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                      }}
                      aria-hidden
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={isProfileMenuOpen}
                      aria-label="Abrir menu do perfil"
                      style={{
                        ...styles.avatarMenuButton,
                        border: `1px solid ${palette.profileBorder}`,
                        backgroundColor: palette.profileBg,
                      }}
                      onClick={() => setIsProfileMenuOpen((o) => !o)}
                    >
                      <span style={styles.avatarMini}>
                        {sessionAvatarSrc ? (
                          <img
                            src={sessionAvatarSrc}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px', display: 'block' }}
                          />
                        ) : (
                          profile?.full_name?.[0] || 'U'
                        )}
                      </span>
                    </button>
                    {planVerifiedTier !== 'none' && (
                      <span style={{ lineHeight: 0, flexShrink: 0 }} aria-hidden>
                        <ZaptroPlanVerifiedSealBubble tier={planVerifiedTier} size="sm" />
                      </span>
                    )}
                  </div>
                </div>

                {isProfileMenuOpen && (
                  <>
                    <div
                      role="menu"
                      style={{
                        ...styles.profileDropdown,
                        backgroundColor: palette.mode === 'dark' ? '#141414' : '#ffffff',
                        border: `1px solid ${palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                        boxShadow: '0 22px 55px rgba(15, 23, 42, 0.16)',
                        padding: 0,
                        overflow: 'hidden',
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => goProfileMenu(ZAPTRO_ROUTES.PROFILE)}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: 10,
                          textAlign: 'left',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div
                          style={{
                            ...(isDark
                              ? { ...zaptroCardSurfaceStyle(true), borderRadius: 16 }
                              : {
                                  backgroundColor: ZAPTRO_FIELD_BG,
                                  border: '1px solid rgba(0, 0, 0, 0.12)',
                                  borderRadius: 16,
                                  boxSizing: 'border-box',
                                }),
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                          }}
                        >
                          <div
                            style={{
                              width: 46,
                              height: 46,
                              borderRadius: '50%',
                              backgroundColor: '#0f172a',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 15,
                              fontWeight: 700,
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {sessionAvatarSrc ? (
                              <img
                                src={sessionAvatarSrc}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              (() => {
                                const n = profile?.full_name?.trim();
                                if (n) {
                                  const p = n.split(/\s+/).filter(Boolean);
                                  return (p.length >= 2
                                    ? `${p[0][0]}${p[p.length - 1][0]}`
                                    : n.slice(0, 2)
                                  ).toUpperCase();
                                }
                                return (profile?.email?.slice(0, 2) || 'ZT').toUpperCase();
                              })()
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: palette.text,
                                letterSpacing: '-0.02em',
                              }}
                            >
                              Meu perfil
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: palette.textMuted,
                                marginTop: 3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {profile?.email ?? user?.email ?? '—'}
                            </div>
                          </div>
                        </div>
                      </button>

                      <div style={{ padding: '2px 10px 8px' }}>
                        {showBillingMenuLink && (
                          <button
                            type="button"
                            role="menuitem"
                            style={{ ...styles.profileMenuItem, color: palette.text }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = palette.navActiveBg;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            onClick={() => goProfileMenu(ZAPTRO_ROUTES.BILLING)}
                          >
                            <CreditCard size={18} strokeWidth={2.2} color={palette.text} />
                            Meu plano
                          </button>
                        )}

                        <button
                          type="button"
                          role="menuitem"
                          style={{ ...styles.profileMenuItem, color: palette.text }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = palette.navActiveBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          onClick={() => goProfileMenu('/conta?tab=empresa')}
                        >
                          <Building2 size={18} strokeWidth={2.2} color={palette.text} />
                          Minha Empresa
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          style={{ ...styles.profileMenuItem, color: palette.text }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = palette.navActiveBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          onClick={() => goProfileMenu(`${ZAPTRO_ROUTES.TEAM}?tab=members`)}
                        >
                          <Users size={18} strokeWidth={2.2} color={palette.text} />
                          Membros
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          style={{ ...styles.profileMenuItem, color: palette.text }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = palette.navActiveBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          onClick={() => goProfileMenu(`${ZAPTRO_ROUTES.TEAM}?tab=ranking`)}
                        >
                          <Trophy size={18} strokeWidth={2.2} color={palette.text} />
                          Ranking
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          style={{ ...styles.profileMenuItem, color: palette.text }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = palette.navActiveBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          onClick={() => goProfileMenu(`${ZAPTRO_ROUTES.TEAM}?tab=permissions`)}
                        >
                          <ShieldCheck size={18} strokeWidth={2.2} color={palette.text} />
                          Acessos
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          style={{ ...styles.profileMenuItem, color: palette.text }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = palette.navActiveBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          onClick={() => goProfileMenu('/conta?tab=billing')}
                        >
                          <FileText size={18} strokeWidth={2.2} color={palette.text} />
                          Assinatura & Faturamento
                        </button>

                        {showHistoryMenuLink && (
                          <button
                            type="button"
                            role="menuitem"
                            style={{ ...styles.profileMenuItem, color: palette.text }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = palette.navActiveBg;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            onClick={() => goProfileMenu(ZAPTRO_ROUTES.HISTORY)}
                          >
                            <Clock size={18} strokeWidth={2.2} color={palette.text} />
                            Histórico
                          </button>
                        )}

                        {showProfileAdvancedLinks && (
                          <>
                            {(showBillingMenuLink &&
                              (showSettingsMenuLink || showIntegrationsMenuLink || showBrandingMenuLink)) ||
                            (!showBillingMenuLink &&
                              showSettingsMenuLink &&
                              (showIntegrationsMenuLink || showBrandingMenuLink)) ? (
                              <div
                                style={{
                                  height: 1,
                                  margin: '6px 4px',
                                  backgroundColor: palette.searchBorder,
                                  border: 'none',
                                }}
                              />
                            ) : null}

                            {showSettingsMenuLink && (
                              <button
                                type="button"
                                role="menuitem"
                                style={{ ...styles.profileMenuItem, color: palette.text }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = palette.navActiveBg;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                onClick={() => goProfileMenu(`${ZAPTRO_ROUTES.SETTINGS_ALIAS}?tab=config`)}
                              >
                                <Settings size={18} strokeWidth={2.2} color={palette.text} />
                                Configurações
                              </button>
                            )}
                            {showIntegrationsMenuLink && (
                              <button
                                type="button"
                                role="menuitem"
                                style={{ ...styles.profileMenuItem, color: palette.text }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = palette.navActiveBg;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                onClick={() => goProfileMenu(`${ZAPTRO_ROUTES.SETTINGS_ALIAS}?tab=api`)}
                              >
                                <LayoutGrid size={18} strokeWidth={2.2} color={palette.text} />
                                Integrações
                              </button>
                            )}
                            {showBrandingMenuLink && (
                              <button
                                type="button"
                                role="menuitem"
                                style={{ ...styles.profileMenuItem, color: palette.text }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = palette.navActiveBg;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                onClick={() => goProfileMenu(`${ZAPTRO_ROUTES.SETTINGS_ALIAS}?tab=marca`)}
                              >
                                <Palette size={18} strokeWidth={2.2} color={palette.text} />
                                Personalizar empresa
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      <div style={{ height: 1, backgroundColor: palette.searchBorder }} />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleProfileMenuSignOut}
                        style={{
                          ...styles.profileMenuItem,
                          color: '#ef4444',
                          borderRadius: 0,
                          padding: '14px 18px',
                          fontWeight: 700,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <LogOut size={18} strokeWidth={2.2} color="#ef4444" />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            </div>
          </header>
        )}

        {/*
          Coluna principal (`zaptro-main-primary`): altura fixa à área útil, sem scroll.
          Rolagem fina na coluna `zaptro-scroll-area` (contentInner) ou, em full-width, só dentro dos filhos.
        */}
        <div
          className="zaptro-main-primary"
          style={{
            ...styles.content,
            backgroundColor: palette.pageBg,
            color: palette.text,
            ...(contentFullWidth ? { padding: 0 } : {}),
          }}
        >
          {scrollAreaTop ? <div style={{ flexShrink: 0 }}>{scrollAreaTop}</div> : null}
          <div
            className="zaptro-scroll-area"
            style={{
              ...styles.contentInner,
              scrollbarWidth: 'thin',
              scrollbarColor: isDark ? 'rgba(148, 163, 184, 0.45) transparent' : 'rgba(100, 116, 139, 0.4) transparent',
              ...(contentFullWidth
                ? {
                    maxWidth: 'none',
                    width: '100%',
                    marginLeft: 0,
                    marginRight: 0,
                    paddingLeft: 'clamp(10px, 1.25vw, 20px)',
                    paddingRight: 'clamp(10px, 1.25vw, 20px)',
                    /** Coluna encosta à altura útil; rolagem fica nos filhos (ex. inbox), não no `main`. */
                    height: '100%',
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }
                : {}),
            }}
          >
            {isImpersonating && (
              <div style={{
                backgroundColor: '#000000',
                color: '#D9FF00',
                padding: '12px 24px',
                marginBottom: 20,
                borderRadius: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px',
                fontWeight: '800',
                boxShadow: '0 10px 30px rgba(217, 255, 0, 0.1)',
                border: '1px solid rgba(217, 255, 0, 0.2)',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={16} color="#D9FF00" />
                  <span>MODO MASTER ATIVO: Administrando {company?.name || 'Empresa'}</span>
                </div>
                <button 
                  onClick={() => stopImpersonating?.()}
                  style={{
                    backgroundColor: '#D9FF00',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '6px 16px',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  ENCERRAR ACESSO
                </button>
              </div>
            )}
            {children}
          </div>
        </div>
      </main>

      <ZaptroPlanGateModal
        open={planGateOpen}
        email={user?.email || profile?.email}
        onGoToBilling={() => navigate(`${ZAPTRO_ROUTES.PROFILE}?tab=billing`)}
        onRecheck={() => void handlePlanRecheck()}
        rechecking={planRechecking}
      />

      <style>{`
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 50px ${isDark ? '#000000' : ZAPTRO_FIELD_BG} inset !important;
          -webkit-text-fill-color: ${palette.text} !important;
        }
        .zaptro-scroll-area::-webkit-scrollbar { width: 8px; }
        .zaptro-scroll-area::-webkit-scrollbar-track { background: transparent; }
        .zaptro-scroll-area::-webkit-scrollbar-thumb { 
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; 
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .zaptro-scroll-area::-webkit-scrollbar-thumb:hover { background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}; background-clip: content-box; }
        .zaptro-scroll-area::-webkit-scrollbar-track { background: transparent; }
        .zaptro-scroll-area::-webkit-scrollbar-thumb {
          background-color: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)'};
          border-radius: 999px;
        }
        .zaptro-scroll-area::-webkit-scrollbar-thumb:hover {
          background-color: ${isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.38)'};
        }
      `}</style>

      {/* Renderização de Toasts Globais */}
      <style>{`
        .react-hot-toast-container {
          z-index: 100001 !important;
        }
      `}</style>
    </div>
  );
};

const ZaptroLayout: React.FC<ZaptroLayoutProps> = ({
  children,
  hideSidebar = false,
  hideTopbar = false,
  hideDesktopTopbar = false,
  contentFullWidth = false,
  scrollAreaTop,
  breadcrumb
}) => {
  const { profile, isMaster } = useAuth();
  const { company } = useTenant();
  /** Testes: `VITE_ZAPTRO_BRANDING_FOR_ALL=true` no `.env.development` — remova em produção. */
  const brandingMenuForAll =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZAPTRO_BRANDING_FOR_ALL === 'true';
  const canCustomizeTenant = useMemo(() => {
    if (brandingMenuForAll) return true;
    if (isMaster) return true;
    if (!isZaptroBrandingEntitledByPlan(company)) return false;
    if (isZaptroTenantAdminRole(profile?.role)) return true;
    return hasZaptroGranularPermission(profile?.role, profile?.permissions, 'cfg_marca');
  }, [brandingMenuForAll, isMaster, profile?.role, profile?.permissions, company]);

  return (
    <ZaptroThemeProvider canCustomizeTenant={canCustomizeTenant}>
      <ZaptroLayoutChrome
        hideSidebar={hideSidebar}
        hideTopbar={hideTopbar}
        hideDesktopTopbar={hideDesktopTopbar}
        contentFullWidth={contentFullWidth}
        scrollAreaTop={scrollAreaTop}
        breadcrumb={breadcrumb}
      >
        {children}
      </ZaptroLayoutChrome>
    </ZaptroThemeProvider>
  );
};

const styles: Record<string, React.CSSProperties> = {
  hamburger: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubBtnMobile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: '1px solid #E2E8F0',
    background: ZAPTRO_FIELD_BG,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(24, 24, 27, 0.22)',
    zIndex: 150,
  },
  hubContainer: { position: 'relative' },
  mobileLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  mobileActions: { display: 'flex', alignItems: 'center', gap: 10 },
  logoTextMainMobile: { fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' },
  sidebar: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 200,
  },
  sidebarHeader: { height: '110px', padding: '0 24px', display: 'flex', alignItems: 'center' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoIcon: {
    width: '46px',
    height: '46px',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconCompact: {
    width: '46px',
    height: '46px',
    border: `1px solid ${ZAPTRO_SECTION_BORDER}`,
    borderRadius: '15px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { display: 'flex', flexDirection: 'column' },
  logoMain: { fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 },
  navColumn: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 },
  /** Ocupa o espaço entre logo e equipe; menu alinhado ao topo (não centrado verticalmente). */
  navCenterWrap: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  nav: {
    flex: '0 1 auto',
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
    overflowY: 'auto',
    maxHeight: '100%',
    minHeight: 0,
  },
  navItem: {
    border: 'none',
    background: 'transparent',
    height: '58px',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    cursor: 'pointer',
    transition: '0.2s',
    fontSize: '15px',
    fontWeight: 600,
  },
  navLabel: { whiteSpace: 'nowrap' },
  sidebarFooter: { padding: '20px' },
  logoutBtn: {
    border: 'none',
    background: 'transparent',
    color: '#EF4444',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },
  main: {
    flex: 1,
    minWidth: 0,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  /** Barra superior em toda a largura do `main` (não segue a coluna centrada do conteúdo). */
  topbarShell: {
    height: '110px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'stretch',
    flexShrink: 0,
    minWidth: 0,
    width: '100%',
    position: 'relative',
    zIndex: 2500,
  },
  topbarInner: {
    width: '100%',
    maxWidth: '100%',
    margin: 0,
    padding: '0 clamp(16px, 3vw, 32px)',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    minWidth: 0,
  },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  newsBtn: {
    position: 'relative',
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsDot: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    width: '10px',
    height: '10px',
    backgroundColor: '#EF4444',
    borderRadius: '50%',
    border: '2px solid white',
  },
  hubBtn: {
    padding: '6px 14px',
    borderRadius: '12px',
    backgroundColor: '#22c55e',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(255,255,255,0.55) inset, 0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  hubPopup: {
    position: 'absolute',
    top: '80px',
    right: 0,
    width: '300px',
    borderRadius: '25px',
    boxShadow: ZAPTRO_SHADOW.lg,
    padding: '25px',
    zIndex: 1000,
  },
  hubHeader: { display: 'flex', gap: '15px', marginBottom: '20px' },
  hubTitle: { margin: 0, fontSize: '16px', fontWeight: 700 },
  hubDesc: { margin: '4px 0 0 0', fontSize: '13px', color: '#94A3B8', fontWeight: 600 },
  hubFooter: { borderTop: '1px solid #e8e8e8', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  supportBtn: {
    padding: '12px',
    background: ZAPTRO_FIELD_BG,
    border: 'none',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  logoutBtnHub: {
    padding: '12px',
    background: 'transparent',
    border: 'none',
    color: '#EF4444',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  profileMenuWrap: {
    position: 'relative',
    flexShrink: 0,
    /** Acima do popup do hub (z-index 1000) para o avatar / menu de perfil continuarem clicáveis. */
    zIndex: 1105,
  },
  profileDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 10,
    minWidth: 280,
    borderRadius: 18,
    padding: '8px',
    zIndex: 1100,
  },
  profileMenuDivider: {
    height: 1,
    margin: '4px 8px',
    border: 'none',
  },
  profileMenuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    border: 'none',
    borderRadius: 14,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  profileArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px 10px 20px',
    borderRadius: '20px',
  },
  profileNameZone: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
  },
  avatarMenuButton: {
    flexShrink: 0,
    padding: 0,
    margin: 0,
    borderRadius: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 0,
    outline: 'none',
  },
  profileInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  profileName: { fontSize: '14px', fontWeight: 700 },
  roleBadgeHeader: {
    padding: '2px 8px',
    backgroundColor: '#000',
    color: '#D9FF00',
    borderRadius: '6px',
    fontSize: '9px',
    fontWeight: 700,
  },
  avatarMini: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    backgroundColor: '#000',
    color: '#D9FF00',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '16px',
  },
  /**
   * Coluna principal sob o `main`: sem rolagem aqui — fica fixa à área útil; quem rola é `contentInner` ou páginas full-width por dentro.
   */
  content: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    height: 0,
    margin: 0,
    overflow: 'hidden',
    padding: '24px 0 32px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
  /** Coluna centrada: rolagem vertical padrão; em `contentFullWidth` passa a `overflow: hidden` e os filhos controlam scroll. */
  contentInner: {
    width: '100%',
    maxWidth: 'min(100%, 1720px)',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: 24,
    paddingRight: 24,
    boxSizing: 'border-box',
    flex: 1,
    minHeight: 0,
    overflowX: 'hidden',
    overflowY: 'auto',
  },
};

export default ZaptroLayout;

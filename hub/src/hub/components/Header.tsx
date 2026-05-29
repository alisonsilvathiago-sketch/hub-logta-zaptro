import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Search, Bell, User, ChevronDown, 
  Settings, LogOut, Menu,
  Shield, Database, Zap, Users, 
  KeyRound, Webhook, ScrollText, Plug, UserCog, Calendar, Activity,
  Workflow, Cpu, Library, HelpCircle, LifeBuoy, BookOpen, Truck,
  Check, ChevronsUpDown, Building2,  GitBranch, Code2, PackageSearch, Sparkles, Smartphone, Brain
} from 'lucide-react';
import { useHubProjectAi } from '@hub/context/HubProjectAiContext';
import HubMasterAvatar from '@hub/components/HubMasterAvatar';
import { resolveHubProjectAiScope } from '@hub/lib/hubProjectAiScope';
import { useAuth } from '@core/context/AuthContext';
import { useWhiteLabel } from '@core/context/WhiteLabelContext';
import SyncIndicator from './SyncIndicator';
import HubProfileThemePicker from './HubProfileThemePicker';
import HubNotificationPanel from './HubNotificationPanel';
import { useHubMasterNotifications } from '@hub/context/HubMasterNotificationsContext';

import Kbd from '@shared/components/Kbd';
import { getPlatform } from '@core/lib/platform';
import {
  MASTER_ROUTE_TOKEN_PARAM,
  getExpectedMasterRouteToken,
} from '@core/lib/masterRouteToken';

const Header: React.FC<{ onMenuClick?: () => void; isMobile?: boolean }> = ({ onMenuClick, isMobile }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [collabDropdownOpen, setCollabDropdownOpen] = useState(false);
  const profilePopoverRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const collabDropdownRef = useRef<HTMLDivElement>(null);
  const bellBtnRef = useRef<HTMLButtonElement>(null);
  const platform = getPlatform();
  const { unreadCount, togglePanel } = useHubMasterNotifications();
  const { isOpen: isAiOpen, toggle: toggleAi } = useHubProjectAi();
  const aiScope = resolveHubProjectAiScope(location.pathname);

  useEffect(() => {
    if (!dropdownOpen && !projectDropdownOpen && !collabDropdownOpen) return;
    const close = (e: MouseEvent) => {
      const profileEl = profilePopoverRef.current;
      const projectEl = projectDropdownRef.current;
      const collabEl = collabDropdownRef.current;
      
      if (dropdownOpen && profileEl && !profileEl.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (projectDropdownOpen && projectEl && !projectEl.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
      if (collabDropdownOpen && collabEl && !collabEl.contains(e.target as Node)) {
        setCollabDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [dropdownOpen, projectDropdownOpen, collabDropdownOpen]);

  const ALL_PROJECTS = [
    { label: 'Logta', path: '/master/logta', icon: PackageSearch },
    { label: 'Zaptro', path: '/master/zaptro', icon: Zap },
    { label: 'LogDock', path: '/master/logdock', icon: Cpu },
    { label: 'LogStoka', path: '/master/logstoka', icon: Truck },
    { label: 'Whatsapp', path: '/master/whatsapp', icon: Smartphone },
    { label: 'IA Gateway', path: '/master/ia-gateway', icon: Brain },
  ];

  const { settings } = useWhiteLabel();

  // Obtém o projeto selecionado atualmente a partir da URL
  const projectKey = location.pathname.includes('/master/zaptro')
    ? ('zaptro' as const)
    : location.pathname.includes('/master/logta')
      ? ('logta' as const)
      : location.pathname.includes('/master/logdock')
        ? ('logdock' as const)
        : location.pathname.includes('/master/logstoka')
          ? ('logstoka' as const)
          : location.pathname.includes('/master/whatsapp')
          ? ('whatsapp' as const)
          : location.pathname.includes('/master/ia-gateway')
            ? ('ia-gateway' as const)
            : null;

  const currentProject = projectKey ? {
    label: (settings as any)[projectKey]?.name || ALL_PROJECTS.find(p => p.path === `/master/${projectKey}`)?.label,
    icon: ALL_PROJECTS.find(p => p.path === `/master/${projectKey}`)?.icon || Database
  } : {
    label: 'Hub Master',
    icon: Database
  };

  const handleSelectProject = (path: string) => {
    setProjectDropdownOpen(false);
    const params = new URLSearchParams(location.search);
    params.set(MASTER_ROUTE_TOKEN_PARAM, getExpectedMasterRouteToken(path));
    navigate({ pathname: path, search: params.toString() });
  };

  // Mapeamento de rotas para nomes amigáveis
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    const breadcrumbs = [];
    
    // Base "Início" sempre presente se estiver no /master
    if (paths.includes('master')) {
      breadcrumbs.push({ label: 'Início', path: '/master' });
    }

    // Mapeamento de nomes
    const routeNames: Record<string, string> = {
      'crm': 'CRM & Vendas',
      'clientes': 'Clientes',
      'companies': 'Empresas',
      'resultados': 'Resultados',
      'modulos-sync': 'Módulos & Sync',
      'metricas-score': 'Métricas & Score',
      'automacoes': 'Automações',
      'integracoes': 'Integrações',
      'saude': 'Saúde & VPS',
      'seguranca': 'Segurança',
      'usuarios-hub': 'Usuários Hub',
      'billing': 'Financeiro',
      'team': 'Equipe Master',
      'reports': 'Relatórios',
      'settings': 'Configurações',
      'notifications': 'Notificações',
      'infrastructure': 'Infraestrutura',
      'backup': 'Backups',
      'security': 'Segurança',
      'analytics': 'Analytics',
      'account': 'Meu Perfil',
      'agenda': 'Agenda Hub',
      'hubchat': 'HubChat',
      'logistica': 'A Logística',
      logta: 'Logta SaaS',
      zaptro: 'Zaptro SaaS',
      logdock: 'LogDock Admin',
      logstoka: 'LogStoka WMS',
    };

    paths.forEach((p, i) => {
      if (p !== 'master' && routeNames[p]) {
        breadcrumbs.push({ label: routeNames[p], path: '/' + paths.slice(0, i + 1).join('/') });
      } else if (p !== 'master' && !routeNames[p] && isNaN(Number(p)) && p.length > 5) {
        // Fallback para IDs ou nomes dinâmicos (simplificado)
        breadcrumbs.push({ label: 'Detalhes', path: location.pathname });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  /** Cor única para ícones da direita (busca, chat, config, sino) */
  const headerIconColor = '#64748B';

  const goAgenda = () => {
    const params = new URLSearchParams(location.search);
    params.set(MASTER_ROUTE_TOKEN_PARAM, getExpectedMasterRouteToken('/master/agenda'));
    navigate({ pathname: '/master/agenda', search: params.toString() });
  };

  return (
    <header className="hub-master-header" style={styles.header}>
      <div style={styles.leftSection}>
        {isMobile && (
          <button style={styles.menuBtn} onClick={onMenuClick}>
            <Menu size={18} color="#0F172A" />
          </button>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: 0, minWidth: 0 }}>
          {/* Divisória Inicial alinhada com a Borda Direita da Sidebar */}
          <div style={{ display: 'flex', alignItems: 'center', color: '#E5E7EB', fontSize: '20px', fontWeight: 300, userSelect: 'none' }}>/</div>

          {/* Seletor de Colaboradores (Organização) */}
          <div 
            ref={collabDropdownRef}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <div 
              onClick={() => setCollabDropdownOpen(!collabDropdownOpen)}
              className="hub-header-selector"
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', 
                userSelect: 'none', flexShrink: 0, backgroundColor: collabDropdownOpen ? '#F3F4F6' : 'transparent'
              }}
            >
              <Building2 size={14} color="#4B5563" strokeWidth={2} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>Alison Thiago</span>
              <span style={{ 
                fontSize: '10px', fontWeight: 700, color: '#6B7280', border: '1px solid #E5E7EB', 
                backgroundColor: '#F9FAFB', borderRadius: '4px', padding: '1px 4px', lineHeight: 1,
                transform: 'scale(0.9)'
              }}>PRO</span>
              <ChevronsUpDown size={12} color="#9CA3AF" />
            </div>

            {collabDropdownOpen && (
              <div className="hub-header-floating-menu" style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 280,
                minHeight: '258px',
                paddingLeft: '14px',
                paddingRight: '14px',
                boxSizing: 'border-box',
                border: '1px solid var(--hub-border)', borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                zIndex: 1100, overflow: 'hidden', animation: 'hubProfileMenuIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <div style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Equipe Hub Master</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748B' }}>Colaboradores trabalhando agora</p>
                </div>
                <div style={{ padding: '6px 0', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {[
                    { id: 1, name: 'Alison Thiago', role: 'Proprietário', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80', online: true },
                    { id: 2, name: 'Ana Paula', role: 'Desenvolvedora Core', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80', online: true },
                    { id: 3, name: 'Lucas Mendes', role: 'Infra & VPS', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80', online: true },
                    { id: 4, name: 'Carla Souza', role: 'Suporte Pleno', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&q=80', online: true },
                    { id: 5, name: 'Mateus Lima', role: 'Financeiro Master', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80', online: false }
                  ].map((collab) => (
                    <div 
                      key={collab.id}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', 
                        borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.15s'
                      }}
                      className="hub-header-project-item"
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={collab.img} alt={collab.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ 
                          position: 'absolute', right: '-1px', bottom: '-1px', width: '9px', height: '9px', 
                          borderRadius: '50%', border: '2px solid #FFF', backgroundColor: collab.online ? '#0061FF' : '#94A3B8'
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{collab.name}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{collab.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', color: '#E5E7EB', fontSize: '20px', fontWeight: 300, userSelect: 'none' }}>/</div>

          {/* Seletor de Projeto (FUNCIONAL!) */}
          <div 
            ref={projectDropdownRef}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <div 
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="hub-header-selector"
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', cursor: 'pointer', borderRadius: '4px',
                backgroundColor: projectDropdownOpen ? '#F3F4F6' : 'transparent', userSelect: 'none'
              }}
            >
              <currentProject.icon size={14} color="#4B5563" strokeWidth={2} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>{currentProject.label}</span>
              <ChevronsUpDown size={12} color="#9CA3AF" />
            </div>
            
            {projectDropdownOpen && (
              <div className="hub-header-floating-menu" style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 280,
                minHeight: '0',
                paddingLeft: '14px',
                paddingRight: '14px',
                paddingBottom: '14px',
                boxSizing: 'border-box',
                border: '1px solid var(--hub-border)', borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                zIndex: 1100, overflow: 'hidden', animation: 'hubProfileMenuIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <div style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                     <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '8px' }} />
                     <input 
                       type="text" 
                       placeholder="Buscar projeto..." 
                       style={{ 
                         width: '100%', padding: '6px 8px 6px 28px', fontSize: '12px', border: '1px solid #E5E7EB', 
                         borderRadius: '6px', outline: 'none', fontFamily: 'inherit', margin: 0, height: '28px',
                         backgroundColor: '#FAFAFA'
                       }} 
                     />
                  </div>
                </div>
                <div style={{ padding: '11px 0', maxHeight: '508px', overflowY: 'auto' }}>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 700, padding: '6px 10px 4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    ALISON's projects
                  </div>
                  {ALL_PROJECTS.map((proj) => {
                     const isProjActive = location.pathname.startsWith(proj.path);
                     return (
                       <button 
                         key={proj.path}
                         onClick={() => handleSelectProject(proj.path)}
                         className="hub-header-project-item"
                         style={{ 
                           display: 'flex', alignItems: 'center', width: '100%', padding: '6px 10px', border: 'none', 
                           background: 'transparent', borderRadius: '6px', cursor: 'pointer', gap: '8px', textAlign: 'left',
                           marginBottom: '2px'
                         }}
                       >
                         <proj.icon size={14} color="#6B7280" strokeWidth={2} />
                         <span style={{ fontSize: '12px', fontWeight: isProjActive ? 600 : 500, color: '#1F2937', flex: 1 }}>{proj.label}</span>
                         {isProjActive && (
                           <Check
                             size={14}
                             color={
                               proj.path === '/master/zaptro'
                                 ? settings.zaptro.primaryColor || '#7C3AED'
                                 : '#0061FF'
                             }
                             strokeWidth={2.5}
                           />
                         )}
                       </button>
                     );
                  })}
                </div>
              </div>
            )}
          </div>



          <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center' }}>
            <SyncIndicator />
          </div>
        </div>
      </div>

      <div className="hub-header-right" style={styles.rightSection}>



        <button
          type="button"
          title="Busca (atalho)"
          aria-label="Abrir busca do hub"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '8px', 
            padding: '0 8px 0 10px', 
            borderRadius: '6px', 
            border: '1px solid #E5E7EB', 
            backgroundColor: '#FAFAFA', 
            color: '#9CA3AF', 
            cursor: 'pointer', 
            fontSize: '13px', 
            height: '32px', 
            width: isMobile ? '36px' : '160px',
            justifyContent: isMobile ? 'center' : 'space-between',
            flexShrink: 0,
            marginRight: '4px',
            transition: 'all 0.15s ease'
          }}
          onClick={() => (window as any).toggleSpotlight?.()}
          className="hub-header-selector"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} strokeWidth={2} />
            {!isMobile && <span>Search...</span>}
          </div>
          {!isMobile && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '2px', 
              fontSize: '10px', 
              border: '1px solid var(--hub-border)', 
              backgroundColor: 'var(--hub-card)', 
              borderRadius: '4px', 
              padding: '1px 4px', 
              color: 'var(--hub-text-muted)',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
               <span>{platform.cmd}</span>
               <span>K</span>
            </div>
          )}
        </button>

        <button
          type="button"
          title={`Assistente ${aiScope.shortLabel} (Ollama)`}
          aria-label={`Assistente de IA — ${aiScope.label}`}
          aria-pressed={isAiOpen}
          style={{
            width: '32px', height: '32px', borderRadius: '6px',
            background: isAiOpen ? `${aiScope.color}14` : 'transparent',
            border: isAiOpen ? `1px solid ${aiScope.color}55` : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: isAiOpen ? aiScope.color : '#4B5563',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
          className="hub-header-selector"
          onClick={toggleAi}
        >
          <Sparkles size={16} strokeWidth={2} />
        </button>

        <button
          ref={bellBtnRef}
          type="button"
          title="Notificações"
          aria-label={unreadCount > 0 ? `Notificações (${unreadCount} não lidas)` : 'Notificações'}
          style={{
            width: '32px', height: '32px', borderRadius: '6px',
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#4B5563', position: 'relative', flexShrink: 0,
            transition: 'all 0.15s ease', marginRight: '4px'
          }}
          className="hub-header-selector"
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(false);
            togglePanel();
          }}
        >
          <Bell size={16} strokeWidth={2} />
          {unreadCount > 0 ? <span style={styles.notificationBadge} aria-hidden /> : null}
        </button>
        <HubNotificationPanel anchorRef={bellBtnRef} />

        <div 
          ref={profilePopoverRef}
          style={{ ...styles.userProfile, ...styles.rightSectionProfile }}
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(!dropdownOpen);
          }}
        >
          <div style={{ ...styles.avatar, padding: 0, overflow: 'hidden', background: 'transparent' }}>
            <HubMasterAvatar size={32} borderRadius={8} />
          </div>
          
          {dropdownOpen && (
            <div className="hub-profile-dropdown" style={styles.dropdown} onClick={(e) => e.stopPropagation()}>
              <div className="hub-profile-dropdown-hero" style={styles.profileMenuHero}>
                <div style={{ ...styles.profileMenuAvatarLarge, padding: 0, overflow: 'hidden', background: 'transparent' }}>
                  <HubMasterAvatar size={48} borderRadius={14} />
                </div>
                <div style={styles.profileMenuHeroText}>
                  <div style={styles.profileMenuName}>{profile?.full_name || 'Administrador master'}</div>
                  <div style={styles.profileMenuEmail}>{profile?.email || '—'}</div>
                </div>
              </div>

              <div style={styles.dropdownScroll}>
                <div style={styles.dropdownSection}>
                  <div style={styles.dropdownSectionTitle}>Perfil</div>
                  <button type="button" className="hub-menu-row" style={styles.menuRow} onClick={() => { setDropdownOpen(false); navigate('/master/profile'); }}>
                    <User size={16} strokeWidth={2} color="#475569" />
                    <span style={styles.menuRowLabel}>Meu Perfil</span>
                  </button>
                  <button type="button" className="hub-menu-row" style={styles.menuRow} onClick={() => { setDropdownOpen(false); navigate('/master/settings'); }}>
                    <Settings size={16} strokeWidth={2} color="#475569" />
                    <span style={styles.menuRowLabel}>Configurações</span>
                  </button>
                  <button type="button" className="hub-menu-row" style={styles.menuRow} onClick={() => { setDropdownOpen(false); navigate('/master/settings?tab=notificacoes'); }}>
                    <Bell size={16} strokeWidth={2} color="#475569" />
                    <span style={styles.menuRowLabel}>Notificações</span>
                  </button>
                </div>

                <div className="hub-profile-divider" style={styles.divider} />

                <HubProfileThemePicker />

                <div className="hub-profile-divider" style={styles.divider} />

                <div style={styles.dropdownSection}>
                  <div style={styles.dropdownSectionTitle}>Acessos Rápidos</div>
                  <button type="button" className="hub-menu-row" style={styles.menuRow}>
                    <HelpCircle size={16} strokeWidth={2} color="#475569" />
                    <span style={styles.menuRowLabel}>Central de Ajuda</span>
                  </button>
                  <button type="button" className="hub-menu-row" style={styles.menuRow}>
                    <LifeBuoy size={16} strokeWidth={2} color="#475569" />
                    <span style={styles.menuRowLabel}>Suporte Master</span>
                  </button>
                  <button type="button" className="hub-menu-row" style={styles.menuRow}>
                    <BookOpen size={16} strokeWidth={2} color="#475569" />
                    <span style={styles.menuRowLabel}>Documentação Hub</span>
                  </button>
                </div>

                <div className="hub-profile-divider" style={styles.divider} />

                <button
                  type="button"
                  className="hub-menu-row-danger"
                  style={styles.menuRowDanger}
                  onClick={() => {
                    setDropdownOpen(false);
                    signOut();
                  }}
                >
                  <LogOut size={16} strokeWidth={2} color="#DC2626" />
                  <span style={styles.menuRowDangerLabel}>Sair do painel</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, any> = {
  header: {
    height: '56px',
    backgroundColor: 'var(--hub-header-bg)',
    borderBottom: '1px solid var(--hub-header-border)',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky' as const,
    top: 0,
    zIndex: 900,
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  leftSection: { display: 'flex', alignItems: 'center', gap: 0, flex: 1, minWidth: 0 },
  
  breadcrumbWrapper: { display: 'flex', alignItems: 'center', minWidth: 0 },
  breadcrumbContainer: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: '2px', minWidth: 0 },
  breadcrumbLink: {
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'color 0.15s ease',
  },

  rightSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flexShrink: 0,
    marginTop: 0,
    marginBottom: 0,
    boxSizing: 'border-box' as const,
  },
  rightSectionCollaborators: {
    display: 'flex',
    alignItems: 'center',
    marginRight: 4,
    flexShrink: 0,
  },
  rightSectionIconBtn: {
    marginLeft: 0,
  },
  rightSectionProfile: {
    marginLeft: 4,
  },
  iconAction: { 
    width: '36px', height: '36px', borderRadius: '8px', 
    backgroundColor: 'transparent', color: '#64748B', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    cursor: 'pointer', transition: 'background-color 0.15s ease, border-color 0.15s ease', border: '1px solid transparent',
    position: 'relative',
    fontSize: '13px',
    fontWeight: 600,
    padding: 0,
    boxSizing: 'border-box' as const,
  },
  notificationBadge: { position: 'absolute', top: '8px', right: '8px', width: '7px', height: '7px', backgroundColor: '#EF4444', borderRadius: '50%', border: '2px solid white' },
  kbdHint: { 
    position: 'absolute', 
    bottom: '-8px', 
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    backgroundColor: '#0F172A',
    padding: '2px 3px',
    borderRadius: '6px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
    zIndex: 10,
    border: '1px solid rgba(255,255,255,0.1)'
  },
  
  userProfile: {
    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
    padding: '4px', borderRadius: '24px', transition: 'all 0.2s',
    position: 'relative' as const,
  },
  avatar: {
    width: '32px', height: '32px', borderRadius: '8px',
    backgroundColor: '#0061FF', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '14px', boxShadow: 'none',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
  userName: { fontSize: '13px', fontWeight: '600', color: '#0F172A' },
  
  dropdown: {
    position: 'absolute' as const,
    top: 'calc(100% + 10px)',
    right: 0,
    width: 320,
    maxWidth: 'calc(100vw - 48px)',
    backgroundColor: 'var(--hub-card)',
    borderRadius: 14,
    border: '1px solid var(--hub-border)',
    boxShadow: 'var(--hub-shadow-dropdown)',
    padding: 8,
    zIndex: 1000,
    animation: 'hubProfileMenuIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  dropdownScroll: {
    maxHeight: '403px',
    overflowY: 'auto' as const,
    padding: '4px 4px 6px',
    scrollbarWidth: 'thin' as const,
  },
  profileMenuHero: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: 'var(--hub-bg-elevated)',
    backgroundImage: 'none',
    border: '1px solid var(--hub-border)',
  },
  profileMenuAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0061FF',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 18,
    flexShrink: 0,
    boxShadow: 'none',
  },
  profileMenuHeroText: { minWidth: 0, flex: 1 },
  profileMenuName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--hub-text-main)',
    letterSpacing: '-0.02em',
    lineHeight: 1.25,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  profileMenuEmail: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--hub-text-muted)',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  dropdownSection: { display: 'flex', flexDirection: 'column', gap: 2 },
  dropdownSectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--hub-text-subtle)',
    padding: '8px 10px 4px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },
  menuRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--hub-text-sec)',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },
  menuRowLabel: {
    fontSize: 12,
    fontWeight: 500,
    opacity: 0.88,
  },
  menuRowDangerLabel: {
    fontSize: 12,
    fontWeight: 500,
    opacity: 1,
  },
  menuRowHighlight: {
    backgroundColor: '#EFF6FF',
    color: '#0061FF',
  },
  menuRowDanger: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: 12,
    fontWeight: 500,
    color: '#DC2626',
        marginTop: 2,
    transition: 'background-color 0.15s ease',
  },
  divider: { height: 1, backgroundColor: 'var(--hub-border)', margin: '6px 6px' },
  menuBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px' },
};

if (typeof document !== 'undefined' && !document.getElementById('hub-profile-menu-keyframes')) {
  const s = document.createElement('style');
  s.id = 'hub-profile-menu-keyframes';
  s.textContent = `
    @keyframes hubProfileMenuIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .hub-menu-row span,
    .hub-menu-row-danger span {
      font-size: 12px !important;
      font-weight: 500 !important;
    }
    .hub-menu-row:hover { background-color: rgba(15, 23, 42, 0.04) !important; }
    .hub-menu-row-danger:hover { background-color: rgba(220, 38, 38, 0.08) !important; }
    .hub-header-selector {
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .hub-header-selector:hover {
      background-color: #F9FAFB !important;
    }
    .hub-header-project-item {
      transition: background-color 0.12s ease;
    }
    .hub-header-project-item:hover {
      background-color: #F3F4F6 !important;
    }
    .hub-header-connect-btn:hover {
      background-color: #F9FAFB !important;
      border-color: #D1D5DB !important;
    }
  `;
  document.head.appendChild(s);
}

export default Header;
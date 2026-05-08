import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Search, Bell, User, ChevronDown, 
  Settings, LogOut, Menu, ChevronRight,
  Shield, Database, Zap, HardDrive, Users, Brain,
  KeyRound, Webhook, ScrollText, Plug, UserCog, Calendar, MessageSquare, Activity
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import SyncIndicator from './SyncIndicator';

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
  const profilePopoverRef = useRef<HTMLDivElement>(null);
  const platform = getPlatform();

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = (e: MouseEvent) => {
      const el = profilePopoverRef.current;
      if (el && !el.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [dropdownOpen]);

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
      'ia-gateway': 'Gateway IA',
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
      'logdock': 'LogDock',
      zaptro: 'Zaptro',
      logta: 'Logta SaaS',
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

  const goAgenda = () => {
    const params = new URLSearchParams(location.search);
    params.set(MASTER_ROUTE_TOKEN_PARAM, getExpectedMasterRouteToken('/master/agenda'));
    navigate({ pathname: '/master/agenda', search: params.toString() });
  };

  const goHubChat = () => {
    const params = new URLSearchParams(location.search);
    params.set(MASTER_ROUTE_TOKEN_PARAM, getExpectedMasterRouteToken('/master/hubchat'));
    navigate({ pathname: '/master/hubchat', search: params.toString() });
  };

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        {isMobile && (
          <button style={styles.menuBtn} onClick={onMenuClick}>
            <Menu size={24} color="#0F172A" />
          </button>
        )}
        
        {/* BREADCRUMBS (Substituindo Pesquisa) */}
        <div style={styles.breadcrumbWrapper}>
          <div style={styles.breadcrumbSeparator} />
          <div style={styles.breadcrumbContainer}>
            <span style={styles.slash}>/</span>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <Link to={b.path} style={{
                  ...styles.breadcrumbLink,
                  fontWeight: i === breadcrumbs.length - 1 ? '800' : '700',
                  color: i === breadcrumbs.length - 1 ? '#0F172A' : '#64748B'
                }}>
                  {b.label}
                </Link>
                {i < breadcrumbs.length - 1 && <ChevronRight size={14} color="#CBD5E1" style={{ margin: '0 8px' }} />}
              </React.Fragment>
            ))}
            <div style={{ marginLeft: '16px' }}>
              <SyncIndicator />
            </div>
          </div>
        </div>
      </div>

      <div style={styles.rightSection}>
        {/* Collaborators Working Now */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }} title="8 colaboradores trabalhando agora">
          {[
            { img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80', name: 'Ana' },
            { img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80', name: 'Lucas' },
            { img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&q=80', name: 'Carla' },
            { img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80', name: 'Mateus' }
          ].map((collab, idx) => (
            <div
              key={idx}
              title={collab.name}
              style={{
                position: 'relative',
                marginLeft: idx === 0 ? '0' : '-8px',
                zIndex: 10 - idx,
              }}
            >
              <img
                src={collab.img}
                alt={collab.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: idx < 3 ? '#22C55E' : '#94A3B8',
                  border: '2px solid #FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#F1F5F9',
            border: '2px solid #FFFFFF',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginLeft: '-8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 800,
            color: '#475569',
            zIndex: 5
          }}>
            +8
          </div>
        </div>

        <button
          type="button"
          title="Agenda"
          aria-label="Abrir Agenda"
          style={{ ...styles.iconAction, border: 'none', flexShrink: 0 }}
          onClick={goAgenda}
        >
          <Calendar size={20} strokeWidth={2} color="#64748B" />
        </button>

        <button
          type="button"
          title="HubChat"
          aria-label="Abrir HubChat"
          style={{ ...styles.iconAction, border: 'none', flexShrink: 0 }}
          onClick={goHubChat}
        >
          <MessageSquare size={20} strokeWidth={2} color="#64748B" />
        </button>

        <button
          type="button"
          title="Busca (atalho)"
          aria-label="Abrir busca do hub"
          style={{ ...styles.iconAction, border: 'none', flexShrink: 0 }}
          onClick={() => (window as any).toggleSpotlight?.()}
        >
          <Search size={20} />
          <div style={styles.kbdHint}>
            <Kbd style={{ height: '16px', minWidth: '16px', fontSize: '11px', padding: '0 3px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', margin: 0 }}>{platform.cmd}</Kbd>
            <Kbd style={{ height: '16px', minWidth: '16px', fontSize: '11px', padding: '0 3px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', margin: 0 }}>K</Kbd>
          </div>
        </button>

        <button
          type="button"
          title="Notificações"
          aria-label="Notificações"
          style={{ ...styles.iconAction, border: 'none', flexShrink: 0 }}
          onClick={() => navigate('/master/notifications')}
        >
          <Bell size={20} />
          <div style={styles.notificationBadge} />
        </button>
        
        <div 
          ref={profilePopoverRef}
          style={styles.userProfile} 
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(!dropdownOpen);
          }}
        >
          <div style={styles.avatar}>
            {profile?.full_name ? profile.full_name[0] : <User size={18} />}
          </div>
          {!isMobile && (
            <div style={styles.userInfo}>
              <span style={styles.userName}>{(profile?.full_name || 'Admin').split(' ')[0]}</span>
              <ChevronDown size={14} color="#64748B" />
            </div>
          )}
          
          {dropdownOpen && (
            <div style={styles.dropdown} onClick={(e) => e.stopPropagation()}>
              <div style={styles.profileMenuHero}>
                <div style={styles.profileMenuAvatarLarge}>
                  {profile?.full_name ? profile.full_name[0] : <User size={20} />}
                </div>
                <div style={styles.profileMenuHeroText}>
                  <div style={styles.profileMenuName}>{profile?.full_name || 'Administrador master'}</div>
                  <div style={styles.profileMenuEmail}>{profile?.email || '—'}</div>
                </div>
              </div>

              <div style={styles.dropdownScroll}>
                <div style={styles.dropdownSection}>
                  <div style={styles.dropdownSectionTitle}>Conta</div>
                  <button type="button" className="hub-menu-row" style={styles.menuRow} onClick={() => { setDropdownOpen(false); navigate('/master/profile'); }}>
                    <User size={16} strokeWidth={2} color="#475569" />
                    <span>Meu perfil</span>
                  </button>
                  <button type="button" className="hub-menu-row" style={styles.menuRow} onClick={() => { setDropdownOpen(false); navigate('/master/settings'); }}>
                    <Settings size={16} strokeWidth={2} color="#475569" />
                    <span>Preferências e configurações</span>
                  </button>
                  <button type="button" className="hub-menu-row" style={styles.menuRow} onClick={() => { setDropdownOpen(false); navigate('/master/notifications'); }}>
                    <Bell size={16} strokeWidth={2} color="#475569" />
                    <span>Notificações</span>
                  </button>
                </div>

                <div style={styles.divider} />

                <div style={styles.dropdownSection}>
                  <div style={styles.dropdownSectionTitle}>Infraestrutura</div>
                  <button type="button" className="hub-menu-row" style={styles.menuRow} onClick={() => { setDropdownOpen(false); navigate('/master/infrastructure/saude'); }}>
                    <Activity size={16} strokeWidth={2} color="#475569" />
                    <span>Visão geral</span>
                  </button>
                  <button type="button" className="hub-menu-row" style={styles.menuRow} onClick={() => { setDropdownOpen(false); navigate('/master/infrastructure/seguranca'); }}>
                    <Shield size={16} strokeWidth={2} color="#475569" />
                    <span>Segurança</span>
                  </button>
                  <button type="button" className="hub-menu-row" style={styles.menuRow} onClick={() => { setDropdownOpen(false); navigate('/master/infrastructure/backup'); }}>
                    <HardDrive size={16} strokeWidth={2} color="#475569" />
                    <span>Backup & storage</span>
                  </button>
                </div>

                <div style={styles.divider} />

                <div style={styles.dropdownSection}>
                  <div style={styles.dropdownSectionTitle}>Equipe master</div>
                  <button type="button" className="hub-menu-row" style={styles.menuRow} onClick={() => { setDropdownOpen(false); const p = new URLSearchParams(location.search); p.set('tab', 'usuarios-hub'); const qs = p.toString(); navigate(`/master/settings/equipe${qs ? `?${qs}` : '?tab=usuarios-hub'}`); }}>
                    <Users size={16} strokeWidth={2} color="#475569" />
                    <span>Usuários Hub</span>
                  </button>
                  <button type="button" className="hub-menu-row" style={styles.menuRow} onClick={() => { setDropdownOpen(false); navigate('/master/settings/equipe'); }}>
                    <UserCog size={16} strokeWidth={2} color="#475569" />
                    <span>Equipe Master</span>
                  </button>
                </div>

                <div style={styles.divider} />

                <div style={styles.dropdownSection}>
                  <div style={styles.dropdownSectionTitle}>Outros produtos</div>
                  <button type="button" className="hub-menu-row" style={{ ...styles.menuRow, ...styles.menuRowHighlight }} onClick={() => { setDropdownOpen(false); navigate('/logdock/app'); }}>
                    <HardDrive size={16} strokeWidth={2} color="#0061FF" />
                    <span>LogDock.com.br (Focado)</span>
                  </button>
                  <button
                    type="button"
                    style={styles.menuRow}
                    onClick={() => {
                      setDropdownOpen(false);
                      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                      window.open(isLocal ? 'http://localhost:5174' : 'https://app.zaptro.com.br', '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <Zap size={16} strokeWidth={2} color="#475569" />
                    <span>Zaptro Commerce</span>
                  </button>
                </div>

                <div style={styles.divider} />

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
                  <span>Sair do painel</span>
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
    height: '80px',
    backgroundColor: 'transparent',
    borderBottom: 'none',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky' as const,
    top: 0,
    zIndex: 900,
    width: '100%',
  },
  leftSection: { display: 'flex', alignItems: 'center', gap: '24px', flex: 1 },
  
  breadcrumbWrapper: { display: 'flex', alignItems: 'center', gap: '20px' },
  breadcrumbSeparator: { width: '1px', height: '24px', backgroundColor: '#E2E8F0' },
  breadcrumbContainer: { display: 'flex', alignItems: 'center' },
  slash: { color: '#94A3B8', fontSize: '18px', fontWeight: '500', marginRight: '12px' },
  breadcrumbLink: { textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' },

  rightSection: { display: 'flex', alignItems: 'center', gap: '20px' },
  iconAction: { 
    width: '44px', height: '44px', borderRadius: '22px', 
    backgroundColor: '#F6F7F8', color: '#64748B', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #E5E7EB',
    position: 'relative',
    fontSize: '11px',
    padding: 0,
    boxSizing: 'border-box' as const,
  },
  notificationBadge: { position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', backgroundColor: '#EF4444', borderRadius: '50%', border: '2px solid white' },
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
    width: '44px', height: '44px', borderRadius: '22px',
    backgroundColor: '#0061FF', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', fontSize: '16px', boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)'
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
  userName: { fontSize: '11px', fontWeight: '700', color: '#0F172A' },
  
  dropdown: {
    position: 'absolute' as const,
    top: 'calc(100% + 10px)',
    right: 0,
    width: 320,
    maxWidth: 'calc(100vw - 48px)',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    border: '1px solid rgba(15, 23, 42, 0.08)',
    boxShadow:
      '0 0 0 1px rgba(15, 23, 42, 0.03), 0 4px 6px rgba(15, 23, 42, 0.04), 0 24px 48px -12px rgba(15, 23, 42, 0.18)',
    padding: 8,
    zIndex: 1000,
    animation: 'hubProfileMenuIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  dropdownScroll: {
    maxHeight: 'min(72vh, 520px)',
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
    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    border: '1px solid #E2E8F0',
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
    boxShadow: '0 8px 20px rgba(0, 97, 255, 0.25)',
  },
  profileMenuHeroText: { minWidth: 0, flex: 1 },
  profileMenuName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.02em',
    lineHeight: 1.25,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  profileMenuEmail: {
    fontSize: 12,
    fontWeight: 500,
    color: '#64748B',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  dropdownSection: { display: 'flex', flexDirection: 'column', gap: 2 },
  dropdownSectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#94A3B8',
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
    fontSize: 13,
    fontWeight: 600,
    color: '#334155',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s ease, color 0.15s ease',
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
    fontSize: 13,
    fontWeight: 700,
    color: '#DC2626',
    fontFamily: 'inherit',
    marginTop: 2,
    transition: 'background-color 0.15s ease',
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', margin: '6px 6px' },
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
    .hub-menu-row:hover { background-color: rgba(15, 23, 42, 0.04) !important; }
    .hub-menu-row-danger:hover { background-color: rgba(220, 38, 38, 0.08) !important; }
  `;
  document.head.appendChild(s);
}

export default Header;
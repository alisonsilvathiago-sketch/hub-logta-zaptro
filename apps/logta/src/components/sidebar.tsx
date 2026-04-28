import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Navigation } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { getSidebarNavForRole, type SidebarNavItem } from '../utils/logtaRbac';

/** Distância do cartão lateral à borda do ecrã. */
export const SIDEBAR_FLOAT_INSET_PX = 16;
/** Largura do cartão quando encolhido (só ícones). */
export const SIDEBAR_COLLAPSED_PX = 72;
/** Largura ao passar o rato (ícone + rótulo). */
export const SIDEBAR_EXPANDED_PX = 252;
/** Margem esquerda do conteúdo principal: inset + cartão + respiro até ao conteúdo. */
export const SIDEBAR_MAIN_OFFSET_PX = SIDEBAR_FLOAT_INSET_PX + SIDEBAR_COLLAPSED_PX + 16;

/** Cartão lateral — alinhado ao `--radius-xl` / módulos Logta */
const RADIUS_OUTER = 24;
const RADIUS_ITEM = 12;
const TEXT_MUTED = '#6B7280';
const MENU_PANEL_SHADOW =
  '0 22px 55px rgba(15, 23, 42, 0.08), 0 8px 22px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(148, 163, 184, 0.14)';
const TEXT_ACTIVE = '#FFFFFF';
const PILL_ACTIVE_BG = '#8B5CF6';
const LOGTA_TEXT = '#111827';
const PURPLE = '#8B5CF6';
const PURPLE_SOFT = 'rgba(139, 92, 246, 0.1)';
function NavIcon({ item }: { item: SidebarNavItem }) {
  const Cmp = (LucideIcons as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>>)[item.icon] ?? LucideIcons.Circle;
  return <Cmp size={20} strokeWidth={2} />;
}

const Sidebar: React.FC = () => {
  const [hovered, setHovered] = useState(false);
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = getSidebarNavForRole(profile?.role);
  const expanded = hovered;
  const width = expanded ? SIDEBAR_EXPANDED_PX : SIDEBAR_COLLAPSED_PX;
  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        left: SIDEBAR_FLOAT_INSET_PX,
        top: SIDEBAR_FLOAT_INSET_PX,
        bottom: SIDEBAR_FLOAT_INSET_PX,
        width,
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: 'transparent',
        borderRadius: RADIUS_OUTER,
        boxShadow: 'none',
        transition: 'width 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          borderRadius: RADIUS_OUTER,
          boxShadow: MENU_PANEL_SHADOW,
          transition: 'box-shadow 0.22s ease',
          border: '1px solid rgba(226, 232, 240, 0.95)',
        }}
      >
        {/* Logo no topo do painel — respiro moderado (evita 56px que empurrava o conteúdo) */}
        <div
          role="button"
          tabIndex={0}
          title="Logta — Início"
          onClick={() => navigate('/dashboard')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/dashboard');
            }
          }}
          style={{
            flexShrink: 0,
            marginTop: 18,
            marginBottom: 16,
            padding: expanded ? '0 12px' : '0 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: 12,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${PURPLE}, #a78bfa)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 6px 20px ${PURPLE_SOFT}`,
            }}
          >
            <Navigation size={22} color="#fff" strokeWidth={2.2} />
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: LOGTA_TEXT,
              letterSpacing: '-0.03em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? 200 : 0,
              transition: 'opacity 0.16s ease, max-width 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            Logta
          </span>
        </div>

      <nav
        style={{
          flex: 1,
          minHeight: 0,
          backgroundColor: '#FFFFFF',
          padding: expanded ? '0 12px 10px' : '0 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <div
              key={`${item.path}-${index}`}
              role="button"
              tabIndex={0}
              title={!expanded ? item.label : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(item.path);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: expanded ? 12 : 0,
                justifyContent: expanded ? 'flex-start' : 'center',
                padding: expanded ? '11px 14px' : '11px 10px',
                borderRadius: RADIUS_ITEM,
                cursor: 'pointer',
                color: isActive ? TEXT_ACTIVE : TEXT_MUTED,
                backgroundColor: isActive ? PILL_ACTIVE_BG : 'transparent',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: expanded ? '-0.01em' : 0,
                transition: 'background-color 0.18s ease, color 0.18s ease, transform 0.18s ease',
                flexShrink: 0,
                outline: 'none',
              }}
              onClick={() => navigate(item.path)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                  e.currentTarget.style.color = '#111827';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = TEXT_MUTED;
                }
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                }}
              >
                <NavIcon item={item} />
              </span>
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  opacity: expanded ? 1 : 0,
                  maxWidth: expanded ? 200 : 0,
                  transition: 'opacity 0.16s ease, max-width 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </nav>

      <div
        style={{
          padding: expanded ? '10px 12px 14px' : '10px 10px 14px',
          borderTop: '1px solid #f1f5f9',
          flexShrink: 0,
          backgroundColor: '#FFFFFF',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          title={!expanded ? 'Sair da Conta' : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              void signOut();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: expanded ? 12 : 0,
            justifyContent: expanded ? 'flex-start' : 'center',
            padding: expanded ? '11px 14px' : '11px 10px',
            borderRadius: RADIUS_ITEM,
            cursor: 'pointer',
            color: TEXT_MUTED,
            fontWeight: 600,
            fontSize: 14,
            transition: 'background-color 0.18s ease, color 0.18s ease',
          }}
          onClick={() => void signOut()}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2';
            e.currentTarget.style.color = '#b91c1c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = TEXT_MUTED;
          }}
        >
          <span style={{ flexShrink: 0, width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <LogOut size={20} strokeWidth={2} />
          </span>
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? 200 : 0,
              transition: 'opacity 0.16s ease, max-width 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            Sair da Conta
          </span>
        </div>
      </div>
      </div>
    </aside>
  );
};

export default Sidebar;

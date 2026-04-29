import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { LogOut, Sparkles, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSidebarNavForRole, type SidebarNavItem } from '../utils/logtaRbac';

/** Distância do cartão lateral à borda do ecrã. */
export const SIDEBAR_FLOAT_INSET_PX = 16;
/** Largura do cartão quando encolhido (só ícones). */
export const SIDEBAR_COLLAPSED_PX = 82;
/** Largura ao passar o rato (ícone + rótulo). */
export const SIDEBAR_EXPANDED_PX = 260;
/** Margem esquerda do conteúdo principal: inset + cartão + respiro até ao conteúdo. */
export const SIDEBAR_MAIN_OFFSET_PX = SIDEBAR_FLOAT_INSET_PX + SIDEBAR_COLLAPSED_PX + 16;

const PANEL_RADIUS = 24;
const ITEM_RADIUS = 12;
const PANEL_BG = '#0a0a10';
const PANEL_BG_ALT = '#121222';
const PANEL_BORDER = 'rgba(255,255,255,0.08)';
const PURPLE = '#8b5cf6';
const PURPLE_SOFT = 'rgba(139,92,246,0.22)';
const TEXT_MAIN = '#f8f8ff';
const TEXT_MUTED = '#a2a0c2';

function NavIcon({ item }: { item: SidebarNavItem }) {
  const Cmp = (LucideIcons as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>>)[item.icon] ?? LucideIcons.Circle;
  return <Cmp size={18} strokeWidth={2.1} />;
}

const Sidebar: React.FC = () => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const menuItems = getSidebarNavForRole(profile?.role);
  const expanded = hovered;
  const width = expanded ? SIDEBAR_EXPANDED_PX : SIDEBAR_COLLAPSED_PX;

  const fullName = profile?.full_name?.trim() || 'Operador';
  const firstName = useMemo(() => fullName.split(/\s+/)[0], [fullName]);
  const roleLabel = profile?.role?.replaceAll('_', ' ') || 'broker';

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
        zIndex: 1200,
        borderRadius: PANEL_RADIUS,
        overflow: 'hidden',
        border: `1px solid ${PANEL_BORDER}`,
        background: `linear-gradient(165deg, ${PANEL_BG} 0%, ${PANEL_BG_ALT} 100%)`,
        boxShadow: '0 22px 60px rgba(2, 6, 23, 0.5)',
        transition: 'width 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        role="button"
        tabIndex={0}
        title={!expanded ? 'Dashboard' : undefined}
        onClick={() => navigate('/dashboard')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigate('/dashboard');
          }
        }}
        style={{
          margin: '14px 10px 10px',
          borderRadius: 14,
          minHeight: 54,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'flex-start' : 'center',
          gap: 12,
          padding: expanded ? '0 14px' : '0 12px',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            background: `linear-gradient(135deg, ${PURPLE} 0%, #a78bfa 100%)`,
            boxShadow: `0 10px 25px ${PURPLE_SOFT}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={16} color="#fff" />
        </div>
        <div
          style={{
            minWidth: 0,
            opacity: expanded ? 1 : 0,
            maxWidth: expanded ? 170 : 0,
            overflow: 'hidden',
            transition: 'opacity 0.18s ease, max-width 0.25s ease',
          }}
        >
          <p style={{ margin: 0, color: TEXT_MAIN, fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>Logta</p>
          <p style={{ margin: 0, color: TEXT_MUTED, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Black Purple UI</p>
        </div>
      </div>

      <nav
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: expanded ? '8px 10px' : '8px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <button
              key={item.path}
              type="button"
              title={!expanded ? item.label : undefined}
              onClick={() => navigate(item.path)}
              style={{
                position: 'relative',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: expanded ? 'flex-start' : 'center',
                gap: 12,
                minHeight: 44,
                borderRadius: ITEM_RADIUS,
                padding: expanded ? '0 13px' : 0,
                background: isActive ? `linear-gradient(135deg, ${PURPLE} 0%, #6d28d9 100%)` : 'transparent',
                color: isActive ? '#fff' : TEXT_MUTED,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13.5,
                fontWeight: 700,
                boxShadow: isActive ? '0 10px 24px rgba(124,58,237,0.3)' : 'none',
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    left: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 4,
                    height: 22,
                    borderRadius: 4,
                    backgroundColor: '#f8f8ff',
                    opacity: 0.75,
                  }}
                />
              )}
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, flexShrink: 0 }}>
                <NavIcon item={item} />
              </span>
              <span
                style={{
                  opacity: expanded ? 1 : 0,
                  maxWidth: expanded ? 170 : 0,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.18s ease, max-width 0.25s ease',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div
        style={{
          padding: expanded ? '12px 10px 12px' : '12px 8px 12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          background: 'rgba(10,10,16,0.75)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: 10,
            padding: expanded ? '0 10px' : '0 6px',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #27272a 0%, #09090b 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ede9fe',
              fontSize: 12,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {firstName.slice(0, 1).toUpperCase()}
          </div>
          <div
            style={{
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? 160 : 0,
              overflow: 'hidden',
              transition: 'opacity 0.18s ease, max-width 0.25s ease',
            }}
          >
            <p style={{ margin: 0, color: TEXT_MAIN, fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>{firstName}</p>
            <p style={{ margin: 0, color: TEXT_MUTED, fontSize: 10, fontWeight: 600, textTransform: 'lowercase', whiteSpace: 'nowrap' }}>
              {roleLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          title={!expanded ? 'Sair' : undefined}
          onClick={() => void signOut()}
          style={{
            border: 'none',
            borderRadius: 12,
            minHeight: 42,
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: 10,
            color: '#fca5a5',
            background: 'rgba(239,68,68,0.1)',
            padding: expanded ? '0 12px' : 0,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <LogOut size={16} />
          <span
            style={{
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? 120 : 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.18s ease, max-width 0.25s ease',
            }}
          >
            Sair
          </span>
        </button>
      </div>
      <button
        type="button"
        aria-label="Expandir menu"
        style={{
          position: 'absolute',
          top: 14,
          right: 10,
          width: 26,
          height: 26,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.14)',
          backgroundColor: 'rgba(255,255,255,0.06)',
          color: '#c4b5fd',
          display: expanded ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Menu size={14} />
      </button>
    </aside>
  );
};

export default Sidebar;
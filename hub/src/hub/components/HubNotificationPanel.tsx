import React from 'react';
import { Bell, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHubMasterNotifications } from '@hub/context/HubMasterNotificationsContext';
import {
  HUB_NOTIFICATION_CATEGORY_LABELS,
  HUB_NOTIFICATION_SOURCE_LABELS,
  categoryIcon,
  formatNotificationTime,
  type HubMasterNotification,
} from '@hub/lib/hubMasterNotifications';

type HubNotificationPanelProps = {
  anchorRef: React.RefObject<HTMLElement | null>;
};

const GRAY = {
  surface: '#FAFAFA',
  surfaceUnread: '#F5F5F5',
  border: '#E5E7EB',
  borderUnread: '#D4D4D4',
  text: '#171717',
  muted: '#737373',
  subtle: '#A3A3A3',
  iconBg: '#EFEFEF',
  icon: '#525252',
};

function notificationItemStyle(read: boolean): React.CSSProperties {
  return {
    ...itemBtn,
    background: read ? GRAY.surface : GRAY.surfaceUnread,
    borderColor: read ? GRAY.border : GRAY.borderUnread,
  };
}

const HubNotificationPanel: React.FC<HubNotificationPanelProps> = ({ anchorRef }) => {
  const navigate = useNavigate();
  const {
    items,
    unreadCount,
    loading,
    panelOpen,
    setPanelOpen,
    markAllAsRead,
    openNotification,
  } = useHubMasterNotifications();

  if (!panelOpen) return null;

  const rect = anchorRef.current?.getBoundingClientRect();
  const top = (rect?.bottom ?? 56) + 8;
  const right = Math.max(12, window.innerWidth - (rect?.right ?? window.innerWidth - 16));

  const renderItem = (n: HubMasterNotification) => {
    const Icon = categoryIcon(n.category);
    return (
      <button
        key={n.id}
        type="button"
        onClick={() => openNotification(n)}
        style={notificationItemStyle(n.read)}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: GRAY.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={16} color={GRAY.icon} />
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: n.read ? 600 : 700,
                color: GRAY.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {n.title}
            </span>
            {!n.read ? (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#EF4444',
                  flexShrink: 0,
                }}
              />
            ) : null}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: GRAY.muted,
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {n.message}
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 8,
              alignItems: 'center',
            }}
          >
            <span style={metaChip}>{HUB_NOTIFICATION_SOURCE_LABELS[n.source]}</span>
            <span style={metaChip}>{HUB_NOTIFICATION_CATEGORY_LABELS[n.category]}</span>
            <span style={metaChip}>{n.priority}</span>
            <span style={{ fontSize: 11, color: GRAY.subtle, marginLeft: 'auto' }}>
              {formatNotificationTime(n.createdAt)}
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
      <button
        type="button"
        aria-label="Fechar painel de notificações"
        onClick={() => setPanelOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1200,
          border: 'none',
          background: 'transparent',
          cursor: 'default',
        }}
      />
      <div
        role="dialog"
        aria-label="Notificações do ecossistema"
        style={{
          position: 'fixed',
          top,
          right,
          width: 'min(420px, calc(100vw - 24px))',
          maxHeight: 'min(560px, calc(100vh - 80px))',
          zIndex: 1210,
          background: 'var(--hub-card, #FFFFFF)',
          border: '1px solid var(--hub-border, #E5E7EB)',
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: GRAY.text }}>Notificações</div>
              <div style={{ fontSize: 12, color: GRAY.muted, marginTop: 2 }}>
                {unreadCount > 0 ? `${unreadCount} não lidas` : 'Tudo em dia'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {unreadCount > 0 ? (
                <button type="button" onClick={markAllAsRead} title="Marcar todas como lidas" style={panelBtn}>
                  <CheckCheck size={16} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setPanelOpen(false);
                  navigate('/master/settings?tab=notificacoes');
                }}
                title="Central completa"
                style={panelBtn}
              >
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 12px' }}>
          {loading ? (
            <div style={emptyState}>
              <Loader2 size={20} className="animate-spin" color={GRAY.muted} />
              <span>Carregando feed…</span>
            </div>
          ) : items.length === 0 ? (
            <div style={emptyState}>
              <Bell size={24} color="#D4D4D4" />
              <span>Nenhuma notificação.</span>
            </div>
          ) : (
            items.map(renderItem)
          )}
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid #F0F0F0', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => {
              setPanelOpen(false);
              navigate('/master/settings?tab=notificacoes');
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              background: '#F5F5F5',
              fontSize: 13,
              fontWeight: 600,
              color: GRAY.text,
              cursor: 'pointer',
            }}
          >
            Ver histórico completo
          </button>
        </div>
      </div>
    </>
  );
};

const panelBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  background: '#FAFAFA',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#525252',
};

const itemBtn: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  gap: 12,
  padding: 14,
  marginBottom: 8,
  borderRadius: 12,
  border: '1px solid',
  cursor: 'pointer',
  textAlign: 'left',
  boxSizing: 'border-box',
  fontSize: 14,
};

const metaChip: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#A3A3A3',
};

const emptyState: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '48px 16px',
  color: '#A3A3A3',
  fontSize: 13,
  fontWeight: 500,
};

export default HubNotificationPanel;

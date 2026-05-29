import React from 'react';
import { X } from 'lucide-react';
import { useHubMasterNotifications } from '@hub/context/HubMasterNotificationsContext';
import {
  HUB_NOTIFICATION_SOURCE_LABELS,
  categoryIcon,
  formatNotificationTime,
} from '@hub/lib/hubMasterNotifications';

const HubNotificationToastStack: React.FC = () => {
  const { incomingToasts, openNotification, dismissToast } = useHubMasterNotifications();

  if (incomingToasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 72,
        right: 20,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 'min(380px, calc(100vw - 32px))',
        pointerEvents: 'none',
      }}
    >
      {incomingToasts.map((n) => {
        const Icon = categoryIcon(n.category);
        return (
          <div
            key={n.id}
            role="status"
            style={{
              pointerEvents: 'auto',
              background: 'var(--hub-toast-surface)',
              color: 'var(--hub-toast-text)',
              borderRadius: 24,
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
              padding: '16px',
              width: 360,
              maxWidth: 'min(360px, calc(100vw - 32px))',
              animation: 'hubNotifToastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
            }}
            onClick={() => openNotification(n)}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#EFEFEF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color="#525252" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--hub-text-muted)', letterSpacing: '0.04em' }}>
                    NOVA · {HUB_NOTIFICATION_SOURCE_LABELS[n.source]}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--hub-text-subtle)' }}>{formatNotificationTime(n.createdAt)}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--hub-toast-text)', marginTop: 4, lineHeight: 1.3 }}>
                  {n.title}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--hub-text-muted)', lineHeight: 1.45 }}>{n.message}</p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(n.id);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 2,
                  cursor: 'pointer',
                  color: 'var(--hub-text-subtle)',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes hubNotifToastIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default HubNotificationToastStack;

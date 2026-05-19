import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type LogtaToastType = 'success' | 'error' | 'warning' | 'info';

export type LogtaToastItem = {
  id: string;
  type: LogtaToastType;
  message: string;
  title: string;
};

const GRAY = {
  surface: '#FAFAFA',
  surfaceUnread: '#F5F5F5',
  border: '#E5E7EB',
  borderUnread: '#D4D4D4',
  text: '#171717',
  muted: '#737373',
  iconBg: '#EFEFEF',
  icon: '#525252',
};

const icons: Record<LogtaToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} color={GRAY.icon} />,
  error: <AlertCircle size={18} color="#EF4444" />,
  warning: <AlertTriangle size={18} color="#F59E0B" />,
  info: <Info size={18} color={GRAY.icon} />,
};

function ToastCard({ toast, onClose }: { toast: LogtaToastItem; onClose: () => void }) {
  const [exiting, setExiting] = useState(false);

  const close = () => {
    setExiting(true);
    window.setTimeout(onClose, 280);
  };

  return (
    <div
      role="status"
      className={`logta-toast-item ${exiting ? 'logta-toast-exit' : 'logta-toast-enter'}`}
      style={{
        pointerEvents: 'auto',
        width: 360,
        maxWidth: 'min(360px, calc(100vw - 32px))',
        padding: 16,
        borderRadius: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: GRAY.surfaceUnread,
        border: `1px solid ${GRAY.borderUnread}`,
        boxShadow: 'none',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          background: GRAY.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icons[toast.type]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GRAY.muted, marginBottom: 2 }}>{toast.title}</div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: GRAY.text, lineHeight: 1.4 }}>{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Fechar"
        style={{
          border: 'none',
          background: 'rgba(0,0,0,0.05)',
          borderRadius: 8,
          padding: 4,
          cursor: 'pointer',
          color: GRAY.muted,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function LogtaToastStack({ toasts, onDismiss }: { toasts: LogtaToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="logta-toast-stack"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 12,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

export function LogtaNotificationPanel({
  open,
  onClose,
  notifications,
  onOpenSettings,
}: {
  open: boolean;
  onClose: () => void;
  notifications: Array<{
    id: string;
    type: LogtaToastType;
    title: string;
    message: string;
    time: string;
    read: boolean;
  }>;
  onOpenSettings?: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar notificações"
        onClick={onClose}
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
        aria-label="Notificações Logta"
        style={{
          position: 'fixed',
          top: 88,
          right: 24,
          width: 'min(400px, calc(100vw - 32px))',
          maxHeight: 'min(520px, calc(100vh - 120px))',
          zIndex: 1210,
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: GRAY.text }}>Notificações</div>
          <div style={{ fontSize: 12, color: GRAY.muted, marginTop: 2 }}>
            {notifications.filter((n) => !n.read).length > 0
              ? `${notifications.filter((n) => !n.read).length} não lidas`
              : 'Tudo em dia'}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {notifications.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 32, color: GRAY.muted, fontSize: 13 }}>Nenhuma notificação.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 14,
                  marginBottom: 8,
                  borderRadius: 12,
                  border: `1px solid ${n.read ? GRAY.border : GRAY.borderUnread}`,
                  background: n.read ? GRAY.surface : GRAY.surfaceUnread,
                  cursor: 'pointer',
                }}
                onClick={onClose}
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
                  {icons[n.type]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: n.read ? 600 : 700, color: GRAY.text }}>{n.title}</span>
                    {!n.read ? (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                    ) : null}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: GRAY.muted, lineHeight: 1.45 }}>{n.message}</p>
                  <span style={{ fontSize: 11, color: '#A3A3A3', marginTop: 6, display: 'block' }}>{n.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
        {onOpenSettings ? (
          <div style={{ padding: '10px 14px', borderTop: '1px solid #F0F0F0' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
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
              Ver todas em Configurações
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export interface LogstokaBannerData {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  actionPath?: string;
  dismissible?: boolean;
  autoDismissMs?: number;
}

const LogstokaGlobalNotificationBanner: React.FC = () => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<LogstokaBannerData | null>(null);

  useEffect(() => {
    const handleShow = (e: Event) => {
      const data = (e as CustomEvent<LogstokaBannerData>).detail;
      const notifId = data.id || `notif-${Date.now()}`;
      setNotification({
        ...data,
        id: notifId,
        dismissible: data.dismissible ?? true,
      });

      // Auto-dismiss success or info after 8 seconds unless custom/persistent
      const delay = data.autoDismissMs ?? (data.type === 'error' ? 0 : 8000);
      if (delay > 0) {
        const timer = window.setTimeout(() => {
          setNotification((prev) => (prev?.id === notifId ? null : prev));
        }, delay);
        return () => window.clearTimeout(timer);
      }
    };

    window.addEventListener('logstoka:show-banner', handleShow);
    return () => window.removeEventListener('logstoka:show-banner', handleShow);
  }, []);

  if (!notification) return null;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotification(null);
  };

  const handleBannerClick = () => {
    if (notification.actionPath) {
      navigate(notification.actionPath);
      setNotification(null);
    }
  };

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
  }[notification.type];

  const styles = {
    success: {
      container: 'border-orange-200 bg-orange-50/70 text-orange-950 hover:bg-orange-50/90 cursor-pointer',
      icon: 'text-orange-600',
    },
    error: {
      container: 'border-red-200 bg-red-50/70 text-red-950 hover:bg-red-50/90 cursor-pointer',
      icon: 'text-red-600',
    },
    warning: {
      container: 'border-amber-200 bg-amber-50/70 text-amber-950 hover:bg-amber-50/90 cursor-pointer',
      icon: 'text-amber-600',
    },
    info: {
      container: 'border-blue-200 bg-blue-50/70 text-blue-950 hover:bg-blue-50/90 cursor-pointer',
      icon: 'text-blue-600',
    },
  }[notification.type];

  return (
    <div className="px-6 pt-4 pb-2 select-none animate-fade-in-down w-full">
      <div
        role="alert"
        onClick={handleBannerClick}
        className={`flex items-start gap-4 rounded-[22px] border px-5 py-3.5 transition-all w-full relative ${styles.container}`}
      >
        <span className={`shrink-0 mt-0.5 ${styles.icon}`}>
          <Icon size={20} strokeWidth={2.25} />
        </span>
        <div className="flex-1 pr-8">
          <h4 className="font-extrabold text-[14px] leading-tight mb-1">{notification.title}</h4>
          <p className="text-[13px] font-semibold opacity-85 leading-normal">{notification.description}</p>
        </div>
        {notification.dismissible !== false ? (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar notificação"
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95 transition-all p-0.5 rounded-full"
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default LogstokaGlobalNotificationBanner;

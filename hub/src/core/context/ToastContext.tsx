import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="hub-toast-container" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
            index={index}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void; index: number }> = ({
  toast,
  onClose,
  index,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: <CheckCircle2 size={20} color="var(--hub-accent-blue, #0061FF)" />,
    error: <AlertCircle size={20} color="#EF4444" />,
    warning: <AlertTriangle size={20} color="#F59E0B" />,
    info: <Info size={20} color="var(--hub-accent-blue, #0061FF)" />,
  };

  return (
    <div
      className={`hub-toast-item hub-toast-item--${toast.type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ zIndex: 1000 - index }}
      role="status"
    >
      <div className="hub-toast-item__icon">{icons[toast.type]}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="hub-toast-item__message">{toast.message}</p>
      </div>

      <button type="button" onClick={handleClose} className="hub-toast-item__close" aria-label="Fechar">
        <X size={16} />
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

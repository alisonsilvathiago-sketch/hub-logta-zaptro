import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* TOAST CONTAINER */}
      <div style={styles.container}>
        {toasts.map((toast, index) => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onClose={() => removeToast(toast.id)} 
            index={index}
          />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toast-slide-in {
          from { transform: translateX(120%) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes toast-slide-out {
          from { transform: translateX(0) scale(1); opacity: 1; }
          to { transform: translateX(120%) scale(0.9); opacity: 0; }
        }
        .toast-enter { animation: toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void; index: number }> = ({ toast, onClose, index }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: <CheckCircle2 size={20} color="#10B981" />,
    error: <AlertCircle size={20} color="#EF4444" />,
    warning: <AlertTriangle size={20} color="#F59E0B" />,
    info: <Info size={20} color="#6366F1" />
  };

  const colors = {
    success: { border: '#D1FAE5', bg: '#F0FDF4' },
    error: { border: '#FEE2E2', bg: '#FEF2F2' },
    warning: { border: '#FEF3C7', bg: '#FFFBEB' },
    info: { border: '#E0E7FF', bg: '#EEF2FF' }
  };

  const config = colors[toast.type];

  return (
    <div 
      className="toast-enter"
      style={{
        ...styles.toast,
        backgroundColor: 'white',
        border: `1px solid ${config.border}`,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: isExiting ? 'toast-slide-out 0.3s ease-in forwards' : undefined,
        zIndex: 1000 - index
      }}
    >
      <div style={{
        ...styles.iconWrapper,
        backgroundColor: config.bg
      }}>
        {icons[toast.type]}
      </div>
      
      <div style={styles.content}>
        <p style={styles.message}>{toast.message}</p>
      </div>

      <button onClick={handleClose} style={styles.closeBtn}>
        <X size={16} color="#94A3B8" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

const styles: Record<string, any> = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: '12px',
    zIndex: 9999,
    pointerEvents: 'none'
  },
  toast: {
    pointerEvents: 'auto',
    width: '360px',
    padding: '16px',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    position: 'relative'
  },
  iconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  content: {
    flex: 1
  },
  message: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: '1.4'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s'
  }
};

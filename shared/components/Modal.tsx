import React from 'react';
import { X, Loader2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; 
  padding?: string;
  hideHeader?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    danger?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  icon, 
  children, 
  size = 'md',
  padding = '32px',
  hideHeader = false,
  primaryAction,
  secondaryAction
}) => {
  if (!isOpen) return null;

  const getWidth = () => {
    switch(size) {
      case 'sm': return '440px';
      case 'md': return '640px';
      case 'lg': return '840px';
      case 'xl': return '1100px';
      case 'full': return '95vw';
      default: return '640px';
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          background: '#fff',
          borderRadius: '32px', 
          width: '100%',
          maxWidth: getWidth(),
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255,255,255,0.1)',
          position: 'relative',
          animation: 'modalSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          border: '1px solid var(--border)'
        }}
      >
        {!hideHeader && (
          <div style={{
            background: '#FFFFFF',
            padding: '32px',
            borderBottom: '1px solid var(--border)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexShrink: 0
          }}>
            {icon && (
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'var(--bg-active)',
                color: '#6366F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 8px 16px rgba(99, 102, 241, 0.1)'
              }}>
                {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 24 }) : icon}
              </div>
            )}
            
            <div style={{ flex: 1 }}>
              <h2 style={{ 
                fontSize: '22px', 
                fontWeight: '700', 
                color: '#1E1B4B', 
                margin: 0, 
                letterSpacing: '-0.4px'
              }}>
                {title}
              </h2>
              {subtitle && (
                <p style={{ color: '#64748B', fontSize: '14px', margin: '4px 0 0', fontWeight: '500', letterSpacing: '0.2px' }}>
                  {subtitle}
                </p>
              )}
            </div>

            <button 
              onClick={onClose}
              style={{
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border)',
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                cursor: 'pointer',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              className="hover-scale"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}

        <div style={{ 
          padding: padding, 
          overflowY: 'auto',
          flex: 1,
          background: '#fff'
        }}>
          {children}
        </div>

        {(primaryAction || secondaryAction) && (
          <div style={{
            padding: '24px 32px 32px',
            background: 'var(--bg-overlay)',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            flexShrink: 0,
            borderTop: '1px solid var(--border)'
          }}>
            {secondaryAction && (
              <button 
                onClick={secondaryAction.onClick}
                style={{
                  padding: '12px 24px',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: '#fff',
                  color: '#64748B',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.2px'
                }}
                className="hover-scale"
              >
                {secondaryAction.label}
              </button>
            )}
            
            {primaryAction && (
              <button 
                onClick={primaryAction.onClick}
                disabled={primaryAction.loading || primaryAction.disabled}
                style={{
                  padding: '12px 28px',
                  borderRadius: '16px',
                  border: 'none',
                  background: primaryAction.danger ? '#EF4444' : '#6366F1',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: (primaryAction.loading || primaryAction.disabled) ? 'not-allowed' : 'pointer',
                  boxShadow: primaryAction.danger ? '0 10px 20px rgba(239,68,68,0.25)' : '0 10px 20px rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: (primaryAction.loading || primaryAction.disabled) ? 0.7 : 1,
                  transition: 'all 0.2s',
                  letterSpacing: '0.3px'
                }}
                className="hover-scale"
              >
                {primaryAction.loading ? <Loader2 className="animate-spin" size={18} /> : primaryAction.label}
              </button>
            )}
          </div>
        )}

        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .hover-scale:hover { transform: scale(1.02); filter: brightness(1.05); }
          .hover-scale:active { transform: scale(0.98); }
        `}</style>
      </div>
    </div>
  );
};

export default Modal;


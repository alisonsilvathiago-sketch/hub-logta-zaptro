import React from 'react';
import { X, Loader2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  padding?: string;
  hideTitle?: boolean; // Nova prop para remover o texto do header azul
  width?: string;      // Alias para maxWidth
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
  maxWidth = '1100px', // Landscape por padrão
  width,               // Alias para maxWidth
  padding = '32px',   // Padding interno para respiro
  hideTitle = false,
  primaryAction,
  secondaryAction
}) => {
  if (!isOpen) return null;

  const actualMaxWidth = width || maxWidth;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(10px)',
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
          borderRadius: '28px', 
          width: '100%',
          maxWidth: actualMaxWidth,
          boxShadow: '0 40px 80px -12px rgba(0,0,0,0.3)',
          position: 'relative',
          animation: 'modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* HEADER SECTION - THE PREMIUM BLUE STRIP */}
        <div style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #1E1B4B 100%)',
          padding: '24px 32px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          flexShrink: 0
        }}>
          {!hideTitle && (
            <>
              {icon && (
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
                }}>
                  {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 24 }) : icon}
                </div>
              )}
              
              <div style={{ flex: 1 }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '800', 
                  color: '#fff', 
                  margin: 0, 
                  letterSpacing: '-0.02em'
                }}>
                  {title}
                </h2>
                {subtitle && (
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '4px 0 0', fontWeight: '500' }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </>
          )}

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* CONTENT SECTION */}
        <div style={{ 
          padding: padding, 
          overflowY: 'auto',
          flex: 1,
          background: '#fff'
        }}>
          {children}
        </div>

        {/* FOOTER SECTION */}
        {(primaryAction || secondaryAction) && (
          <div style={{
            padding: '0 24px 24px',
            background: '#fff',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end', // Alinhado à direita para ser mais "Landscape"
            flexShrink: 0
          }}>
            {secondaryAction && (
              <button 
                onClick={secondaryAction.onClick}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#fff',
                  color: '#64748B',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {secondaryAction.label}
              </button>
            )}
            
            {primaryAction && (
              <button 
                onClick={primaryAction.onClick}
                disabled={primaryAction.loading || primaryAction.disabled}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: primaryAction.danger ? '#EF4444' : 'linear-gradient(135deg, #6366F1 0%, #0F172A 100%)',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: (primaryAction.loading || primaryAction.disabled) ? 'not-allowed' : 'pointer',
                  boxShadow: primaryAction.danger ? '0 4px 12px rgba(239,68,68,0.2)' : '0 4px 12px rgba(99,102,241,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: (primaryAction.loading || primaryAction.disabled) ? 0.7 : 1
                }}
              >
                {primaryAction.loading ? <Loader2 className="animate-spin" size={16} /> : primaryAction.label}
              </button>
            )}
          </div>
        )}

        <style>{`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
};

export default Modal;


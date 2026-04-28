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
  maxWidth = '600px', // Reduzido para ser mais compacto
  padding = '24px',   // Padding interno reduzido
  hideTitle = false,
  primaryAction,
  secondaryAction
}) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.4)', // Menos opaco para ser mais leve
        backdropFilter: 'blur(8px)',
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
          borderRadius: '24px', // Mais moderno e compacto
          width: '100%',
          maxWidth: maxWidth,
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)',
          position: 'relative',
          animation: 'modalFadeIn 0.3s ease-out',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh'
        }}
      >
        {/* HEADER SECTION - THE PREMIUM BLUE STRIP (Finer now) */}
        <div style={{
          background: 'linear-gradient(135deg, #6366F1 0%, #0F172A 100%)',
          padding: hideTitle ? '12px 24px' : '20px 24px', // Faixa mais fina
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0
        }}>
          {!hideTitle && (
            <>
              {icon && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 18 }) : icon}
                </div>
              )}
              
              <div style={{ flex: 1 }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '800', 
                  color: '#fff', 
                  margin: 0, 
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {title}
                </h2>
                {subtitle && (
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: 0, fontWeight: '500' }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </>
          )}

          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '50%',
              right: '20px',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <X size={18} strokeWidth={2.5} />
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


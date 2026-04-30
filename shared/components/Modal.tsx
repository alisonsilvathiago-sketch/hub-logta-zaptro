import React from 'react';
import { X, Loader2 } from 'lucide-react';
import Button from './Button';
import Kbd from './Kbd';
import { getPlatform } from '../lib/platform';

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
  hideTitle?: boolean;
  maxWidth?: string;
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
  hideTitle = false,
  maxWidth,
  primaryAction,
  secondaryAction
}) => {
  const platform = getPlatform();
  if (!isOpen) return null;

  const getWidth = () => {
    if (maxWidth) return maxWidth;
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
              {!hideTitle && (
                <h2 style={{ 
                  fontSize: '22px', 
                  fontWeight: '700', 
                  color: '#1E1B4B', 
                  margin: 0, 
                  letterSpacing: '-0.4px'
                }}>
                  {title}
                </h2>
              )}
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
                width: 'auto',
                height: '36px',
                padding: '0 12px',
                borderRadius: '12px',
                cursor: 'pointer',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              className="hover-scale"
            >
              <Kbd style={{ fontSize: '9px', padding: '0 4px', height: '18px', minWidth: '18px' }}>Esc</Kbd>
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
              <Button 
                variant="secondary"
                label={secondaryAction.label}
                onClick={secondaryAction.onClick}
              />
            )}
            
            {primaryAction && (
              <Button 
                variant={primaryAction.danger ? 'danger' : 'primary'}
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{primaryAction.label}</span>
                    <div style={{ display: 'flex', gap: '2px', opacity: 0.8 }}>
                      <Kbd style={{ height: '16px', minWidth: '16px', fontSize: '9px', padding: '0 4px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF' }}>{platform.cmd}</Kbd>
                      <Kbd style={{ height: '16px', minWidth: '16px', fontSize: '9px', padding: '0 4px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF' }}>↵</Kbd>
                    </div>
                  </div>
                }
                onClick={primaryAction.onClick}
                loading={primaryAction.loading}
                disabled={primaryAction.disabled}
              />
            )}
          </div>
        )}

        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .hover-scale:hover { transform: scale(1.02); filter: brightness(1.05); }
          .hover-scale:active { transform: scale(0.98); }
        `}</style>
      </div>
    </div>
  );
};

export default Modal;

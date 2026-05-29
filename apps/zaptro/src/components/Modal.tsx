import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import '../app/zaptroFormFields.css';
import './zaptroLandscapeModal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  variant?: 'drawer' | 'center' | 'landscape';
  headerStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}

const LogtaModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = '500px',
  variant = 'drawer',
  headerStyle,
  contentStyle,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  if (variant === 'landscape') {
    return (
      <div className="zaptro-modal-landscape-overlay animate-fade-in" onClick={onClose} role="presentation">
        <div
          className="zaptro-modal-landscape-panel"
          style={{ maxWidth: width || '960px' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <button type="button" className="zaptro-modal-landscape-close" onClick={onClose} aria-label="Fechar">
            <X size={24} />
          </button>
          <div className="zaptro-modal-landscape-content" style={contentStyle}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.overlay,
        justifyContent: variant === 'center' ? 'center' : 'flex-end',
      }}
      onClick={onClose}
      className="animate-fade-in"
    >
      <div
        style={{
          ...styles.modal,
          ...(variant === 'center'
            ? {
                width: 'min(640px, 92vw)',
                maxWidth: width,
                height: 'auto',
                maxHeight: '90vh',
                borderRadius: 22,
                borderTopLeftRadius: 22,
                borderBottomLeftRadius: 22,
                boxShadow: '0 22px 60px rgba(0, 0, 0, 0.18)',
                animation: 'none',
              }
            : { maxWidth: width }),
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-scale-in"
      >
        <header style={{ ...styles.header, ...(headerStyle || {}) }}>
          <h2 style={styles.title}>{title}</h2>
          <button type="button" style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div style={{ ...styles.content, ...(contentStyle || {}) }}>{children}</div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    zIndex: 5000,
  },
  modal: {
    backgroundColor: 'white',
    width: '100%',
    height: '100%',
    boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    borderTopLeftRadius: '32px',
    borderBottomLeftRadius: '32px',
    animation: 'zaptroSlideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  header: {
    padding: '24px 32px',
    borderBottom: '1px solid #EBEBEC',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#000000',
    letterSpacing: '-0.02em',
  },
  closeBtn: {
    padding: '10px',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#F4F4F5',
    color: '#18181B',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  content: {
    padding: '32px',
    overflowY: 'auto' as const,
    flex: 1,
  },
};

const modalGlobalStyles = `
  @keyframes zaptroSlideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
`;

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.textContent = modalGlobalStyles;
  document.head.appendChild(styleTag);
}

export default LogtaModal;

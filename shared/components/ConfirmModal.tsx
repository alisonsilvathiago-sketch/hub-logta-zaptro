import React from 'react';
import Modal from './Modal';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  loading = false
}) => {
  const colors = {
    danger: { bg: '#FEF2F2', border: '#FEE2E2', text: '#EF4444', btn: '#EF4444' },
    warning: { bg: '#FFFBEB', border: '#FEF3C7', text: '#F59E0B', btn: '#F59E0B' },
    info: { bg: '#EFF6FF', border: '#DBEAFE', text: '#3B82F6', btn: '#3B82F6' }
  };

  const c = colors[type];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      hideTitle={true}
      maxWidth="400px"
    >
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '24px', 
          background: c.bg, color: c.text, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 24px',
          border: `1px solid ${c.border}`
        }}>
          <AlertTriangle size={32} />
        </div>
        
        <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', marginBottom: '12px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '32px' }}>{message}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button 
            onClick={onClose}
            style={{ 
              padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', 
              background: '#fff', color: '#64748B', fontWeight: '800', cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            disabled={loading}
            style={{ 
              padding: '14px', borderRadius: '12px', border: 'none', 
              background: c.btn, color: '#fff', fontWeight: '800', cursor: 'pointer',
              fontSize: '13px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;

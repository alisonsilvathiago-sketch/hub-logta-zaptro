import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlatform } from '../lib/platform';
import Kbd from './Kbd';
import { X, Keyboard, HelpCircle } from 'lucide-react';
import { getAllShortcuts } from '../lib/keyboardEngine';

export const ShortcutHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const shortcuts = getAllShortcuts();
  const platform = getPlatform();

  useEffect(() => {
    const handleClose = () => setIsOpen(false);
    window.addEventListener('close-all-modals', handleClose);
    return () => window.removeEventListener('close-all-modals', handleClose);
  }, []);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '16px',
          backgroundColor: 'white',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748B',
          cursor: 'pointer',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          zIndex: 1000,
          transition: 'all 0.2s'
        }}
        className="hover-scale"
        title="Ajuda de Atalhos (?)"
      >
        <Keyboard size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }} onClick={() => setIsOpen(false)}>
      <div 
        style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: 'white',
          borderRadius: '32px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
          animation: 'paletteIn 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#6366F115', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Atalhos do Teclado</h3>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0', fontWeight: '500' }}>Potencialize sua produtividade no Hub.</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '24px 32px 32px', maxHeight: '60vh', overflowY: 'auto' }}>
          {shortcuts.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i === shortcuts.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>{s.description || 'Ação'}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {s.ctrl && <Kbd>{platform.cmd}</Kbd>}
                {s.meta && <Kbd>{platform.cmd}</Kbd>}
                {s.shift && <Kbd>{platform.shift}</Kbd>}
                {s.alt && <Kbd>{platform.alt}</Kbd>}
                <Kbd>{s.key.toUpperCase()}</Kbd>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '20px 32px', backgroundColor: '#F8FAFC', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600', margin: 0 }}>
            Pressione <Kbd>{platform.esc}</Kbd> para fechar qualquer janela.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutHelp;

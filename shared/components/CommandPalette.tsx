import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight, Zap, Briefcase, Truck, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPlatform } from '../lib/platform';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const platform = getPlatform();

  const commands = [
    { id: 'logistica', title: 'Ir para Logística', icon: <Truck size={18} />, path: '/master/logistica' },
    { id: 'crm', title: 'Ir para CRM / Vendas', icon: <Briefcase size={18} />, path: '/master/crm' },
    { id: 'financeiro', title: 'Ver Financeiro / Billing', icon: <Settings size={18} />, path: '/master/billing?tab=financeiro' },
    { id: 'backup', title: 'Gerenciar Backups', icon: <Settings size={18} />, path: '/master/infrastructure?tab=backup' },
    { id: 'planos', title: 'Criar / Editar Planos', icon: <Zap size={18} />, path: '/master/plans' },
    { id: 'empresas', title: 'Gerenciar Empresas / SaaS', icon: <Users size={18} />, path: '/master/companies' },
    { id: 'clientes', title: 'Meus Clientes', icon: <Users size={18} />, path: '/master/clientes' },
    { id: 'home', title: 'Página Inicial / Hub', icon: <Zap size={18} />, path: '/master' },
  ].filter(cmd => cmd.title.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSearch('');
      setSelectedIndex(0);
    };
    const handleClose = () => setIsOpen(false);

    window.addEventListener('open-command-palette', handleOpen);
    window.addEventListener('close-all-modals', handleClose);

    return () => {
      window.removeEventListener('open-command-palette', handleOpen);
      window.removeEventListener('close-all-modals', handleClose);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % commands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
    } else if (e.key === 'Enter') {
      const selected = commands[selectedIndex];
      if (selected) {
        navigate(selected.path);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '15vh',
      zIndex: 99999
    }} onClick={() => setIsOpen(false)}>
      <div 
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: 'white',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
          animation: 'paletteIn 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #F1F5F9',
          gap: '16px'
        }}>
          <Search size={20} color="#94A3B8" />
          <input
            ref={inputRef}
            placeholder="O que você deseja fazer?"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '18px',
              fontWeight: '500',
              color: '#1E293B',
              backgroundColor: 'transparent'
            }}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#F1F5F9',
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#64748B'
          }}>
            {platform.esc}
          </div>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '12px' }}>
          {commands.length > 0 ? (
            commands.map((cmd, i) => (
              <div
                key={cmd.id}
                onClick={() => { navigate(cmd.path); setIsOpen(false); }}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  gap: '16px',
                  backgroundColor: i === selectedIndex ? '#F8FAFC' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: i === selectedIndex ? '#6366F1' : '#F1F5F9',
                  color: i === selectedIndex ? 'white' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}>
                  {cmd.icon}
                </div>
                <div style={{ flex: 1, fontSize: '15px', fontWeight: '600', color: i === selectedIndex ? '#1E293B' : '#475569' }}>
                  {cmd.title}
                </div>
                {i === selectedIndex && (
                  <ArrowRight size={16} color="#6366F1" />
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
              Nenhum comando encontrado para "{search}"
            </div>
          )}
        </div>

        <div style={{
          padding: '12px 24px',
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Command size={12} /> {platform.cmd} + K para buscar
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowRight size={12} /> Enter para selecionar
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#CBD5E1', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Hub Intelligence
          </div>
        </div>
      </div>
      <style>{`
        @keyframes paletteIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CommandPalette;


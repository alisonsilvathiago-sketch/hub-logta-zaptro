import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Car, Users, Building2, 
  ChevronRight, X, Command, Zap,
  Truck, Layout, History, ExternalLink
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock data for immediate "Google-like" feel
  const [staticShortcuts] = useState([
    { id: 's1', type: 'shortcut', name: 'Painel de Logística', path: '/master/logistica', icon: <Truck size={16} /> },
    { id: 's2', type: 'shortcut', name: 'Gestão de Empresas', path: '/master/companies', icon: <Building2 size={16} /> },
    { id: 's3', type: 'shortcut', name: 'CRM & Pipeline', path: '/master/crm', icon: <Layout size={16} /> },
    { id: 's4', type: 'shortcut', name: 'Configurações Globais', path: '/master/settings', icon: <Zap size={16} /> }
  ]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? onClose() : null; // Handled by parent but good to have
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults(staticShortcuts);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // In a real app, this would be a single RPC or global index search
        const lowerSearch = searchTerm.toLowerCase();
        
        // Mocking results from different entities as requested (Vehicle, Client, Company)
        const mockResults = [
          { id: 'v1', type: 'vehicle', name: 'Volvo FH 540', plate: 'ABC1234', owner: 'Transportes Silva', path: '/master/logistica' },
          { id: 'c1', type: 'client', name: 'João Ricardo Pereira', email: 'joao@silva.com', owner: 'Silva Logta', path: '/master/clientes' },
          { id: 'e1', type: 'company', name: 'Logta Soluções', subdomain: 'logta', path: '/master/companies' }
        ].filter(r => 
          (r.name || '').toLowerCase().includes(lowerSearch) || 
          ((r as any).plate || '').toLowerCase().includes(lowerSearch) ||
          ((r as any).owner || '').toLowerCase().includes(lowerSearch)
        );

        setResults([...staticShortcuts.filter(s => s.name.toLowerCase().includes(lowerSearch)), ...mockResults]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, staticShortcuts]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.searchHeader}>
          <Search size={20} color="#6366F1" />
          <input 
            ref={inputRef}
            style={styles.input}
            placeholder="Buscar por placa, cliente, empresa ou comando... (Google Hub)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={styles.kbd}>ESC</div>
        </div>

        <div style={styles.resultsArea}>
          {results.length > 0 ? (
            <div style={styles.resultsList}>
              {results.map((res, i) => (
                <div 
                  key={res.id} 
                  style={styles.resultItem}
                  onClick={() => {
                    navigate(res.path);
                    onClose();
                  }}
                >
                  <div style={{
                    ...styles.iconBox,
                    backgroundColor: res.type === 'shortcut' ? '#EEF2FF' : res.type === 'vehicle' ? '#F0FDF4' : '#FFF7ED'
                  }}>
                    {res.type === 'shortcut' ? (res.icon || <Zap size={16} />) : 
                     res.type === 'vehicle' ? <Car size={16} color="#10B981" /> : 
                     res.type === 'client' ? <Users size={16} color="#F59E0B" /> : <Building2 size={16} color="#6366F1" />}
                  </div>
                  <div style={styles.resInfo}>
                    <div style={styles.resName}>
                      {res.name} {res.plate && <span style={styles.plateTag}>{res.plate}</span>}
                    </div>
                    <div style={styles.resMeta}>
                      {res.type.toUpperCase()} • {res.owner || res.subdomain || 'Módulo Hub'}
                    </div>
                  </div>
                  <div style={styles.resAction}><Command size={12} /> Enter</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Search size={32} color="#E2E8F0" style={{ marginBottom: '12px' }} />
              <p>Nenhum resultado encontrado para "{searchTerm}"</p>
              <span>Tente buscar por uma placa de carro ou nome de cliente.</span>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <div style={styles.footerItem}><Command size={12} /> + K para buscar</div>
          <div style={styles.footerItem}><ChevronRight size={12} /> para selecionar</div>
          <div style={styles.footerItem}>Ouro: Inteligência Cross-Tenant Ativa</div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'start',
    justifyContent: 'center',
    paddingTop: '15vh'
  },
  modal: {
    width: '600px',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column'
  },
  searchHeader: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderBottom: '1px solid #F1F5F9'
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '18px',
    fontWeight: '600',
    color: '#0F172A',
    backgroundColor: 'transparent'
  },
  kbd: {
    padding: '4px 8px',
    backgroundColor: '#F1F5F9',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '800',
    color: '#94A3B8'
  },
  resultsArea: {
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '12px'
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#F8FAF9'
    }
  },
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  resInfo: {
    flex: 1
  },
  resName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  plateTag: {
    fontSize: '10px',
    backgroundColor: '#0F172A',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '800'
  },
  resMeta: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px'
  },
  resAction: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#CBD5E1',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#94A3B8'
  },
  footer: {
    padding: '12px 24px',
    backgroundColor: '#F8FAF9',
    borderTop: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerItem: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94A3B8',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }
};

export default SpotlightSearch;

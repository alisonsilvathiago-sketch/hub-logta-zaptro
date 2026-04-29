import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Search, Sparkles, UserRound, Command } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type LogtaAppShellHeaderProps = {
  /**
   * `true`: dentro de um contentor com padding horizontal + `--logta-dash-pad-x` no pai
   * (ex.: dashboard), estende o header à largura útil com margens negativas.
   */
  fullBleed?: boolean;
};

const LogtaAppShellHeader: React.FC<LogtaAppShellHeaderProps> = ({ fullBleed = false }) => {
  const navigate = useNavigate();
  const { profile, stopImpersonating } = useAuth();
  const [query, setQuery] = useState('');
  
  const isImpersonating = !!localStorage.getItem('hub-impersonate-tenant');

  const displayName = useMemo(() => profile?.full_name?.trim() || 'Operador Logta', [profile?.full_name]);
  const firstName = useMemo(() => displayName.split(/\s+/)[0], [displayName]);
  const roleLabel = useMemo(() => profile?.role?.replaceAll('_', ' ') || 'Operador', [profile?.role]);

  return (
    <header
      style={{
        width: fullBleed ? 'calc(100% + 2 * var(--logta-dash-pad-x))' : '100%',
        marginLeft: fullBleed ? 'calc(-1 * var(--logta-dash-pad-x))' : 0,
        marginRight: fullBleed ? 'calc(-1 * var(--logta-dash-pad-x))' : 0,
        padding: fullBleed ? '14px calc(var(--logta-dash-pad-x) + 8px)' : '14px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {isImpersonating && (
        <div style={{
          backgroundColor: '#6366F1',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          fontWeight: '700',
          boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} />
            <span>MODO MASTER: Visualizando como Administrador</span>
          </div>
          <button 
            onClick={() => stopImpersonating?.()}
            style={{
              backgroundColor: 'white',
              color: '#6366F1',
              border: 'none',
              borderRadius: '8px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            PARAR ACESSO
          </button>
        </div>
      )}
      <div className="logta-topbar">
        <div className="logta-topbar-search">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar cargas, clientes, rotas..."
            aria-label="Pesquisar no Logta"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && query.trim()) {
                navigate(`/dashboard?q=${encodeURIComponent(query.trim())}`);
              }
            }}
          />
          <span className="logta-topbar-kbd">
            <Command size={12} />
            K
          </span>
        </div>

        <div className="logta-topbar-actions">
          <button type="button" className="logta-topbar-icon-btn" title="IA assistente">
            <Sparkles size={16} />
          </button>
          <button type="button" className="logta-topbar-icon-btn" title="Notificações">
            <Bell size={16} />
          </button>
          <button type="button" className="logta-topbar-icon-btn" title="Mensagens">
            <MessageSquare size={16} />
          </button>
          <button type="button" className="logta-topbar-user" onClick={() => navigate('/perfil')} title="Perfil">
            <span className="logta-topbar-user-avatar">
              <UserRound size={15} />
            </span>
            <span className="logta-topbar-user-text">
              <strong>{firstName}</strong>
              <small>{roleLabel}</small>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default LogtaAppShellHeader;
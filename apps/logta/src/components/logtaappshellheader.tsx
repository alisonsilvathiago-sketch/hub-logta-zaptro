import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Search, User, Shield, Settings, Calculator } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import LogtaModal from './Modal';
import FinanceCalculator from './FinanceCalculator';

const MUTED = '#64748b';
const TEXT = '#0f172a';
const PURPLE = '#7c3aed';
const PURPLE_SOFT = 'rgba(124, 58, 237, 0.1)';
const BORDER = '#e2e8f0';

const iconRound: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  border: `1px solid ${BORDER}`,
  backgroundColor: '#f4f4f4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

export type LogtaAppShellHeaderProps = {
  /**
   * `true`: dentro de um contentor com padding horizontal + `--logta-dash-pad-x` no pai
   * (ex.: dashboard), estende o header à largura útil com margens negativas.
   */
  fullBleed?: boolean;
};

/**
 * Barra superior padrão Logta (atalhos + avatar), fundo transparente.
 */
const LogtaAppShellHeader: React.FC<LogtaAppShellHeaderProps> = ({ fullBleed = false }) => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const firstName = useMemo(() => {
    const n = profile?.full_name?.trim() || 'Operador';
    return n.split(/\s+/)[0];
  }, [profile?.full_name]);

  const displayName = useMemo(() => profile?.full_name?.trim() || firstName, [profile?.full_name, firstName]);

  const accountSubtitle = useMemo(() => {
    const e = profile?.email?.trim();
    if (e) return e;
    return 'Área da conta';
  }, [profile?.email]);

  const avatarUrl = useMemo(() => {
    const fromProfile = profile?.avatar_url?.trim();
    if (fromProfile) return fromProfile;
    const meta = user?.user_metadata?.avatar_url;
    return typeof meta === 'string' && meta.trim() ? meta.trim() : undefined;
  }, [profile?.avatar_url, user?.user_metadata?.avatar_url]);

  const [avatarBroken, setAvatarBroken] = useState(false);
  useEffect(() => {
    setAvatarBroken(false);
  }, [avatarUrl]);

  const showAvatar = Boolean(avatarUrl) && !avatarBroken;

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountWrapRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [financeCalcOpen, setFinanceCalcOpen] = useState(false);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const close = (e: MouseEvent) => {
      const el = accountWrapRef.current;
      if (el && !el.contains(e.target as Node)) setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', close, true);
    return () => document.removeEventListener('mousedown', close, true);
  }, [accountMenuOpen]);

  const headerStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    borderRadius: 0,
    padding: fullBleed ? '14px calc(var(--logta-dash-pad-x) + 22px)' : '14px 0',
    marginBottom: fullBleed ? 20 : 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    width: fullBleed ? 'calc(100% + 2 * var(--logta-dash-pad-x))' : '100%',
    maxWidth: '100%',
    marginLeft: fullBleed ? 'calc(-1 * var(--logta-dash-pad-x))' : 0,
    marginRight: fullBleed ? 'calc(-1 * var(--logta-dash-pad-x))' : 0,
  };

  return (
    <header className="logta-app-shell-header" style={headerStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
          maxWidth: 400,
          marginRight: 12,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            minWidth: 0,
            minHeight: 48,
            flexShrink: 0,
            paddingLeft: 14,
            paddingRight: 14,
            borderRadius: 14,
            border: `1px solid ${BORDER}`,
            backgroundColor: '#f4f4f4',
            boxSizing: 'border-box',
          }}
        >
          <Search size={20} color={MUTED} strokeWidth={2} aria-hidden />
          <input
            id="logta-global-search"
            type="search"
            aria-label={`Pesquisar no Logta (${displayName})`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar rotas, clientes, documentos…"
            autoComplete="off"
            enterKeyHint="search"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                e.preventDefault();
                navigate(`/dashboard?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              fontWeight: 600,
              color: TEXT,
              outline: 'none',
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          type="button"
          style={iconRound}
          aria-label="Abrir calculadora financeira"
          title="Calculadora financeira avançada (histórico e partilha)"
          onClick={() => {
            setAccountMenuOpen(false);
            setFinanceCalcOpen(true);
          }}
        >
          <Calculator size={20} color={MUTED} strokeWidth={2} />
        </button>
        <button type="button" style={iconRound} aria-label="Notificações">
          <Bell size={20} color={MUTED} />
        </button>
        <button type="button" style={iconRound} aria-label="Mensagens">
          <MessageSquare size={20} color={MUTED} />
        </button>
        <div ref={accountWrapRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            aria-label={`Conta e definições — ${displayName}`}
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
            onClick={() => setAccountMenuOpen((o) => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              maxWidth: 'min(280px, 42vw)',
              minHeight: 42,
              padding: '4px 6px 4px 12px',
              borderRadius: 14,
              backgroundColor: '#f4f4f4',
              color: PURPLE,
              border: `1px solid ${BORDER}`,
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'center',
                textAlign: 'right',
                minWidth: 0,
                flex: 1,
                gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: TEXT,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  maxWidth: 200,
                }}
              >
                {displayName}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: MUTED,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  maxWidth: 200,
                }}
              >
                {accountSubtitle}
              </span>
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: showAvatar ? '#f1f5f9' : PURPLE_SOFT,
                fontWeight: 900,
                fontSize: 15,
              }}
            >
              {showAvatar ? (
                <img
                  src={avatarUrl}
                  alt=""
                  width={42}
                  height={42}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                (firstName[0] || 'L').toUpperCase()
              )}
            </div>
          </button>
          {accountMenuOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: 208,
                paddingTop: 14,
                paddingLeft: 12,
                paddingRight: 12,
                paddingBottom: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                borderRadius: 14,
                border: `1px solid ${BORDER}`,
                backgroundColor: '#ffffff',
                boxShadow: '0 16px 48px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.06)',
                zIndex: 2000,
              }}
            >
              {(
                [
                  { label: 'Perfil', Icon: User, path: '/perfil' },
                  { label: 'Permissões', Icon: Shield, path: '/usuarios' },
                  { label: 'Configuração', Icon: Settings, path: '/configuracoes' },
                ] as const
              ).map(({ label, Icon, path }) => (
                <button
                  key={path}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    navigate(path);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    border: 'none',
                    borderRadius: 10,
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                    color: TEXT,
                    textAlign: 'left',
                  }}
                >
                  <Icon size={18} color={MUTED} strokeWidth={2} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <LogtaModal
        isOpen={financeCalcOpen}
        onClose={() => setFinanceCalcOpen(false)}
        title="Calculadora Financeira Avançada"
        width="min(1100px, calc(100vw - 32px))"
      >
        <>
          <FinanceCalculator />
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1px solid ${BORDER}`,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setFinanceCalcOpen(false);
                navigate('/financeiro');
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: PURPLE,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Abrir módulo Financeiro
            </button>
          </div>
        </>
      </LogtaModal>
    </header>
  );
};

export default LogtaAppShellHeader;

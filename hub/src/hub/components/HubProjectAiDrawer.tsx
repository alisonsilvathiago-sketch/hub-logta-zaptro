import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Plus,
  FileText,
  ArrowUp,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { dispatchToAiGateway } from '@core/lib/hubAiOrchestrator';
import { useAuth } from '@core/context/AuthContext';
import { useHubProjectAi } from '@hub/context/HubProjectAiContext';
import {
  HUB_PRODUCT_AI_SCOPES,
  hubProjectAiStorageKey,
  resolveHubProjectAiScope,
  type HubProjectAiScope,
  type HubProjectAiScopeId,
} from '@hub/lib/hubProjectAiScope';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

function loadMessages(scopeId: HubProjectAiScopeId): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(hubProjectAiStorageKey(scopeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages(scopeId: HubProjectAiScopeId, messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(hubProjectAiStorageKey(scopeId), JSON.stringify(messages.slice(-40)));
  } catch {
    /* ignore quota */
  }
}

const HubProjectAiDrawer: React.FC = () => {
  const { isOpen, close } = useHubProjectAi();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const scope = resolveHubProjectAiScope(location.pathname);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scopeMenuRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);

  useEffect(() => {
    if (!scopeMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (scopeMenuRef.current && !scopeMenuRef.current.contains(e.target as Node)) {
        setScopeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [scopeMenuOpen]);

  useEffect(() => {
    if (isOpen) {
      setMessages(loadMessages(scope.id));
    }
  }, [isOpen, scope.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const persist = useCallback(
    (next: ChatMessage[]) => {
      setMessages(next);
      saveMessages(scope.id, next);
    },
    [scope.id],
  );

  const sendPrompt = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
    const withUser = [...messages, userMsg];
    persist(withUser);
    setInput('');
    setIsTyping(true);

    try {
      const result = await dispatchToAiGateway({
        systemId: scope.systemId,
        prompt: trimmed,
        userId: profile?.id,
      });

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: result.success
          ? result.response
          : result.response || 'Não foi possível conectar ao serviço de IA. Verifique a infraestrutura.',
      };
      persist([...withUser, assistantMsg]);
    } catch {
      persist([
        ...withUser,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: 'Erro de conexão com o Ollama. Tente novamente em instantes.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    persist([]);
    setInput('');
  };

  const handleSelectScope = (next: HubProjectAiScope) => {
    setScopeMenuOpen(false);
    if (next.id !== scope.id) {
      navigate(next.defaultPath);
    }
  };

  if (!isOpen) return null;

  const showWelcome = messages.length === 0 && !isTyping;
  const firstName = (profile?.full_name || '').trim().split(/\s+/)[0];

  return (
    <>
      <button
        type="button"
        aria-label="Fechar assistente"
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1190,
          border: 'none',
          background: 'rgba(15, 23, 42, 0.18)',
          cursor: 'default',
        }}
      />
      <aside
        role="dialog"
        aria-label={scope.label}
        style={{
          position: 'fixed',
          top: 56,
          right: 0,
          width: 'min(420px, 100vw)',
          height: 'calc(100vh - 56px)',
          zIndex: 1200,
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.08)',
        }}
      >
        {/* Top bar — estilo Supabase */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderBottom: '1px solid #ECEEF1',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: `linear-gradient(135deg, ${scope.color}, ${scope.color}cc)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={12} color="#FFF" strokeWidth={2.5} />
            </div>
            <div ref={scopeMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                aria-expanded={scopeMenuOpen}
                aria-haspopup="listbox"
                onClick={() => setScopeMenuOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  border: 'none',
                  background: scopeMenuOpen ? '#F3F4F6' : 'transparent',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1a1d21',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: 6,
                }}
              >
                {scope.label}
                <ChevronDown
                  size={14}
                  color="#9CA3AF"
                  style={{
                    transform: scopeMenuOpen ? 'rotate(180deg)' : undefined,
                    transition: 'transform 0.15s ease',
                  }}
                />
              </button>
              {scopeMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Trocar assistente por produto"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    minWidth: 220,
                    background: '#FFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                    padding: 6,
                    zIndex: 10,
                  }}
                >
                  {HUB_PRODUCT_AI_SCOPES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={item.id === scope.id}
                      onClick={() => handleSelectScope(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        border: 'none',
                        borderRadius: 8,
                        background: item.id === scope.id ? `${item.color}12` : 'transparent',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: item.id === scope.id ? 600 : 500,
                        color: '#1a1d21',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: item.color,
                          flexShrink: 0,
                        }}
                      />
                      {item.shortLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              type="button"
              title="Nova conversa"
              onClick={handleNewChat}
              style={iconBtnStyle}
            >
              <Plus size={16} />
            </button>
            <button type="button" title="Fechar" onClick={close} style={iconBtnStyle}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          {showWelcome ? (
            <>
              <h2
                style={{
                  margin: '8px 0 24px',
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#1a1d21',
                  letterSpacing: '-0.02em',
                }}
              >
                {firstName ? `Olá, ${firstName}. Como posso ajudar?` : 'Como posso ajudar?'}
              </h2>
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#9CA3AF',
                }}
              >
                Ideias
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {scope.ideas.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => sendPrompt(idea)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: 8,
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#374151',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FileText size={16} color="#9CA3AF" strokeWidth={1.75} />
                    {idea}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: 20, fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
                Contexto isolado: <strong>{scope.shortLabel}</strong> via Ollama. Respostas não
                misturam outros produtos.
              </p>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '92%',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      backgroundColor: msg.role === 'user' ? scope.color : '#F3F4F6',
                      color: msg.role === 'user' ? '#FFFFFF' : '#1F2937',
                      fontSize: 13,
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 13 }}>
                  <Loader2 size={16} className="animate-spin" />
                  Pensando…
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '12px 14px 16px',
            borderTop: '1px solid #ECEEF1',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              backgroundColor: '#FAFAFA',
              padding: '10px 12px',
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendPrompt(input);
                }
              }}
              placeholder={scope.placeholder}
              rows={2}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
                background: 'transparent',
                fontSize: 13,
                lineHeight: 1.5,
                color: '#1F2937',
                fontFamily: 'inherit',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6B7280',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FFF',
                }}
              >
                Ollama · llama3.2
              </span>
              <button
                type="button"
                disabled={!input.trim() || isTyping}
                onClick={() => sendPrompt(input)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: input.trim() && !isTyping ? '#3ECF8E' : '#E5E7EB',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                }}
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </aside>
      <style>{`.animate-spin { animation: hub-ai-spin 0.8s linear infinite; } @keyframes hub-ai-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

const iconBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#6B7280',
};

export default HubProjectAiDrawer;

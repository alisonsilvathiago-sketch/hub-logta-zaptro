import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, Loader2, Mic, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { supabase } from '../lib/supabase';
import {
  chatOllamaCopilot,
  isOllamaCopilotPreferred,
  ollamaModelPrimary,
  ollamaOfflineHelp,
  type OllamaChatTurn,
} from '../lib/ollamaCopilot';
import { buildEffectiveZaptroPromptMestreSystemPrompt } from '../lib/zaptroPromptMestre';
import { ZAPTRO_APP_ROUTES } from './zaptroAppRoutes';
import { useZaptroOllamaStatus } from '../hooks/useZaptroOllamaStatus';
import { ZAPTRO_OLLAMA_DEFAULT_MODEL } from '../constants/zaptroOllamaConfig';

export type ZaptroAiChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Mensagem enviada automaticamente ao abrir (ex.: campo IA da home). */
  initialMessage?: string;
  onInitialMessageConsumed?: () => void;
};

const QUICK_PROMPTS = [
  'Abrir conversas',
  'Criar um orçamento',
  'Ver meus leads no CRM',
  'Como está a fila de atendimento?',
] as const;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildWelcome(firstName: string): string {
  return `Olá, ${firstName}! Sou a Zaptro IA. Pergunta o que quiseres — CRM, conversas, logística, orçamentos ou o painel.`;
}

export const ZaptroAiDrawer: React.FC<Props> = ({
  open,
  onClose,
  initialMessage = '',
  onInitialMessageConsumed,
}) => {
  const { profile } = useAuth();
  const { company } = useTenant();
  const navigate = useNavigate();

  const firstName = profile?.full_name?.split(' ')[0] || 'Comandante';
  const useOllama = isOllamaCopilotPreferred();
  const { online: ollamaOnline, model: ollamaModelLabel } = useZaptroOllamaStatus(useOllama);

  const [messages, setMessages] = useState<ZaptroAiChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const seededRef = useRef(false);
  const pendingInitialRef = useRef<string | null>(null);

  const systemPrompt = useMemo(
    () =>
      `${buildEffectiveZaptroPromptMestreSystemPrompt(company)}

Contexto adicional (assistente no painel Zaptro):
- Utilizador autenticado: ${firstName}
- Responda sobre CRM, financeiro, logística, motoristas, frota, arquivos e conversas WhatsApp quando perguntado.
- Comportamento: humano, natural e directo; use o nome quando fizer sentido.
- Se pedirem para abrir uma área, indique o caminho no menu (ex.: Conversas, CRM, Clientes).`,
    [company, firstName],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;
    seededRef.current = false;
    pendingInitialRef.current = null;
    setMessages([]);
    setDraft('');
    setSending(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!seededRef.current) {
      seededRef.current = true;
      setMessages([
        {
          id: newId(),
          role: 'assistant',
          content: buildWelcome(firstName),
        },
      ]);
    }
    const seed = initialMessage.trim();
    if (seed) {
      pendingInitialRef.current = seed;
    }
    window.setTimeout(() => inputRef.current?.focus(), 120);
  }, [open, firstName, initialMessage]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const historyForOllama = useCallback((list: ZaptroAiChatMessage[]): OllamaChatTurn[] => {
    return list
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));
  }, []);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || sending) return;

      const userMsg: ZaptroAiChatMessage = { id: newId(), role: 'user', content: text };
      setMessages((prev) => [...prev, userMsg]);
      setDraft('');
      setSending(true);

      const history = historyForOllama(messages);

      try {
        let answer: string;

        if (useOllama) {
          answer = await chatOllamaCopilot({
            systemPrompt,
            userMessage: text,
            model: ollamaModelPrimary(),
            history,
          });
        } else {
          const { data, error } = await supabase.functions.invoke('zaptro-ai-copilot', {
            body: {
              input: text,
              systemPrompt,
              model: 'gpt-4o',
              context: {
                userRole: profile?.role || 'admin',
                tenant: 'zaptro',
                userName: firstName,
                history: history.slice(-6),
              },
            },
          });

          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          answer =
            data?.answer ||
            'Não consegui processar a resposta. Verifique a API Key ou o modelo configurado.';
        }

        setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content: answer }]);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (useOllama) {
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: 'assistant',
              content:
                `Não consegui ligar ao assistente agora.\n\n` +
                (errorMsg.includes('O Zaptro não alcançou')
                  ? errorMsg
                  : `Detalhe: ${errorMsg}\n\n${ollamaOfflineHelp()}`),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: 'assistant',
              content: `Erro ao conectar com a IA.\nDetalhe: ${errorMsg}`,
            },
          ]);
        }
      } finally {
        setSending(false);
      }
    },
    [sending, messages, historyForOllama, systemPrompt, useOllama, profile?.role, firstName],
  );

  useEffect(() => {
    if (!open || sending || !pendingInitialRef.current) return;
    const msg = pendingInitialRef.current;
    pendingInitialRef.current = null;
    onInitialMessageConsumed?.();
    void sendMessage(msg);
  }, [open, sending, sendMessage, onInitialMessageConsumed]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(draft);
  };

  const onQuickPrompt = (prompt: string) => {
    if (prompt.toLowerCase().includes('conversas')) {
      onClose();
      navigate(ZAPTRO_APP_ROUTES.INBOX);
      return;
    }
    if (prompt.toLowerCase().includes('crm') || prompt.toLowerCase().includes('leads')) {
      onClose();
      navigate(ZAPTRO_APP_ROUTES.CRM);
      return;
    }
    if (prompt.toLowerCase().includes('orçamento')) {
      onClose();
      navigate(ZAPTRO_APP_ROUTES.QUOTES);
      return;
    }
    void sendMessage(prompt);
  };

  if (!open) return null;

  return createPortal(
    <div className="zapdash-ai-overlay" role="presentation" onMouseDown={onClose}>
      <aside
        className="zapdash-ai-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Zaptro IA"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="zapdash-ai-head">
          <div className="zapdash-ai-title">
            <span className="zapdash-ai-title-orb" aria-hidden>
              <Sparkles size={16} strokeWidth={2.2} />
            </span>
            <div className="zapdash-ai-title-text">
              <strong>Zaptro IA</strong>
              {useOllama ? (
                <span
                  className="zapdash-ai-title-model"
                  data-online={ollamaOnline === true ? 'true' : ollamaOnline === false ? 'false' : 'unknown'}
                >
                  Llama 3.2 · {ollamaModelLabel || ZAPTRO_OLLAMA_DEFAULT_MODEL}
                  {ollamaOnline === true ? ' · online' : ollamaOnline === false ? ' · offline' : ''}
                </span>
              ) : null}
            </div>
          </div>
          <button type="button" className="zapdash-ai-icon-btn" title="Fechar" onClick={onClose}>
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        {useOllama && ollamaOnline === false ? (
          <div className="zapdash-ai-status" data-online="false">
            Ollama offline — verifica a ligação à VPS ou reinicia o dev server.
          </div>
        ) : null}

        <div className="zapdash-ai-chat" ref={scrollRef}>
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <div key={msg.id} className="zapdash-ai-msg zapdash-ai-msg--user">
                <div className="zapdash-ai-bubble zapdash-ai-bubble--user">{msg.content}</div>
              </div>
            ) : (
              <div key={msg.id} className="zapdash-ai-msg zapdash-ai-msg--assistant">
                <span className="zapdash-ai-avatar" aria-hidden>
                  <Sparkles size={14} strokeWidth={2.2} />
                </span>
                <div className="zapdash-ai-assistant-block">
                  <span className="zapdash-ai-assistant-name">Zaptro</span>
                  <div className="zapdash-ai-bubble zapdash-ai-bubble--assistant">{msg.content}</div>
                </div>
              </div>
            ),
          )}

          {sending ? (
            <div className="zapdash-ai-msg zapdash-ai-msg--assistant">
              <span className="zapdash-ai-avatar" aria-hidden>
                <Loader2 size={14} className="zapdash-ai-spin" />
              </span>
              <div className="zapdash-ai-assistant-block">
                <span className="zapdash-ai-assistant-name">Zaptro</span>
                <div className="zapdash-ai-typing">A pensar…</div>
              </div>
            </div>
          ) : null}

          {messages.length <= 1 && !sending ? (
            <div className="zapdash-ai-quick">
              <span className="zapdash-ai-quick-label">Sugestões rápidas</span>
              <div className="zapdash-ai-quick-list">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} type="button" className="zapdash-ai-quick-btn" onClick={() => onQuickPrompt(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <footer className="zapdash-ai-foot">
          <form className="zapdash-ai-compose" onSubmit={onSubmit}>
            <div className="zapdash-ai-input-wrap">
              <textarea
                ref={inputRef}
                className="zapdash-ai-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escreve a tua pergunta…"
                rows={2}
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(draft);
                  }
                }}
              />
              <button type="button" className="zapdash-ai-mic" title="Voz (em breve)" disabled tabIndex={-1}>
                <Mic size={18} strokeWidth={2} />
              </button>
            </div>
            <button
              type="submit"
              className="zapdash-ai-send"
              disabled={!draft.trim() || sending}
              title="Enviar"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </form>
          <p className="zapdash-ai-disclaimer">
            A Zaptro IA está sempre a aprender e pode cometer erros. Revise as respostas.
          </p>
        </footer>
      </aside>
    </div>,
    document.body,
  );
};

export default ZaptroAiDrawer;

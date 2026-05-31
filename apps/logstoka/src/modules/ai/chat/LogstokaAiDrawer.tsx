import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, Loader2, Sparkles, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/LogstokaAuthProvider';
import {
  AI_AGENT_LABELS,
  AI_QUICK_PROMPTS,
  LOGSTOKA_AI_MODEL,
  LOGSTOKA_AI_TAGLINE,
  aiEngineStatusLabel,
  buildAiWelcomeMessage,
  type AiChatTurn,
} from '../types';
import { formatLogstokaApiError } from '@/lib/logstokaApiBase';
import { useAiChat } from './useAiChat';
import { useAiHealth } from './useAiHealth';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; agents?: string[] };

type Props = {
  open: boolean;
  onClose: () => void;
  initialMessage?: string;
  onInitialMessageConsumed?: () => void;
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const LogstokaAiDrawer: React.FC<Props> = ({
  open,
  onClose,
  initialMessage = '',
  onInitialMessageConsumed,
}) => {
  const { profile } = useAuth();
  const location = useLocation();
  const screen = location.pathname.replace('/app/', '') || 'dashboard';

  const firstName = profile?.full_name?.split(' ')[0] || 'Operador';
  const { send, sending } = useAiChat({
    screen,
    userName: profile?.full_name ?? undefined,
  });

  const { online } = useAiHealth(open);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const seededRef = useRef(false);
  const pendingInitialRef = useRef<string | null>(null);

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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!seededRef.current) {
      seededRef.current = true;
      setMessages([
        {
          id: newId(),
          role: 'assistant',
          content: buildAiWelcomeMessage(firstName, online),
        },
      ]);
    }
    const seed = initialMessage.trim();
    if (seed) pendingInitialRef.current = seed;
    window.setTimeout(() => inputRef.current?.focus(), 120);
  }, [open, firstName, initialMessage, online]);

  const pushReply = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { id: newId(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setDraft('');

    const history: AiChatTurn[] = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await send(text, history);
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          content: res.reply,
          agents: res.agents,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          content: formatLogstokaApiError(err),
        },
      ]);
    }
  }, [messages, send]);

  useEffect(() => {
    if (!open || !pendingInitialRef.current || sending) return;
    const msg = pendingInitialRef.current;
    pendingInitialRef.current = null;
    onInitialMessageConsumed?.();
    void pushReply(msg);
  }, [open, sending, pushReply, onInitialMessageConsumed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  if (!open) return null;

  const engineStatus = aiEngineStatusLabel(online);

  return createPortal(
    <div className="ls-ai-overlay" role="dialog" aria-label="Assistente IA Global LogStoka">
      <button type="button" className="ls-ai-backdrop" aria-label="Fechar" onClick={onClose} />
      <aside className="ls-ai-drawer">
        <header className="ls-ai-header">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="text-sm font-black text-slate-900">Assistente IA Global</p>
              <p className="text-xs text-slate-500">
                {LOGSTOKA_AI_TAGLINE} · {LOGSTOKA_AI_MODEL} ·{' '}
                <span className={online ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>
                  {engineStatus}
                </span>
              </p>
            </div>
          </div>
          <button type="button" className="ls-ai-close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div ref={scrollRef} className="ls-ai-messages">
          {messages.map((m) => (
            <div key={m.id} className={m.role === 'user' ? 'ls-ai-msg ls-ai-msg-user' : 'ls-ai-msg ls-ai-msg-bot'}>
              <p className="whitespace-pre-wrap text-sm">{m.content}</p>
              {m.agents && m.agents.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.agents.map((a) => (
                    <span key={a} className="ls-badge bg-orange-50 text-orange-700 text-[10px]">
                      {AI_AGENT_LABELS[a] ?? a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="ls-ai-msg ls-ai-msg-bot flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Consultando dados do sistema…
            </div>
          )}
        </div>

        <div className="ls-ai-quick">
          {AI_QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              className="ls-ai-chip"
              disabled={sending}
              onClick={() => void pushReply(q)}
            >
              {q}
            </button>
          ))}
        </div>

        <footer className="ls-ai-footer">
          <textarea
            ref={inputRef}
            className="ls-ai-input"
            rows={2}
            placeholder="Pergunte sobre estoque, vendas, reposição, documentos ou integrações…"
            value={draft}
            disabled={sending}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const t = draft.trim();
                if (t) void pushReply(t);
              }
            }}
          />
          <button
            type="button"
            className="ls-ai-send"
            disabled={sending || !draft.trim()}
            onClick={() => {
              const t = draft.trim();
              if (t) void pushReply(t);
            }}
          >
            <ArrowUp size={18} />
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
};

export default LogstokaAiDrawer;

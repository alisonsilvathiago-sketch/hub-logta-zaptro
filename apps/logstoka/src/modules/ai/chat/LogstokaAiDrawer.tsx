import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, Loader2, Paperclip, Sparkles, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/LogstokaAuthProvider';
import {
  AI_AGENT_LABELS,
  LOGSTOKA_AI_BRAND,
  LOGSTOKA_AI_TAGLINE,
  aiEngineStatusLabel,
  buildAiWelcomeMessage,
  type AiAttachmentLink,
  type AiChatTurn,
} from '../types';
import { formatLogstokaApiError } from '@/lib/logstokaApiBase';
import AiMessageContent from './AiMessageContent';
import { useAiChat } from './useAiChat';
import { useAiHealth } from './useAiHealth';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agents?: string[];
  links?: AiAttachmentLink[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  initialMessage?: string;
  onInitialMessageConsumed?: () => void;
};

const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024;

const ACCEPT_ATTACHMENTS =
  'image/*,.pdf,.xml,.csv,.txt,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readFileAsBase64(file: File): Promise<{ base64: string; mime_type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
      resolve({ base64, mime_type: file.type || 'application/octet-stream' });
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo'));
    reader.readAsDataURL(file);
  });
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
  const { send, analyzeAttachment, sending } = useAiChat({
    screen,
    userName: profile?.full_name ?? undefined,
  });

  const { online } = useAiHealth(open);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const pushReply = useCallback(
    async (text: string) => {
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
    },
    [messages, send],
  );

  const pushAttachmentAnalysis = useCallback(
    async (file: File) => {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            content: 'Arquivo muito grande. Envie imagens ou documentos de até 6 MB.',
          },
        ]);
        return;
      }

      const note = draft.trim();
      const userLabel = note ? `📎 ${file.name}\n${note}` : `📎 ${file.name}`;
      setMessages((prev) => [...prev, { id: newId(), role: 'user', content: userLabel }]);
      setDraft('');

      try {
        const { base64, mime_type } = await readFileAsBase64(file);
        const res = await analyzeAttachment({
          file_name: file.name,
          mime_type,
          base64,
          message: note || undefined,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'assistant',
            content: res.reply,
            agents: res.agents,
            links: res.links,
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
    },
    [analyzeAttachment, draft],
  );

  const onPickFile = (file: File | undefined) => {
    if (!file || sending) return;
    void pushAttachmentAnalysis(file);
  };

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
                {LOGSTOKA_AI_TAGLINE} · {LOGSTOKA_AI_BRAND} ·{' '}
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
              <AiMessageContent content={m.content} />
              {m.links && m.links.length > 0 ? (
                <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-200/80 pt-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">No sistema</span>
                  {m.links.map((link) => (
                    <AiMessageContent
                      key={link.path}
                      content={`[${link.label}](${link.path})`}
                      className="text-sm"
                    />
                  ))}
                </div>
              ) : null}
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
              {LOGSTOKA_AI_BRAND} analisando anexo e consultando o WMS…
            </div>
          )}
        </div>

        <footer className="ls-ai-footer">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTACHMENTS}
            className="hidden"
            onChange={(e) => {
              onPickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="ls-ai-attach"
            disabled={sending}
            aria-label="Enviar foto ou documento"
            title="Foto, PDF, planilha ou XML — resumo e localização no WMS"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={18} />
          </button>
          <textarea
            ref={inputRef}
            className="ls-ai-input"
            rows={2}
            placeholder="Pergunte ou envie foto/documento (📎) para identificar produto e local no WMS…"
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

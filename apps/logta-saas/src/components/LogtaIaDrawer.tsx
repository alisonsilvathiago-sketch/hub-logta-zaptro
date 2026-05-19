import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { useLogtaIa } from '../contexts/LogtaIaContext';
import { useTenant } from '../contexts/TenantContext';
import { useOperationalData } from '../contexts/OperationalDataContext';
import { useLogtaProfile } from '../contexts/LogtaProfileContext';
import { generateLogtaIaResponse, LOGTA_IA_IDEAS } from '../lib/logtaIaAssistant';

const STORAGE_KEY = 'logta-ia-chat-history';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-80)));
  } catch {
    /* quota */
  }
}

function renderMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function LogtaIaDrawer() {
  const { isOpen, close } = useLogtaIa();
  const location = useLocation();
  const { config } = useTenant();
  const { profile } = useLogtaProfile();
  const { shipments, deliveries, motoristas, vehicles, transactions } = useOperationalData();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setMessages(loadHistory());
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const persist = useCallback((next: ChatMessage[]) => {
    setMessages(next);
    saveHistory(next);
  }, []);

  const sendPrompt = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const withUser = [...messages, userMsg];
      persist(withUser);
      setInput('');
      setIsTyping(true);

      await new Promise((r) => setTimeout(r, 450 + Math.random() * 400));

      const reply = generateLogtaIaResponse(trimmed, {
        pathname: location.pathname,
        companyName: config.companyName || 'Logta',
        shipments,
        deliveries,
        motoristas,
        vehicles,
        transactions,
      });

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
      };
      persist([...withUser, assistantMsg]);
      setIsTyping(false);
    },
    [
      isTyping,
      messages,
      persist,
      location.pathname,
      config.companyName,
      shipments,
      deliveries,
      motoristas,
      vehicles,
      transactions,
    ],
  );

  const handleNewChat = () => {
    persist([]);
    setInput('');
  };

  if (!isOpen) return null;

  const firstName = (profile?.full_name || '').trim().split(/\s+/)[0];
  const showWelcome = messages.length === 0 && !isTyping;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar assistente IA"
        className="fixed inset-0 z-[1180] cursor-default border-0 bg-slate-900/20 backdrop-blur-[1px]"
        onClick={close}
      />
      <aside
        role="dialog"
        aria-label="IA Operacional Logta"
        className="fixed right-0 top-0 z-[1200] flex h-full w-full max-w-[420px] flex-col border-l border-gray-200 bg-white shadow-[-8px_0_32px_rgba(15,23,42,0.08)] animate-in slide-in-from-right duration-300"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-gray-900 shadow-sm shadow-primary/30">
              <Sparkles size={16} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">IA Operacional Logta</p>
              <p className="text-[10px] font-semibold uppercase tracking-normal text-gray-400">
                Tempo real · histórico salvo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Nova conversa"
              onClick={handleNewChat}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              title="Fechar"
              onClick={close}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 scrollbar-hide">
          {showWelcome ? (
            <>
              <h2 className="mb-1 text-xl font-bold tracking-tight text-gray-900">
                {firstName ? `Olá, ${firstName}` : 'Olá'} — como posso ajudar?
              </h2>
              <p className="mb-6 text-sm font-medium text-gray-500">
                Pergunte sobre fretes, frota, financeiro, fiscal, RH e CRM. Respondo com base no que está
                acontecendo agora na Logta.
              </p>
              <p className="mb-3 text-[10px] font-black uppercase tracking-normal text-gray-400">Sugestões</p>
              <div className="flex flex-col gap-1">
                {LOGTA_IA_IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => sendPrompt(idea)}
                    className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gray-900 text-white'
                        : 'border border-gray-100 bg-gray-50 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{renderMarkdownLite(msg.content)}</p>
                    <p
                      className={`mt-1.5 text-[9px] font-bold uppercase tracking-normal ${
                        msg.role === 'user' ? 'text-gray-400' : 'text-gray-400'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping ? (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  Analisando operação…
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 p-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendPrompt(input);
                }
              }}
              placeholder="Pergunte o que está acontecendo na Logta…"
              rows={2}
              className="w-full resize-none border-0 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                IA · dados ao vivo
              </span>
              <button
                type="button"
                disabled={!input.trim() || isTyping}
                onClick={() => void sendPrompt(input)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-gray-900 shadow-md shadow-primary/25 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

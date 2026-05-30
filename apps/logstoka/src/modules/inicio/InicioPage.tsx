import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUp, Mic, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useAiChat } from '@/modules/ai/chat/useAiChat';
import { useAiHealth } from '@/modules/ai/chat/useAiHealth';
import {
  AI_INICIO_EXAMPLES,
  LOGSTOKA_AI_MODEL,
  LOGSTOKA_AI_TAGLINE,
  aiEngineStatusLabel,
  buildInicioHeroSubtitle,
  type AiChatTurn,
} from '@/modules/ai/types';

const HERO_GRADIENT =
  'linear-gradient(180deg, rgb(0,0,0) 0%, rgb(0,0,0) 22%, rgb(67,20,7) 38%, rgb(194,65,12) 55%, rgb(234,88,12) 68%, rgb(251,146,60) 78%, rgb(254,215,170) 88%, rgb(255,255,255) 96%)';

const InicioPage: React.FC = () => {
  const { profile } = useAuth();
  const displayName = profile?.full_name?.split(' ')[0] || 'LogStoka';
  const companyName = profile?.full_name?.includes('LogStoka') ? 'LogStoka' : 'sua operação';
  const { online } = useAiHealth(true);
  const navigate = useNavigate();

  const { send, sending } = useAiChat({
    screen: 'inicio',
    userName: profile?.full_name ?? undefined,
    companyName,
  });

  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<AiChatTurn[]>([]);
  const [lastExchange, setLastExchange] = useState<{ query: string; answer: string } | null>(null);

  const runQuery = useCallback(
    async (query: string) => {
      const q = query.trim();
      if (!q || sending) return;

      setLastExchange(null);
      try {
        const res = await send(q, history);
        const answer =
          res.reply?.trim() ||
          'Não consegui gerar uma resposta agora. O motor Llama 3.2 está a reconectar — tente novamente em instantes.';
        setLastExchange({ query: q, answer });
        setHistory((prev) => [
          ...prev,
          { role: 'user', content: q },
          { role: 'assistant', content: answer },
        ]);
      } catch {
        setLastExchange({
          query: q,
          answer:
            'Motor Llama 3.2 temporariamente indisponível. A reconexão é automática — pode continuar a usar o dashboard e os módulos pelo menu lateral.',
        });
      }
    },
    [history, send, sending],
  );

  const handleSend = () => {
    const q = inputValue.trim();
    if (!q) return;
    setInputValue('');
    void runQuery(q);
  };

  const showWelcome = !lastExchange && !sending;
  const engineStatus = aiEngineStatusLabel(online);

  return (
    <div
      className="ls-inicio-page scrollbar-hide flex min-h-full min-w-0 flex-1 flex-col items-center justify-center overflow-x-hidden overflow-y-auto"
      style={{ backgroundImage: HERO_GRADIENT }}
    >
      <div className="w-full max-w-3xl space-y-8 pb-16 sm:space-y-10 sm:pb-20">
        {showWelcome && (
          <div className="animate-in fade-in slide-in-from-top-4 space-y-3 text-center duration-700">
            <div className="inline-flex flex-col items-center gap-2 text-[11px] font-bold text-gray-400 sm:flex-row">
              <span className="inline-flex items-center gap-2">
                <span className="rounded-full bg-orange-600 px-[22px] py-[6px] text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                  LogStoka IA
                </span>
                <span className="text-gray-500">•</span>
                <span className="font-bold text-gray-500">
                  {LOGSTOKA_AI_TAGLINE} · {LOGSTOKA_AI_MODEL}
                </span>
                <span className="text-gray-500">•</span>
                <span className={online ? 'font-bold text-emerald-400' : 'font-bold text-amber-300'}>{engineStatus}</span>
              </span>
            </div>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
              Bem-vindo à LogStoka
            </h1>
            <p className="mx-auto max-w-xl pt-2 text-xs font-medium text-white/75">
              {buildInicioHeroSubtitle(displayName)}{' '}
              <Link to="/app/dashboard" className="font-bold text-orange-200 underline-offset-2 hover:underline">
                Dashboard operacional
              </Link>
            </p>
          </div>
        )}

        {(sending || lastExchange) && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
            {lastExchange && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-[24px] border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-md">
                  <p className="text-sm font-medium text-white">{lastExchange.query}</p>
                </div>
              </div>
            )}

            <div className="flex justify-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-600 shadow-lg shadow-orange-950/30">
                <Sparkles size={20} className="text-white" />
              </div>
              <div className="relative flex-1 overflow-hidden rounded-[32px] border border-gray-100 bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
                <div className="absolute left-0 top-0 h-full w-1 bg-orange-600/50" />
                {sending ? (
                  <div className="flex items-center gap-2 py-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-orange-600 [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-orange-600 [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-orange-600" />
                    <span className="ml-2 text-sm font-extrabold uppercase tracking-normal text-gray-400">
                      Motor Llama 3.2 a analisar…
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="whitespace-pre-wrap font-medium leading-relaxed text-gray-700">
                      {lastExchange?.answer}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-1">
                      <Link
                        to="/app/dashboard"
                        className="text-[10px] font-black uppercase text-orange-600 transition-all hover:underline"
                      >
                        Ver dashboard
                      </Link>
                      <button
                        type="button"
                        className="text-[10px] font-black uppercase text-gray-400 transition-all hover:text-gray-600"
                        onClick={() => {
                          setLastExchange(null);
                          setHistory([]);
                        }}
                      >
                        Limpar conversa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="group relative">
          <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-r from-orange-600 to-orange-400 opacity-[0.07] blur transition duration-1000 group-focus-within:opacity-[0.12] group-hover:duration-200" />
          <div className="relative rounded-[20px] border border-gray-100 bg-white px-5 py-3.5 shadow-md shadow-gray-50 transition-all focus-within:border-orange-200">
            <textarea
              placeholder="Ex.: Qual produto mais vendeu este mês? Quais precisam de reposição?"
              className="scrollbar-hide min-h-[64px] w-full resize-none border-none bg-transparent pr-12 text-base text-gray-800 outline-none placeholder:text-gray-400"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-orange-600"
                aria-label="Anexar documento"
                title="Importar PDF, planilha ou imagem (Importações)"
                onClick={() => navigate('/app/imports')}
              >
                <Plus size={18} />
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-orange-600"
                  aria-label="Entrada por voz"
                >
                  <Mic size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || sending}
                  className={`rounded-xl p-2 transition-all shadow-md ${
                    inputValue.trim() && !sending
                      ? 'scale-105 bg-orange-600 text-white shadow-orange-600/25'
                      : 'cursor-not-allowed bg-gray-100 text-gray-300 shadow-none'
                  }`}
                  aria-label="Enviar"
                >
                  <ArrowUp size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>

          {showWelcome && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {AI_INICIO_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => void runQuery(example)}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
                >
                  {example}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InicioPage;

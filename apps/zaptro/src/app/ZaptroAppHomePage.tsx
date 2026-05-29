import React, { useState } from 'react';
import { ChevronDown, Mic, Plus, SendHorizontal } from 'lucide-react';
import { isZaptroLocalhost } from '../lib/appOrigin';
import { useZaptroOllamaStatus } from '../hooks/useZaptroOllamaStatus';
import { ZAPTRO_OLLAMA_DEFAULT_MODEL } from '../constants/zaptroOllamaConfig';
import './zaptroAppHome.css';

function openZaptroAiDrawer(message?: string) {
  window.dispatchEvent(
    new CustomEvent('zaptro:open-ai-drawer', {
      detail: { message: message?.trim() || '' },
    }),
  );
}

const ZaptroAppHomePage: React.FC = () => {
  const [ai, setAi] = useState('');
  const onLocalhost = import.meta.env.DEV || isZaptroLocalhost();
  const { useOllama, online: ollamaOnline, model: ollamaModel } = useZaptroOllamaStatus(true);

  const submitAi = () => {
    const text = ai.trim();
    if (!text) return;
    openZaptroAiDrawer(text);
    setAi('');
  };

  const modelLabel = ollamaModel || ZAPTRO_OLLAMA_DEFAULT_MODEL;

  return (
    <div className={`zhome${onLocalhost ? ' zhome--localhost' : ''}`}>
      <div className="zhome-bg" aria-hidden />

      <div className="zhome-center">
        <div className="zhome-pill">
          <span className="zhome-pill-brand">Zaptro AI</span>
          <span className="zhome-pill-copy">Tudo cruzado num só lugar, pergunta que eu te guio →</span>
        </div>

        <h1 className="zhome-title">Do Zap ao controle.</h1>
        <p className="zhome-sub">Tudo cruzado num só lugar, pergunta que eu te guio.</p>

        <div className="zhome-ai">
          <div className="zhome-ai-row">
            <button type="button" className="zhome-ai-plus" title="Novo" aria-label="Novo" disabled>
              <Plus size={18} strokeWidth={2.4} />
            </button>
            <input
              value={ai}
              onChange={(e) => setAi(e.target.value)}
              placeholder="Como posso te ajudar? CRM, WhatsApp, faturamento, motorista, placa, rota, mapa…"
              className="zhome-ai-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitAi();
                }
              }}
            />
            <div className="zhome-ai-actions">
              <button type="button" className="zhome-ai-pill" disabled>
                Atalhos <ChevronDown size={14} strokeWidth={2.4} />
              </button>
              <button type="button" className="zhome-ai-icon" title="Voz" aria-label="Voz" disabled>
                <Mic size={18} strokeWidth={2.4} />
              </button>
              <button
                type="button"
                className="zhome-ai-send"
                title="Enviar para Zaptro IA"
                aria-label="Enviar"
                disabled={!ai.trim()}
                onClick={submitAi}
              >
                <SendHorizontal size={18} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          {useOllama ? (
            <div
              className="zhome-ai-model"
              data-online={ollamaOnline === true ? 'true' : ollamaOnline === false ? 'false' : 'unknown'}
            >
              <span className="zhome-ai-model-dot" aria-hidden />
              Llama 3.2 · {modelLabel}
              {ollamaOnline === true ? ' · online' : ollamaOnline === false ? ' · offline' : ' · a ligar…'}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ZaptroAppHomePage;

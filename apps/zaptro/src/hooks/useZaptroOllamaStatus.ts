import { useEffect, useState } from 'react';
import {
  isOllamaCopilotPreferred,
  ollamaModelPrimary,
  pingOllamaDetailed,
} from '../lib/ollamaCopilot';

/** Estado da ligação Ollama (Llama 3.2) — partilhado pela home e pelo drawer IA. */
export function useZaptroOllamaStatus(active = true) {
  const useOllama = isOllamaCopilotPreferred();
  const [online, setOnline] = useState<boolean | null>(null);
  const [model, setModel] = useState(ollamaModelPrimary());

  useEffect(() => {
    if (!active || !useOllama) {
      setOnline(null);
      return;
    }

    let cancelled = false;
    const run = () => {
      void pingOllamaDetailed().then((r) => {
        if (cancelled) return;
        setOnline(r.online);
        setModel(r.resolvedModel || ollamaModelPrimary());
      });
    };

    run();
    const interval = window.setInterval(run, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [active, useOllama]);

  return { useOllama, online, model };
}

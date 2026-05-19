import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@shared/index.css';
import './index.css';

/** Quando o #root continua vazio, mostra falha de carregamento (bundle 404, outro app na mesma porta, etc.). */
function showEmptyRootLoadFailure(detail: string) {
  const root = document.getElementById('root');
  if (!root || root.childElementCount > 0) return;
  root.replaceChildren();
  const wrap = document.createElement('div');
  wrap.style.minHeight = '100dvh';
  wrap.style.boxSizing = 'border-box';
  wrap.style.padding = '24px';
  wrap.style.fontFamily = 'system-ui, sans-serif';
  wrap.style.background = '#fafafa';
  wrap.style.color = '#111';
  const h1 = document.createElement('h1');
  h1.style.fontSize = '20px';
  h1.style.margin = '0 0 12px';
  h1.textContent = 'Não foi possível iniciar o Logta SaaS';
  const p = document.createElement('p');
  p.style.margin = '0 0 16px';
  p.style.color = '#444';
  p.style.maxWidth = '560px';
  p.style.lineHeight = '1.5';
  p.innerHTML =
    'O JavaScript principal não carregou ou outro processo está usando a mesma porta. Rode o dev server <strong>nesta pasta</strong> (<code>apps/logta-saas</code>), pare outros servidores na porta 5173 e atualize com ⌘⇧R.';
  const pre = document.createElement('pre');
  pre.style.padding = '16px';
  pre.style.background = '#fff';
  pre.style.border = '1px solid #e5e5e5';
  pre.style.borderRadius = '8px';
  pre.style.overflow = 'auto';
  pre.style.fontSize = '12px';
  pre.style.whiteSpace = 'pre-wrap';
  pre.textContent = detail;
  wrap.append(h1, p, pre);
  root.appendChild(wrap);
}

/** Em dev, força `localhost` (evita 127.0.0.1 quebrar login/links compartilhados). */
if (typeof window !== 'undefined' && import.meta.env.DEV && window.location.hostname === '127.0.0.1') {
  const port = window.location.port || '5173';
  window.location.replace(
    `http://localhost:${port}${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
}

if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event: Event) => {
      const t = event.target;
      if (!t || t === window) return;
      const src =
        t instanceof HTMLScriptElement
          ? t.src
          : t instanceof HTMLLinkElement
            ? t.href
            : '';
      if (!src) return;
      showEmptyRootLoadFailure(`Recurso não carregado:\n${src}`);
    },
    true,
  );
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const r = event.reason;
    const msg = r instanceof Error ? r.message : String(r);
    if (/Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(msg)) {
      showEmptyRootLoadFailure(msg);
    }
  });
  if (import.meta.env.DEV) {
    console.info('[Logta SaaS] Dev em http://localhost:5173 — npm run dev em apps/logta-saas');
  }
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Logta] erro na árvore React:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const { error } = this.state;
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            background: '#fafafa',
            color: '#111',
            boxSizing: 'border-box',
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Algo quebrou ao carregar o Logta</h1>
          <p style={{ marginBottom: 16, color: '#444', maxWidth: 560 }}>
            Abra o DevTools (Console) e envie o erro abaixo para a equipe. Depois tente atualizar com ⌘⇧R (hard
            refresh).
          </p>
          <pre
            style={{
              padding: 16,
              background: '#fff',
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 13,
              whiteSpace: 'pre-wrap',
            }}
          >
            {error.message}
            {import.meta.env.DEV && error.stack ? `\n\n${error.stack}` : ''}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
);

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL UI ERROR:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const msg = this.state.error
        ? `${this.state.error.name}: ${this.state.error.message}`
        : 'Erro desconhecido.';

      return (
        <div style={styles.wrap}>
          <p style={styles.lead}>Algo deu errado ao mostrar esta página.</p>
          <pre style={styles.pre}>{msg}</pre>
          <div style={styles.actions}>
            <button type="button" style={styles.btn} onClick={() => window.location.reload()}>
              Recarregar
            </button>
            <button type="button" style={styles.btn} onClick={() => (window.location.href = '/')}>
              Ir para o início
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    margin: 0,
    padding: '32px 24px',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 14,
    lineHeight: 1.5,
  },
  lead: {
    margin: '0 0 16px',
    maxWidth: 560,
    fontWeight: 600,
  },
  pre: {
    margin: '0 0 24px',
    maxWidth: 640,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 12,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: '#334155',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  btn: {
    font: 'inherit',
    fontSize: 13,
    fontWeight: 500,
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#0f172a',
    cursor: 'pointer',
  },
};

export default ErrorBoundary;

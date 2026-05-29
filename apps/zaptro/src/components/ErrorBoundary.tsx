import React, { Component, ErrorInfo, ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const LIME = '#D9FF00';
const SUPPORT_EMAIL = 'suporte@zaptro.com.br';
const SUPPORT_WHATSAPP =
  (import.meta.env.VITE_ZAPTRO_SUPPORT_WHATSAPP as string | undefined)?.replace(/\D/g, '') || '5511988882222';

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Zaptro Critical Error:', error, errorInfo);
  }

  private handleContactSupport = () => {
    const page = typeof window !== 'undefined' ? window.location.pathname : '';
    const message = encodeURIComponent(
      `Olá, encontrei um erro no painel Zaptro e preciso de ajuda.${page ? `\n\nPágina: ${page}` : ''}`,
    );
    const waUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`;
    const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Erro no painel Zaptro')}&body=${message}`;
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            maxWidth: 1480,
            margin: '0 auto',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            padding: '0 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: 'rgba(217, 255, 0, 0.35)',
              border: `2px solid ${LIME}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 28,
              fontSize: 36,
            }}
            aria-hidden
          >
            ⚠️
          </div>

          <h1
            style={{
              fontSize: 'clamp(22px, 4vw, 28px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 12px',
              color: '#0f172a',
            }}
          >
            Ops algo deu errado.
          </h1>

          <p
            style={{
              fontSize: 15,
              color: '#C9C9C9',
              maxWidth: 559,
              lineHeight: 1.55,
              margin: '0 0 32px',
              fontWeight: 600,
            }}
          >
            Pode ser algo temporário no sistema. Fale com o nosso suporte e a equipa ajuda você.
          </p>

          <button
            type="button"
            onClick={this.handleContactSupport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              height: 50,
              minWidth: 220,
              padding: '0 40px',
              borderRadius: 14,
              backgroundColor: LIME,
              color: '#000',
              border: 'none',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(217, 255, 0, 0.35)',
            }}
          >
            <MessageCircle size={20} strokeWidth={2.2} aria-hidden />
            Falar com suporte
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

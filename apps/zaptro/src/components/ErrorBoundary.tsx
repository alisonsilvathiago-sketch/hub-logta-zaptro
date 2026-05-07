import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Zaptro Critical Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#000',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, -apple-system, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(217, 255, 0, 0.05) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            backgroundColor: 'rgba(217, 255, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
            position: 'relative'
          }}>
            <span style={{ fontSize: '40px' }}>⚠️</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 32px)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #FFF 0%, #D9FF00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Ops! Algo deu errado no painel.
          </h1>

          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '480px',
            lineHeight: '1.6',
            marginBottom: '40px'
          }}>
            Detectamos uma falha inesperada na renderização. Não se preocupe, seus dados estão seguros.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '14px 28px',
                borderRadius: '14px',
                backgroundColor: '#D9FF00',
                color: '#000',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Tentar Novamente
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                padding: '14px 28px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#FFF',
                border: '1px solid rgba(255,255,255,0.1)',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              Ir para o Início
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <div style={{
              marginTop: '64px',
              padding: '24px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'left',
              maxWidth: '800px',
              width: '100%',
              overflow: 'auto'
            }}>
              <p style={{ color: '#EF4444', fontWeight: 800, fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase' }}>Debug Error:</p>
              <pre style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0, fontFamily: 'monospace' }}>
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react';

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
    hasError: false
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

      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconBox}>
              <AlertTriangle size={48} color="#EF4444" />
            </div>
            <h1 style={styles.title}>Ops! Algo não saiu como o esperado</h1>
            <p style={styles.desc}>
              Ocorreu um erro crítico na interface. Nossa inteligência já foi notificada e estamos trabalhando para resolver.
            </p>
            {this.state.error && (
              <div style={styles.errorLog}>
                {this.state.error.toString()}
              </div>
            )}
            <div style={styles.actions}>
              <button 
                onClick={() => window.location.reload()} 
                style={styles.primaryBtn}
              >
                <RefreshCw size={18} style={{ marginRight: '8px' }} />
                Tentar Novamente
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                style={styles.secondaryBtn}
              >
                <Home size={18} style={{ marginRight: '8px' }} />
                Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, any> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    padding: '24px',
    fontFamily: 'Inter, sans-serif'
  },
  card: {
    maxWidth: '560px',
    width: '100%',
    backgroundColor: 'white',
    padding: '48px',
    borderRadius: '32px',
    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)',
    textAlign: 'center',
    border: '1px solid #E2E8F0'
  },
  iconBox: {
    width: '96px',
    height: '96px',
    backgroundColor: '#FEF2F2',
    borderRadius: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 32px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: '16px',
    letterSpacing: '-0.5px'
  },
  desc: {
    fontSize: '16px',
    color: '#64748B',
    lineHeight: '1.6',
    marginBottom: '32px'
  },
  errorLog: {
    backgroundColor: '#F1F5F9',
    padding: '16px',
    borderRadius: '16px',
    marginBottom: '32px',
    fontSize: '12px',
    color: '#475569',
    fontFamily: 'monospace',
    textAlign: 'left',
    overflowX: 'auto'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 24px',
    backgroundColor: '#0F172A',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 24px',
    backgroundColor: 'white',
    color: '#0F172A',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px'
  },
  footer: {
    marginTop: '32px',
    fontSize: '12px',
    color: '#94A3B8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '600'
  }
};

export default ErrorBoundary;

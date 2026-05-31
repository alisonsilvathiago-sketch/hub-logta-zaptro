import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  title?: string;
};

type State = {
  error: Error | null;
};

export default class LogstokaRouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[LogStoka] Erro na página:', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="ls-route-error" role="alert">
        <h2 className="ls-route-error__title">{this.props.title ?? 'Não foi possível carregar esta página'}</h2>
        <p className="ls-route-error__message">
          {error.message || 'Erro inesperado ao renderizar o módulo.'}
        </p>
        <button type="button" className="ls-btn-primary" onClick={this.handleRetry}>
          Recarregar página
        </button>
      </div>
    );
  }
}

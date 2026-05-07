import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from '@shared/context/AuthContext'
import { Toaster } from 'react-hot-toast'
import './index.css'

// Error Boundary para evitar tela branca total
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("LogDock Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#FFF',
          fontFamily: 'sans-serif'
        }}>
          <h1 style={{ color: '#0F172A', fontSize: '24px', fontWeight: 900 }}>Ocorreu um erro inesperado</h1>
          <p style={{ color: '#64748B', marginTop: '8px' }}>Por favor, recarregue a página.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              marginTop: '24px', 
              padding: '12px 24px', 
              backgroundColor: '#0061FF', 
              color: '#FFF', 
              border: 'none', 
              borderRadius: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Recarregar Sistema
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: '#1A1A1A',
                color: '#FFFFFF',
                padding: '16px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                margin: '0 24px 24px 0'
              },
              success: {
                iconTheme: {
                  primary: '#25D366',
                  secondary: '#FFF',
                },
              },
            }}
          />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

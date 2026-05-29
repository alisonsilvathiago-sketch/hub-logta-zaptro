import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import '@shared/index.css';

if (import.meta.env.DEV) {
  console.info(
    '%c[Zaptro]%c Vendas: /  ·  QR: /app/configuracoes?tab=config  ·  Conversas: /app/conversas',
    'background:#D9FF00;color:#000;font-weight:800;padding:2px 8px;border-radius:4px',
    'color:#949494;font-weight:600',
  );
  console.info(
    '%c[Zaptro IA v2]%c Chat + Ollama llama3.2 · drawer portal · home input activo',
    'background:#0f172a;color:#d9ff00;font-weight:800;padding:2px 8px;border-radius:4px',
    'color:#64748b;font-weight:600',
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <TenantProvider>
              <Toaster position="bottom-right" />
              <App />
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>,
  );
}

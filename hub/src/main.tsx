import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@shared/index.css';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import { AuthProvider } from './core/context/AuthContext';
import { TenantProvider } from './core/context/TenantContext';
import { ToastProvider } from './core/context/ToastContext';
import { SyncProvider } from './core/context/SyncContext';
import { SystemConfigProvider } from './core/context/SystemConfigContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <SystemConfigProvider>
            <ToastProvider>
              <SyncProvider>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
              </SyncProvider>
            </ToastProvider>
          </SystemConfigProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);


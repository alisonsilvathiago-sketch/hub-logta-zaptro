import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@shared/index.css';
import './hub/styles/hub-theme.css';
import './hub-fields.css';
import './hub-master-design.css';
import { applyHubThemeToDocument, readStoredHubThemeMode, resolveHubTheme } from './core/lib/hubTheme';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import { AuthProvider } from './core/context/AuthContext';
import { TenantProvider } from './core/context/TenantContext';
import { ToastProvider } from './core/context/ToastContext';
import { SyncProvider } from './core/context/SyncContext';
import { SystemConfigProvider } from './core/context/SystemConfigContext';
import { HubThemeProvider } from './core/context/HubThemeContext';

applyHubThemeToDocument(resolveHubTheme(readStoredHubThemeMode()), false);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <HubThemeProvider>
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
      </HubThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

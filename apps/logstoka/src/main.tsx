import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LogstokaAuthProvider } from '@/context/LogstokaAuthProvider';
import { LogstokaTenantProvider } from '@/context/LogstokaTenantContext';
import { LogstokaBrandingProvider } from '@/context/LogstokaBrandingContext';
import { LogstokaThemeProvider } from '@/context/LogstokaThemeContext';
import { LogstokaMoneyPrivacyProvider } from '@/context/LogstokaMoneyPrivacyContext';
import { LogstokaSecurityProvider } from '@/context/LogstokaSecurityProvider';
import { LogstokaWarehouseScopeProvider } from '@/context/LogstokaWarehouseScopeContext';
import App from './App';
import './index.css';
import '@/components/privacy/moneyPrivacy.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LogstokaThemeProvider>
        <LogstokaAuthProvider>
          <LogstokaTenantProvider>
            <LogstokaWarehouseScopeProvider>
            <LogstokaBrandingProvider>
              <LogstokaMoneyPrivacyProvider>
                <LogstokaSecurityProvider>
                  <Toaster position="bottom-right" />
                  <App />
                </LogstokaSecurityProvider>
              </LogstokaMoneyPrivacyProvider>
            </LogstokaBrandingProvider>
            </LogstokaWarehouseScopeProvider>
          </LogstokaTenantProvider>
        </LogstokaAuthProvider>
      </LogstokaThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

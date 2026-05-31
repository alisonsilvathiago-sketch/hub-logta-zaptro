import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LogstokaAuthProvider } from '@/context/LogstokaAuthProvider';
import { LogstokaTenantProvider } from '@/context/LogstokaTenantContext';
import { LogstokaBrandingProvider } from '@/context/LogstokaBrandingContext';
import { LogstokaThemeProvider } from '@/context/LogstokaThemeContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LogstokaThemeProvider>
        <LogstokaAuthProvider>
          <LogstokaTenantProvider>
            <LogstokaBrandingProvider>
              <Toaster position="bottom-right" />
              <App />
            </LogstokaBrandingProvider>
          </LogstokaTenantProvider>
        </LogstokaAuthProvider>
      </LogstokaThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

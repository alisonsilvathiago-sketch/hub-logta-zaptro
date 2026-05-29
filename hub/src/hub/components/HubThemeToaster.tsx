import React from 'react';
import { Toaster } from 'sonner';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useHubTheme } from '@core/context/HubThemeContext';

const hubToastStyle: React.CSSProperties = {
  width: 360,
  maxWidth: 'min(360px, calc(100vw - 32px))',
  padding: '16px',
  borderRadius: '24px',
  boxShadow: 'none',
  background: 'var(--hub-toast-surface)',
  color: 'var(--hub-toast-text)',
  border: '1px solid var(--hub-border)',
  fontSize: 14,
  fontWeight: 600,
};

/** Toaster do Hub Master — Dark / Light / System, sem sombra. */
export const HubThemeToaster: React.FC = () => {
  const { resolved } = useHubTheme();

  return (
    <Toaster
      position="bottom-right"
      closeButton
      expand={false}
      theme={resolved}
      toastOptions={{
        style: hubToastStyle,
        classNames: {
          toast: 'hub-sonner-toast',
        },
        success: {
          style: {
            ...hubToastStyle,
            borderColor: 'var(--hub-toast-success-border)',
          },
          icon: <CheckCircle size={20} color="var(--hub-accent-blue, #0061FF)" />,
        },
        error: {
          style: {
            ...hubToastStyle,
            borderColor: 'var(--hub-toast-error-border)',
          },
          icon: <AlertCircle size={20} color="#EF4444" />,
        },
        warning: {
          style: {
            ...hubToastStyle,
            borderColor: 'var(--hub-toast-warning-border)',
          },
          icon: <AlertTriangle size={20} color="#F59E0B" />,
        },
        info: {
          style: {
            ...hubToastStyle,
            borderColor: 'var(--hub-toast-info-border)',
          },
          icon: <AlertCircle size={20} color="var(--hub-accent-blue, #0061FF)" />,
        },
      }}
    />
  );
};

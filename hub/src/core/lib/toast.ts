import type { CSSProperties } from 'react';
import { toast } from 'sonner';

const hubToastStyle: CSSProperties = {
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

export const toastSuccess = (msg: string) => {
  toast.success(msg, {
    duration: 4500,
    style: { ...hubToastStyle, borderColor: 'var(--hub-toast-success-border)' },
  });
};

export const toastError = (msg: string) => {
  toast.error(msg, {
    duration: 6000,
    style: { ...hubToastStyle, borderColor: 'var(--hub-toast-error-border)' },
  });
};

export const toastLoading = (msg: string): string | number => {
  return toast.loading(msg, { style: hubToastStyle });
};

export const toastInfo = (msg: string) => {
  toast(msg, {
    duration: 5000,
    style: { ...hubToastStyle, borderColor: 'var(--hub-toast-info-border)' },
  });
};

export const toastDismiss = (id?: string | number) => {
  if (id) toast.dismiss(id);
  else toast.dismiss();
};

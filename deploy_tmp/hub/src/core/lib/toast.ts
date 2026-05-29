import { toast } from 'sonner';

export const toastSuccess = (msg: string) => {
  toast.success(msg, { duration: 4500 });
};

export const toastError = (msg: string) => {
  toast.error(msg, { duration: 6000 });
};

export const toastLoading = (msg: string): string | number => {
  return toast.loading(msg);
};

export const toastInfo = (msg: string) => {
  toast(msg, {
    icon: 'ℹ️',
    duration: 5000,
    style: {
      borderRadius: '16px',
      background: '#0F172A',
      color: '#fff',
    },
  });
};

export const toastDismiss = (id?: string | number) => {
  if (id) toast.dismiss(id);
  else toast.dismiss();
};

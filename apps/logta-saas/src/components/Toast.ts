export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Usa o mesmo canal de toasts que `App.tsx` expõe em `window.showToast`. */
export function showToast(type: ToastType, message: string, title?: string) {
  (window as unknown as { showToast?: (t: ToastType, m: string, title?: string) => void }).showToast?.(
    type,
    message,
    title
  );
}

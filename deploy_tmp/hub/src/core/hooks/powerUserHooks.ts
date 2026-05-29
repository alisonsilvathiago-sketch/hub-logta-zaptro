import { useEffect } from 'react';

export function useFocusNavigation() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Custom focus logic if needed, otherwise default browser behavior is usually best
        // but we can add data-focusable support to jump between sections
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

export function useAutoSave(data: any, saveFn: () => void, delay = 2000) {
  useEffect(() => {
    if (!data) return;
    
    const timeout = setTimeout(() => {
      saveFn();
    }, delay);

    return () => clearTimeout(timeout);
  }, [data, saveFn, delay]);
}

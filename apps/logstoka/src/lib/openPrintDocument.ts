const PRINT_STORAGE_PREFIX = 'logstoka-print:';

export function stashPrintHtml(html: string): string {
  const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem(`${PRINT_STORAGE_PREFIX}${key}`, html);
  return key;
}

export function readPrintHtml(key: string): string | null {
  return sessionStorage.getItem(`${PRINT_STORAGE_PREFIX}${key}`);
}

export function printDocumentPath(key: string): string {
  return `/app/impressao/conferencia?key=${encodeURIComponent(key)}`;
}

/**
 * Abre HTML de impressão numa nova aba.
 * 1) about:blank + document.write (conteúdo visível de imediato)
 * 2) fallback: rota /app/impressao/conferencia?key=… (URL normal, sem blob:)
 */
export function openPrintDocument(html: string): Window | null {
  const popup = window.open('about:blank', '_blank');
  if (popup) {
    try {
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      popup.focus();
      return popup;
    } catch {
      try {
        popup.close();
      } catch {
        /* ignore */
      }
    }
  }

  const key = stashPrintHtml(html);
  const url = `${window.location.origin}${printDocumentPath(key)}`;
  const routeWin = window.open(url, '_blank');
  return routeWin;
}

export function resolvePrintLogoUrl(logoUrl: string | null | undefined): string {
  const fallback = `${window.location.origin}/logstoka-mark.svg`;
  if (!logoUrl) return fallback;
  if (logoUrl.startsWith('http') || logoUrl.startsWith('data:') || logoUrl.startsWith('blob:')) {
    return logoUrl;
  }
  const path = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
  return `${window.location.origin}${path}`;
}

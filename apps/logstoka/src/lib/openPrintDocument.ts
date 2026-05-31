const PRINT_STORAGE_PREFIX = 'logstoka-print:';
const PRINT_STORAGE_TTL_MS = 30 * 60 * 1000;

type StashedPrint = {
  html: string;
  createdAt: number;
};

function cleanupOldPrints() {
  try {
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PRINT_STORAGE_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) {
        localStorage.removeItem(key);
        continue;
      }
      try {
        const parsed = JSON.parse(raw) as StashedPrint;
        if (now - parsed.createdAt > PRINT_STORAGE_TTL_MS) localStorage.removeItem(key);
      } catch {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function stashPrintHtml(html: string): string {
  cleanupOldPrints();
  const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const payload: StashedPrint = { html, createdAt: Date.now() };
  try {
    localStorage.setItem(`${PRINT_STORAGE_PREFIX}${key}`, JSON.stringify(payload));
  } catch {
    /* fallback route may fail — blob/about:blank still work */
  }
  return key;
}

export function readPrintHtml(key: string): string | null {
  try {
    const raw = localStorage.getItem(`${PRINT_STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StashedPrint;
    if (Date.now() - parsed.createdAt > PRINT_STORAGE_TTL_MS) {
      localStorage.removeItem(`${PRINT_STORAGE_PREFIX}${key}`);
      return null;
    }
    return parsed.html;
  } catch {
    return null;
  }
}

/** Rota pública — não passa pelo guard de login (HTML já foi gerado na sessão autenticada). */
export function printDocumentPath(key: string): string {
  return `/impressao/documento?key=${encodeURIComponent(key)}`;
}

function openBlobDocument(html: string): Window | null {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    URL.revokeObjectURL(url);
    return null;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
  win.focus();
  return win;
}

function openAboutBlankDocument(html: string): Window | null {
  const popup = window.open('about:blank', '_blank');
  if (!popup) return null;
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
    return null;
  }
}

/**
 * Abre HTML de impressão numa nova aba (pré-visualização antes de imprimir).
 * 1) Blob URL — não exige login nem pop-up com document.write
 * 2) about:blank + document.write
 * 3) localStorage + rota pública /impressao/documento
 */
export function openPrintDocument(html: string): Window | null {
  const blobWin = openBlobDocument(html);
  if (blobWin) return blobWin;

  const blankWin = openAboutBlankDocument(html);
  if (blankWin) return blankWin;

  const key = stashPrintHtml(html);
  const url = `${window.location.origin}${printDocumentPath(key)}`;
  return window.open(url, '_blank', 'noopener,noreferrer');
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

export function resolvePrintBrandAssetUrl(relativePath: string): string {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${window.location.origin}${path}`;
}

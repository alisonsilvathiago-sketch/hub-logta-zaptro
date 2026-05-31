import { recommendPresetForPrinter, type LabelPresetId } from '@/lib/labelPresets';

const PRINTER_STORAGE_KEY = 'logstoka-label-printer';
const SCANNER_STORAGE_KEY = 'logstoka-label-scanner';

export type SavedPrinterProfile = {
  printerKey: string;
  displayName: string;
  presetId: LabelPresetId;
  savedAt: string;
};

export type SavedScannerProfile = {
  displayName: string;
  lastRead?: string;
  lastReadAt?: string;
  savedAt: string;
};

export type PrinterDetectionResult = {
  status: 'configured' | 'unknown';
  profile: SavedPrinterProfile | null;
  message: string;
};

export type ScannerDetectionResult = {
  status: 'active' | 'configured' | 'unknown';
  profile: SavedScannerProfile | null;
  message: string;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function loadSavedPrinter(): SavedPrinterProfile | null {
  return readJson<SavedPrinterProfile>(PRINTER_STORAGE_KEY);
}

export function savePrinterProfile(profile: Omit<SavedPrinterProfile, 'savedAt'>): SavedPrinterProfile {
  const next: SavedPrinterProfile = { ...profile, savedAt: new Date().toISOString() };
  writeJson(PRINTER_STORAGE_KEY, next);
  return next;
}

export function loadSavedScanner(): SavedScannerProfile | null {
  return readJson<SavedScannerProfile>(SCANNER_STORAGE_KEY);
}

export function saveScannerRead(displayName: string, readValue: string): SavedScannerProfile {
  const prev = loadSavedScanner();
  const next: SavedScannerProfile = {
    displayName: prev?.displayName ?? displayName,
    lastRead: readValue.slice(0, 120),
    lastReadAt: new Date().toISOString(),
    savedAt: prev?.savedAt ?? new Date().toISOString(),
  };
  writeJson(SCANNER_STORAGE_KEY, next);
  return next;
}

export function saveScannerName(displayName: string): SavedScannerProfile {
  const next: SavedScannerProfile = {
    displayName,
    lastRead: loadSavedScanner()?.lastRead,
    lastReadAt: loadSavedScanner()?.lastReadAt,
    savedAt: new Date().toISOString(),
  };
  writeJson(SCANNER_STORAGE_KEY, next);
  return next;
}

/**
 * Navegadores web não expõem lista de impressoras USB com nome confiável.
 * Usamos perfil salvo + diálogo de impressão do sistema na hora de imprimir.
 */
export function detectPrinterProfile(): PrinterDetectionResult {
  const profile = loadSavedPrinter();
  if (profile) {
    return {
      status: 'configured',
      profile,
      message: `${profile.displayName} · tamanho sugerido ${profile.presetId}`,
    };
  }
  return {
    status: 'unknown',
    profile: null,
    message: 'Selecione o modelo da impressora térmica. Na impressão, o Windows/Mac mostrará a fila real.',
  };
}

export function detectScannerProfile(): ScannerDetectionResult {
  const profile = loadSavedScanner();
  if (profile?.lastReadAt) {
    const age = Date.now() - new Date(profile.lastReadAt).getTime();
    if (age < 120_000) {
      return {
        status: 'active',
        profile,
        message: `Leitura recente: ${profile.lastRead}`,
      };
    }
  }
  if (profile?.displayName) {
    return {
      status: 'configured',
      profile,
      message: `${profile.displayName} · use "Testar bipador" abaixo`,
    };
  }
  return {
    status: 'unknown',
    profile: null,
    message:
      'Bipadores USB aparecem como teclado (HID). O LogStoka detecta leituras rápidas + Enter — não o modelo exato.',
  };
}

export function buildPrinterProfileFromKey(printerKey: string): SavedPrinterProfile {
  const presetId = recommendPresetForPrinter(printerKey);
  const labels: Record<string, string> = {
    'zebra-zd220': 'Zebra ZD220',
    'zebra-zd420': 'Zebra ZD420',
    'elgin-l42': 'Elgin L42 PRO',
    'argox-os214': 'Argox OS-214 Plus',
    'gprinter-gp1324': 'Gprinter GP-1324D',
    'tsc-te244': 'TSC TE244',
    'brother-ql800': 'Brother QL-800',
    other: 'Impressora térmica',
  };
  return savePrinterProfile({
    printerKey,
    displayName: labels[printerKey] ?? 'Impressora térmica',
    presetId,
  });
}

/** Escuta leituras estilo bipador (caracteres rápidos + Enter) */
export function attachBarcodeWedgeListener(
  onRead: (value: string) => void,
  options?: { minLength?: number; flushMs?: number },
): () => void {
  const minLength = options?.minLength ?? 3;
  const flushMs = options?.flushMs ?? 80;
  let buffer = '';
  let timer: number | null = null;

  const flush = () => {
    const value = buffer.trim();
    buffer = '';
    if (value.length >= minLength) onRead(value);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (timer) window.clearTimeout(timer);
      flush();
      return;
    }

    if (event.key.length === 1) {
      buffer += event.key;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(flush, flushMs);
    }
  };

  window.addEventListener('keydown', onKeyDown);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    if (timer) window.clearTimeout(timer);
  };
}

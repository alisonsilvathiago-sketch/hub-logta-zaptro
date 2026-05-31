import { parseSpreadsheetFile, type ParsedSpreadsheet } from '@/lib/importSpreadsheetParser';
import { logstokaApi } from '@/lib/logstokaApi';

export type ImportFileKind = 'excel' | 'csv' | 'text' | 'pdf' | 'tsv' | 'image' | 'unknown';

export type ImportFileDetection = {
  kind: ImportFileKind;
  label: string;
  extension: string;
  mimeType: string;
  confidence: 'high' | 'medium' | 'low';
  method: 'extension' | 'mime' | 'content';
};

export type ImportParseResult = ParsedSpreadsheet & {
  detection: ImportFileDetection;
  aiAssisted: boolean;
  aiSummary?: string;
};

const SPREADSHEET_EXTS = new Set(['xlsx', 'xls', 'csv', 'txt', 'tsv', 'tab']);
const TEXT_EXTS = new Set(['txt', 'log', 'dat', 'md', 'rtf']);
const ALL_IMPORT_EXTS = new Set([...SPREADSHEET_EXTS, 'pdf', 'json', ...TEXT_EXTS]);

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function extensionOf(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? '';
}

function kindFromExtension(ext: string): ImportFileKind | null {
  if (ext === 'xlsx' || ext === 'xls') return 'excel';
  if (ext === 'csv') return 'csv';
  if (ext === 'tsv' || ext === 'tab') return 'tsv';
  if (ext === 'pdf') return 'pdf';
  if (TEXT_EXTS.has(ext)) return 'text';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) return 'image';
  return null;
}

function kindFromMime(mime: string): ImportFileKind | null {
  if (!mime) return null;
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'excel';
  if (mime === 'text/csv') return 'csv';
  if (mime === 'text/tab-separated-values') return 'tsv';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('text/')) return 'text';
  if (mime.startsWith('image/')) return 'image';
  return null;
}

function kindFromContent(sample: string): ImportFileKind | null {
  const head = sample.slice(0, 512);
  if (head.startsWith('%PDF')) return 'pdf';
  if (head.startsWith('PK')) return 'excel';
  if (/sku|quantidade|marketplace|codigo|código/i.test(head) && (head.includes(',') || head.includes(';') || head.includes('\t'))) {
    return head.includes('\t') && !head.includes(',') ? 'tsv' : 'csv';
  }
  if (head.includes('\t') && head.split('\n').length > 1) return 'tsv';
  return null;
}

const KIND_LABELS: Record<ImportFileKind, string> = {
  excel: 'Planilha Excel',
  csv: 'Arquivo CSV',
  tsv: 'Arquivo TSV (tabulado)',
  text: 'Documento de texto',
  pdf: 'Documento PDF',
  image: 'Imagem / OCR',
  unknown: 'Formato genérico',
};

export function detectImportFile(file: File, contentSample?: string): ImportFileDetection {
  const ext = extensionOf(file);
  const mimeType = file.type || 'application/octet-stream';

  const byExt = kindFromExtension(ext);
  if (byExt) {
    return {
      kind: byExt,
      label: KIND_LABELS[byExt],
      extension: ext,
      mimeType,
      confidence: 'high',
      method: 'extension',
    };
  }

  const byMime = kindFromMime(mimeType);
  if (byMime) {
    return {
      kind: byMime,
      label: KIND_LABELS[byMime],
      extension: ext || byMime,
      mimeType,
      confidence: 'medium',
      method: 'mime',
    };
  }

  if (contentSample) {
    const byContent = kindFromContent(contentSample);
    if (byContent) {
      return {
        kind: byContent,
        label: KIND_LABELS[byContent],
        extension: ext || byContent,
        mimeType,
        confidence: 'medium',
        method: 'content',
      };
    }
  }

  return {
    kind: 'unknown',
    label: KIND_LABELS.unknown,
    extension: ext || 'file',
    mimeType,
    confidence: 'low',
    method: 'extension',
  };
}

export function isSupportedImportFile(file: File): boolean {
  const ext = extensionOf(file);
  if (ALL_IMPORT_EXTS.has(ext)) return true;
  if (file.type.startsWith('text/') || file.type.startsWith('image/')) return true;
  if (file.type === 'application/pdf') return true;
  return false;
}

type ReportPreviewRow = {
  sku?: string;
  quantity?: number;
  marketplace?: string;
  store?: string;
  productName?: string;
};

function rowsToParsedSpreadsheet(fileName: string, rows: ReportPreviewRow[]): ParsedSpreadsheet {
  return {
    headers: ['sku', 'quantidade', 'marketplace', 'loja', 'nome_produto'],
    rows: rows
      .filter((r) => r.sku && r.quantity && r.quantity > 0)
      .map((r) => [
        String(r.sku),
        String(r.quantity),
        String(r.marketplace ?? ''),
        String(r.store ?? ''),
        String(r.productName ?? ''),
      ]),
    fileName,
  };
}

async function tryAiatoExtract(
  file: File,
  detection: ImportFileDetection,
): Promise<{ parsed: ParsedSpreadsheet; summary: string } | null> {
  try {
    let payload: { file_type: string; content?: string; base64?: string };

    if (detection.kind === 'pdf' || detection.kind === 'excel') {
      const base64 = await fileToBase64(file);
      payload = {
        file_type: detection.kind === 'pdf' ? 'pdf' : 'xlsx',
        base64,
      };
    } else {
      const content = await file.text();
      payload = {
        file_type: detection.kind === 'text' || detection.kind === 'unknown' ? 'text' : 'csv',
        content,
      };
    }

    const result = await logstokaApi.aiValidateImport(payload);
    const preview = (result as { preview_rows?: ReportPreviewRow[] }).preview_rows;
    if (Array.isArray(preview) && preview.length > 0) {
      return {
        parsed: rowsToParsedSpreadsheet(file.name, preview),
        summary: result.summary ?? 'Aiato extraiu linhas do documento.',
      };
    }
    if (result.rows_total > 0) {
      return {
        parsed: rowsToParsedSpreadsheet(file.name, preview ?? []),
        summary: result.summary,
      };
    }
  } catch {
    /* API offline — fallback local abaixo */
  }
  return null;
}

function parseTextHeuristic(text: string, fileName: string): ParsedSpreadsheet {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [], fileName };
  }

  const delimiters = ['\t', ';', '|', ','];
  let bestDelimiter = ',';
  let bestScore = 0;
  for (const d of delimiters) {
    const cols = lines[0]!.split(d).length;
    if (cols > bestScore) {
      bestScore = cols;
      bestDelimiter = d;
    }
  }

  const splitLine = (line: string) => line.split(bestDelimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
  const parsed = lines.map(splitLine);
  const headerRowIndex = parsed.findIndex((row) =>
    row.some((cell) => /sku|codigo|código|quantidade|qtd/i.test(cell)),
  );
  const start = headerRowIndex >= 0 ? headerRowIndex : 0;
  return {
    headers: parsed[start] ?? [],
    rows: parsed.slice(start + 1).filter((row) => row.some((cell) => cell.trim())),
    fileName,
  };
}

function needsAiAssist(parsed: ParsedSpreadsheet, detection: ImportFileDetection): boolean {
  if (detection.kind === 'pdf' || detection.kind === 'image') return true;
  if (parsed.headers.length === 0) return true;
  const hasSku = parsed.headers.some((h) => /sku|codigo|código/i.test(h));
  const hasQty = parsed.headers.some((h) => /quantidade|qtd|qty|un/i.test(h));
  return !hasSku || !hasQty;
}

export async function parseImportFileSmart(file: File): Promise<ImportParseResult> {
  const textSample = await file.slice(0, 4096).text().catch(() => '');
  const detection = detectImportFile(file, textSample);

  if (detection.kind === 'image') {
    const ai = await tryAiatoExtract(file, detection);
    if (ai) {
      return {
        ...ai.parsed,
        detection,
        aiAssisted: true,
        aiSummary: ai.summary,
      };
    }
    return {
      headers: [],
      rows: [],
      fileName: file.name,
      detection,
      aiAssisted: false,
      aiSummary: 'Imagem detectada — use OCR ou envie CSV/Excel para importação offline.',
    };
  }

  if (detection.kind === 'pdf') {
    const ai = await tryAiatoExtract(file, detection);
    if (ai) {
      return {
        ...ai.parsed,
        detection,
        aiAssisted: true,
        aiSummary: ai.summary,
      };
    }
    return {
      headers: [],
      rows: [],
      fileName: file.name,
      detection,
      aiAssisted: false,
      aiSummary: 'PDF detectado — conecte a API LogStoka para o Aiato ler o documento.',
    };
  }

  let parsed: ParsedSpreadsheet;
  if (detection.kind === 'excel' || detection.kind === 'csv' || detection.kind === 'tsv') {
    parsed = await parseSpreadsheetFile(file);
  } else if (detection.kind === 'text' || detection.kind === 'unknown') {
    const fullText = textSample.length >= 4096 ? await file.text() : textSample;
    parsed = parseTextHeuristic(fullText, file.name);
  } else {
    parsed = await parseSpreadsheetFile(file).catch(() => ({
      headers: [],
      rows: [],
      fileName: file.name,
    }));
  }

  if (needsAiAssist(parsed, detection)) {
    const ai = await tryAiatoExtract(file, detection);
    if (ai && ai.parsed.rows.length > 0) {
      return {
        ...ai.parsed,
        detection,
        aiAssisted: true,
        aiSummary: ai.summary,
      };
    }
  }

  return {
    ...parsed,
    detection,
    aiAssisted: false,
  };
}

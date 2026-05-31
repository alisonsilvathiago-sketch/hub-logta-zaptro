import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_IMPORTS, type DemoImportRow, type ImportValidationSnapshot } from '@/lib/logstokaDemoSeed';
import type { ImportValidationResult } from '@/lib/importSpreadsheetValidator';
import { pulseLogstokaSystem } from '@/lib/logstokaSystemPulse';

const STORAGE_PREFIX = 'logstoka-demo-imports:';

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}${companyId}`;
}

function readExtra(companyId: string): DemoImportRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    return raw ? (JSON.parse(raw) as DemoImportRow[]) : [];
  } catch {
    return [];
  }
}

function writeExtra(companyId: string, rows: DemoImportRow[]): void {
  try {
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent('logstoka:demo-imports-updated'));
    window.dispatchEvent(new CustomEvent('logstoka:system-pulse'));
  } catch {
    /* ignore */
  }
}

export function loadMergedDemoImports(companyId: string | null): DemoImportRow[] {
  const base = companyId && isLogstokaDemoCompany(companyId) ? [...DEMO_IMPORTS] : [];
  if (!companyId || typeof window === 'undefined') return base;
  const extra = readExtra(companyId);
  const byId = new Map<string, DemoImportRow>();
  for (const row of base) byId.set(row.id, row);
  for (const row of extra) byId.set(row.id, row);
  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function appendDemoImport(companyId: string, row: DemoImportRow): void {
  writeExtra(companyId, [row, ...readExtra(companyId)]);
}

export function updateDemoImport(companyId: string, id: string, patch: Partial<DemoImportRow>): DemoImportRow | null {
  const extra = readExtra(companyId);
  const base = DEMO_IMPORTS.find((r) => r.id === id);
  const existing = extra.find((r) => r.id === id) ?? base;
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  writeExtra(companyId, [updated, ...extra.filter((r) => r.id !== id)]);
  return updated;
}

export function getDemoImportById(companyId: string | null, id: string): DemoImportRow | null {
  return loadMergedDemoImports(companyId).find((row) => row.id === id) ?? null;
}

export function validationToSnapshot(result: ImportValidationResult): ImportValidationSnapshot {
  return {
    valid: result.valid,
    score: result.score,
    rows_total: result.rows_total,
    rows_ok: result.rows_ok,
    summary: result.summary,
    column_issues: result.column_issues,
    line_issues: result.line_issues.map((issue) => ({
      row_index: issue.row_index,
      message: issue.message,
      severity: issue.severity,
    })),
    lines: result.lines,
    headers: result.headers,
    raw_rows: result.raw_rows,
  };
}

export function appendDemoImportFromSpreadsheet(
  companyId: string,
  file: File,
  result: ImportValidationResult,
  applied: boolean,
): DemoImportRow {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'xlsx';
  const file_type =
    ext === 'pdf'
      ? 'pdf'
      : ext === 'txt' || ext === 'tsv' || ext === 'tab'
        ? 'txt'
        : ext === 'csv'
          ? 'csv'
          : ext === 'xls'
            ? 'xls'
            : 'xlsx';
  const row: DemoImportRow = {
    id: `imp-${Date.now()}`,
    file_name: file.name,
    file_type,
    status: applied ? 'completed' : result.valid ? 'validated' : 'failed',
    rows_processed: applied ? result.rows_ok : result.rows_total,
    created_at: new Date().toISOString(),
    validation: validationToSnapshot(result),
    movements_created: applied ? result.rows_ok : 0,
  };
  appendDemoImport(companyId, row);
  if (applied) pulseLogstokaSystem();
  return row;
}

export async function estimateDemoImportFromFile(
  file: File,
): Promise<{ fileType: string; rows: number; status: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'file';
  const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  const fileType = isImage
    ? 'ocr'
    : ext === 'xml'
      ? 'xml'
      : ext === 'pdf'
        ? 'pdf'
        : ext === 'xlsx' || ext === 'xls'
          ? 'xlsx'
          : ext === 'csv' || ext === 'txt'
            ? 'csv'
            : ext;

  try {
    if (fileType === 'xml') {
      const text = await file.text();
      const items = (text.match(/<det[\s>]/gi) ?? []).length;
      return { fileType, rows: items > 0 ? items : 8, status: 'completed' };
    }
    if (fileType === 'csv' || fileType === 'txt') {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      const rows = Math.max(0, lines.length - 1);
      return { fileType, rows: rows > 0 ? rows : 1, status: rows > 0 ? 'completed' : 'warning' };
    }
  } catch {
    /* fallback below */
  }

  const defaults: Record<string, number> = { ocr: 24, pdf: 8, xlsx: 50, xls: 50 };
  return {
    fileType,
    rows: defaults[fileType] ?? 12,
    status: 'completed',
  };
}

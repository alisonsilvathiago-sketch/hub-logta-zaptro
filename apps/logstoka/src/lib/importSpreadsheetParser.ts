import * as XLSX from 'xlsx';
import {
  IMPORT_TEMPLATE_HEADERS,
  IMPORT_TEMPLATE_INSTRUCTIONS,
  IMPORT_TEMPLATE_SAMPLE_ROW,
} from '@/lib/importSpreadsheetSchema';

export type ParsedSpreadsheet = {
  headers: string[];
  rows: string[][];
  fileName: string;
};

export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'csv' || ext === 'txt') {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) {
      return { headers: [], rows: [], fileName: file.name };
    }
    const delimiter = lines[0]!.includes(';') ? ';' : ',';
    const parsed = lines.map((line) => splitCsvLine(line, delimiter));
    return {
      headers: parsed[0] ?? [],
      rows: parsed.slice(1),
      fileName: file.name,
    };
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [], fileName: file.name };
  }
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][];
  const normalized = matrix.map((row) => row.map((cell) => String(cell ?? '').trim()));
  const headerRowIndex = normalized.findIndex((row) =>
    row.some((cell) => normalizeHeaderCell(cell) === 'sku'),
  );
  const start = headerRowIndex >= 0 ? headerRowIndex : 0;
  return {
    headers: normalized[start] ?? [],
    rows: normalized.slice(start + 1).filter((row) => row.some((cell) => cell.trim())),
    fileName: file.name,
  };
}

function normalizeHeaderCell(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]!;
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

export function downloadOfficialImportTemplate(): void {
  const instructionRows = IMPORT_TEMPLATE_INSTRUCTIONS.map((line) => [line]);
  const ws = XLSX.utils.aoa_to_sheet([
    ...instructionRows,
    [],
    IMPORT_TEMPLATE_HEADERS,
    IMPORT_TEMPLATE_SAMPLE_ROW,
  ]);
  ws['!cols'] = IMPORT_TEMPLATE_HEADERS.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Importacao LogStoka');
  XLSX.writeFile(wb, 'logstoka-modelo-importacao.xlsx');
}

export function buildSpreadsheetTsv(headers: string[], rows: string[][]): string {
  const escape = (value: string) => {
    if (value.includes('\t') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  return [headers, ...rows].map((row) => row.map(escape).join('\t')).join('\n');
}

export function openGoogleSheetsForEdit(headers: string[], rows: string[][]): void {
  const tsv = buildSpreadsheetTsv(headers, rows);
  void navigator.clipboard.writeText(tsv).then(() => {
    window.open('https://sheets.new', '_blank', 'noopener,noreferrer');
  });
}

import { getDemoProductBySku } from '@/lib/logstokaDemoSeed';
import {
  IMPORT_SPREADSHEET_COLUMNS,
  type ImportSpreadsheetColumnDef,
  type ImportSpreadsheetColumnKey,
} from '@/lib/importSpreadsheetSchema';
import type { ParsedSpreadsheet } from '@/lib/importSpreadsheetParser';

export type ImportColumnIssue = {
  column_index: number;
  column_header: string;
  expected: string;
  severity: 'error' | 'warning';
  message: string;
};

export type ImportLineIssue = {
  row_index: number;
  column_key: ImportSpreadsheetColumnKey;
  message: string;
  severity: 'error' | 'warning';
};

export type ImportParsedLine = {
  row_index: number;
  sku: string;
  quantity: number;
  marketplace: string;
  store: string;
  warehouse: string;
  date: string;
  product_name: string;
  status: 'ok' | 'error' | 'warning';
  message?: string;
};

export type ImportValidationResult = {
  valid: boolean;
  score: number;
  rows_total: number;
  rows_ok: number;
  column_issues: ImportColumnIssue[];
  line_issues: ImportLineIssue[];
  lines: ImportParsedLine[];
  summary: string;
  column_map: Partial<Record<ImportSpreadsheetColumnKey, number>>;
  headers: string[];
  raw_rows: string[][];
};

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function matchColumn(header: string): ImportSpreadsheetColumnDef | null {
  const norm = normalizeHeader(header);
  if (!norm) return null;
  return (
    IMPORT_SPREADSHEET_COLUMNS.find(
      (col) => col.header === norm || col.aliases.some((alias) => alias === norm),
    ) ?? null
  );
}

function buildColumnMap(headers: string[]): {
  map: Partial<Record<ImportSpreadsheetColumnKey, number>>;
  issues: ImportColumnIssue[];
} {
  const map: Partial<Record<ImportSpreadsheetColumnKey, number>> = {};
  const issues: ImportColumnIssue[] = [];
  const usedKeys = new Set<ImportSpreadsheetColumnKey>();

  headers.forEach((header, index) => {
    const matched = matchColumn(header);
    if (!matched) {
      if (header.trim()) {
        issues.push({
          column_index: index + 1,
          column_header: header,
          expected: IMPORT_SPREADSHEET_COLUMNS.map((c) => c.header).join(', '),
          severity: 'error',
          message: `Coluna "${header}" não reconhecida. Baixe o modelo oficial e use os nomes corretos.`,
        });
      }
      return;
    }
    if (usedKeys.has(matched.key)) {
      issues.push({
        column_index: index + 1,
        column_header: header,
        expected: matched.header,
        severity: 'error',
        message: `Coluna duplicada para "${matched.header}". Remova a coluna extra.`,
      });
      return;
    }
    usedKeys.add(matched.key);
    map[matched.key] = index;
  });

  for (const col of IMPORT_SPREADSHEET_COLUMNS) {
    if (col.required && map[col.key] === undefined) {
      issues.push({
        column_index: 0,
        column_header: '(ausente)',
        expected: col.header,
        severity: 'error',
        message: `Coluna obrigatória "${col.header}" não encontrada. ${col.hint}`,
      });
    }
  }

  return { map, issues };
}

const VALID_MARKETPLACES = new Set([
  'mercadolivre',
  'ml',
  'shopee',
  'amazon',
  'magalu',
  'tiktok',
  'interno',
  'wms',
]);

function parseQuantity(raw: string): number | null {
  const n = Number.parseInt(raw.replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function validateImportSpreadsheet(parsed: ParsedSpreadsheet): ImportValidationResult {
  const { map, issues: columnIssues } = buildColumnMap(parsed.headers);
  const lineIssues: ImportLineIssue[] = [];
  const lines: ImportParsedLine[] = [];

  if (parsed.headers.length === 0) {
    return {
      valid: false,
      score: 0,
      rows_total: 0,
      rows_ok: 0,
      column_issues: [
        {
          column_index: 0,
          column_header: '(vazio)',
          expected: 'sku, quantidade, marketplace…',
          severity: 'error',
          message: 'Planilha vazia ou sem cabeçalho na primeira linha.',
        },
      ],
      line_issues: [],
      lines: [],
      summary: 'Arquivo vazio — use o modelo LogStoka.',
      column_map: {},
      headers: parsed.headers,
      raw_rows: parsed.rows,
    };
  }

  const hasRequiredColumns = IMPORT_SPREADSHEET_COLUMNS.filter((c) => c.required).every(
    (c) => map[c.key] !== undefined,
  );

  parsed.rows.forEach((row, rowIdx) => {
    const excelRow = rowIdx + 2;
    const get = (key: ImportSpreadsheetColumnKey) => {
      const idx = map[key];
      return idx === undefined ? '' : String(row[idx] ?? '').trim();
    };

    const sku = get('sku');
    const qtyRaw = get('quantity');
    const marketplace = get('marketplace').toLowerCase();
    const store = get('store');
    const warehouse = get('warehouse');
    const date = get('date');
    const product_name = get('product_name');

    let status: ImportParsedLine['status'] = 'ok';
    let message: string | undefined;

    if (!hasRequiredColumns) {
      status = 'error';
      message = 'Corrija as colunas antes de importar linhas.';
    } else if (!sku) {
      status = 'error';
      message = 'SKU vazio';
      lineIssues.push({
        row_index: excelRow,
        column_key: 'sku',
        message: `Linha ${excelRow}: SKU vazio`,
        severity: 'error',
      });
    } else {
      const qty = parseQuantity(qtyRaw);
      if (qty === null) {
        status = 'error';
        message = 'Quantidade inválida';
        lineIssues.push({
          row_index: excelRow,
          column_key: 'quantity',
          message: `Linha ${excelRow}: quantidade "${qtyRaw || '—'}" inválida`,
          severity: 'error',
        });
      } else if (!marketplace) {
        status = 'error';
        message = 'Marketplace vazio';
        lineIssues.push({
          row_index: excelRow,
          column_key: 'marketplace',
          message: `Linha ${excelRow}: marketplace obrigatório`,
          severity: 'error',
        });
      } else if (!VALID_MARKETPLACES.has(marketplace)) {
        status = 'warning';
        message = `Canal "${marketplace}" não reconhecido — será mapeado como interno`;
        lineIssues.push({
          row_index: excelRow,
          column_key: 'marketplace',
          message: `Linha ${excelRow}: marketplace "${marketplace}" desconhecido`,
          severity: 'warning',
        });
      } else {
        const product = getDemoProductBySku(sku);
        if (!product) {
          status = 'warning';
          message = `SKU ${sku} não encontrado no catálogo — revise ou cadastre o produto`;
          lineIssues.push({
            row_index: excelRow,
            column_key: 'sku',
            message: `Linha ${excelRow}: SKU "${sku}" não cadastrado`,
            severity: 'warning',
          });
        }
      }
    }

    lines.push({
      row_index: excelRow,
      sku,
      quantity: parseQuantity(qtyRaw) ?? 0,
      marketplace,
      store,
      warehouse,
      date,
      product_name: product_name || getDemoProductBySku(sku)?.name || '',
      status,
      message,
    });
  });

  const rows_ok = lines.filter((l) => l.status === 'ok').length;
  const columnErrors = columnIssues.filter((i) => i.severity === 'error').length;
  const lineErrors = lineIssues.filter((i) => i.severity === 'error').length;
  const valid = columnErrors === 0 && lineErrors === 0 && lines.length > 0;
  const score = lines.length === 0 ? 0 : Math.round((rows_ok / lines.length) * 100);

  let summary: string;
  if (columnErrors > 0) {
    summary = `${columnErrors} coluna(s) com erro — refaça o cabeçalho usando o modelo oficial.`;
  } else if (lineErrors > 0) {
    summary = `${lineErrors} linha(s) com erro — corrija SKU, quantidade ou marketplace.`;
  } else if (rows_ok === lines.length) {
    summary = `Planilha válida — ${lines.length} linha(s) prontas para aplicar no estoque.`;
  } else {
    summary = `${rows_ok} de ${lines.length} linha(s) OK — ${lineIssues.length} alerta(s) para revisar.`;
  }

  return {
    valid,
    score,
    rows_total: lines.length,
    rows_ok,
    column_issues: columnIssues,
    line_issues: lineIssues,
    lines,
    summary,
    column_map: map,
    headers: parsed.headers,
    raw_rows: parsed.rows,
  };
}

export const IMPORT_VERIFY_PHRASES = [
  'Identificando o tipo de documento…',
  'Aiato lê Excel, CSV, TXT e PDF…',
  'Conferindo colunas sku, quantidade, marketplace…',
  'Cruzando com catálogo de produtos…',
  'Validando vínculo com banco de dados…',
  'Analisando rotatividade e CDs…',
];

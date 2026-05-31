import * as XLSX from 'xlsx';
import type { LsProduct, ProductPublicationStatus } from '@/types';

export type ProductSpreadsheetColumn = {
  key: string;
  header: string;
  label: string;
  required: boolean;
  example: string;
};

/** Colunas oficiais — o sistema reconhece estes cabeçalhos na importação. */
export const PRODUCT_SPREADSHEET_COLUMNS: ProductSpreadsheetColumn[] = [
  { key: 'sku', header: 'sku', label: 'SKU único no WMS (obrigatório)', required: true, example: 'PLM-FRD-P' },
  { key: 'barcode', header: 'codigo_barras', label: 'EAN / código de barras', required: false, example: '7891234567890' },
  { key: 'internal_code', header: 'codigo_interno', label: 'Código interno / fornecedor', required: false, example: 'INT-001' },
  { key: 'name', header: 'nome', label: 'Nome do produto (obrigatório)', required: true, example: 'Fralda Pluma Premium P 60un' },
  { key: 'short_name', header: 'nome_curto', label: 'Nome curto para marketplaces', required: false, example: 'Fralda Pluma P' },
  { key: 'brand', header: 'marca', label: 'Marca', required: false, example: 'Pluma Baby' },
  { key: 'category', header: 'categoria', label: 'Nome da categoria cadastrada', required: false, example: 'Bebê & Infantil' },
  { key: 'ncm', header: 'ncm', label: 'NCM (8 dígitos)', required: false, example: '96190000' },
  { key: 'origin_code', header: 'origem', label: 'Origem ICMS: 0, 1 ou 2', required: false, example: '0' },
  { key: 'unit', header: 'unidade', label: 'UN, CX, KG, etc.', required: false, example: 'UN' },
  { key: 'description_short', header: 'descricao_curta', label: 'Descrição curta', required: false, example: 'Fralda premium tamanho P' },
  { key: 'description', header: 'descricao', label: 'Descrição completa', required: false, example: 'Fralda descartável premium…' },
  { key: 'cost', header: 'custo', label: 'Custo unitário (R$)', required: false, example: '12,50' },
  { key: 'sale_price', header: 'preco_venda', label: 'Preço de venda (R$)', required: false, example: '29,90' },
  { key: 'promo_price', header: 'preco_promocional', label: 'Preço promocional (R$)', required: false, example: '24,90' },
  { key: 'min_stock', header: 'estoque_minimo', label: 'Estoque mínimo', required: false, example: '50' },
  { key: 'max_stock', header: 'estoque_maximo', label: 'Estoque máximo', required: false, example: '500' },
  { key: 'weight_kg', header: 'peso_kg', label: 'Peso em kg', required: false, example: '0,85' },
  { key: 'height_cm', header: 'altura_cm', label: 'Altura cm', required: false, example: '25' },
  { key: 'width_cm', header: 'largura_cm', label: 'Largura cm', required: false, example: '12' },
  { key: 'length_cm', header: 'comprimento_cm', label: 'Comprimento cm', required: false, example: '18' },
  { key: 'status', header: 'status', label: 'active ou inactive', required: false, example: 'active' },
  {
    key: 'publication_status',
    header: 'publicacao',
    label: 'draft, review, ready ou published',
    required: false,
    example: 'draft',
  },
];

const HEADER_ALIASES: Record<string, string> = {
  sku: 'sku',
  codigo_barras: 'barcode',
  ean: 'barcode',
  barcode: 'barcode',
  codigo_interno: 'internal_code',
  internal_code: 'internal_code',
  nome: 'name',
  name: 'name',
  nome_curto: 'short_name',
  short_name: 'short_name',
  marca: 'brand',
  brand: 'brand',
  categoria: 'category',
  category: 'category',
  ncm: 'ncm',
  origem: 'origin_code',
  origin_code: 'origin_code',
  unidade: 'unit',
  unit: 'unit',
  descricao_curta: 'description_short',
  description_short: 'description_short',
  descricao: 'description',
  description: 'description',
  custo: 'cost',
  cost: 'cost',
  preco_venda: 'sale_price',
  sale_price: 'sale_price',
  preco_promocional: 'promo_price',
  promo_price: 'promo_price',
  estoque_minimo: 'min_stock',
  min_stock: 'min_stock',
  estoque_maximo: 'max_stock',
  max_stock: 'max_stock',
  peso_kg: 'weight_kg',
  weight_kg: 'weight_kg',
  altura_cm: 'height_cm',
  height_cm: 'height_cm',
  largura_cm: 'width_cm',
  width_cm: 'width_cm',
  comprimento_cm: 'length_cm',
  length_cm: 'length_cm',
  status: 'status',
  publicacao: 'publication_status',
  publication_status: 'publication_status',
};

export type ParsedProductImportRow = {
  rowNumber: number;
  sku: string;
  barcode: string;
  internal_code: string;
  name: string;
  short_name: string;
  brand: string;
  category: string;
  ncm: string;
  origin_code: string;
  unit: string;
  description_short: string;
  description: string;
  cost: number;
  sale_price: number;
  promo_price: number | null;
  min_stock: number;
  max_stock: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  width_cm: number | null;
  length_cm: number | null;
  status: 'active' | 'inactive';
  publication_status: ProductPublicationStatus;
};

export type ProductImportResult = {
  rows: ParsedProductImportRow[];
  errors: string[];
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function parseNumber(value: unknown): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value).trim().replace(/R\$\s?/i, '').replace(/\./g, '').replace(',', '.');
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function parseOptionalNumber(value: unknown): number | null {
  if (value == null || String(value).trim() === '') return null;
  const n = parseNumber(value);
  return Number.isFinite(n) ? n : null;
}

function parseStatus(value: unknown): 'active' | 'inactive' {
  const v = String(value ?? 'active').trim().toLowerCase();
  return v === 'inactive' || v === 'inativo' ? 'inactive' : 'active';
}

function parsePublicationStatus(value: unknown): ProductPublicationStatus {
  const v = String(value ?? 'draft').trim().toLowerCase();
  if (v === 'review' || v === 'revisao') return 'review';
  if (v === 'ready' || v === 'pronto') return 'ready';
  if (v === 'published' || v === 'publicado') return 'published';
  return 'draft';
}

function cell(row: Record<string, unknown>, key: string): unknown {
  return row[key] ?? '';
}

function rowToProduct(row: Record<string, unknown>, rowNumber: number): { parsed?: ParsedProductImportRow; error?: string } {
  const sku = String(cell(row, 'sku')).trim();
  const name = String(cell(row, 'name')).trim();

  if (!sku && !name) return {};
  if (!sku) return { error: `Linha ${rowNumber}: SKU obrigatório.` };
  if (!name) return { error: `Linha ${rowNumber}: nome obrigatório.` };

  return {
    parsed: {
      rowNumber,
      sku,
      barcode: String(cell(row, 'barcode')).trim(),
      internal_code: String(cell(row, 'internal_code')).trim(),
      name,
      short_name: String(cell(row, 'short_name')).trim(),
      brand: String(cell(row, 'brand')).trim(),
      category: String(cell(row, 'category')).trim(),
      ncm: String(cell(row, 'ncm')).trim(),
      origin_code: String(cell(row, 'origin_code') || '0').trim(),
      unit: String(cell(row, 'unit') || 'UN').trim().toUpperCase(),
      description_short: String(cell(row, 'description_short')).trim(),
      description: String(cell(row, 'description')).trim(),
      cost: parseNumber(cell(row, 'cost')),
      sale_price: parseNumber(cell(row, 'sale_price')),
      promo_price: parseOptionalNumber(cell(row, 'promo_price')),
      min_stock: parseNumber(cell(row, 'min_stock')),
      max_stock: parseOptionalNumber(cell(row, 'max_stock')),
      weight_kg: parseOptionalNumber(cell(row, 'weight_kg')),
      height_cm: parseOptionalNumber(cell(row, 'height_cm')),
      width_cm: parseOptionalNumber(cell(row, 'width_cm')),
      length_cm: parseOptionalNumber(cell(row, 'length_cm')),
      status: parseStatus(cell(row, 'status')),
      publication_status: parsePublicationStatus(cell(row, 'publication_status')),
    },
  };
}

function mapHeaderRow(headers: unknown[]): Record<number, string> {
  const map: Record<number, string> = {};
  headers.forEach((h, index) => {
    const normalized = normalizeHeader(h);
    const key = HEADER_ALIASES[normalized];
    if (key) map[index] = key;
  });
  return map;
}

function sheetToRows(sheet: XLSX.WorkSheet): ProductImportResult {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
  if (matrix.length === 0) {
    return { rows: [], errors: ['Planilha vazia.'] };
  }

  let headerIndex = matrix.findIndex((row) =>
    row.some((cell) => {
      const n = normalizeHeader(cell);
      return n === 'sku' || n === 'nome' || n === 'name';
    }),
  );

  if (headerIndex < 0) headerIndex = 0;

  const headerMap = mapHeaderRow(matrix[headerIndex] ?? []);
  if (!Object.values(headerMap).includes('sku')) {
    return { rows: [], errors: ['Cabeçalho inválido — use o modelo LogStoka (coluna sku).'] };
  }

  const rows: ParsedProductImportRow[] = [];
  const errors: string[] = [];

  for (let i = headerIndex + 1; i < matrix.length; i += 1) {
    const line = matrix[i] ?? [];
    const record: Record<string, unknown> = {};
    for (const [colIndex, key] of Object.entries(headerMap)) {
      record[key] = line[Number(colIndex)] ?? '';
    }

    const { parsed, error } = rowToProduct(record, i + 1);
    if (error) errors.push(error);
    if (parsed) rows.push(parsed);
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push('Nenhuma linha de produto encontrada.');
  }

  return { rows, errors };
}

export async function parseProductSpreadsheet(file: File): Promise<ProductImportResult> {
  const buffer = await file.arrayBuffer();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'csv' || ext === 'txt') {
    const text = new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, '');
    const wb = XLSX.read(text, { type: 'string', FS: text.includes(';') ? ';' : ',' });
    const sheet = wb.Sheets[wb.SheetNames[0] ?? ''];
    if (!sheet) return { rows: [], errors: ['Arquivo CSV inválido.'] };
    return sheetToRows(sheet);
  }

  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName =
    wb.SheetNames.find((n) => normalizeHeader(n) === 'produtos') ?? wb.SheetNames[0];
  const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!sheet) return { rows: [], errors: ['Planilha Excel inválida.'] };
  return sheetToRows(sheet);
}

export function downloadProductImportTemplate(): void {
  const wb = XLSX.utils.book_new();

  const instructionRows = [
    ['Coluna', 'Descrição', 'Exemplo', 'Obrigatório'],
    ...PRODUCT_SPREADSHEET_COLUMNS.map((c) => [c.header, c.label, c.example, c.required ? 'Sim' : 'Não']),
    [],
    ['Dica', 'Preencha a aba Produtos. Não altere os nomes das colunas na primeira linha.', '', ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instructionRows), 'Instruções');

  const headers = PRODUCT_SPREADSHEET_COLUMNS.map((c) => c.header);
  const example = PRODUCT_SPREADSHEET_COLUMNS.map((c) => c.example);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers, example]), 'Produtos');

  XLSX.writeFile(wb, 'logstoka-produtos-modelo.xlsx');
}

function productRowsForExport(products: LsProduct[], categoryName: (id?: string | null) => string) {
  const headers = PRODUCT_SPREADSHEET_COLUMNS.map((c) => c.header);
  const rows = products.map((p) =>
    PRODUCT_SPREADSHEET_COLUMNS.map((col) => {
      switch (col.key) {
        case 'sku':
          return p.sku;
        case 'barcode':
          return p.barcode ?? '';
        case 'internal_code':
          return p.internal_code ?? '';
        case 'name':
          return p.name;
        case 'short_name':
          return p.short_name ?? '';
        case 'brand':
          return p.brand ?? '';
        case 'category':
          return categoryName(p.category_id);
        case 'ncm':
          return p.ncm ?? '';
        case 'origin_code':
          return p.origin_code ?? '0';
        case 'unit':
          return p.unit;
        case 'description_short':
          return p.description_short ?? '';
        case 'description':
          return p.description ?? '';
        case 'cost':
          return p.cost;
        case 'sale_price':
          return p.sale_price;
        case 'promo_price':
          return p.promo_price ?? '';
        case 'min_stock':
          return p.min_stock;
        case 'max_stock':
          return p.max_stock ?? '';
        case 'weight_kg':
          return p.weight_kg ?? '';
        case 'height_cm':
          return p.height_cm ?? '';
        case 'width_cm':
          return p.width_cm ?? '';
        case 'length_cm':
          return p.length_cm ?? '';
        case 'status':
          return p.status;
        case 'publication_status':
          return p.publication_status ?? 'draft';
        default:
          return '';
      }
    }),
  );

  return { headers, rows };
}

export function downloadProductsExport(products: LsProduct[], categoryName: (id?: string | null) => string): void {
  const { headers, rows } = productRowsForExport(products, categoryName);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers, ...rows]), 'Produtos');
  XLSX.writeFile(wb, `logstoka-produtos-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadProductsExportCsv(products: LsProduct[], categoryName: (id?: string | null) => string): void {
  const { headers, rows } = productRowsForExport(products, categoryName);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers, ...rows]), 'Produtos');
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets.Produtos!, { FS: ';' });
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `logstoka-produtos-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

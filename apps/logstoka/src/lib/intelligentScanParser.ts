export type ScanFormatType =
  | 'json'
  | 'url'
  | 'ean'
  | 'gtin'
  | 'internal_sku'
  | 'xml'
  | 'plain_text'
  | 'unknown';

export type ScanSuggestedAction =
  | 'lookup_catalog'
  | 'quick_create'
  | 'register_movement'
  | 'fetch_url_data'
  | 'needs_user_input';

export type ScanExtractedFields = {
  name?: string;
  barcode?: string;
  ean?: string;
  brand?: string;
  sku?: string;
  internal_code?: string;
  category?: string;
  weight?: string;
  url?: string;
  description?: string;
  quantity?: number;
};

export type ParsedScanPayload = {
  raw: string;
  format: ScanFormatType;
  formatLabel: string;
  extracted: ScanExtractedFields;
  lookupKeys: string[];
  suggestedActions: ScanSuggestedAction[];
  completeness: 'complete' | 'partial' | 'minimal';
  preview: string;
};

const FORMAT_LABELS: Record<ScanFormatType, string> = {
  json: 'JSON estruturado',
  url: 'URL / link',
  ean: 'EAN / código de barras',
  gtin: 'GTIN',
  internal_sku: 'Código interno',
  xml: 'XML',
  plain_text: 'Texto',
  unknown: 'Conteúdo desconhecido',
};

const EAN_REGEX = /^\d{8,14}$/;
const INTERNAL_SKU_REGEX = /^LS\d{6,}$/i;
const URL_REGEX = /^https?:\/\//i;

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'string' && val.trim()) return val.trim();
    if (typeof val === 'number' && Number.isFinite(val)) return String(val);
  }
  return undefined;
}

function extractFromJsonObject(obj: Record<string, unknown>): ScanExtractedFields {
  return {
    name: pickString(obj, ['produto', 'product', 'name', 'nome', 'titulo', 'title', 'descricao_curta']),
    barcode: pickString(obj, ['ean', 'gtin', 'barcode', 'codigo_barras', 'codigoBarras']),
    ean: pickString(obj, ['ean', 'gtin', 'barcode']),
    brand: pickString(obj, ['marca', 'brand', 'fabricante']),
    sku: pickString(obj, ['sku', 'codigo', 'codigo_produto', 'product_code']),
    internal_code: pickString(obj, ['codigo_interno', 'internal_code', 'codigo_empresa', 'ref']),
    category: pickString(obj, ['categoria', 'category', 'grupo']),
    weight: pickString(obj, ['peso', 'weight', 'peso_kg', 'weight_kg']),
    description: pickString(obj, ['descricao', 'description', 'detalhe']),
    quantity: typeof obj.quantidade === 'number' ? obj.quantidade : undefined,
  };
}

function mergeExtracted(base: ScanExtractedFields, extra: ScanExtractedFields): ScanExtractedFields {
  return {
    name: base.name || extra.name,
    barcode: base.barcode || extra.barcode || extra.ean,
    ean: base.ean || extra.ean || base.barcode || extra.barcode,
    brand: base.brand || extra.brand,
    sku: base.sku || extra.sku,
    internal_code: base.internal_code || extra.internal_code,
    category: base.category || extra.category,
    weight: base.weight || extra.weight,
    url: base.url || extra.url,
    description: base.description || extra.description,
    quantity: base.quantity ?? extra.quantity,
  };
}

function buildLookupKeys(raw: string, extracted: ScanExtractedFields): string[] {
  const keys = new Set<string>();
  const add = (v?: string) => {
    const t = v?.trim();
    if (t && t.length >= 2) keys.add(t);
  };

  add(raw);
  add(extracted.sku);
  add(extracted.internal_code);
  add(extracted.barcode);
  add(extracted.ean);
  add(extracted.name);

  return [...keys];
}

function assessCompleteness(extracted: ScanExtractedFields): ParsedScanPayload['completeness'] {
  if (extracted.name && (extracted.barcode || extracted.ean || extracted.sku)) return 'complete';
  if (extracted.name || extracted.barcode || extracted.ean || extracted.sku) return 'partial';
  return 'minimal';
}

function buildSuggestedActions(
  format: ScanFormatType,
  extracted: ScanExtractedFields,
  completeness: ParsedScanPayload['completeness'],
): ScanSuggestedAction[] {
  const actions: ScanSuggestedAction[] = ['lookup_catalog'];

  if (format === 'url') actions.push('fetch_url_data');
  if (completeness === 'complete' || completeness === 'partial') {
    actions.push('quick_create', 'register_movement');
  }
  if (completeness === 'minimal') actions.push('needs_user_input');

  return [...new Set(actions)];
}

function previewText(raw: string, extracted: ScanExtractedFields, format: ScanFormatType): string {
  if (extracted.name) return extracted.name;
  if (extracted.barcode || extracted.ean) return `EAN ${extracted.barcode ?? extracted.ean}`;
  if (extracted.url) return extracted.url;
  if (format === 'json') return 'Dados estruturados no QR';
  return raw.length > 80 ? `${raw.slice(0, 77)}…` : raw;
}

export function parseIntelligentScan(rawInput: string): ParsedScanPayload {
  const raw = rawInput.trim();
  if (!raw) {
    return {
      raw: '',
      format: 'unknown',
      formatLabel: FORMAT_LABELS.unknown,
      extracted: {},
      lookupKeys: [],
      suggestedActions: ['needs_user_input'],
      completeness: 'minimal',
      preview: '',
    };
  }

  let format: ScanFormatType = 'unknown';
  let extracted: ScanExtractedFields = {};

  if (URL_REGEX.test(raw)) {
    format = 'url';
    extracted.url = raw;
  } else if (raw.startsWith('<') && raw.includes('>')) {
    format = 'xml';
  } else if (EAN_REGEX.test(raw.replace(/\s/g, ''))) {
    const digits = raw.replace(/\s/g, '');
    format = digits.length >= 12 ? 'ean' : 'gtin';
    extracted.ean = digits;
    extracted.barcode = digits;
  } else if (INTERNAL_SKU_REGEX.test(raw)) {
    format = 'internal_sku';
    extracted.sku = raw.toUpperCase();
  } else if (raw.startsWith('{') || raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      format = 'json';
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        extracted = extractFromJsonObject(parsed as Record<string, unknown>);
      } else if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === 'object') {
        extracted = extractFromJsonObject(parsed[0] as Record<string, unknown>);
      }
    } catch {
      format = 'plain_text';
    }
  } else {
    format = 'plain_text';
    if (/^[A-Za-z0-9-]{2,24}$/.test(raw) && !/^[A-Za-zÀ-ú\s]{4,}$/.test(raw)) {
      extracted.internal_code = raw;
    }
  }

  const completeness = assessCompleteness(extracted);
  const lookupKeys = buildLookupKeys(raw, extracted);
  const suggestedActions = buildSuggestedActions(format, extracted, completeness);

  return {
    raw,
    format,
    formatLabel: FORMAT_LABELS[format],
    extracted,
    lookupKeys,
    suggestedActions,
    completeness,
    preview: previewText(raw, extracted, format),
  };
}

export function mergeScanExtraction(
  local: ParsedScanPayload,
  ai: Partial<ScanExtractedFields> & { category_hint?: string },
): ParsedScanPayload {
  const extracted = mergeExtracted(local.extracted, {
    name: ai.name,
    brand: ai.brand,
    barcode: ai.barcode,
    ean: ai.ean,
    sku: ai.sku,
    internal_code: ai.internal_code,
    category: ai.category ?? ai.category_hint,
    weight: ai.weight,
    description: ai.description,
    url: ai.url,
  });

  const completeness = assessCompleteness(extracted);
  return {
    ...local,
    extracted,
    lookupKeys: buildLookupKeys(local.raw, extracted),
    suggestedActions: buildSuggestedActions(local.format, extracted, completeness),
    completeness,
    preview: previewText(local.raw, extracted, local.format),
  };
}

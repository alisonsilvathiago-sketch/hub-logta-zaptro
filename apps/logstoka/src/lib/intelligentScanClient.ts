import { logstokaApi } from '@/lib/logstokaApi';
import { suggestProductForQuickCreate } from '@/lib/productSuggestClient';
import {
  mergeScanExtraction,
  parseIntelligentScan,
  type ParsedScanPayload,
  type ScanExtractedFields,
} from '@/lib/intelligentScanParser';
import { findProductByAnyIdentifier, type ProductLookupResult } from '@/lib/productLookup';

export type IntelligentScanAi = {
  name?: string;
  brand?: string;
  category_hint?: string;
  barcode?: string;
  internal_code?: string;
  sku?: string;
  weight?: string;
  description?: string;
  image_url?: string | null;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  suggested_action: string;
  url_fetch_recommended?: boolean;
};

export type IntelligentScanResult = {
  parsed: ParsedScanPayload;
  ai: IntelligentScanAi | null;
  catalogMatch: ProductLookupResult | null;
  prefill: ScanExtractedFields;
  readyToRegister: boolean;
};

function demoAiFromParse(parsed: ParsedScanPayload): IntelligentScanAi {
  const { extracted, completeness } = parsed;
  return {
    name: extracted.name,
    brand: extracted.brand,
    category_hint: extracted.category,
    barcode: extracted.barcode ?? extracted.ean,
    internal_code: extracted.internal_code,
    sku: extracted.sku,
    weight: extracted.weight,
    description: extracted.description,
    confidence: completeness === 'complete' ? 'high' : completeness === 'partial' ? 'medium' : 'low',
    summary:
      completeness === 'complete'
        ? 'QR com dados completos — pronto para cadastro rápido.'
        : parsed.format === 'url'
          ? 'Link detectado — confirme extração ou cadastre manualmente.'
          : parsed.format === 'ean'
            ? 'EAN identificado — buscando sugestões no catálogo.'
            : 'Informe nome e categoria se a IA não identificar.',
    suggested_action:
      completeness === 'complete'
        ? 'quick_create'
        : parsed.format === 'url'
          ? 'fetch_url_data'
          : completeness === 'partial'
            ? 'quick_create'
            : 'needs_user_input',
    url_fetch_recommended: parsed.format === 'url',
  };
}

async function lookupFromKeys(
  companyId: string | null,
  demo: boolean,
  keys: string[],
): Promise<ProductLookupResult | null> {
  for (const key of keys) {
    const found = await findProductByAnyIdentifier(companyId, key, demo);
    if (found) return found;
  }
  return null;
}

export async function processIntelligentScan(
  companyId: string | null,
  raw: string,
  demo: boolean,
  movementType = 'entry',
): Promise<IntelligentScanResult> {
  const parsed = parseIntelligentScan(raw);
  let ai: IntelligentScanAi | null = null;
  let merged = parsed;

  const catalogMatch = await lookupFromKeys(companyId, demo, parsed.lookupKeys);

  if (demo) {
    ai = demoAiFromParse(parsed);
    if (!ai.name && parsed.extracted.ean) {
      const suggest = await suggestProductForQuickCreate(companyId, parsed.extracted.ean, true);
      if (suggest.ai_suggestion) {
        ai.name = suggest.ai_suggestion.name;
        ai.brand = suggest.ai_suggestion.brand;
        ai.category_hint = suggest.ai_suggestion.category_hint;
        ai.image_url = suggest.ai_suggestion.image_url ?? null;
        ai.summary = 'Produto sugerido pela IA a partir do EAN.';
        ai.suggested_action = catalogMatch ? 'register_movement' : 'quick_create';
        ai.confidence = 'medium';
      }
    }
  } else {
    try {
      const res = await logstokaApi.aiScanInterpret({
        raw: parsed.raw,
        format: parsed.format,
        extracted: parsed.extracted,
        movement_type: movementType,
      });
      if (res.ai) {
        ai = res.ai;
        merged = mergeScanExtraction(parsed, {
          name: res.ai.name,
          brand: res.ai.brand,
          category_hint: res.ai.category_hint,
          barcode: res.ai.barcode,
          internal_code: res.ai.internal_code,
          sku: res.ai.sku,
          weight: res.ai.weight,
          description: res.ai.description,
        });
      }
    } catch {
      ai = demoAiFromParse(parsed);
    }
  }

  const prefill: ScanExtractedFields = {
    ...merged.extracted,
    name: merged.extracted.name ?? ai?.name,
    brand: merged.extracted.brand ?? ai?.brand,
    category: merged.extracted.category ?? ai?.category_hint,
    barcode: merged.extracted.barcode ?? merged.extracted.ean ?? ai?.barcode,
    internal_code: merged.extracted.internal_code ?? ai?.internal_code,
    sku: merged.extracted.sku ?? ai?.sku,
    weight: merged.extracted.weight ?? ai?.weight,
    description: merged.extracted.description ?? ai?.description,
  };

  const readyToRegister =
    Boolean(catalogMatch) ||
    (Boolean(prefill.name) && Boolean(prefill.barcode || prefill.ean || prefill.sku || prefill.internal_code));

  return {
    parsed: merged,
    ai,
    catalogMatch,
    prefill,
    readyToRegister,
  };
}

export type ScanQuickPrefill = {
  name?: string;
  brand?: string;
  barcode?: string;
  internal_code?: string;
  category?: string;
  main_image_url?: string | null;
};

export function scanResultToQuickPrefill(result: IntelligentScanResult | null): ScanQuickPrefill | undefined {
  if (!result) return undefined;
  const { prefill, ai } = result;
  return {
    name: prefill.name ?? ai?.name,
    brand: prefill.brand ?? ai?.brand,
    barcode: prefill.barcode ?? prefill.ean ?? ai?.barcode,
    internal_code: prefill.internal_code ?? prefill.sku ?? ai?.internal_code,
    category: prefill.category ?? ai?.category_hint,
    main_image_url: ai?.image_url ?? null,
  };
}

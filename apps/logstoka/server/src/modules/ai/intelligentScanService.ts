import type { LogstokaConfig } from '../../config.js';
import { generateOllamaJson } from './ollamaService.js';
import { suggestProduct } from './productSuggestService.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ScanInterpretRequest = {
  raw: string;
  format: string;
  extracted?: Record<string, unknown>;
  movement_type?: string;
};

export type ScanAiInterpretation = {
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
  suggested_action: 'lookup_catalog' | 'quick_create' | 'register_movement' | 'fetch_url_data' | 'needs_user_input';
  url_fetch_recommended?: boolean;
};

export type ScanInterpretResponse = {
  local_format: string;
  ai: ScanAiInterpretation | null;
  product_suggestion: Awaited<ReturnType<typeof suggestProduct>> | null;
};

type AiScanJson = {
  name?: string;
  brand?: string;
  category_hint?: string;
  barcode?: string;
  internal_code?: string;
  sku?: string;
  weight?: string;
  description?: string;
  confidence?: string;
  summary?: string;
  suggested_action?: string;
  url_fetch_recommended?: boolean;
};

function normalizeAction(value?: string): ScanAiInterpretation['suggested_action'] {
  const v = (value ?? '').trim();
  if (v === 'quick_create' || v === 'register_movement' || v === 'fetch_url_data' || v === 'needs_user_input') {
    return v;
  }
  return 'lookup_catalog';
}

function normalizeConfidence(value?: string): ScanAiInterpretation['confidence'] {
  if (value === 'high' || value === 'medium') return value;
  return 'low';
}

export async function interpretIntelligentScan(
  cfg: LogstokaConfig,
  admin: SupabaseClient,
  companyId: string,
  body: ScanInterpretRequest,
): Promise<ScanInterpretResponse> {
  const raw = body.raw.trim();
  const format = body.format || 'unknown';
  const extracted = body.extracted ?? {};

  const searchQuery =
    (typeof extracted.name === 'string' && extracted.name) ||
    (typeof extracted.ean === 'string' && extracted.ean) ||
    (typeof extracted.barcode === 'string' && extracted.barcode) ||
    raw;

  let product_suggestion: ScanInterpretResponse['product_suggestion'] = null;
  if (searchQuery.length >= 2) {
    try {
      product_suggestion = await suggestProduct(cfg, admin, companyId, searchQuery.slice(0, 120));
    } catch {
      product_suggestion = null;
    }
  }

  let ai: ScanAiInterpretation | null = null;

  try {
    const aiRaw = await generateOllamaJson<AiScanJson>(
      cfg,
      `Você é o Scanner Inteligente do LogStoka (ERP de estoque brasileiro).
Analise a leitura de QR Code, código de barras ou etiqueta de QUALQUER fornecedor.
Não assuma formato proprietário. Interprete JSON, URL, EAN, GTIN, SKU, XML ou texto.

Responda APENAS JSON válido:
{
  "name": "nome comercial sugerido em português ou vazio",
  "brand": "marca ou vazio",
  "category_hint": "categoria curta ou vazio",
  "barcode": "EAN/GTIN se identificado ou vazio",
  "internal_code": "código empresa se houver ou vazio",
  "sku": "SKU se houver ou vazio",
  "weight": "peso se houver ou vazio",
  "description": "resumo curto ou vazio",
  "confidence": "high|medium|low",
  "summary": "frase curta explicando o que foi identificado",
  "suggested_action": "lookup_catalog|quick_create|register_movement|fetch_url_data|needs_user_input",
  "url_fetch_recommended": true/false
}

Formato detectado: ${format}
Movimentação: ${body.movement_type ?? 'entrada'}
Conteúdo bruto: """${raw.slice(0, 800)}"""
Campos já extraídos: ${JSON.stringify(extracted).slice(0, 500)}`,
    );

    ai = {
      name: aiRaw.name?.trim() || undefined,
      brand: aiRaw.brand?.trim() || undefined,
      category_hint: aiRaw.category_hint?.trim() || undefined,
      barcode: aiRaw.barcode?.trim() || undefined,
      internal_code: aiRaw.internal_code?.trim() || undefined,
      sku: aiRaw.sku?.trim() || undefined,
      weight: aiRaw.weight?.trim() || undefined,
      description: aiRaw.description?.trim() || undefined,
      image_url: product_suggestion?.ai_suggestion?.image_url ?? null,
      confidence: normalizeConfidence(aiRaw.confidence),
      summary: aiRaw.summary?.trim() || 'Leitura interpretada pela IA.',
      suggested_action: normalizeAction(aiRaw.suggested_action),
      url_fetch_recommended: Boolean(aiRaw.url_fetch_recommended),
    };

    if (!ai.name && product_suggestion?.ai_suggestion?.name) {
      ai.name = product_suggestion.ai_suggestion.name;
      ai.brand = ai.brand ?? product_suggestion.ai_suggestion.brand;
      ai.category_hint = ai.category_hint ?? product_suggestion.ai_suggestion.category_hint;
      ai.image_url = product_suggestion.ai_suggestion.image_url ?? null;
    }
  } catch {
    if (product_suggestion?.ai_suggestion) {
      ai = {
        name: product_suggestion.ai_suggestion.name,
        brand: product_suggestion.ai_suggestion.brand,
        category_hint: product_suggestion.ai_suggestion.category_hint,
        image_url: product_suggestion.ai_suggestion.image_url ?? null,
        confidence: 'medium',
        summary: 'Sugestão parcial via catálogo e Wikipedia.',
        suggested_action: 'quick_create',
      };
    }
  }

  return { local_format: format, ai, product_suggestion };
}

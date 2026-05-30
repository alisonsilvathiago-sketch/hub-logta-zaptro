import type { SupabaseClient } from '@supabase/supabase-js';
import type { LogstokaConfig } from '../../config.js';
import { generateOllamaJson } from './ollamaService.js';

export type ProductSuggestMatch = {
  id: string;
  sku: string;
  name: string;
  barcode?: string | null;
  internal_code?: string | null;
  brand?: string | null;
  main_image_url?: string | null;
};

export type ProductAiSuggestion = {
  name: string;
  brand?: string;
  category_hint?: string;
  image_url?: string | null;
  source: 'ollama' | 'wikipedia' | 'fallback';
};

export type ProductSuggestResponse = {
  local_matches: ProductSuggestMatch[];
  ai_suggestion: ProductAiSuggestion | null;
};

type AiProductJson = {
  name?: string;
  brand?: string;
  category_hint?: string;
  image_search_query?: string;
};

async function searchLocalProducts(
  admin: SupabaseClient,
  companyId: string,
  query: string,
  limit = 8,
): Promise<ProductSuggestMatch[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const { data, error } = await admin
    .from('ls_products')
    .select('id, sku, name, barcode, internal_code, brand, main_image_url')
    .eq('company_id', companyId)
    .or(`name.ilike.%${q}%,sku.ilike.%${q}%,internal_code.ilike.%${q}%,barcode.ilike.%${q}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductSuggestMatch[];
}

function pickWikipediaPageImage(page: {
  thumbnail?: { source?: string };
  original?: { source?: string };
}): string | null {
  if (page.original?.source) return page.original.source;
  if (page.thumbnail?.source) {
    return page.thumbnail.source.replace(/\/(\d+)px-/g, '/1200px-');
  }
  return null;
}

async function fetchWikipediaImage(query: string, variant = 0): Promise<string | null> {
  const search = query.trim();
  if (!search) return null;

  const variantSuffixes = ['produto embalagem', 'embalagem fundo branco', 'caixa produto', 'foto produto'];
  const suffix = variantSuffixes[variant % variantSuffixes.length];

  try {
    const api = new URL('https://pt.wikipedia.org/w/api.php');
    api.searchParams.set('action', 'query');
    api.searchParams.set('generator', 'search');
    api.searchParams.set('gsrsearch', `${search} ${suffix}`);
    api.searchParams.set('gsrlimit', String(Math.max(5, variant + 5)));
    api.searchParams.set('prop', 'pageimages');
    api.searchParams.set('piprop', 'thumbnail|original');
    api.searchParams.set('pithumbsize', '1200');
    api.searchParams.set('format', 'json');
    api.searchParams.set('origin', '*');

    const res = await fetch(api.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          { thumbnail?: { source?: string }; original?: { source?: string } }
        >;
      };
    };
    const pages = data.query?.pages;
    if (!pages) return null;

    const pageList = Object.values(pages);
    for (let i = variant; i < pageList.length; i += 1) {
      const image = pickWikipediaPageImage(pageList[i]);
      if (image) return image;
    }

    for (const page of pageList) {
      const image = pickWikipediaPageImage(page);
      if (image) return image;
    }
    return null;
  } catch {
    return null;
  }
}

async function buildAiSuggestion(
  cfg: LogstokaConfig,
  query: string,
  imageVariant = 0,
): Promise<ProductAiSuggestion | null> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return null;

  try {
    const ai = await generateOllamaJson<AiProductJson>(
      cfg,
      `Você ajuda cadastro de produtos para e-commerce brasileiro.
Dado o termo de busca, responda APENAS JSON válido:
{
  "name": "nome comercial normalizado em português",
  "brand": "marca ou string vazia",
  "category_hint": "categoria curta",
  "image_search_query": "termo em português para buscar foto do produto embalagem fundo branco"
}

Termo: "${trimmed}"`,
    );

    const name = (ai.name ?? trimmed).trim();
    const imageQuery = (ai.image_search_query ?? name).trim();
    const imageUrl = await fetchWikipediaImage(imageQuery, imageVariant);

    return {
      name,
      brand: ai.brand?.trim() || undefined,
      category_hint: ai.category_hint?.trim() || undefined,
      image_url: imageUrl,
      source: imageUrl ? 'wikipedia' : 'ollama',
    };
  } catch {
    const imageUrl = await fetchWikipediaImage(trimmed, imageVariant);
    return {
      name: trimmed,
      image_url: imageUrl,
      source: imageUrl ? 'wikipedia' : 'fallback',
    };
  }
}

export async function suggestProduct(
  cfg: LogstokaConfig,
  admin: SupabaseClient,
  companyId: string,
  query: string,
  options?: { imageVariant?: number },
): Promise<ProductSuggestResponse> {
  const trimmed = query.trim();
  const imageVariant = Math.max(0, options?.imageVariant ?? 0);
  const local_matches = await searchLocalProducts(admin, companyId, trimmed);
  const ai_suggestion = await buildAiSuggestion(cfg, trimmed, imageVariant);
  return { local_matches, ai_suggestion };
}

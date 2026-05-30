import { logstokaApi } from '@/lib/logstokaApi';
import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import { searchProductsByName, type ProductLookupResult } from '@/lib/productLookup';

export type ProductAiSuggestion = {
  name: string;
  brand?: string;
  category_hint?: string;
  image_url?: string | null;
  source: string;
};

export type ProductSuggestResult = {
  local_matches: ProductLookupResult[];
  ai_suggestion: ProductAiSuggestion | null;
};

function demoAiSuggestion(query: string): ProductAiSuggestion | null {
  const q = query.trim();
  if (q.length < 3) return null;

  const match = DEMO_PRODUCTS.find((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return {
    name: match?.name ?? q,
    brand: match?.brand ?? undefined,
    category_hint: match ? 'Catálogo demo' : undefined,
    image_url: match?.main_image_url ?? null,
    source: 'demo',
  };
}

function demoProductImage(query: string, variant = 0): string | null {
  const q = query.trim().toLowerCase();
  const withImages = DEMO_PRODUCTS.filter((p) => p.main_image_url);
  if (withImages.length === 0) return null;

  const matches = withImages.filter((p) => p.name.toLowerCase().includes(q));
  const pool = matches.length > 0 ? matches : withImages;
  return pool[variant % pool.length]?.main_image_url ?? null;
}

export async function suggestProductForQuickCreate(
  companyId: string | null,
  query: string,
  demo: boolean,
  imageVariant = 0,
): Promise<ProductSuggestResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { local_matches: [], ai_suggestion: null };
  }

  try {
    const result = await logstokaApi.aiProductSuggest(trimmed, imageVariant);
    const local_matches =
      result.local_matches.length > 0
        ? result.local_matches
        : await searchProductsByName(companyId, trimmed, demo);
    return { ...result, local_matches };
  } catch {
    const local_matches = await searchProductsByName(companyId, trimmed, demo);
    const fallback = demo ? demoAiSuggestion(trimmed) : null;
    if (fallback && imageVariant > 0) {
      fallback.image_url = demoProductImage(trimmed, imageVariant);
    }
    return {
      local_matches,
      ai_suggestion: fallback,
    };
  }
}

/** Busca apenas imagem (IA + Wikipedia) — usado no botão Gerar / Gerar outra */
export async function fetchProductImageForQuickCreate(
  companyId: string | null,
  query: string,
  demo: boolean,
  imageVariant = 0,
): Promise<string | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  if (demo) {
    return demoProductImage(trimmed, imageVariant);
  }

  try {
    const result = await logstokaApi.aiProductSuggest(trimmed, imageVariant);
    return result.ai_suggestion?.image_url ?? null;
  } catch {
    return demo ? demoProductImage(trimmed, imageVariant) : null;
  }
}

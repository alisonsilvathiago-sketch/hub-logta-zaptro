import { supabase } from '@/lib/supabase';
import { findDemoProductByScan, DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import { parseScanPayload } from '@/lib/productIdentifiers';
import type { LsProduct } from '@/types';

export type ProductScanMode = 'universal' | 'code' | 'barcode';

export type ProductLookupResult = Pick<
  LsProduct,
  'id' | 'sku' | 'name' | 'barcode' | 'internal_code' | 'brand' | 'main_image_url'
>;

function escapeFilter(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,');
}

function mapDemoProduct(p: (typeof DEMO_PRODUCTS)[number]): ProductLookupResult {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    barcode: p.barcode,
    internal_code: p.internal_code,
    brand: p.brand,
    main_image_url: p.main_image_url,
  };
}

const PRODUCT_SELECT =
  'id, sku, name, barcode, internal_code, brand, main_image_url';

/** Busca por LS, SKU, EAN/GTIN, QR (URL) ou nome */
export async function findProductByAnyIdentifier(
  companyId: string | null,
  value: string,
  demo: boolean,
): Promise<ProductLookupResult | null> {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = parseScanPayload(trimmed);
  const candidates = Array.from(
    new Set([trimmed, parsed, trimmed.replace(/\D/g, '')].filter((v) => v.length > 0)),
  );

  for (const candidate of candidates) {
    const hit = await findProductBySingleIdentifier(companyId, candidate, demo);
    if (hit) return hit;
  }

  return null;
}

async function findProductBySingleIdentifier(
  companyId: string | null,
  value: string,
  demo: boolean,
): Promise<ProductLookupResult | null> {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (demo) {
    const lower = trimmed.toLowerCase();
    const digits = trimmed.replace(/\D/g, '');

    const exact = DEMO_PRODUCTS.find(
      (p) =>
        p.sku.toLowerCase() === lower ||
        (p.internal_code ?? '').toLowerCase() === lower ||
        (p.barcode ?? '') === trimmed ||
        (p.barcode ?? '').replace(/\D/g, '') === digits,
    );
    if (exact) return mapDemoProduct(exact);

    const byName = DEMO_PRODUCTS.find((p) => p.name.toLowerCase().includes(lower));
    return byName ? mapDemoProduct(byName) : null;
  }

  if (!companyId) return null;

  const escaped = escapeFilter(trimmed);
  const digitsOnly = trimmed.replace(/\D/g, '');
  const orParts = [`sku.eq.${escaped}`, `internal_code.eq.${escaped}`, `barcode.eq.${escaped}`];
  if (digitsOnly.length >= 8 && digitsOnly !== trimmed) {
    orParts.push(`barcode.eq.${escapeFilter(digitsOnly)}`);
  }

  const { data: exact, error: exactError } = await supabase
    .from('ls_products')
    .select(PRODUCT_SELECT)
    .eq('company_id', companyId)
    .or(orParts.join(','))
    .limit(1)
    .maybeSingle();

  if (exactError) throw new Error(exactError.message);
  if (exact) return exact;

  const { data: byName, error: nameError } = await supabase
    .from('ls_products')
    .select(PRODUCT_SELECT)
    .eq('company_id', companyId)
    .ilike('name', `%${trimmed}%`)
    .limit(1)
    .maybeSingle();

  if (nameError) throw new Error(nameError.message);
  return byName;
}

export async function findProductByScan(
  companyId: string | null,
  value: string,
  mode: ProductScanMode,
  demo: boolean,
): Promise<ProductLookupResult | null> {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (demo) {
    const universal = await findProductByAnyIdentifier(companyId, trimmed, true);
    if (universal) return universal;
    if (mode === 'barcode') return findDemoProductByScan(trimmed, 'barcode');
    return findDemoProductByScan(trimmed, mode === 'code' ? 'code' : 'code');
  }

  return findProductByAnyIdentifier(companyId, trimmed, false);
}

export async function searchProductsByName(
  companyId: string | null,
  query: string,
  demo: boolean,
  limit = 8,
): Promise<ProductLookupResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  if (demo) {
    const lower = q.toLowerCase();
    return DEMO_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.sku.toLowerCase().includes(lower) ||
        (p.barcode ?? '').includes(q) ||
        (p.internal_code ?? '').toLowerCase().includes(lower),
    )
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        barcode: p.barcode,
        internal_code: p.internal_code,
        brand: p.brand,
        main_image_url: p.main_image_url,
      }));
  }

  if (!companyId) return [];

  const { data, error } = await supabase
    .from('ls_products')
    .select('id, sku, name, barcode, internal_code, brand, main_image_url')
    .eq('company_id', companyId)
    .or(`name.ilike.%${q}%,sku.ilike.%${q}%,internal_code.ilike.%${q}%,barcode.ilike.%${q}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

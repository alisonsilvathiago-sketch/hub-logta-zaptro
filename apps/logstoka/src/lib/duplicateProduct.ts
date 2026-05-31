import {
  buildDuplicateProductFields,
  nextDuplicateProductName,
  stripDuplicateNameSuffix,
} from '@/lib/duplicateProductNaming';
import { generateNextInternalSku, reserveNextDemoInternalSku } from '@/lib/internalProductCode';
import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import {
  generateLogstokaInternalEan13,
  parseLsSequence,
} from '@/lib/productIdentifiers';
import { supabase } from '@/lib/supabase';
import type { LsProduct } from '@/types';

export {
  buildDuplicateProductFields,
  nextDuplicateProductName,
  stripDuplicateNameSuffix,
} from '@/lib/duplicateProductNaming';

function eanForSku(sku: string): string {
  const seq = parseLsSequence(sku) ?? 1;
  return generateLogstokaInternalEan13(seq);
}

function duplicateDemoProduct(source: LsProduct): LsProduct {
  const newSku = reserveNextDemoInternalSku();
  const fields = buildDuplicateProductFields(source, {
    newSku,
    newBarcode: eanForSku(newSku),
    existingNames: DEMO_PRODUCTS.map((p) => p.name),
  });

  const now = new Date().toISOString();
  const copy: LsProduct = {
    ...source,
    id: `prod-dup-${Date.now()}`,
    sku: fields.sku,
    internal_code: fields.internal_code,
    barcode: fields.barcode,
    name: fields.name,
    publication_status: 'draft',
    status: 'active',
    created_at: now,
    updated_at: now,
  };

  DEMO_PRODUCTS.unshift(copy);
  window.dispatchEvent(new CustomEvent('logstoka:demo-products-updated'));
  return copy;
}

async function barcodeExists(companyId: string, barcode: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('ls_products')
    .select('id')
    .eq('company_id', companyId)
    .eq('barcode', barcode)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function uniqueEanForCompany(companyId: string, sku: string): Promise<string> {
  let candidate = eanForSku(sku);
  const seq = parseLsSequence(sku) ?? 1;
  for (let offset = 0; offset < 50; offset += 1) {
    if (!(await barcodeExists(companyId, candidate))) return candidate;
    candidate = generateLogstokaInternalEan13(seq + offset + 1);
  }
  return candidate;
}

/**
 * Duplica produto com SKU/LS, EAN e nome únicos.
 * Nome: "Produto X" → "Produto X 2" → "Produto X 3" …
 */
export async function duplicateProduct(
  companyId: string,
  source: LsProduct,
  options: { demo: boolean },
): Promise<LsProduct> {
  if (options.demo) {
    return duplicateDemoProduct(source);
  }

  const { data: catalog, error: catalogError } = await supabase
    .from('ls_products')
    .select('name')
    .eq('company_id', companyId);
  if (catalogError) throw new Error(catalogError.message);

  const { data: current, error: loadError } = await supabase
    .from('ls_products')
    .select('*')
    .eq('id', source.id)
    .single();
  if (loadError || !current) throw new Error('Produto original não encontrado');

  const newSku = await generateNextInternalSku(companyId);
  const newBarcode = await uniqueEanForCompany(companyId, newSku);
  const fields = buildDuplicateProductFields(current as LsProduct, {
    newSku,
    newBarcode,
    existingNames: (catalog ?? []).map((row) => row.name as string),
  });

  const {
    id: _id,
    created_at: _created,
    updated_at: _updated,
    ...rest
  } = current as LsProduct & { id: string };

  const now = new Date().toISOString();
  const payload = {
    ...rest,
    sku: fields.sku,
    internal_code: fields.internal_code,
    barcode: fields.barcode,
    name: fields.name,
    publication_status: 'draft' as const,
    status: 'active' as const,
    created_at: now,
    updated_at: now,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('ls_products')
    .insert(payload)
    .select('*')
    .single();
  if (insertError) throw new Error(insertError.message);

  return inserted as LsProduct;
}

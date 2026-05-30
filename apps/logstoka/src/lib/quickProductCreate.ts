import { supabase } from '@/lib/supabase';
import { generateNextInternalSku } from '@/lib/internalProductCode';
import type { LsProduct } from '@/types';

export type QuickProductInput = {
  name: string;
  internal_code?: string;
  barcode?: string;
  brand?: string;
  main_image_url?: string | null;
};

export async function createQuickProduct(
  companyId: string,
  input: QuickProductInput,
): Promise<Pick<LsProduct, 'id' | 'sku' | 'name'>> {
  const name = input.name.trim();
  if (!name) throw new Error('Informe o nome do produto');

  const sku = await generateNextInternalSku(companyId);
  const payload = {
    company_id: companyId,
    sku,
    name,
    internal_code: input.internal_code?.trim() || null,
    barcode: input.barcode?.trim() || null,
    brand: input.brand?.trim() || null,
    main_image_url: input.main_image_url?.trim() || null,
    unit: 'UN',
    cost: 0,
    sale_price: 0,
    min_stock: 0,
    status: 'active' as const,
    publication_status: 'draft' as const,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('ls_products').insert(payload).select('id, sku, name').single();
  if (error) throw new Error(error.message);
  return data;
}

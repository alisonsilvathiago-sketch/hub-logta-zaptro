import { patchDemoProductIdentifiers } from '@/lib/logstokaDemoSeed';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import type { ResolvedProductIdentifiers } from '@/lib/productIdentifiers';
import { supabase } from '@/lib/supabase';

export type PersistLabelIdentifiersInput = {
  companyId: string | null;
  productId: string;
  sku: string;
  identifiers: ResolvedProductIdentifiers;
  demo: boolean;
};

/**
 * Grava LS + EAN + QR no produto e notifica integrações (evento para filas/API).
 */
export async function persistProductLabelIdentifiers(input: PersistLabelIdentifiersInput): Promise<void> {
  const { companyId, productId, identifiers, demo } = input;
  const payload = {
    sku: identifiers.marketplaceSku || input.sku,
    internal_code: identifiers.masterCode,
    barcode: identifiers.ean13,
    updated_at: new Date().toISOString(),
  };

  if (demo) {
    patchDemoProductIdentifiers(productId, {
      internal_code: payload.internal_code,
      barcode: payload.barcode,
      sku: payload.sku,
    });
    window.dispatchEvent(
      new CustomEvent('logstoka:demo-product-identifiers-updated', {
        detail: { productId, ...payload },
      }),
    );
  } else if (companyId) {
    const { error } = await supabase.from('ls_products').update(payload).eq('id', productId).eq('company_id', companyId);
    if (error) throw new Error(error.message);
  }

  window.dispatchEvent(
    new CustomEvent('logstoka:product-identifiers-sync', {
      detail: {
        productId,
        masterCode: identifiers.masterCode,
        ean13: identifiers.ean13,
        qrPayload: identifiers.qrPayload,
        eanGenerated: identifiers.eanGenerated,
        demo: demo || isLogstokaDemoCompany(companyId),
        at: new Date().toISOString(),
      },
    }),
  );
}

import { supabase } from '@/lib/supabase';
import { formatInternalSku } from '@/lib/formatInternalSku';
import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';

export { formatInternalSku };

const DEMO_LS_COUNTER_KEY = 'logstoka-demo-next-ls';

async function skuExists(companyId: string, sku: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('ls_products')
    .select('id')
    .eq('company_id', companyId)
    .eq('sku', sku)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function maxLsSequence(companyId: string): Promise<number> {
  const { data, error } = await supabase
    .from('ls_products')
    .select('sku, internal_code')
    .eq('company_id', companyId);

  if (error) throw new Error(error.message);

  let max = 0;
  for (const row of data ?? []) {
    for (const code of [row.sku, row.internal_code]) {
      if (!code || !String(code).toUpperCase().startsWith('LS')) continue;
      const num = Number.parseInt(String(code).replace(/^LS0*/i, ''), 10);
      if (Number.isFinite(num) && num > max) max = num;
    }
  }
  return max;
}

function maxDemoLsSequence(): number {
  let max = Number(sessionStorage.getItem(DEMO_LS_COUNTER_KEY) ?? '0');
  for (const p of DEMO_PRODUCTS) {
    for (const code of [p.sku, p.internal_code]) {
      if (!code || !String(code).toUpperCase().startsWith('LS')) continue;
      const num = Number.parseInt(String(code).replace(/^LS0*/i, ''), 10);
      if (Number.isFinite(num) && num > max) max = num;
    }
  }
  return max;
}

function isSkuTaken(sku: string): boolean {
  const upper = sku.toUpperCase();
  return DEMO_PRODUCTS.some(
    (p) => p.sku.toUpperCase() === upper || (p.internal_code ?? '').toUpperCase() === upper,
  );
}

/** Pré-visualiza o próximo código interno único (sem reservar) */
export async function peekNextInternalSku(companyId: string | null, demo: boolean): Promise<string> {
  if (demo) {
    return formatInternalSku(maxDemoLsSequence() + 1);
  }
  if (!companyId) return formatInternalSku(1);
  const max = await maxLsSequence(companyId);
  return formatInternalSku(max + 1);
}

/** Reserva contador demo após cadastro simulado */
export function bumpDemoInternalSkuCounter(): void {
  const next = maxDemoLsSequence() + 1;
  sessionStorage.setItem(DEMO_LS_COUNTER_KEY, String(next));
}

/** Próximo LS único no demo (reserva contador) */
export function reserveNextDemoInternalSku(): string {
  let next = maxDemoLsSequence() + 1;
  let sku = formatInternalSku(next);
  while (isSkuTaken(sku)) {
    next += 1;
    sku = formatInternalSku(next);
  }
  sessionStorage.setItem(DEMO_LS_COUNTER_KEY, String(next));
  return sku;
}

/** Gera o próximo código interno automático garantindo unicidade */
export async function generateNextInternalSku(companyId: string): Promise<string> {
  const base = await maxLsSequence(companyId);

  for (let i = 1; i <= 50; i += 1) {
    const candidate = formatInternalSku(base + i);
    const exists = await skuExists(companyId, candidate);
    if (!exists) return candidate;
  }

  throw new Error('Não foi possível gerar um código interno único');
}

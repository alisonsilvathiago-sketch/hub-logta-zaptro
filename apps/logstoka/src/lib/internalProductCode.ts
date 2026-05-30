import { supabase } from '@/lib/supabase';
import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';

const DEMO_LS_COUNTER_KEY = 'logstoka-demo-next-ls';

export function formatInternalSku(sequence: number): string {
  return `LS${String(Math.max(1, sequence)).padStart(6, '0')}`;
}

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
    .select('sku')
    .eq('company_id', companyId)
    .like('sku', 'LS%')
    .order('sku', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  let max = 0;
  for (const row of data ?? []) {
    const num = Number.parseInt(String(row.sku).replace(/^LS0*/, ''), 10);
    if (Number.isFinite(num) && num > max) max = num;
  }
  return max;
}

function maxDemoLsSequence(): number {
  let max = Number(sessionStorage.getItem(DEMO_LS_COUNTER_KEY) ?? '0');
  for (const p of DEMO_PRODUCTS) {
    if (!p.sku.startsWith('LS')) continue;
    const num = Number.parseInt(p.sku.replace(/^LS0*/, ''), 10);
    if (Number.isFinite(num) && num > max) max = num;
  }
  return max;
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

/** Gera o próximo código interno automático garantindo unicidade */
export async function generateNextInternalSku(companyId: string): Promise<string> {
  let base = await maxLsSequence(companyId);

  for (let i = 1; i <= 20; i += 1) {
    const candidate = formatInternalSku(base + i);
    const exists = await skuExists(companyId, candidate);
    if (!exists) return candidate;
  }

  throw new Error('Não foi possível gerar um código interno único');
}

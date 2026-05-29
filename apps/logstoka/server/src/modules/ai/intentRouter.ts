export type AiIntent =
  | 'stock'
  | 'movements'
  | 'returns'
  | 'inventory'
  | 'replenishment'
  | 'imports'
  | 'analytics'
  | 'daily_summary'
  | 'general';

const PATTERNS: Array<{ intent: AiIntent; re: RegExp }> = [
  { intent: 'daily_summary', re: /resumo|hoje|di[aá]rio|ontem|oper[aç]ão de hoje/i },
  { intent: 'stock', re: /estoque|sku|unidades|dep[oó]sito|armaz[eé]m|quantas?|saldo|m[ií]nimo|abaixo/i },
  { intent: 'movements', re: /moviment|entrada|sa[ií]da|transfer|picking|confer/i },
  { intent: 'returns', re: /devolu|retorno|triagem|reprov/i },
  { intent: 'inventory', re: /invent[aá]rio|contagem|diverg|recont/i },
  { intent: 'replenishment', re: /reposi|compra|reabastec|giro|parado|90 dias|60 dias|30 dias/i },
  { intent: 'imports', re: /import|xml|excel|csv|pdf|ocr|nota fiscal|nfe|relat[oó]rio/i },
  { intent: 'analytics', re: /vendeu|marketplace|loja|curva abc|ranking|mais vendido|gest[aã]o|executiv/i },
];

export function detectIntents(message: string): AiIntent[] {
  const found = new Set<AiIntent>();
  for (const { intent, re } of PATTERNS) {
    if (re.test(message)) found.add(intent);
  }
  if (found.size === 0) found.add('general');
  if (found.has('daily_summary')) return ['daily_summary', ...[...found].filter((i) => i !== 'daily_summary')];
  return [...found];
}

export function extractSkuHint(message: string): string | null {
  const m = message.match(/\b(?:sku[\s-]*)?([A-Za-z0-9][A-Za-z0-9._-]{2,})\b/i);
  if (!m?.[1]) return null;
  const val = m[1].toUpperCase();
  if (['HOJE', 'MES', 'MÊS', 'XML', 'PDF', 'CSV', 'NFE'].includes(val)) return null;
  return m[1];
}

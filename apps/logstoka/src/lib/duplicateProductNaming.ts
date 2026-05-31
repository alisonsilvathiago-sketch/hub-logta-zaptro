import type { LsProduct } from '@/types';

/** Remove sufixos de cópia/numeração para obter o nome base */
export function stripDuplicateNameSuffix(name: string): string {
  return name
    .trim()
    .replace(/\s*\(c[oó]pia\)\s*$/i, '')
    .replace(/\s*[-–]\s*c[oó]pia\s*$/i, '')
    .replace(/\s+(\d+)$/, '')
    .trim();
}

/**
 * Nome da cópia: "Organizador Modular" → "Organizador Modular 2" → "Organizador Modular 3" …
 */
export function nextDuplicateProductName(sourceName: string, existingNames: string[]): string {
  const base = stripDuplicateNameSuffix(sourceName);
  if (!base) return sourceName;

  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escaped}(?:\\s+(\\d+))?$`, 'i');

  let maxIndex = 1;
  for (const raw of existingNames) {
    const trimmed = raw.trim();
    if (stripDuplicateNameSuffix(trimmed).toLowerCase() === base.toLowerCase()) {
      maxIndex = Math.max(maxIndex, 1);
    }
    const match = trimmed.match(pattern);
    if (match) {
      const n = match[1] ? Number.parseInt(match[1], 10) : 1;
      if (Number.isFinite(n) && n > 0) maxIndex = Math.max(maxIndex, n);
    }
  }

  const next = maxIndex + 1;
  return `${base} ${next}`;
}

export type DuplicateProductFields = {
  sku: string;
  internal_code: string;
  barcode: string;
  name: string;
};

export function buildDuplicateProductFields(
  source: Pick<LsProduct, 'name'>,
  opts: { newSku: string; newBarcode: string; existingNames: string[] },
): DuplicateProductFields {
  return {
    sku: opts.newSku,
    internal_code: opts.newSku,
    barcode: opts.newBarcode,
    name: nextDuplicateProductName(source.name, opts.existingNames),
  };
}

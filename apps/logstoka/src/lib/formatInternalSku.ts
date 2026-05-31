/** Código interno imutável do produto (LS000001) — sem dependência do demo seed */
export function formatInternalSku(sequence: number): string {
  return `LS${String(Math.max(1, sequence)).padStart(6, '0')}`;
}

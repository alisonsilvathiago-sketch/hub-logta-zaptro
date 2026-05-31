/** Token criptograficamente forte — não previsível (evita enumeração). */
export function generateSecureShareToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `stk-${crypto.randomUUID().replace(/-/g, '')}`;
  }
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `stk-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/** Comparação em tempo constante para reduzir timing attacks em tokens. */
export function shareTokensEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

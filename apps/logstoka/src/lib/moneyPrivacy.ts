/** Detecta strings formatadas como moeda (BRL, USD, etc.). */
export function looksLikeMoney(value: string | number): boolean {
  const text = String(value).trim();
  if (!text || text === '—' || text === '…') return false;
  return (
    text.startsWith('R$') ||
    /^R\s*\$/i.test(text) ||
    /^(USD|US\$|€|\$)\s?[\d.,]+/i.test(text) ||
    (text.includes(',') && /^\d/.test(text) && text.includes('R'))
  );
}

export const MONEY_PRIVACY_STORAGE_KEY = 'logstoka-hide-money';

export function readMoneyPrivacyHidden(): boolean {
  try {
    return localStorage.getItem(MONEY_PRIVACY_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeMoneyPrivacyHidden(hidden: boolean): void {
  try {
    localStorage.setItem(MONEY_PRIVACY_STORAGE_KEY, hidden ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function fmtBrl(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    ...options,
  });
}

/**
 * CPF / CNPJ brasileiros: dígitos, máscaras, validação e classificação PF × PJ.
 * Reutilizável em Hub, CRM, Financeiro, cobrança e cadastros.
 */

export type BrazilianPartyKind = 'PF' | 'PJ';

export function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function maskCpf(input: string): string {
  const d = onlyDigits(input).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function maskCnpj(input: string): string {
  const d = onlyDigits(input).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

/** Máscara dinâmica: até 11 dígitos formata como CPF; a partir do 12º, como CNPJ. */
export function maskCpfOrCnpj(input: string): string {
  const d = onlyDigits(input);
  if (d.length <= 11) return maskCpf(d);
  return maskCnpj(d);
}

export function validateCpf(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]!, 10) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9]!, 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]!, 10) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]!, 10);
}

export function validateCnpj(cnpj: string): boolean {
  const d = onlyDigits(cnpj);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(d[i]!, 10) * w1[i]!;
  let dig = sum % 11;
  dig = dig < 2 ? 0 : 11 - dig;
  if (dig !== parseInt(d[12]!, 10)) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(d[i]!, 10) * w2[i]!;
  dig = sum % 11;
  dig = dig < 2 ? 0 : 11 - dig;
  return dig === parseInt(d[13]!, 10);
}

/** Classifica pelo comprimento (11 = PF, 14 = PJ). Não valida dígitos verificadores. */
export function classifyDocLength(digits: string): BrazilianPartyKind | null {
  const n = onlyDigits(digits);
  if (n.length === 11) return 'PF';
  if (n.length === 14) return 'PJ';
  return null;
}

export function detectPartyFromDocument(raw: string): {
  kind: BrazilianPartyKind;
  valid: boolean;
  digits: string;
} | null {
  const digits = onlyDigits(raw);
  if (digits.length === 11) {
    return { kind: 'PF', valid: validateCpf(digits), digits };
  }
  if (digits.length === 14) {
    return { kind: 'PJ', valid: validateCnpj(digits), digits };
  }
  return null;
}

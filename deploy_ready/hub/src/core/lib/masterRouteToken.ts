/**
 * Token de URL por rota do Hub Master (?token=...).
 * Único para cada pathname (ex.: /master/clientes ≠ /master/crm).
 * Obfuscação / assinatura leve no cliente — não substitui auth no servidor.
 */

export const MASTER_ROUTE_TOKEN_PARAM = 'token';

const PEPPER = 'hub-master-route-v1';

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  if (!trimmed) return '/master';
  return trimmed;
}

/** Gera string estável alfanumérica a partir do caminho. */
export function getExpectedMasterRouteToken(pathname: string): string {
  const key = normalizePath(pathname);
  const payload = `${PEPPER}|${key}`;
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const alphabet = '0123456789abcdefghijkmnpqrstuvwxyz';
  let x = h >>> 0;
  let out = '';
  for (let i = 0; i < 20; i++) {
    out += alphabet[x % alphabet.length];
    x = (Math.imul(x, 1103515245) + 12345 + i) >>> 0;
  }
  return out;
}

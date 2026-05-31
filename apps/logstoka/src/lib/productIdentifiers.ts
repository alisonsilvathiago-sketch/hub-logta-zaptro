import { formatInternalSku } from '@/lib/formatInternalSku';

/** Prefixo EAN-13 Brasil (GS1) — faixa interna LogStoka: 789 6004 XXXXX */
const LOGSTOKA_EAN_PREFIX = '7896004';

export const LOGSTOKA_QR_BASE_URL = 'https://logstoka.com.br/p';

export type ResolvedProductIdentifiers = {
  /** Código mestre imutável (LS000001) */
  masterCode: string;
  /** SKU comercial / marketplace (pode diferir do LS) */
  marketplaceSku: string;
  /** EAN-13 válido para bipador e marketplaces */
  ean13: string;
  /** true quando o EAN foi gerado pelo sistema (produto sem GTIN) */
  eanGenerated: boolean;
  /** Conteúdo do QR Code (URL pública do produto) */
  qrPayload: string;
};

export function computeEan13CheckDigit(digits12: string): string {
  const d = digits12.replace(/\D/g, '').padStart(12, '0').slice(0, 12);
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const n = Number(d[i]) || 0;
    sum += n * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

export function isValidEan13(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 13) return false;
  return digits[12] === computeEan13CheckDigit(digits.slice(0, 12));
}

export function parseLsSequence(code: string): number | null {
  const m = code.trim().toUpperCase().match(/^LS0*(\d+)$/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** EAN-13 interno LogStoka derivado da sequência LS (compatível com leitores BR) */
export function generateLogstokaInternalEan13(lsSequence: number): string {
  const seq = Math.min(99_999, Math.max(1, Math.floor(lsSequence)));
  const body = `${LOGSTOKA_EAN_PREFIX}${String(seq).padStart(5, '0')}`;
  return body + computeEan13CheckDigit(body);
}

export function buildLogstokaQrPayload(masterCode: string): string {
  const code = masterCode.trim().toUpperCase();
  return `${LOGSTOKA_QR_BASE_URL}/${encodeURIComponent(code)}`;
}

/** Normaliza leitura de scanner (LS, EAN, URL do QR) para valor de busca */
export function parseScanPayload(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const pathMatch = url.pathname.match(/\/p\/([^/?#]+)/i);
      if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]).toUpperCase();
      const host = url.hostname.toLowerCase();
      if (host.includes('logstoka')) {
        const segments = url.pathname.split('/').filter(Boolean);
        const last = segments[segments.length - 1];
        if (last && /^LS\d+$/i.test(last)) return last.toUpperCase();
      }
    } catch {
      /* não é URL válida */
    }
  }

  if (/^LS\d+$/i.test(trimmed)) return trimmed.toUpperCase();

  return trimmed;
}

function inferLsSequenceFromProductId(productId: string): number | null {
  const m = productId.match(/(\d+)$/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function resolveMasterCode(
  product: Pick<{ sku: string; internal_code?: string | null; id: string }, 'sku' | 'internal_code' | 'id'>,
): string {
  const internal = product.internal_code?.trim();
  if (internal && /^LS\d+$/i.test(internal)) return internal.toUpperCase();

  if (/^LS\d+$/i.test(product.sku.trim())) return product.sku.trim().toUpperCase();

  const fromId = inferLsSequenceFromProductId(product.id);
  if (fromId != null) return formatInternalSku(fromId);

  return formatInternalSku(1);
}

/**
 * Resolve identificadores padrão do produto para etiqueta, scanner e integrações.
 * O LS é sempre a chave mestre; EAN ausente ou inválido gera GTIN interno LogStoka.
 *
 * Um produto (mesmo modelo/cor) compartilha sempre o mesmo LS + EAN — milhões de unidades,
 * uma única identificação. Novo código só para cadastro novo (outro modelo, cor, etc.).
 */
export function resolveProductIdentifiers(
  product: Pick<{ sku: string; internal_code?: string | null; barcode?: string | null; id: string }, 'sku' | 'internal_code' | 'barcode' | 'id'>,
): ResolvedProductIdentifiers {
  const marketplaceSku = product.sku.trim();
  const masterCode = resolveMasterCode(product);

  let ean13 = (product.barcode ?? '').replace(/\D/g, '');
  let eanGenerated = false;

  if (ean13.length !== 13 || !isValidEan13(ean13)) {
    const seq = parseLsSequence(masterCode) ?? inferLsSequenceFromProductId(product.id) ?? 1;
    ean13 = generateLogstokaInternalEan13(seq);
    eanGenerated = true;
  }

  return {
    masterCode,
    marketplaceSku,
    ean13,
    eanGenerated,
    qrPayload: buildLogstokaQrPayload(masterCode),
  };
}

export type ScanIdentifierKind = 'internal' | 'ean' | 'qr' | 'sku' | 'unknown';

/** Classifica o que foi lido e se bate com os identificadores do produto */
export function classifyScanAgainstProduct(
  raw: string,
  ids: ResolvedProductIdentifiers,
): { kind: ScanIdentifierKind; matches: boolean; normalized: string } {
  const normalized = parseScanPayload(raw);
  const digits = raw.replace(/\D/g, '');

  if (
    normalized.toUpperCase() === ids.masterCode ||
    raw.trim().toUpperCase() === ids.masterCode
  ) {
    return { kind: 'internal', matches: true, normalized: ids.masterCode };
  }

  if (digits.length >= 8 && digits === ids.ean13) {
    return { kind: 'ean', matches: true, normalized: ids.ean13 };
  }

  if (
    normalized === ids.qrPayload ||
    raw.trim() === ids.qrPayload ||
    parseScanPayload(raw).toUpperCase() === ids.masterCode
  ) {
    return { kind: 'qr', matches: true, normalized: ids.qrPayload };
  }

  if (normalized.toUpperCase() === ids.marketplaceSku.toUpperCase()) {
    return { kind: 'sku', matches: true, normalized: ids.marketplaceSku };
  }

  if (/^LS\d+$/i.test(normalized)) return { kind: 'internal', matches: false, normalized };
  if (digits.length >= 8) return { kind: 'ean', matches: false, normalized: digits };
  if (/^https?:\/\//i.test(raw.trim())) return { kind: 'qr', matches: false, normalized };

  return { kind: 'unknown', matches: false, normalized };
}

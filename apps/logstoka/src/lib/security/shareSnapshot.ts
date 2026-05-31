export type ShareLinkPermission = 'view_only' | 'view_comment' | 'view_approve' | 'view_reprove';

/** Dados permitidos na internet — somente via link explícito e snapshot congelado. */
export type PublicShareSnapshot = {
  title: string;
  /** Alias legado na UI pública */
  name?: string;
  sku?: string;
  unit?: string;
  brand?: string;
  main_image_url?: string | null;
  /** Quantidade agregada — só quando a permissão do link permite. */
  stockTotal?: number;
  stockAvailable?: number;
  stockReserved?: number;
  divergencesFound?: boolean;
  publication_status?: string;
  lines?: Array<{ label: string; value: string }>;
};

const FORBIDDEN_KEYS = new Set([
  'company_id',
  'companyId',
  'cost',
  'sale_price',
  'promo_price',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'email',
  'phone',
  'document',
  'cnpj',
  'cpf',
  'internal_code',
  'barcode',
  'created_by',
  'user_id',
]);

function stripForbiddenDeep(value: unknown): unknown {
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(stripForbiddenDeep);
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    out[key] = stripForbiddenDeep(val);
  }
  return out;
}

/**
 * Congela apenas o que pode ir para `/shared/:token`.
 * Nunca envie objeto vivo do WMS — sempre passe por aqui antes de createShareLink.
 */
export function buildPublicShareSnapshot(
  raw: unknown,
  permission: ShareLinkPermission,
  resourceName: string,
): PublicShareSnapshot | null {
  if (raw == null) return null;
  const safe = stripForbiddenDeep(raw) as Record<string, unknown>;

  const title = String(safe.name ?? safe.title ?? resourceName).slice(0, 200);
  const snapshot: PublicShareSnapshot = {
    title,
    name: title,
    sku: safe.sku ? String(safe.sku).slice(0, 64) : undefined,
    unit: safe.unit ? String(safe.unit).slice(0, 16) : undefined,
    brand: safe.brand ? String(safe.brand).slice(0, 80) : undefined,
    main_image_url: typeof safe.main_image_url === 'string' ? safe.main_image_url : null,
    publication_status:
      typeof safe.publication_status === 'string' ? safe.publication_status : undefined,
    divergencesFound: Boolean(safe.divergencesFound),
  };

  const showQuantities =
    permission === 'view_comment' ||
    permission === 'view_approve' ||
    permission === 'view_reprove';

  if (showQuantities) {
    if (typeof safe.stockTotal === 'number') snapshot.stockTotal = safe.stockTotal;
    if (typeof safe.stockAvailable === 'number') snapshot.stockAvailable = safe.stockAvailable;
    if (typeof safe.stockReserved === 'number') snapshot.stockReserved = safe.stockReserved;
  }

  return snapshot;
}

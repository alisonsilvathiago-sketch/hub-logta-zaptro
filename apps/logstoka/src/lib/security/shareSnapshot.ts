export type ShareLinkPermission = 'view_only' | 'view_comment' | 'view_approve' | 'view_reprove';

/** Linha de produto/inventário no snapshot público (lista congelada). */
export type PublicShareSnapshotRow = {
  name: string;
  sku?: string;
  unit?: string;
  category?: string;
  brand?: string;
  main_image_url?: string | null;
  publication_status?: string;
  stockTotal?: number;
  system_quantity?: number;
  counted_quantity?: number;
  difference?: number;
};

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
  /** Lista congelada (catálogo, inventário, etc.) */
  rows?: PublicShareSnapshotRow[];
  rowCount?: number;
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

function permissionShowsQuantities(permission: ShareLinkPermission): boolean {
  return (
    permission === 'view_comment' ||
    permission === 'view_approve' ||
    permission === 'view_reprove'
  );
}

function sanitizeSnapshotRow(
  raw: Record<string, unknown>,
  showQuantities: boolean,
): PublicShareSnapshotRow {
  const row: PublicShareSnapshotRow = {
    name: String(raw.name ?? raw.title ?? '—').slice(0, 200),
    sku: raw.sku ? String(raw.sku).slice(0, 64) : undefined,
    unit: raw.unit ? String(raw.unit).slice(0, 16) : undefined,
    category: raw.category ? String(raw.category).slice(0, 80) : undefined,
    brand: raw.brand ? String(raw.brand).slice(0, 80) : undefined,
    main_image_url: typeof raw.main_image_url === 'string' ? raw.main_image_url : null,
    publication_status:
      typeof raw.publication_status === 'string' ? raw.publication_status : undefined,
  };

  if (showQuantities) {
    if (typeof raw.stockTotal === 'number') row.stockTotal = raw.stockTotal;
    if (typeof raw.system_quantity === 'number') row.system_quantity = raw.system_quantity;
    if (typeof raw.counted_quantity === 'number') row.counted_quantity = raw.counted_quantity;
    if (typeof raw.difference === 'number') row.difference = raw.difference;
  }

  return row;
}

function buildListSnapshot(
  rawRows: unknown[],
  permission: ShareLinkPermission,
  resourceName: string,
): PublicShareSnapshot {
  const showQuantities = permissionShowsQuantities(permission);
  const rows = rawRows
    .map((entry) => stripForbiddenDeep(entry))
    .filter((entry): entry is Record<string, unknown> => entry != null && typeof entry === 'object' && !Array.isArray(entry))
    .map((entry) => sanitizeSnapshotRow(entry, showQuantities));

  let stockTotal: number | undefined;
  if (showQuantities) {
    const sum = rows.reduce((acc, row) => acc + (row.stockTotal ?? 0), 0);
    if (sum > 0) stockTotal = sum;
  }

  const title = resourceName.slice(0, 200);
  return {
    title,
    name: title,
    rowCount: rows.length,
    rows,
    stockTotal,
    lines: [{ label: 'Itens no snapshot', value: String(rows.length) }],
  };
}

function buildSingleSnapshot(
  safe: Record<string, unknown>,
  permission: ShareLinkPermission,
  resourceName: string,
): PublicShareSnapshot {
  const showQuantities = permissionShowsQuantities(permission);
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

  if (showQuantities) {
    if (typeof safe.stockTotal === 'number') snapshot.stockTotal = safe.stockTotal;
    if (typeof safe.stockAvailable === 'number') snapshot.stockAvailable = safe.stockAvailable;
    if (typeof safe.stockReserved === 'number') snapshot.stockReserved = safe.stockReserved;
  }

  return snapshot;
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

  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    return buildListSnapshot(raw, permission, resourceName);
  }

  const safe = stripForbiddenDeep(raw);
  if (safe == null || typeof safe !== 'object' || Array.isArray(safe)) return null;

  return buildSingleSnapshot(safe as Record<string, unknown>, permission, resourceName);
}

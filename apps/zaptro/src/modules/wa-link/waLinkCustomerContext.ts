import { readActiveRoutes, type ActiveRouteRow } from '../../constants/zaptroCrmActiveRoutes';
import { readAllRouteLive } from '../../constants/zaptroRouteLiveStore';
import { ROUTE_STATUS_LABEL, type RouteExecutionStatus } from '../../constants/zaptroRouteExecution';
import {
  readAllQuotesFlattened,
  type FreightQuoteWithLead,
  quoteProductLabel,
  quoteMonetaryValue,
} from '../../constants/zaptroQuotes';
import { waLinkPhonesMatch } from './waLinkPhoneMatch';

type LeadRow = {
  id: string;
  clientName?: string;
  phone?: string;
  origin?: string;
  destination?: string;
};

function readLeadsForCompany(crmStorageId: string): LeadRow[] {
  try {
    const raw = localStorage.getItem(`zaptro_crm_kanban_v3_${crmStorageId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeadRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function metadataCompanyName(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return '';
  const m = metadata as Record<string, unknown>;
  const name = m.company_name ?? m.companyName;
  return typeof name === 'string' ? name.trim() : '';
}

export type WaLinkCustomerQuoteSummary = {
  id: string;
  token: string;
  status: string;
  label: string;
  value?: number;
  origin?: string;
  destination?: string;
};

export type WaLinkCustomerRouteSummary = {
  id: string;
  token: string;
  label: string;
  status: RouteExecutionStatus | 'ativa' | 'encerrada';
  statusLabel: string;
  origin?: string | null;
  dest?: string | null;
  trackPath: string;
  mapLat?: number;
  mapLng?: number;
  mapLabel?: string;
};

export type WaLinkCustomerContextSnapshot = {
  companyName: string;
  crmType: string | null;
  quotes: WaLinkCustomerQuoteSummary[];
  routes: WaLinkCustomerRouteSummary[];
  productsLabel: string;
};

const EMPTY_CONTEXT: WaLinkCustomerContextSnapshot = {
  companyName: '',
  crmType: null,
  quotes: [],
  routes: [],
  productsLabel: 'Sem produtos ou rotas associados',
};

export function resolveWaLinkCustomerContext(input: {
  phone: string;
  companyId: string;
  senderName?: string | null;
  metadata?: unknown;
}): WaLinkCustomerContextSnapshot {
  try {
    return resolveWaLinkCustomerContextInner(input);
  } catch (err) {
    console.warn('[wa-link] customer context:', err);
    return { ...EMPTY_CONTEXT, companyName: metadataCompanyName(input.metadata) };
  }
}

function resolveWaLinkCustomerContextInner(input: {
  phone: string;
  companyId: string;
  senderName?: string | null;
  metadata?: unknown;
}): WaLinkCustomerContextSnapshot {
  const crmStorageId = input.companyId || 'local-demo';
  const phone = input.phone;
  const displayName = (input.senderName || '').trim();
  const companyFromMeta = metadataCompanyName(input.metadata);

  const leads = readLeadsForCompany(crmStorageId);
  const leadIdsForPhone = new Set(
    leads.filter((l) => l.phone && waLinkPhonesMatch(l.phone, phone)).map((l) => l.id),
  );
  const leadNames = leads
    .filter((l) => leadIdsForPhone.has(l.id))
    .map((l) => (l.clientName || '').trim())
    .filter(Boolean);

  const allQuotes = readAllQuotesFlattened(crmStorageId);
  const quotes: WaLinkCustomerQuoteSummary[] = allQuotes
    .filter((q) => leadIdsForPhone.has(q.leadId))
    .slice(0, 6)
    .map((q) => mapQuote(q));

  const activeRoutes = readActiveRoutes(crmStorageId);
  const live = readAllRouteLive();
  const nameNeedle = (displayName || companyFromMeta).toLowerCase();

  const routes: WaLinkCustomerRouteSummary[] = activeRoutes
    .filter((r) => routeMatchesClient(r, nameNeedle, phone, leadNames))
    .slice(0, 4)
    .map((r) => mapRoute(r, live[r.token]));

  const productLabels = quotes.map((q) => q.label).filter(Boolean);
  const productsLabel =
    productLabels.length > 0
      ? productLabels.slice(0, 3).join(' · ')
      : routes.length > 0
        ? 'Frete / rota activa'
        : 'Sem produtos ou rotas associados';

  return {
    companyName: companyFromMeta,
    crmType: null,
    quotes,
    routes,
    productsLabel,
  };
}

function mapQuote(q: FreightQuoteWithLead): WaLinkCustomerQuoteSummary {
  return {
    id: q.id,
    token: q.token,
    status: q.status,
    label: quoteProductLabel(q),
    value: quoteMonetaryValue(q) || undefined,
    origin: q.origin,
    destination: q.destination,
  };
}

function routeMatchesClient(
  route: ActiveRouteRow,
  nameNeedle: string,
  phone: string,
  leadNames: string[],
): boolean {
  const ref = (route.clientRef || route.label || '').toLowerCase();
  if (!ref.trim()) return false;
  const names = [nameNeedle, ...leadNames.map((n) => n.toLowerCase())].filter((n) => n.length >= 3);
  for (const n of names) {
    if (ref.includes(n)) return true;
    const first = n.split(/\s+/)[0];
    if (first && first.length >= 3 && ref.includes(first)) return true;
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 8 && ref.replace(/\D/g, '').includes(digits.slice(-8))) return true;
  return false;
}

function mapRoute(
  row: ActiveRouteRow,
  live:
    | {
        status?: RouteExecutionStatus;
        originLabel?: string | null;
        destLabel?: string | null;
        lastLat?: number;
        lastLng?: number;
        destLat?: number;
        destLng?: number;
      }
    | undefined,
): WaLinkCustomerRouteSummary {
  const execStatus = live?.status;
  const status: WaLinkCustomerRouteSummary['status'] = execStatus ?? row.status;
  const statusLabel =
    execStatus && execStatus in ROUTE_STATUS_LABEL
      ? ROUTE_STATUS_LABEL[execStatus as RouteExecutionStatus]
      : row.status === 'ativa'
        ? 'Rota activa'
        : 'Encerrada';

  const mapLat =
    typeof live?.lastLat === 'number'
      ? live.lastLat
      : typeof live?.destLat === 'number'
        ? live.destLat
        : undefined;
  const mapLng =
    typeof live?.lastLng === 'number'
      ? live.lastLng
      : typeof live?.destLng === 'number'
        ? live.destLng
        : undefined;
  const mapLabel = live?.destLabel?.trim() || live?.originLabel?.trim() || row.label || null;

  return {
    id: row.id,
    token: row.token,
    label: row.label || row.clientRef || row.token,
    status,
    statusLabel,
    origin: live?.originLabel ?? null,
    dest: live?.destLabel ?? null,
    trackPath: `/acompanhar/${encodeURIComponent(row.token)}`,
    mapLat,
    mapLng,
    mapLabel: mapLabel || undefined,
  };
}

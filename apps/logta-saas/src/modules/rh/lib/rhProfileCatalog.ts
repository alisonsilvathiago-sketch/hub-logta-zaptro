import {
  getSandboxOperationalBundle,
  refreshSandboxRhProfiles,
  resolveDemoCompanyId,
  seedLocalSandboxModules,
  shouldUseLogtaSandbox,
} from '../../../lib/seed';
import { buildEquipeRouteId } from './equipeRouteId';
import type { RhColaboradorListItem } from './mergeRhColaboradores';
import {
  findColaboradorRhProfileByRouteId,
  listColaboradorProfilesForCompany,
  type ColaboradorRhProfile,
  type ColaboradorTimelineEvent,
  type RhEmploymentStatus,
} from '../ponto/colaboradorRhStorage';

export type RhProfileCatalogRow = {
  key: string;
  equipeRouteId: string;
  fullName: string;
  role: string;
  sector: string;
  admissionDate?: string;
  status: RhEmploymentStatus;
  timelineCount: number;
  lastEvent?: ColaboradorTimelineEvent;
};

export function formatRhDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

export function loadRhProfilesMap(companyId: string): Map<string, ColaboradorRhProfile> {
  const cid = resolveDemoCompanyId(companyId);
  if (shouldUseLogtaSandbox()) {
    seedLocalSandboxModules(cid);
    refreshSandboxRhProfiles(cid);
  }
  const bundle = getSandboxOperationalBundle(cid);
  const byId = new Map<string, ColaboradorRhProfile>();
  for (const p of bundle.colaboradorProfiles) {
    byId.set(p.id, { ...p, companyId: p.companyId || cid });
  }
  for (const p of listColaboradorProfilesForCompany(cid)) {
    byId.set(p.id, p);
  }
  return byId;
}

export function latestTimelineEvent(
  profile: ColaboradorRhProfile,
): ColaboradorTimelineEvent | undefined {
  return [...(profile.timeline ?? [])].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )[0];
}

export function buildRhProfileCatalogRows(
  companyId: string,
  colaboradoresEquipe: RhColaboradorListItem[] = [],
  options?: { employmentFilter?: (status: RhEmploymentStatus) => boolean },
): RhProfileCatalogRow[] {
  const cid = resolveDemoCompanyId(companyId);
  const profiles = Array.from(loadRhProfilesMap(cid).values());
  const profileByRoute = new Map<string, ColaboradorRhProfile>();
  for (const p of profiles) {
    profileByRoute.set(buildEquipeRouteId(p), p);
    if (p.id) profileByRoute.set(p.id, p);
  }

  const rows = new Map<string, RhProfileCatalogRow>();
  const filter = options?.employmentFilter;

  const addRow = (
    routeId: string,
    name: string,
    profile?: ColaboradorRhProfile | null,
    fallback?: RhColaboradorListItem,
  ) => {
    const rh = profile ?? findColaboradorRhProfileByRouteId(cid, routeId);
    const status = rh?.employmentStatus ?? 'ativo';
    if (filter && !filter(status)) return;
    const key = routeId || name;
    if (!key || rows.has(key)) return;
    const lastEvent = rh ? latestTimelineEvent(rh) : undefined;
    rows.set(key, {
      key,
      equipeRouteId: routeId,
      fullName: rh?.fullName ?? name,
      role: rh?.role ?? fallback?.role ?? 'Colaborador',
      sector: rh?.sector ?? fallback?.department ?? '—',
      admissionDate: rh?.admissionDate ?? fallback?.created_at,
      status,
      timelineCount: rh?.timeline?.length ?? 0,
      lastEvent,
    });
  };

  for (const c of colaboradoresEquipe) {
    addRow(c.equipeRouteId || c.id, c.full_name, profileByRoute.get(c.equipeRouteId || c.id), c);
  }

  for (const p of profiles) {
    const status = p.employmentStatus ?? 'ativo';
    if (filter && !filter(status)) continue;
    addRow(buildEquipeRouteId(p), p.fullName, p);
  }

  return Array.from(rows.values()).sort((a, b) =>
    a.fullName.localeCompare(b.fullName, 'pt-BR'),
  );
}

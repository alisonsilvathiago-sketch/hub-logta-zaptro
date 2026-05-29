import {
  refreshSandboxRhProfiles,
  seedLocalSandboxModules,
  shouldUseLogtaSandbox,
} from '../../../lib/seed';
import { buildEquipeRouteId } from '../lib/equipeRouteId';
import { loadRhProfilesMap } from '../lib/rhProfileCatalog';
import {
  appendTimelineEvent,
  findColaboradorRhProfileByRouteId,
  saveColaboradorProfile,
  type ColaboradorRhProfile,
  type ColaboradorRhRequest,
} from '../ponto/colaboradorRhStorage';

const STORAGE_PREFIX = 'logta-rh-ferias-aprovacao';

export type FeriasAprovacaoStatus = 'pendente' | 'em_analise' | 'aprovado' | 'recusado';

export type FeriasAprovacaoRecord = {
  id: string;
  profileId: string;
  equipeRouteId: string;
  collaboratorName: string;
  role: string;
  sector: string;
  submittedAt: string;
  startDate: string;
  endDate?: string;
  days: number;
  reason: string;
  saldoDias?: number;
  status: FeriasAprovacaoStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  rhNote?: string;
  source: 'request' | 'timeline' | 'agenda' | 'programada' | 'manual';
};

type FeriasOverride = {
  status?: FeriasAprovacaoStatus;
  rhNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

function storageKey(companyId: string) {
  return `${STORAGE_PREFIX}:${companyId}`;
}

function loadOverrides(companyId: string): Record<string, FeriasOverride> {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, FeriasOverride>;
  } catch {
    return {};
  }
}

function saveOverrides(companyId: string, data: Record<string, FeriasOverride>) {
  localStorage.setItem(storageKey(companyId), JSON.stringify(data));
}

function parseDaysFromText(text: string): number {
  const m = text.match(/(\d+)\s*dia/i);
  if (m) return Math.max(1, Number(m[1]));
  return 0;
}

function daysBetweenInclusive(startIso: string, endIso?: string): number {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : start;
  if (Number.isNaN(start.getTime())) return 1;
  if (Number.isNaN(end.getTime())) return 1;
  const diff = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, diff);
}

function mapRequestStatus(status: string): FeriasAprovacaoStatus {
  if (status === 'aprovada') return 'aprovado';
  if (status === 'recusada') return 'recusado';
  return 'pendente';
}

function collectFromProfile(profile: ColaboradorRhProfile): FeriasAprovacaoRecord[] {
  const routeId = buildEquipeRouteId(profile);
  const base = {
    profileId: profile.id,
    equipeRouteId: routeId,
    collaboratorName: profile.fullName,
    role: profile.role ?? 'Colaborador',
    sector: profile.sector ?? '—',
    saldoDias: profile.vacationDaysAvailable,
  };
  const out: FeriasAprovacaoRecord[] = [];

  for (const r of profile.requests ?? []) {
    if (r.type !== 'ferias') continue;
    const days = parseDaysFromText(r.detail ?? r.title) || 15;
    out.push({
      ...base,
      id: `request-${r.id}`,
      submittedAt: r.createdAt,
      startDate: r.createdAt,
      days,
      reason: r.detail ?? r.title,
      status: mapRequestStatus(r.status),
      source: 'request',
    });
  }

  for (const t of profile.timeline ?? []) {
    if (t.kind !== 'ferias') continue;
    const days = parseDaysFromText(t.detail ?? t.title) || 15;
    out.push({
      ...base,
      id: `timeline-${profile.id}-${t.id}`,
      submittedAt: t.at,
      startDate: t.at,
      days,
      reason: t.detail ?? t.title,
      status: 'aprovado',
      reviewedAt: t.at,
      reviewedBy: 'RH',
      source: 'timeline',
    });
  }

  for (const a of profile.agenda ?? []) {
    if (a.kind !== 'ferias') continue;
    out.push({
      ...base,
      id: `agenda-${profile.id}-${a.id}`,
      submittedAt: a.at,
      startDate: a.at,
      days: parseDaysFromText(a.detail ?? a.title) || 15,
      reason: a.detail ?? a.title,
      status: 'aprovado',
      source: 'agenda',
    });
  }

  if (profile.vacationStart?.trim()) {
    const days = daysBetweenInclusive(profile.vacationStart, profile.vacationEnd);
    const start = new Date(profile.vacationStart);
    const status: FeriasAprovacaoStatus =
      !Number.isNaN(start.getTime()) && start.getTime() > Date.now() ? 'aprovado' : 'aprovado';
    out.push({
      ...base,
      id: `programada-${profile.id}`,
      submittedAt: profile.vacationStart,
      startDate: profile.vacationStart,
      endDate: profile.vacationEnd,
      days,
      reason: 'Período de férias programado no dossiê',
      status,
      source: 'programada',
    });
  }

  return out;
}

function buildDemoFerias(): FeriasAprovacaoRecord[] {
  const now = Date.now();
  const iso = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
  const isoFuture = (daysAhead: number) => new Date(now + daysAhead * 86400000).toISOString();
  return [
    {
      id: 'demo-ferias-1',
      profileId: 'colab-98765432100',
      equipeRouteId: '98765432100',
      collaboratorName: 'Ana Paula Mendes',
      role: 'Analista RH',
      sector: 'RH',
      submittedAt: iso(2),
      startDate: isoFuture(60),
      endDate: isoFuture(74),
      days: 15,
      saldoDias: 42,
      reason: 'Solicitação de férias — 15 dias em julho/2026',
      status: 'pendente',
      source: 'manual',
    },
    {
      id: 'demo-ferias-2',
      profileId: 'colab-45678912345',
      equipeRouteId: '45678912345',
      collaboratorName: 'Carlos Henrique',
      role: 'Motorista',
      sector: 'Frota',
      submittedAt: iso(5),
      startDate: isoFuture(90),
      endDate: isoFuture(104),
      days: 15,
      saldoDias: 18,
      reason: 'Férias após alta temporada — 15 dias',
      status: 'em_analise',
      source: 'manual',
    },
    {
      id: 'demo-ferias-3',
      profileId: 'colab-12345678901',
      equipeRouteId: '12345678901',
      collaboratorName: 'Roberto Silva',
      role: 'Gerente Comercial',
      sector: 'Comercial',
      submittedAt: iso(20),
      startDate: iso(25),
      endDate: iso(10),
      days: 10,
      saldoDias: 30,
      reason: 'Férias gozadas — período aquisitivo',
      status: 'aprovado',
      reviewedAt: iso(18),
      reviewedBy: 'RH Admin',
      source: 'manual',
    },
  ];
}

export function buildFeriasFromProfiles(companyId: string): FeriasAprovacaoRecord[] {
  if (shouldUseLogtaSandbox()) {
    seedLocalSandboxModules(companyId);
    refreshSandboxRhProfiles(companyId);
  }
  const profiles = Array.from(loadRhProfilesMap(companyId).values());
  const overrides = loadOverrides(companyId);
  const byId = new Map<string, FeriasAprovacaoRecord>();

  for (const p of profiles) {
    for (const row of collectFromProfile(p)) {
      byId.set(row.id, row);
    }
  }

  if (byId.size === 0) {
    for (const row of buildDemoFerias()) {
      byId.set(row.id, row);
    }
  }

  for (const [id, row] of byId) {
    const o = overrides[id];
    if (!o) continue;
    byId.set(id, {
      ...row,
      status: o.status ?? row.status,
      rhNote: o.rhNote ?? row.rhNote,
      reviewedAt: o.reviewedAt ?? row.reviewedAt,
      reviewedBy: o.reviewedBy ?? row.reviewedBy,
    });
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function requestIdFromFeriasRecordId(recordId: string): string | null {
  if (recordId.startsWith('request-')) return recordId.slice('request-'.length);
  return null;
}

function mapFeriasStatusToRequest(
  status: FeriasAprovacaoStatus,
): ColaboradorRhRequest['status'] {
  if (status === 'aprovado') return 'aprovada';
  if (status === 'recusado') return 'recusada';
  return 'aberta';
}

const FERIAS_STATUS_TITLE: Record<FeriasAprovacaoStatus, string> = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
};

/** Propaga decisão de férias para solicitação, agenda, timeline e período no dossiê. */
export function applyFeriasApprovalToProfile(
  companyId: string,
  record: FeriasAprovacaoRecord,
  status: FeriasAprovacaoStatus,
  rhNote: string,
  reviewedBy: string,
): ColaboradorRhProfile | null {
  let profile =
    loadRhProfilesMap(companyId).get(record.profileId) ??
    findColaboradorRhProfileByRouteId(companyId, record.equipeRouteId);
  if (!profile) return null;

  const reviewedAt = new Date().toISOString();
  const requestStatus = mapFeriasStatusToRequest(status);
  const reqId = requestIdFromFeriasRecordId(record.id);

  if (reqId && profile.requests?.length) {
    profile = {
      ...profile,
      requests: profile.requests.map((r) =>
        r.id === reqId ? { ...r, status: requestStatus } : r,
      ),
    };
  }

  const auditDetail = [FERIAS_STATUS_TITLE[status], rhNote?.trim() || record.reason]
    .filter(Boolean)
    .join(' — ');
  profile = {
    ...profile,
    auditLog: [
      {
        id: `audit-ferias-${Date.now()}`,
        at: reviewedAt,
        actor: reviewedBy,
        action: `Aprovação de férias: ${FERIAS_STATUS_TITLE[status]}`,
        detail: auditDetail,
      },
      ...(profile.auditLog ?? []),
    ].slice(0, 50),
  };

  if (status === 'aprovado') {
    const start = record.startDate.slice(0, 10);
    const end = (record.endDate ?? addDaysIso(record.startDate, record.days - 1)).slice(0, 10);
    profile = saveColaboradorProfile({
      ...profile,
      vacationStart: start,
      vacationEnd: end,
      vacationDaysAvailable:
        record.saldoDias != null
          ? Math.max(0, record.saldoDias - record.days)
          : profile.vacationDaysAvailable,
    });
    profile = appendTimelineEvent(profile, {
      kind: 'ferias',
      title: 'Férias aprovadas pelo RH',
      detail: `${record.days} dia(s) · ${start} a ${end}${rhNote?.trim() ? ` · ${rhNote.trim()}` : ''}`,
    });
    const agendaId = `agenda-aprov-${record.id}`;
    const hasAgenda = (profile.agenda ?? []).some((a) => a.id === agendaId);
    if (!hasAgenda) {
      profile = saveColaboradorProfile({
        ...profile,
        agenda: [
          {
            id: agendaId,
            at: record.startDate,
            kind: 'ferias',
            title: `Férias aprovadas — ${record.days} dias`,
            detail: rhNote?.trim() || record.reason,
          },
          ...(profile.agenda ?? []),
        ],
      });
    }
  } else if (status === 'recusado') {
    profile = appendTimelineEvent(profile, {
      kind: 'ferias',
      title: 'Solicitação de férias recusada',
      detail: rhNote?.trim() || record.reason,
    });
  } else if (status === 'em_analise') {
    profile = saveColaboradorProfile(profile);
  } else {
    profile = saveColaboradorProfile(profile);
  }

  return profile;
}

export function findFeriasRecordById(
  companyId: string,
  id: string,
): FeriasAprovacaoRecord | undefined {
  return buildFeriasFromProfiles(companyId).find((r) => r.id === id);
}

export function updateFeriasAprovacao(
  companyId: string,
  id: string,
  patch: FeriasOverride & { status: FeriasAprovacaoStatus },
  reviewedBy = 'RH',
): FeriasAprovacaoRecord[] {
  const overrides = loadOverrides(companyId);
  const reviewedAt = patch.reviewedAt ?? new Date().toISOString();
  overrides[id] = {
    status: patch.status,
    rhNote: patch.rhNote,
    reviewedAt,
    reviewedBy: patch.reviewedBy ?? reviewedBy,
  };
  saveOverrides(companyId, overrides);

  const record = buildFeriasFromProfiles(companyId).find((r) => r.id === id);
  if (record) {
    applyFeriasApprovalToProfile(
      companyId,
      record,
      patch.status,
      patch.rhNote ?? '',
      patch.reviewedBy ?? reviewedBy,
    );
  }

  return buildFeriasFromProfiles(companyId);
}

export function computeFeriasKpis(rows: FeriasAprovacaoRecord[]) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const pendentes = rows.filter((r) => r.status === 'pendente' || r.status === 'em_analise').length;
  const aprovadosMes = rows.filter((r) => {
    if (r.status !== 'aprovado' || !r.reviewedAt) return false;
    const d = new Date(r.reviewedAt);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;
  const diasPendentes = rows
    .filter((r) => r.status === 'pendente' || r.status === 'em_analise')
    .reduce((s, r) => s + r.days, 0);

  return {
    total: rows.length,
    pendentes,
    aprovadosMes,
    diasPendentes,
  };
}

export function formatFeriasDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

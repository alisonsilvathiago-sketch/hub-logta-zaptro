import {
  refreshSandboxRhProfiles,
  seedLocalSandboxModules,
  shouldUseLogtaSandbox,
} from '../../../lib/seed';
import { buildEquipeRouteId } from '../lib/equipeRouteId';
import { loadRhProfilesMap } from '../lib/rhProfileCatalog';
import type { ColaboradorRhProfile } from '../ponto/colaboradorRhStorage';

const STORAGE_PREFIX = 'logta-rh-atestados-aprovacao';

export type AtestadoAprovacaoStatus = 'pendente' | 'em_analise' | 'aprovado' | 'recusado';

export type AtestadoAprovacaoRecord = {
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
  cid?: string;
  attachmentName?: string;
  status: AtestadoAprovacaoStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  rhNote?: string;
  source: 'absence' | 'request' | 'timeline' | 'manual';
};

type AtestadoOverride = {
  status?: AtestadoAprovacaoStatus;
  rhNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

function storageKey(companyId: string) {
  return `${STORAGE_PREFIX}:${companyId}`;
}

function loadOverrides(companyId: string): Record<string, AtestadoOverride> {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, AtestadoOverride>;
  } catch {
    return {};
  }
}

function saveOverrides(companyId: string, data: Record<string, AtestadoOverride>) {
  localStorage.setItem(storageKey(companyId), JSON.stringify(data));
}

function parseDaysFromText(text: string): number {
  const m = text.match(/(\d+)\s*dia/i);
  if (m) return Math.max(1, Number(m[1]));
  return 1;
}

function mapRequestStatus(status: string): AtestadoAprovacaoStatus {
  if (status === 'aprovada') return 'aprovado';
  if (status === 'recusada') return 'recusado';
  return 'pendente';
}

function collectFromProfile(profile: ColaboradorRhProfile): AtestadoAprovacaoRecord[] {
  const routeId = buildEquipeRouteId(profile);
  const base = {
    profileId: profile.id,
    equipeRouteId: routeId,
    collaboratorName: profile.fullName,
    role: profile.role ?? 'Colaborador',
    sector: profile.sector ?? '—',
  };
  const out: AtestadoAprovacaoRecord[] = [];

  for (const a of profile.absences ?? []) {
    if (a.tipo !== 'atestado') continue;
    const days = parseDaysFromText(a.reason);
    out.push({
      ...base,
      id: `absence-${profile.id}-${a.id}`,
      submittedAt: a.date,
      startDate: a.date,
      endDate: a.date,
      days,
      reason: a.reason,
      attachmentName: 'Atestado médico.pdf',
      status: 'pendente',
      source: 'absence',
    });
  }

  for (const r of profile.requests ?? []) {
    if (r.type !== 'atestado') continue;
    const days = parseDaysFromText(r.detail ?? r.title);
    out.push({
      ...base,
      id: `request-${r.id}`,
      submittedAt: r.createdAt,
      startDate: r.createdAt,
      days,
      reason: r.detail ?? r.title,
      attachmentName: 'Anexo enviado pelo colaborador',
      status: mapRequestStatus(r.status),
      source: 'request',
    });
  }

  for (const t of profile.timeline ?? []) {
    if (t.kind !== 'atestado') continue;
    out.push({
      ...base,
      id: `timeline-${profile.id}-${t.id}`,
      submittedAt: t.at,
      startDate: t.at,
      days: parseDaysFromText(t.detail ?? t.title),
      reason: t.detail ?? t.title,
      status: 'aprovado',
      reviewedAt: t.at,
      reviewedBy: 'RH',
      source: 'timeline',
    });
  }

  return out;
}

/** Catálogo demo quando a base ainda não tem solicitações. */
function buildDemoAtestados(companyId: string): AtestadoAprovacaoRecord[] {
  const now = Date.now();
  const iso = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
  return [
    {
      id: 'demo-atest-1',
      profileId: 'colab-98765432100',
      equipeRouteId: '98765432100',
      collaboratorName: 'Ana Paula Mendes',
      role: 'Analista RH',
      sector: 'RH',
      submittedAt: iso(1),
      startDate: iso(1),
      endDate: iso(0),
      days: 1,
      reason: 'Consulta médica — gripe',
      cid: 'J11.1',
      attachmentName: 'atestado_ana_21-05.pdf',
      status: 'pendente',
      source: 'manual',
    },
    {
      id: 'demo-atest-2',
      profileId: 'colab-45678912345',
      equipeRouteId: '45678912345',
      collaboratorName: 'Carlos Henrique',
      role: 'Motorista',
      sector: 'Frota',
      submittedAt: iso(3),
      startDate: iso(3),
      endDate: iso(1),
      days: 3,
      reason: 'Repouso médico pós cirurgia menor',
      cid: 'Z54.0',
      attachmentName: 'atestado_carlos.pdf',
      status: 'em_analise',
      source: 'manual',
    },
    {
      id: 'demo-atest-3',
      profileId: 'colab-12345678901',
      equipeRouteId: '12345678901',
      collaboratorName: 'Roberto Silva',
      role: 'Gerente Comercial',
      sector: 'Comercial',
      submittedAt: iso(18),
      startDate: iso(18),
      days: 2,
      reason: 'Acompanhamento familiar — 2 dias',
      attachmentName: 'atestado_roberto.pdf',
      status: 'aprovado',
      reviewedAt: iso(16),
      reviewedBy: 'RH Admin',
      source: 'manual',
    },
    {
      id: 'demo-atest-4',
      profileId: 'colab-32165498700',
      equipeRouteId: '32165498700',
      collaboratorName: 'Juliana Rocha',
      role: 'Coordenadora Fiscal',
      sector: 'Fiscal',
      submittedAt: iso(25),
      startDate: iso(25),
      days: 1,
      reason: 'Exame periódico — meio período',
      status: 'recusado',
      reviewedAt: iso(24),
      reviewedBy: 'RH Admin',
      rhNote: 'Documento ilegível — solicitar reenvio com CRM legível.',
      source: 'manual',
    },
  ];
}

export function buildAtestadosFromProfiles(companyId: string): AtestadoAprovacaoRecord[] {
  if (shouldUseLogtaSandbox()) {
    seedLocalSandboxModules(companyId);
    refreshSandboxRhProfiles(companyId);
  }
  const profiles = Array.from(loadRhProfilesMap(companyId).values());
  const overrides = loadOverrides(companyId);
  const byId = new Map<string, AtestadoAprovacaoRecord>();

  for (const p of profiles) {
    for (const row of collectFromProfile(p)) {
      byId.set(row.id, row);
    }
  }

  if (byId.size === 0) {
    for (const row of buildDemoAtestados(companyId)) {
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

export function updateAtestadoAprovacao(
  companyId: string,
  id: string,
  patch: AtestadoOverride & { status: AtestadoAprovacaoStatus },
  reviewedBy = 'RH',
): AtestadoAprovacaoRecord[] {
  const overrides = loadOverrides(companyId);
  overrides[id] = {
    status: patch.status,
    rhNote: patch.rhNote,
    reviewedAt: patch.reviewedAt ?? new Date().toISOString(),
    reviewedBy: patch.reviewedBy ?? reviewedBy,
  };
  saveOverrides(companyId, overrides);
  return buildAtestadosFromProfiles(companyId);
}

export function computeAtestadosKpis(rows: AtestadoAprovacaoRecord[]) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const pendentes = rows.filter((r) => r.status === 'pendente' || r.status === 'em_analise').length;
  const aprovadosMes = rows.filter((r) => {
    if (r.status !== 'aprovado' || !r.reviewedAt) return false;
    const d = new Date(r.reviewedAt);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;

  const slaHours: number[] = [];
  for (const r of rows) {
    if (r.status !== 'aprovado' || !r.reviewedAt) continue;
    const h =
      (new Date(r.reviewedAt).getTime() - new Date(r.submittedAt).getTime()) / (1000 * 60 * 60);
    if (h >= 0 && h < 24 * 30) slaHours.push(h);
  }
  const slaMedio =
    slaHours.length > 0
      ? `${(slaHours.reduce((a, b) => a + b, 0) / slaHours.length).toFixed(1)}h`
      : '—';

  return {
    total: rows.length,
    pendentes,
    aprovadosMes,
    slaMedio,
  };
}

export function formatAtestadoDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

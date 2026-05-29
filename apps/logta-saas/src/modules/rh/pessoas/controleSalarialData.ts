import {
  getSandboxOperationalBundle,
  refreshSandboxRhProfiles,
  resolveDemoCompanyId,
  seedLocalSandboxModules,
  shouldUseLogtaSandbox,
} from '../../../lib/seed';
import { buildEquipeRouteId } from '../lib/equipeRouteId';
import type { RhColaboradorListItem } from '../lib/mergeRhColaboradores';
import {
  findColaboradorRhProfileByRouteId,
  listColaboradorProfilesForCompany,
  type ColaboradorRhProfile,
  type RhEmploymentStatus,
} from '../ponto/colaboradorRhStorage';

export type SalarioRemuneracaoStatus = 'regular' | 'pendente' | 'defasado';

export type SalarioColaboradorRow = {
  key: string;
  equipeRouteId: string;
  fullName: string;
  role: string;
  sector: string;
  employmentStatus: RhEmploymentStatus;
  currentSalary: number;
  ultimoReajusteIso?: string;
  ultimoReajusteLabel: string;
  remuneracaoStatus: SalarioRemuneracaoStatus;
  remuneracaoLabel: string;
};

const MESES_DEFASADO = 12;

export function formatSalarioBrl(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatSalarioDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

export function computeRemuneracaoStatus(profile: ColaboradorRhProfile): SalarioRemuneracaoStatus {
  const salary = profile.currentSalary ?? 0;
  if (salary <= 0) return 'pendente';

  const history = [...(profile.salaryHistory ?? [])].sort(
    (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime(),
  );
  const last = history[0];
  if (!last?.effectiveDate) {
    const admission = profile.admissionDate ? new Date(profile.admissionDate) : null;
    if (admission && !Number.isNaN(admission.getTime())) {
      const months = (Date.now() - admission.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return months > MESES_DEFASADO ? 'defasado' : 'regular';
    }
    return 'pendente';
  }

  const lastDate = new Date(last.effectiveDate);
  if (Number.isNaN(lastDate.getTime())) return 'pendente';
  const monthsAgo = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsAgo > MESES_DEFASADO) return 'defasado';
  return 'regular';
}

const REMUNERACAO_LABEL: Record<SalarioRemuneracaoStatus, string> = {
  regular: 'Regular',
  pendente: 'Pendente',
  defasado: 'Defasado',
};

function loadProfiles(companyId: string): ColaboradorRhProfile[] {
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
  return Array.from(byId.values());
}

export function buildSalarioColaboradorRows(
  companyId: string,
  colaboradoresEquipe: RhColaboradorListItem[] = [],
): SalarioColaboradorRow[] {
  const cid = resolveDemoCompanyId(companyId);
  const profiles = loadProfiles(cid);
  const profileByRoute = new Map<string, ColaboradorRhProfile>();
  for (const p of profiles) {
    profileByRoute.set(buildEquipeRouteId(p), p);
    if (p.id) profileByRoute.set(p.id, p);
  }

  const rows = new Map<string, SalarioColaboradorRow>();

  const addRow = (
    routeId: string,
    name: string,
    profile?: ColaboradorRhProfile | null,
    fallback?: RhColaboradorListItem,
  ) => {
    const rh = profile ?? findColaboradorRhProfileByRouteId(cid, routeId);
    const employmentStatus = rh?.employmentStatus ?? 'ativo';
    if (employmentStatus === 'desligado' || employmentStatus === 'falecido') return;

    const key = routeId || name;
    if (!key || rows.has(key)) return;

    const salary = rh?.currentSalary ?? 0;
    const history = [...(rh?.salaryHistory ?? [])].sort(
      (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime(),
    );
    const lastReajuste = history[0]?.effectiveDate;
    const remuneracaoStatus = rh ? computeRemuneracaoStatus(rh) : 'pendente';

    rows.set(key, {
      key,
      equipeRouteId: routeId,
      fullName: rh?.fullName ?? name,
      role: (rh?.role ?? fallback?.role ?? 'Colaborador').toUpperCase(),
      sector: rh?.sector ?? fallback?.department ?? '—',
      employmentStatus,
      currentSalary: salary,
      ultimoReajusteIso: lastReajuste,
      ultimoReajusteLabel: formatSalarioDate(lastReajuste),
      remuneracaoStatus,
      remuneracaoLabel: REMUNERACAO_LABEL[remuneracaoStatus],
    });
  };

  for (const c of colaboradoresEquipe) {
    addRow(c.equipeRouteId || c.id, c.full_name, profileByRoute.get(c.equipeRouteId || c.id), c);
  }

  for (const p of profiles) {
    const status = p.employmentStatus ?? 'ativo';
    if (status === 'desligado' || status === 'falecido') continue;
    addRow(buildEquipeRouteId(p), p.fullName, p);
  }

  return Array.from(rows.values()).sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'));
}

export function computeSalarioKpis(rows: SalarioColaboradorRow[]) {
  const folhaBase = rows.reduce((s, r) => s + r.currentSalary, 0);
  const now = new Date();
  const reajustesMes = rows.filter((r) => {
    if (!r.ultimoReajusteIso) return false;
    const d = new Date(r.ultimoReajusteIso);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const media = rows.length > 0 ? folhaBase / rows.length : 0;
  const encargosEst = folhaBase * 0.68;

  return {
    folhaBase,
    folhaBaseLabel:
      folhaBase >= 1000 ? `R$ ${(folhaBase / 1000).toFixed(1)}K` : formatSalarioBrl(folhaBase),
    reajustesMes,
    media,
    mediaLabel: media >= 1000 ? `R$ ${(media / 1000).toFixed(1)}K` : formatSalarioBrl(media),
    encargosLabel:
      encargosEst >= 1000 ? `R$ ${(encargosEst / 1000).toFixed(1)}K` : formatSalarioBrl(encargosEst),
    pendentes: rows.filter((r) => r.remuneracaoStatus === 'pendente').length,
    defasados: rows.filter((r) => r.remuneracaoStatus === 'defasado').length,
  };
}

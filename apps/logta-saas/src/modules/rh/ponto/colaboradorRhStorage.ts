import { getSandboxOperationalBundle } from '../../../lib/seed';
import { buildEquipeRouteId, cpfDigits, normalizeEquipeRouteId } from '../lib/equipeRouteId';
import {
  RH_LEGACY_USR_DISPLAY_NAME,
  RH_LEGACY_USR_TO_COLAB_ID,
  isLegacyUsrRouteId,
} from '../lib/rhLegacyUserRoute';
import type { PontoRecord } from './types';

const PROFILE_PREFIX = 'logta-rh-colaborador';

export type ColaboradorAbsence = {
  id: string;
  date: string;
  reason: string;
  tipo: 'falta' | 'atestado' | 'folga' | 'ferias';
};

export type ColaboradorDocumentCategory =
  | 'contrato'
  | 'rg'
  | 'cpf'
  | 'cnh'
  | 'medico'
  | 'certificado'
  | 'ferias'
  | 'advertencia'
  | 'pessoal'
  | 'treinamento'
  | 'outro';

export type ColaboradorDocument = {
  id: string;
  name: string;
  type: string;
  expiresAt?: string;
  status: 'ok' | 'vencendo' | 'vencido';
  category?: ColaboradorDocumentCategory;
  uploadedAt?: string;
  fileName?: string;
  signedAt?: string;
};

export type ColaboradorFinancialExtra = {
  id: string;
  kind: 'bonus' | 'premiacao' | 'desconto' | 'beneficio' | 'diaria' | 'custo_rh';
  label: string;
  amount?: number;
  at: string;
  note?: string;
};

export type FinanceRuleBase = 'salario_bruto' | 'salario_liquido' | 'fixo';
export type FinanceRuleRecurrence = 'unica' | 'mensal' | 'parcelado';

export type RhFinanceRule = {
  id: string;
  name: string;
  type: 'fixo' | 'percentual';
  amount: number;
  base: FinanceRuleBase;
  recurrence: FinanceRuleRecurrence;
  totalInstallments?: number;
  installmentsPaid?: number;
  startDate?: string;
  endDate?: string;
};

export type Benefit = {
  id: string;
  type: string;
  amount: number;
  note?: string;
};

export type RhFinanceConfig = {
  baseSalary?: number;
  rules: RhFinanceRule[];
  benefits: Benefit[];
};

export type HoleriteStatus = 'rascunho' | 'aguardando_pagamento' | 'pago' | 'cancelado';

export type HoleriteLine = {
  label: string;
  amount: number;
  type: 'provento' | 'desconto';
};

export type ColaboradorHolerite = {
  id: string;
  /** Competência YYYY-MM */
  competencia: string;
  grossSalary: number;
  additions: number;
  discounts: number;
  netSalary: number;
  status: HoleriteStatus;
  paidAt?: string;
  financeTransactionId?: string;
  generatedAt: string;
  signedAt?: string;
  lines?: HoleriteLine[];
};

export type ColaboradorGoal = {
  id: string;
  title: string;
  target: number;
  current: number;
  unit?: string;
  dueDate?: string;
  status: 'em_andamento' | 'concluida' | 'atrasada';
  teamRank?: number;
};

export type ColaboradorRhRequest = {
  id: string;
  type: 'ferias' | 'atestado' | 'documento' | 'cadastro';
  title: string;
  status: 'aberta' | 'aprovada' | 'recusada';
  createdAt: string;
  detail?: string;
};

export type ColaboradorAuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string;
};

export type ColaboradorInternalNote = {
  id: string;
  at: string;
  author: string;
  body: string;
};

export type ColaboradorAgendaItem = {
  id: string;
  at: string;
  kind: 'aniversario' | 'ferias' | 'reuniao' | 'escala' | 'treinamento' | 'evento';
  title: string;
  detail?: string;
};

export type MotoristaOpsSnapshot = {
  trucksUsed: string[];
  kmRodados: number;
  entregas: number;
  multas: number;
  ocorrencias: number;
  rotasAtivas?: number;
  consumoMedio?: string;
};

export type RhEmploymentStatus = 'ativo' | 'afastado' | 'desligado' | 'falecido';

export type ColaboradorSalaryEntry = {
  id: string;
  effectiveDate: string;
  amount: number;
  note?: string;
};

export type ColaboradorTimelineEvent = {
  id: string;
  at: string;
  kind:
    | 'admissao'
    | 'salario'
    | 'status'
    | 'documento'
    | 'ponto'
    | 'ferias'
    | 'premio'
    | 'afastamento'
    | 'desligamento'
    | 'falecimento'
    | 'atestado';
  title: string;
  detail?: string;
};

export type ColaboradorRhProfile = {
  id: string;
  companyId: string;
  fullName: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  sector?: string;
  role?: string;
  admissionDate?: string;
  vacationStart?: string;
  vacationEnd?: string;
  employmentStatus?: RhEmploymentStatus;
  currentSalary?: number;
  salaryHistory?: ColaboradorSalaryEntry[];
  timeline?: ColaboradorTimelineEvent[];
  photoUrl?: string;
  systemAccessBlocked?: boolean;
  lastStatusReason?: string;
  absences: ColaboradorAbsence[];
  documents: ColaboradorDocument[];
  linkedProfileId?: string;
  /** Matrícula numérica RH (URL da equipe quando não há CPF). */
  equipeMatricula?: string;
  financialExtras?: ColaboradorFinancialExtra[];
  financialConfig?: RhFinanceConfig;
  holerites?: ColaboradorHolerite[];
  goals?: ColaboradorGoal[];
  requests?: ColaboradorRhRequest[];
  auditLog?: ColaboradorAuditEntry[];
  internalNotes?: ColaboradorInternalNote[];
  agenda?: ColaboradorAgendaItem[];
  motoristaOps?: MotoristaOpsSnapshot;
  trainingsCompleted?: number;
  vacationDaysAvailable?: number;
  updatedAt: string;
};

export function normalizeColaboradorProfile(profile: ColaboradorRhProfile): ColaboradorRhProfile {
  return {
    ...profile,
    employmentStatus: profile.employmentStatus ?? 'ativo',
    currentSalary: profile.currentSalary ?? 0,
    salaryHistory: profile.salaryHistory ?? [],
    timeline: profile.timeline ?? [],
    documents: profile.documents ?? [],
    absences: profile.absences ?? [],
    financialExtras: profile.financialExtras ?? [],
    financialConfig: (() => {
      const cfg: any = profile.financialConfig || {};
      const rules: RhFinanceRule[] = cfg.rules || [];
      if (cfg.fixedDeductions) {
        cfg.fixedDeductions.forEach((d: any) => {
          rules.push({ id: d.id, name: d.type, type: 'fixo', amount: d.amount || 0, base: 'fixo', recurrence: d.recurring ? 'mensal' : 'unica' });
        });
        delete cfg.fixedDeductions;
      }
      if (cfg.variableDeductions) {
        cfg.variableDeductions.forEach((d: any) => {
          rules.push({ id: d.id, name: d.type, type: 'fixo', amount: d.amount, base: 'fixo', recurrence: 'unica' });
        });
        delete cfg.variableDeductions;
      }
      if (cfg.installments) {
        cfg.installments.forEach((d: any) => {
          rules.push({ id: d.id, name: d.type, type: 'fixo', amount: d.installmentAmount, base: 'fixo', recurrence: 'parcelado', totalInstallments: d.totalInstallments, installmentsPaid: d.installmentsPaid });
        });
        delete cfg.installments;
      }
      return {
        baseSalary: cfg.baseSalary,
        rules,
        benefits: cfg.benefits || [],
      };
    })(),
    holerites: profile.holerites ?? [],
    goals: profile.goals ?? [],
    requests: profile.requests ?? [],
    auditLog: profile.auditLog ?? [],
    internalNotes: profile.internalNotes ?? [],
    agenda: profile.agenda ?? [],
  };
}

export function computeRhTenure(admissionDate?: string) {
  if (!admissionDate) {
    return { years: 0, months: 0, totalMonths: 0, label: '—', halfYears: 0 };
  }
  const start = new Date(admissionDate);
  if (Number.isNaN(start.getTime())) {
    return { years: 0, months: 0, totalMonths: 0, label: '—', halfYears: 0 };
  }
  const now = new Date();
  let totalMonths =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) totalMonths -= 1;
  if (totalMonths < 0) totalMonths = 0;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const label =
    years > 0
      ? `${years} ano${years > 1 ? 's' : ''} e ${months} ${months === 1 ? 'mês' : 'meses'}`
      : `${months} ${months === 1 ? 'mês' : 'meses'}`;
  return { years, months, totalMonths, label, halfYears: Math.floor(totalMonths / 6) };
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function appendTimelineEvent(
  profile: ColaboradorRhProfile,
  event: Omit<ColaboradorTimelineEvent, 'id' | 'at'> & { at?: string },
): ColaboradorRhProfile {
  const normalized = normalizeColaboradorProfile(profile);
  const entry: ColaboradorTimelineEvent = {
    id: newId('tl'),
    at: event.at ?? new Date().toISOString(),
    kind: event.kind,
    title: event.title,
    detail: event.detail,
  };
  return saveColaboradorProfile({
    ...normalized,
    timeline: [entry, ...normalized.timeline!].slice(0, 80),
  });
}

export function setEmploymentStatus(
  profile: ColaboradorRhProfile,
  status: RhEmploymentStatus,
  detail?: string,
  options?: { blockSystemAccess?: boolean },
): ColaboradorRhProfile {
  const reason = detail?.trim() ?? '';
  if ((status === 'desligado' || status === 'falecido') && !reason) {
    throw new Error('Informe o motivo do desligamento ou falecimento.');
  }

  const titles: Record<RhEmploymentStatus, string> = {
    ativo: 'Retorno / colaborador ativo',
    afastado: 'Afastamento registrado',
    desligado: 'Desligamento da empresa',
    falecido: 'Registro de falecimento',
  };
  const kinds: Record<RhEmploymentStatus, ColaboradorTimelineEvent['kind']> = {
    ativo: 'status',
    afastado: 'afastamento',
    desligado: 'desligamento',
    falecido: 'falecimento',
  };
  const blockAccess =
    options?.blockSystemAccess ??
    (status === 'desligado' || status === 'falecido' || status === 'afastado');

  const next = saveColaboradorProfile({
    ...normalizeColaboradorProfile(profile),
    employmentStatus: status,
    systemAccessBlocked: status === 'ativo' ? false : blockAccess,
    lastStatusReason: reason || profile.lastStatusReason,
  });
  return appendTimelineEvent(next, {
    kind: kinds[status],
    title: titles[status],
    detail:
      reason ||
      (blockAccess ? 'Acesso ao sistema bloqueado pelo RH.' : undefined),
  });
}

export function addInternalRhNote(
  profile: ColaboradorRhProfile,
  body: string,
  author = 'RH',
): ColaboradorRhProfile {
  const text = body.trim();
  if (!text) throw new Error('Escreva a observação.');
  const normalized = normalizeColaboradorProfile(profile);
  const entry: ColaboradorInternalNote = {
    id: newId('note'),
    at: new Date().toISOString(),
    author,
    body: text,
  };
  return saveColaboradorProfile({
    ...normalized,
    internalNotes: [entry, ...normalized.internalNotes!].slice(0, 50),
  });
}

export function addManualHistoryNote(
  profile: ColaboradorRhProfile,
  title: string,
  detail?: string,
): ColaboradorRhProfile {
  const t = title.trim();
  if (!t) throw new Error('Descreva o registro do histórico.');
  return appendTimelineEvent(profile, {
    kind: 'status',
    title: t,
    detail: detail?.trim() || undefined,
  });
}

export function addSalaryEntry(
  profile: ColaboradorRhProfile,
  amount: number,
  note?: string,
  effectiveDate?: string,
): ColaboradorRhProfile {
  const normalized = normalizeColaboradorProfile(profile);
  const entry: ColaboradorSalaryEntry = {
    id: newId('sal'),
    effectiveDate: effectiveDate ?? new Date().toISOString().slice(0, 10),
    amount,
    note,
  };
  const prev = normalized.currentSalary ?? 0;
  let updated = saveColaboradorProfile({
    ...normalized,
    currentSalary: amount,
    salaryHistory: [entry, ...normalized.salaryHistory!],
  });
  updated = appendTimelineEvent(updated, {
    kind: 'salario',
    title: prev > 0 ? 'Reajuste salarial' : 'Salário inicial registrado',
    detail: `R$ ${amount.toLocaleString('pt-BR')} · ${note || 'Atualização RH'}`,
  });
  return updated;
}

export function addColaboradorDocument(
  profile: ColaboradorRhProfile,
  doc: Omit<ColaboradorDocument, 'id'> & { id?: string },
): ColaboradorRhProfile {
  const normalized = normalizeColaboradorProfile(profile);
  const entry: ColaboradorDocument = {
    id: doc.id ?? newId('doc'),
    name: doc.name,
    type: doc.type,
    status: doc.status ?? 'ok',
    expiresAt: doc.expiresAt,
    category: doc.category,
    uploadedAt: doc.uploadedAt ?? new Date().toISOString(),
    fileName: doc.fileName,
  };
  let updated = saveColaboradorProfile({
    ...normalized,
    documents: [entry, ...normalized.documents],
  });
  updated = appendTimelineEvent(updated, {
    kind: 'documento',
    title: 'Documento anexado ao dossiê',
    detail: `${entry.name} (${entry.category || entry.type})`,
  });
  return updated;
}

function profileKey(companyId: string, collaboratorId: string) {
  return `${PROFILE_PREFIX}:${companyId}:${collaboratorId}`;
}

export function collaboratorIdFromDocument(document: string) {
  const doc = document.replace(/\D/g, '');
  return doc ? `colab-${doc}` : `colab-${Date.now()}`;
}

export function listColaboradorProfilesForCompany(companyId: string): ColaboradorRhProfile[] {
  const prefix = `${PROFILE_PREFIX}:${companyId}:`;
  const out: ColaboradorRhProfile[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      out.push(JSON.parse(raw) as ColaboradorRhProfile);
    }
  } catch {
    /* ignore */
  }
  return out.sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'));
}

export function loadColaboradorProfile(companyId: string, collaboratorId: string): ColaboradorRhProfile | null {
  try {
    const raw = localStorage.getItem(profileKey(companyId, collaboratorId));
    if (!raw) return null;
    return normalizeColaboradorProfile(JSON.parse(raw) as ColaboradorRhProfile);
  } catch {
    return null;
  }
}

function cnhDocStatusFromExpiry(iso?: string): ColaboradorDocument['status'] {
  if (!iso) return 'ok';
  const venc = new Date(iso);
  if (Number.isNaN(venc.getTime())) return 'ok';
  const diff = (venc.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'vencido';
  if (diff <= 60) return 'vencendo';
  return 'ok';
}

function profileMatchesEquipeRoute(p: ColaboradorRhProfile, routeKey: string): boolean {
  if (buildEquipeRouteId(p) === routeKey) return true;
  if (cpfDigits(p.document) === routeKey) return true;
  if ((p.equipeMatricula ?? '').replace(/\D/g, '') === routeKey) return true;
  if (p.id === routeKey || p.id === `colab-${routeKey}`) return true;
  if (p.linkedProfileId === routeKey) return true;
  return false;
}

function findByEquipeNumericRoute(companyId: string, routeKey: string): ColaboradorRhProfile | null {
  const bundle = getSandboxOperationalBundle(companyId);
  const all = [
    ...listColaboradorProfilesForCompany(companyId),
    ...bundle.colaboradorProfiles.map((p) => ({ ...p, companyId })),
  ];
  for (const p of all) {
    if (profileMatchesEquipeRoute(p, routeKey)) {
      return saveColaboradorProfile({ ...p, companyId: p.companyId || companyId });
    }
  }
  const byColabKey = loadColaboradorProfile(companyId, `colab-${routeKey}`);
  if (byColabKey) return byColabKey;
  return null;
}

/** Resolve perfil RH por rota `/rh/equipe/:id` (ID numérico, CPF, colab-*, prof-*, mot-*, usr-*). */
export function findColaboradorRhProfileByRouteId(
  companyId: string,
  routeId: string,
): ColaboradorRhProfile | null {
  const id = decodeURIComponent(routeId).trim();
  if (!id) return null;

  if (id === 'undefined' || !id) return null;

  if (isLegacyUsrRouteId(id)) {
    const mappedColabId = RH_LEGACY_USR_TO_COLAB_ID[id];
    if (mappedColabId) {
      const byMapped = findColaboradorRhProfileByRouteId(companyId, mappedColabId);
      if (byMapped) return byMapped;
    }
    const displayName = RH_LEGACY_USR_DISPLAY_NAME[id];
    if (displayName) {
      const all = listColaboradorProfilesForCompany(companyId);
      const byName = all.find((p) => {
        const a = p.fullName.trim().toLowerCase();
        const b = displayName.trim().toLowerCase();
        return a === b || a.startsWith(b) || b.startsWith(a);
      });
      if (byName) return byName;
      const stubId = mappedColabId ?? `colab-${id}`;
      return saveColaboradorProfile({
        id: stubId,
        companyId,
        fullName: displayName,
        document: '',
        email: `${id.replace('usr-', 'user')}@logtademo.com.br`,
        role: 'Colaborador',
        sector: 'RH',
        absences: [],
        documents: [{ id: 'doc-clt', name: 'Contrato CLT', type: 'Contrato', status: 'ok' }],
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const routeKey = normalizeEquipeRouteId(id);
  if (/^\d{6,14}$/.test(routeKey)) {
    const byNumeric = findByEquipeNumericRoute(companyId, routeKey);
    if (byNumeric) return byNumeric;
  }

  const bundle = getSandboxOperationalBundle(companyId);

  const direct = loadColaboradorProfile(companyId, id);
  if (direct) {
    const sandboxMatch = bundle.colaboradorProfiles.find(
      (p) => p.id === direct.id || p.linkedProfileId === direct.linkedProfileId || p.id === id,
    );
    if (sandboxMatch) {
      const sandboxRicher =
        (direct.timeline?.length ?? 0) < (sandboxMatch.timeline?.length ?? 0) ||
        (direct.documents?.length ?? 0) < (sandboxMatch.documents?.length ?? 0) ||
        !(direct.goals?.length) && (sandboxMatch.goals?.length ?? 0) > 0;
      if (sandboxRicher) {
        return saveColaboradorProfile({
          ...sandboxMatch,
          ...direct,
          id: direct.id,
          linkedProfileId: direct.linkedProfileId ?? sandboxMatch.linkedProfileId,
        });
      }
    }
    return direct;
  }

  for (const p of listColaboradorProfilesForCompany(companyId)) {
    if (p.id === id || p.linkedProfileId === id) return p;
  }

  for (const p of bundle.colaboradorProfiles) {
    if (p.id === id || p.linkedProfileId === id) {
      return saveColaboradorProfile({ ...p, companyId });
    }
  }

  const sandboxProfile = bundle.profiles.find((pr) => pr.id === id);
  if (sandboxProfile) {
    const linked = bundle.colaboradorProfiles.find((c) => c.linkedProfileId === id);
    if (linked) return saveColaboradorProfile({ ...linked, companyId });

    return saveColaboradorProfile({
      id,
      companyId,
      fullName: sandboxProfile.full_name,
      document: '',
      email: sandboxProfile.email,
      role: sandboxProfile.role,
      sector: sandboxProfile.department,
      phone: '',
      linkedProfileId: id,
      absences: [],
      documents: [
        { id: 'doc-clt', name: 'Contrato de trabalho', type: 'Contrato', status: 'ok' },
        { id: 'doc-aso', name: 'ASO periódico', type: 'Saúde', status: 'ok' },
      ],
      updatedAt: new Date().toISOString(),
    });
  }

  if (id.startsWith('mot-')) {
    const mot = bundle.motoristas.find((m) => m.id === id);
    if (mot) {
      const byName = bundle.colaboradorProfiles.find(
        (c) => c.fullName.trim().toLowerCase() === (mot.nome || '').trim().toLowerCase(),
      );
      if (byName) return saveColaboradorProfile({ ...byName, companyId });

      const cnhStatus = cnhDocStatusFromExpiry(mot.cnh_vencimento);
      return saveColaboradorProfile({
        id,
        companyId,
        fullName: mot.nome || 'Motorista',
        document: '',
        role: 'Motorista',
        sector: 'Frota',
        absences: [],
        documents: mot.cnh_vencimento
          ? [
              {
                id: 'cnh',
                name: 'CNH',
                type: 'CNH',
                status: cnhStatus,
                expiresAt: mot.cnh_vencimento,
              },
            ]
          : [],
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return null;
}

export function saveColaboradorProfile(profile: ColaboradorRhProfile) {
  const next = normalizeColaboradorProfile({ ...profile, updatedAt: new Date().toISOString() });
  localStorage.setItem(profileKey(next.companyId, next.id), JSON.stringify(next));
  return next;
}

export function mergeProfileFromPontoRecord(
  companyId: string,
  record: PontoRecord,
  seed?: Partial<ColaboradorRhProfile>,
): ColaboradorRhProfile {
  const id = record.collaboratorId || collaboratorIdFromDocument(record.collaboratorDocument);
  const existing = loadColaboradorProfile(companyId, id);
  const doc = record.collaboratorDocument.replace(/\D/g, '');

  const base: ColaboradorRhProfile = existing ?? {
    id,
    companyId,
    fullName: record.collaboratorName,
    document: doc,
    sector: record.sectorId ? `Setor ${record.sectorId}` : 'Operação',
    role: 'Colaborador',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    admissionDate: new Date().toISOString().slice(0, 10),
    vacationStart: '',
    vacationEnd: '',
    absences: [],
    documents: [
      { id: 'doc-1', name: 'Contrato de trabalho', type: 'Contrato', status: 'ok' },
      { id: 'doc-2', name: 'ASO — exame admissional', type: 'Saúde', status: 'ok' },
    ],
    updatedAt: new Date().toISOString(),
    ...seed,
  };

  return saveColaboradorProfile({
    ...base,
    fullName: record.collaboratorName || base.fullName,
    document: doc || base.document,
  });
}

export function enrichProfileFromSupabase(
  profile: ColaboradorRhProfile,
  member: {
    id?: string;
    full_name?: string;
    email?: string;
    role?: string;
    department?: string;
    cargo?: string;
    phone?: string;
    created_at?: string;
  },
): ColaboradorRhProfile {
  return saveColaboradorProfile({
    ...profile,
    linkedProfileId: member.id ?? profile.linkedProfileId,
    fullName: member.full_name || profile.fullName,
    email: member.email || profile.email,
    role: member.cargo || member.role || profile.role,
    sector: member.department || profile.sector,
    phone: member.phone || profile.phone,
    admissionDate: member.created_at?.slice(0, 10) || profile.admissionDate,
  });
}

export function getPontoRecordsForCollaborator(records: PontoRecord[], collaboratorId: string) {
  const docFromId = collaboratorId.startsWith('colab-') ? collaboratorId.slice(6) : '';
  return records
    .filter((r) => {
      if (r.collaboratorId === collaboratorId) return true;
      if (docFromId && r.collaboratorDocument.replace(/\D/g, '') === docFromId) return true;
      return (
        !r.collaboratorId &&
        collaboratorIdFromDocument(r.collaboratorDocument) === collaboratorId
      );
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function countAbsenceDays(profile: ColaboradorRhProfile) {
  return profile.absences.filter((a) => a.tipo === 'falta').length;
}

export function isOnVacation(profile: ColaboradorRhProfile, at = new Date()) {
  if (!profile.vacationStart || !profile.vacationEnd) return false;
  const start = new Date(profile.vacationStart);
  const end = new Date(profile.vacationEnd);
  return at >= start && at <= end;
}

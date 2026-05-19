import type { PontoRecord } from './types';

const PROFILE_PREFIX = 'logta-rh-colaborador';

export type ColaboradorAbsence = {
  id: string;
  date: string;
  reason: string;
  tipo: 'falta' | 'atestado' | 'folga' | 'ferias';
};

export type ColaboradorDocument = {
  id: string;
  name: string;
  type: string;
  expiresAt?: string;
  status: 'ok' | 'vencendo' | 'vencido';
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
  absences: ColaboradorAbsence[];
  documents: ColaboradorDocument[];
  linkedProfileId?: string;
  updatedAt: string;
};

function profileKey(companyId: string, collaboratorId: string) {
  return `${PROFILE_PREFIX}:${companyId}:${collaboratorId}`;
}

export function collaboratorIdFromDocument(document: string) {
  const doc = document.replace(/\D/g, '');
  return doc ? `colab-${doc}` : `colab-${Date.now()}`;
}

export function loadColaboradorProfile(companyId: string, collaboratorId: string): ColaboradorRhProfile | null {
  try {
    const raw = localStorage.getItem(profileKey(companyId, collaboratorId));
    if (!raw) return null;
    return JSON.parse(raw) as ColaboradorRhProfile;
  } catch {
    return null;
  }
}

export function saveColaboradorProfile(profile: ColaboradorRhProfile) {
  const next = { ...profile, updatedAt: new Date().toISOString() };
  localStorage.setItem(profileKey(profile.companyId, profile.id), JSON.stringify(next));
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

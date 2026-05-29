import { resolveDemoCompanyId } from '../../../lib/seed';
import {
  appendTimelineEvent,
  collaboratorIdFromDocument,
  saveColaboradorProfile,
  type ColaboradorRhProfile,
} from '../ponto/colaboradorRhStorage';

export type RhColaboradorFormInput = {
  nome: string;
  email: string;
  cargo: string;
  departamento?: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  fotoDataUrl?: string;
};

export function registerRhColaborador(
  companyId: string | undefined,
  input: RhColaboradorFormInput,
): ColaboradorRhProfile {
  const cid = resolveDemoCompanyId(companyId);
  const cpf = (input.cpf ?? '').replace(/\D/g, '');
  const id = cpf ? collaboratorIdFromDocument(cpf) : collaboratorIdFromDocument(input.email);

  let profile: ColaboradorRhProfile = {
    id,
    companyId: cid,
    fullName: input.nome.trim(),
    document: cpf || input.email.replace(/[^a-z0-9]/gi, '').slice(0, 11),
    equipeMatricula: cpf || undefined,
    email: input.email.trim().toLowerCase(),
    phone: input.telefone?.trim() || '',
    address: input.endereco?.trim() || '',
    city: input.cidade?.trim() || '',
    state: input.uf?.trim() || '',
    sector: input.departamento?.trim() || 'Operação',
    role: input.cargo.trim(),
    admissionDate: new Date().toISOString().slice(0, 10),
    employmentStatus: 'ativo',
    systemAccessBlocked: false,
    currentSalary: 0,
    salaryHistory: [],
    timeline: [],
    photoUrl: input.fotoDataUrl,
    vacationStart: '',
    vacationEnd: '',
    absences: [],
    documents: [
      {
        id: `doc-${id}-contrato`,
        name: 'Contrato de trabalho',
        type: 'Contrato',
        category: 'contrato',
        status: 'ok',
        uploadedAt: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  profile = saveColaboradorProfile(profile);
  profile = appendTimelineEvent(profile, {
    kind: 'admissao',
    title: 'Colaborador cadastrado no RH',
    detail: `${profile.role} · ${profile.sector} · CPF/ID ${profile.document}`,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('logta-rh-team-updated'));
  }
  return profile;
}

export type RhColaboradorDadosUpdateInput = RhColaboradorFormInput & {
  admissionDate?: string;
  salario?: number;
  feriasDisponiveis?: number;
  linkedProfileId?: string;
  matricula?: string;
};

/** Atualiza dossiê cadastral de colaborador existente (aba Dados do perfil). */
export function updateRhColaboradorDados(
  profile: ColaboradorRhProfile,
  input: RhColaboradorDadosUpdateInput,
): ColaboradorRhProfile {
  const cpf = (input.cpf ?? profile.document ?? '').replace(/\D/g, '');
  const salary =
    input.salario != null && !Number.isNaN(input.salario) ? Math.max(0, input.salario) : profile.currentSalary;

  let updated = saveColaboradorProfile({
    ...profile,
    fullName: input.nome.trim(),
    document: cpf || profile.document,
    equipeMatricula: cpf || input.matricula?.replace(/\D/g, '') || profile.equipeMatricula,
    email: input.email.trim().toLowerCase(),
    phone: input.telefone?.trim() || '',
    address: input.endereco?.trim() || '',
    city: input.cidade?.trim() || '',
    state: input.uf?.trim()?.toUpperCase().slice(0, 2) || '',
    sector: input.departamento?.trim() || profile.sector || 'Operação',
    role: input.cargo.trim(),
    admissionDate: input.admissionDate?.trim() || profile.admissionDate,
    currentSalary: salary,
    vacationDaysAvailable:
      input.feriasDisponiveis != null && !Number.isNaN(input.feriasDisponiveis)
        ? Math.max(0, Math.floor(input.feriasDisponiveis))
        : profile.vacationDaysAvailable,
    linkedProfileId: input.linkedProfileId?.trim() || profile.linkedProfileId,
    photoUrl: input.fotoDataUrl ?? profile.photoUrl,
  });

  updated = appendTimelineEvent(updated, {
    kind: 'status',
    title: 'Dados cadastrais atualizados',
    detail: 'Edição do dossiê RH (cadastro completo).',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('logta-rh-team-updated'));
  }
  return updated;
}

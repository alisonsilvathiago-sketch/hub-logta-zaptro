import { resolveDemoCompanyId } from '../../../lib/seed';
import type { MotoristaRow } from '../../../contexts/OperationalDataContext';
import {
  countAbsenceDays,
  findColaboradorRhProfileByRouteId,
  getPontoRecordsForCollaborator,
  isOnVacation,
  type ColaboradorRhProfile,
} from '../ponto/colaboradorRhStorage';
import { loadPontoRecords } from '../ponto/pontoStorage';
import type { PontoRecord, PontoRecordType } from '../ponto/types';
import { resolveEquipeListRouteId } from './equipeRouteId';
import type { RhColaboradorListItem } from './mergeRhColaboradores';

export type EquipeJornadaStatus =
  | 'em_jornada'
  | 'pausa'
  | 'fora'
  | 'ferias'
  | 'sem_registro';

export type EquipeInteligenteRow = RhColaboradorListItem & {
  rhProfile: ColaboradorRhProfile | null;
  jornadaStatus: EquipeJornadaStatus;
  jornadaLabel: string;
  lastPontoAt: string | null;
  lastPontoType: PontoRecordType | null;
  lastPontoLabel: string | null;
  alertasDocs: number;
  alertasCriticos: number;
  faltasMes: number;
  isMotorista: boolean;
  cnhVencendo: boolean;
  insights: string[];
};

const PONTO_LABEL: Record<PontoRecordType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  pausa_inicio: 'Pausa',
  pausa_fim: 'Retorno',
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function resolveRhProfile(
  companyId: string,
  member: RhColaboradorListItem,
): ColaboradorRhProfile | null {
  return findColaboradorRhProfileByRouteId(
    companyId,
    member.equipeRouteId || member.rhProfileId || member.id,
  );
}

function resolvePontoRecordsForMember(
  records: PontoRecord[],
  member: RhColaboradorListItem,
  rhProfile: ColaboradorRhProfile | null,
): PontoRecord[] {
  const ids = [
    rhProfile?.id,
    member.rhProfileId,
    member.id,
    rhProfile?.linkedProfileId,
  ].filter(Boolean) as string[];

  const seen = new Set<string>();
  const merged: PontoRecord[] = [];
  for (const id of ids) {
    for (const r of getPontoRecordsForCollaborator(records, id)) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        merged.push(r);
      }
    }
  }
  if (merged.length > 0) {
    return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  const nameKey = member.full_name.trim().toLowerCase();
  return records
    .filter((r) => r.collaboratorName.trim().toLowerCase() === nameKey)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function equipeAvatarUrl(member: { full_name: string; avatar_url?: string; id: string }) {
  if (member.avatar_url?.trim()) return member.avatar_url.trim();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&size=96&background=EEF2FF&color=2563eb&bold=true`;
}

function inferJornadaFromRecords(records: PontoRecord[]): {
  status: EquipeJornadaStatus;
  label: string;
  lastAt: string | null;
  lastType: PontoRecordType | null;
} {
  const today = todayKey();
  const todayRecords = records.filter((r) => r.timestamp.slice(0, 10) === today);
  const last = records[0];
  const lastAt = last?.timestamp ?? null;
  const lastType = last?.type ?? null;

  if (todayRecords.length === 0) {
    return {
      status: 'sem_registro',
      label: 'Sem registro hoje',
      lastAt,
      lastType,
    };
  }

  const lastToday = todayRecords[0];
  if (lastToday.type === 'saida') {
    return {
      status: 'fora',
      label: `Encerrou — ${PONTO_LABEL.saida}`,
      lastAt: lastToday.timestamp,
      lastType: lastToday.type,
    };
  }
  if (lastToday.type === 'pausa_inicio') {
    return {
      status: 'pausa',
      label: 'Em pausa',
      lastAt: lastToday.timestamp,
      lastType: lastToday.type,
    };
  }
  return {
    status: 'em_jornada',
    label: `Em jornada — ${PONTO_LABEL[lastToday.type] ?? lastToday.type}`,
    lastAt: lastToday.timestamp,
    lastType: lastToday.type,
  };
}

function countDocAlerts(profile: ColaboradorRhProfile | null) {
  if (!profile?.documents?.length) return { total: 0, critical: 0 };
  let total = 0;
  let critical = 0;
  for (const d of profile.documents) {
    if (d.status === 'vencendo') total += 1;
    if (d.status === 'vencido') {
      total += 1;
      critical += 1;
    }
  }
  return { total, critical };
}

function buildInsights(
  member: RhColaboradorListItem,
  profile: ColaboradorRhProfile | null,
  jornada: EquipeJornadaStatus,
  alertasDocs: number,
  faltas: number,
  isMotorista: boolean,
  cnhVencendo: boolean,
): string[] {
  const lines: string[] = [];
  if (jornada === 'sem_registro') lines.push('Sem batida de ponto hoje — vale conferir escala.');
  if (jornada === 'ferias') lines.push('Colaborador em período de férias.');
  if (faltas > 0) lines.push(`${faltas} falta(s) registrada(s) no dossiê RH.`);
  if (alertasDocs > 0) lines.push(`${alertasDocs} documento(s) exigem atenção (vencendo ou vencido).`);
  if (cnhVencendo && isMotorista) lines.push('CNH próxima do vencimento — alinhar renovação com frota.');
  if (profile?.absences?.some((a) => a.tipo === 'atestado')) {
    lines.push('Atestado médico recente no histórico.');
  }
  if (!lines.length) {
    lines.push(
      `${member.role || 'Colaborador'} em ${member.department || 'operação'} — situação regular no painel.`,
    );
  }
  return lines.slice(0, 3);
}

export function buildEquipeInteligenteRows(
  companyId: string | undefined,
  colaboradores: RhColaboradorListItem[],
  motoristas: MotoristaRow[] = [],
): EquipeInteligenteRow[] {
  const cid = resolveDemoCompanyId(companyId);
  const pontoRecords = loadPontoRecords(cid);
  const motNames = new Set(
    motoristas.map((m) => (m.nome || '').trim().toLowerCase()).filter(Boolean),
  );

  return colaboradores.map((member) => {
    const rhProfile = resolveRhProfile(cid, member);
    const collabRecords = resolvePontoRecordsForMember(pontoRecords, member, rhProfile);

    let jornada = inferJornadaFromRecords(collabRecords);
    let jornadaStatus = jornada.status;

    if (rhProfile && isOnVacation(rhProfile)) {
      jornadaStatus = 'ferias';
      jornada = { ...jornada, status: 'ferias', label: 'Em férias' };
    }

    const { total: alertasDocs, critical: alertasCriticos } = countDocAlerts(rhProfile);
    const faltasMes = rhProfile ? countAbsenceDays(rhProfile) : 0;
    const nomeKey = member.full_name.trim().toLowerCase();
    const mot = motoristas.find((m) => (m.nome || '').trim().toLowerCase() === nomeKey);
    const isMotorista =
      Boolean(mot) ||
      motNames.has(nomeKey) ||
      /motorista/i.test(member.role || '') ||
      /frota/i.test(member.department || '');

    let cnhVencendo = false;
    if (mot?.cnh_vencimento) {
      const venc = new Date(mot.cnh_vencimento);
      if (!Number.isNaN(venc.getTime())) {
        const diff = (venc.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        cnhVencendo = diff <= 60;
      }
    }
    if (!cnhVencendo && rhProfile?.documents) {
      cnhVencendo = rhProfile.documents.some(
        (d) => /cnh/i.test(d.name) && (d.status === 'vencendo' || d.status === 'vencido'),
      );
    }

    const insights = buildInsights(
      member,
      rhProfile,
      jornadaStatus,
      alertasDocs,
      faltasMes,
      isMotorista,
      cnhVencendo,
    );

    const equipeRouteId = resolveEquipeListRouteId({
      ...member,
      document: rhProfile?.document,
      rhProfileId: member.rhProfileId || rhProfile?.id,
    });

    return {
      ...member,
      id: equipeRouteId,
      equipeRouteId,
      rhProfile,
      jornadaStatus,
      jornadaLabel: jornada.label,
      lastPontoAt: jornada.lastAt,
      lastPontoType: jornada.lastType,
      lastPontoLabel: jornada.lastType ? PONTO_LABEL[jornada.lastType] : null,
      alertasDocs,
      alertasCriticos,
      faltasMes,
      isMotorista,
      cnhVencendo,
      insights,
    };
  });
}

export function equipeResumoStats(rows: EquipeInteligenteRow[]) {
  return {
    total: rows.length,
    emJornada: rows.filter((r) => r.jornadaStatus === 'em_jornada' || r.jornadaStatus === 'pausa').length,
    semRegistro: rows.filter((r) => r.jornadaStatus === 'sem_registro').length,
    alertas: rows.filter((r) => r.alertasDocs > 0 || r.cnhVencendo || r.faltasMes > 0).length,
    motoristas: rows.filter((r) => r.isMotorista).length,
  };
}

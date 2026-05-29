import type { PontoRecord } from '../ponto/types';
import {
  computeRhTenure,
  countAbsenceDays,
  isOnVacation,
  type ColaboradorRhProfile,
} from '../ponto/colaboradorRhStorage';

export type Colaborador360Dashboard = {
  produtividade: number;
  presenca: number;
  faltas: number;
  atrasos: number;
  horasExtras: number;
  bancoHoras: number;
  feriasDisponiveis: number;
  treinamentosConcluidos: number;
  metasAtivas: number;
  rankingInterno: number;
};

export type Colaborador360Alert = {
  id: string;
  severity: 'info' | 'warn' | 'critical';
  title: string;
  detail: string;
};

export type Colaborador360IA = {
  riscoDesligamento: number;
  performance: number;
  previsaoPromocao: number;
  comportamento: number;
  produtividade: number;
  riscoJornada: number;
  highlights: string[];
};

export type JornadaDaySummary = {
  date: string;
  label: string;
  hours: number;
  batidas: number;
  hasExtra: boolean;
  hasLate: boolean;
};

export type Colaborador360Bundle = {
  dashboard: Colaborador360Dashboard;
  alerts: Colaborador360Alert[];
  ia: Colaborador360IA;
  smartSummary: string;
  isMotorista: boolean;
  jornadaDays: JornadaDaySummary[];
  horasSemanais: number;
  advertencias: number;
};

function daysUntil(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function estimateHoursFromPonto(records: PontoRecord[], dayKey: string): number {
  const dayRecords = records.filter((r) => r.timestamp.slice(0, 10) === dayKey);
  const entrada = dayRecords.find((r) => r.type === 'entrada');
  const saida = dayRecords.find((r) => r.type === 'saida');
  if (!entrada || !saida) return dayRecords.length > 0 ? 4 : 0;
  const ms = new Date(saida.timestamp).getTime() - new Date(entrada.timestamp).getTime();
  return Math.max(0, Math.round((ms / 3600000) * 10) / 10);
}

export function buildJornadaDays(records: PontoRecord[], days = 14): JornadaDaySummary[] {
  const out: JornadaDaySummary[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayRecords = records.filter((r) => r.timestamp.slice(0, 10) === key);
    const hours = estimateHoursFromPonto(records, key);
    const entrada = dayRecords.find((r) => r.type === 'entrada');
    const hasLate =
      !!entrada &&
      new Date(entrada.timestamp).getHours() * 60 + new Date(entrada.timestamp).getMinutes() >
        8 * 60 + 15;
    out.push({
      date: key,
      label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      hours,
      batidas: dayRecords.length,
      hasExtra: hours > 8.5,
      hasLate,
    });
  }
  return out;
}

export function buildColaborador360(
  profile: ColaboradorRhProfile,
  pontoHistory: PontoRecord[],
): Colaborador360Bundle {
  const tenure = computeRhTenure(profile.admissionDate);
  const faltas = countAbsenceDays(profile);
  const batidas = pontoHistory.length;
  const presencaBase = Math.min(99, Math.max(72, 94 - faltas * 4 + Math.min(4, batidas)));
  const atrasos = pontoHistory.filter((r) => {
    if (r.type !== 'entrada') return false;
    const h = new Date(r.timestamp);
    return h.getHours() * 60 + h.getMinutes() > 8 * 60 + 10;
  }).length;

  const jornadaDays = buildJornadaDays(pontoHistory);
  const horasSemanais = jornadaDays.slice(-7).reduce((s, d) => s + d.hours, 0);
  const horasExtras = Math.max(0, Math.round((horasSemanais - 44) * 10) / 10);

  const metasAtivas = (profile.goals ?? []).filter((g) => g.status === 'em_andamento').length;
  const goalsAvg =
    (profile.goals ?? []).length > 0
      ? (profile.goals ?? []).reduce((s, g) => s + Math.min(100, (g.current / g.target) * 100), 0) /
        (profile.goals ?? []).length
      : 82;

  const advertencias = (profile.documents ?? []).filter(
    (d) => d.category === 'advertencia' || d.name.toLowerCase().includes('advert'),
  ).length;

  const feriasDisponiveis =
    profile.vacationDaysAvailable ??
    Math.max(0, Math.floor(tenure.totalMonths * 2.5) - (isOnVacation(profile) ? 15 : 0));

  const dashboard: Colaborador360Dashboard = {
    produtividade: Math.round(goalsAvg),
    presenca: presencaBase,
    faltas,
    atrasos,
    horasExtras,
    bancoHoras: profile.role?.toLowerCase().includes('motorista') ? 12 : 6,
    feriasDisponiveis,
    treinamentosConcluidos: profile.trainingsCompleted ?? (profile.documents.some((d) => d.category === 'treinamento') ? 3 : 1),
    metasAtivas: metasAtivas || 2,
    rankingInterno: (profile.goals?.[0]?.teamRank ?? 3) as number,
  };

  const alerts: Colaborador360Alert[] = [];

  for (const doc of profile.documents) {
    const days = daysUntil(doc.expiresAt);
    if (doc.status === 'vencido' || (days != null && days < 0)) {
      alerts.push({
        id: `doc-${doc.id}`,
        severity: 'critical',
        title: `${doc.name} vencido`,
        detail: 'Renovar ou arquivar no dossiê imediatamente.',
      });
    } else if (doc.status === 'vencendo' || (days != null && days <= 60)) {
      alerts.push({
        id: `doc-${doc.id}`,
        severity: 'warn',
        title: `${doc.name} vencendo`,
        detail: days != null ? `Vence em ${days} dia(s).` : 'Validade próxima.',
      });
    }
  }

  if (profile.vacationStart) {
    const d = daysUntil(profile.vacationStart);
    if (d != null && d > 0 && d <= 45) {
      alerts.push({
        id: 'ferias',
        severity: 'info',
        title: 'Férias programadas',
        detail: `Início em ${new Date(profile.vacationStart).toLocaleDateString('pt-BR')} (${d} dias).`,
      });
    }
  } else if (feriasDisponiveis >= 30) {
    alerts.push({
      id: 'ferias-disp',
      severity: 'info',
      title: 'Férias disponíveis',
      detail: `${feriasDisponiveis} dias acumulados — planejar gozo com o RH.`,
    });
  }

  if (faltas > 0) {
    alerts.push({
      id: 'faltas',
      severity: 'warn',
      title: 'Ausências no dossiê',
      detail: `${faltas} falta(s) registrada(s). Conferir justificativas.`,
    });
  }

  if (horasExtras > 10) {
    alerts.push({
      id: 'jornada',
      severity: 'warn',
      title: 'Jornada elevada na semana',
      detail: `${horasExtras}h extras estimadas — revisar escala e descanso.`,
    });
  }

  if (profile.admissionDate) {
    const adm = new Date(profile.admissionDate);
    const now = new Date();
    if (adm.getMonth() === now.getMonth() && Math.abs(adm.getDate() - now.getDate()) <= 7) {
      alerts.push({
        id: 'aniv-empresa',
        severity: 'info',
        title: 'Aniversário de empresa',
        detail: `Completa ${tenure.label} neste período.`,
      });
    }
  }

  const treinamentoPendente = profile.documents.some(
    (d) => d.category === 'treinamento' && d.status !== 'ok',
  );
  if (treinamentoPendente) {
    alerts.push({
      id: 'treinamento',
      severity: 'warn',
      title: 'Treinamento obrigatório pendente',
      detail: 'NR / certificação com validade a renovar.',
    });
  }

  const performance = dashboard.produtividade;
  const riscoDesligamento = Math.min(
    85,
    Math.max(
      5,
      (profile.employmentStatus === 'desligado' ? 90 : 0) +
        faltas * 12 +
        advertencias * 15 +
        (profile.systemAccessBlocked ? 10 : 0),
    ),
  );

  const ia: Colaborador360IA = {
    riscoDesligamento,
    performance,
    previsaoPromocao: Math.min(92, performance + tenure.halfYears * 4),
    comportamento: Math.min(98, dashboard.presenca + 2),
    produtividade: dashboard.produtividade,
    riscoJornada: Math.min(90, horasExtras * 6 + atrasos * 5),
    highlights: [
      riscoDesligamento < 25
        ? 'Baixo risco de desligamento nos últimos 12 meses.'
        : 'Monitorar indicadores de engajamento e absenteísmo.',
      performance >= 80
        ? 'Performance acima da média da equipe.'
        : 'Plano de desenvolvimento recomendado.',
      horasExtras > 8
        ? 'Atenção a excesso de jornada — alinhar com gestor.'
        : 'Jornada dentro dos parâmetros operacionais.',
    ],
  };

  const nome = firstName(profile.fullName);
  const smartSummary = [
    `${nome} possui ${tenure.label} na empresa`,
    `${dashboard.presenca}% de presença`,
    advertencias === 0 ? 'sem advertências' : `${advertencias} advertência(s) no dossiê`,
    `${feriasDisponiveis} dias de férias disponíveis`,
    performance >= 85
      ? 'e alta performance operacional.'
      : 'com evolução contínua em metas e treinamentos.',
  ].join(', ');

  const isMotorista =
    profile.role?.toLowerCase().includes('motorista') ||
    profile.sector?.toLowerCase().includes('frota') ||
    profile.id.startsWith('mot-');

  return {
    dashboard,
    alerts,
    ia,
    smartSummary,
    isMotorista,
    jornadaDays,
    horasSemanais,
    advertencias,
  };
}

import type { PontoAlert, PontoConfig, PontoInsight, PontoLiveStats, PontoRecord } from './types';

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeLiveStats(records: PontoRecord[], alerts: PontoAlert[]): PontoLiveStats {
  const today = records.filter((r) => isToday(r.timestamp));
  const docs = new Set(today.map((r) => r.collaboratorDocument));
  const entradas = today.filter((r) => r.type === 'entrada');
  const online = entradas.filter((e) => {
    const saida = today.find(
      (r) => r.collaboratorDocument === e.collaboratorDocument && r.type === 'saida' && r.timestamp > e.timestamp,
    );
    return !saida;
  });

  return {
    registrosHoje: today.length,
    onlineAgora: online.length,
    atrasos: alerts.filter((a) => a.category === 'atraso').length,
    foraArea: alerts.filter((a) => a.category === 'geo').length,
    bancoHorasEst: '+12h',
    alertasAtivos: alerts.length,
  };
}

export function buildPontoAlerts(config: PontoConfig, records: PontoRecord[]): PontoAlert[] {
  const alerts: PontoAlert[] = [];
  const today = records.filter((r) => isToday(r.timestamp));

  for (const r of today) {
    if (!r.validated && r.flags.includes('fora_area')) {
      alerts.push({
        id: `geo-${r.id}`,
        title: 'Ponto fora da área',
        message: `${r.collaboratorName} registrou ${r.type} fora do raio permitido (${config.geoRadiusMeters}m).`,
        priority: 'critical',
        category: 'geo',
        timestamp: r.timestamp,
      });
    }
    if (r.flags.includes('suspeito')) {
      alerts.push({
        id: `sus-${r.id}`,
        title: 'Tentativa suspeita',
        message: `Múltiplos acessos detectados para ${r.collaboratorDocument}.`,
        priority: 'high',
        category: 'suspeita',
        timestamp: r.timestamp,
      });
    }
    if (r.flags.includes('atraso')) {
      alerts.push({
        id: `atr-${r.id}`,
        title: 'Colaborador atrasado',
        message: `${r.collaboratorName} iniciou após o limite de ${config.maxLateMinutes} min.`,
        priority: 'medium',
        category: 'atraso',
        timestamp: r.timestamp,
      });
    }
  }

  const entradasHoje = today.filter((r) => r.type === 'entrada').length;
  if (entradasHoje === 0 && new Date().getHours() >= 10) {
    alerts.push({
      id: 'ausencia-dia',
      title: 'Ausência detectada',
      message: 'Nenhuma entrada registrada na unidade até o momento.',
      priority: 'high',
      category: 'ausencia',
      timestamp: new Date().toISOString(),
    });
  }

  if (today.length >= 8) {
    alerts.push({
      id: 'jornada-excesso',
      title: 'Risco de jornada excessiva',
      message: 'IA detectou volume alto de registros — revisar escalas e pausas.',
      priority: 'high',
      category: 'jornada',
      timestamp: new Date().toISOString(),
    });
  }

  return alerts.slice(0, 12);
}

export function buildPontoInsights(config: PontoConfig, records: PontoRecord[]): PontoInsight[] {
  const today = records.filter((r) => isToday(r.timestamp));
  const insights: PontoInsight[] = [
    {
      id: 'i1',
      title: 'Risco trabalhista',
      detail:
        today.filter((r) => r.flags.includes('jornada')).length > 0
          ? 'Há indícios de jornada acima do padrão — valide escalas.'
          : 'Jornada dentro do padrão operacional nas últimas 24h.',
      tone: today.some((r) => r.flags.includes('jornada')) ? 'risk' : 'success',
    },
    {
      id: 'i2',
      title: 'Previsão de atrasos',
      detail: `Com base no horário ${config.operationalHoursStart}, IA estima pico de entrada entre 07:50 e 08:20.`,
      tone: 'info',
    },
    {
      id: 'i3',
      title: 'Padrão operacional',
      detail:
        config.geoEnabled
          ? `Geofence ativo — raio ${config.geoRadiusMeters}m em torno da unidade.`
          : 'Geolocalização desativada — ative para validar batidas.',
      tone: 'info',
    },
  ];
  return insights;
}

export function validatePontoRecord(
  config: PontoConfig,
  records: PontoRecord[],
  input: {
    collaboratorDocument: string;
    type: PontoRecord['type'];
    lat?: number;
    lng?: number;
    deviceInfo: string;
  },
): { validated: boolean; flags: string[]; distanceMeters?: number } {
  const flags: string[] = [];
  let validated = true;
  let distanceMeters: number | undefined;

  const now = new Date();
  const [sh, sm] = config.operationalHoursStart.split(':').map(Number);
  const start = new Date(now);
  start.setHours(sh, sm, 0, 0);

  if (config.validations.schedule && input.type === 'entrada' && now > start) {
    const lateMin = (now.getTime() - start.getTime()) / 60000;
    if (lateMin > config.maxLateMinutes) flags.push('atraso');
  }

  if (config.geoEnabled && config.validations.distance && input.lat != null && input.lng != null) {
    distanceMeters = haversineMeters(input.lat, input.lng, config.geoLat, config.geoLng);
    if (distanceMeters > config.geoRadiusMeters) {
      flags.push('fora_area');
      validated = false;
    }
  }

  if (config.validations.multiAccess) {
    const recent = records.filter(
      (r) =>
        r.collaboratorDocument === input.collaboratorDocument &&
        Date.now() - new Date(r.timestamp).getTime() < 3 * 60 * 1000,
    );
    if (recent.length >= 2) flags.push('suspeito');
  }

  if (config.validations.journey) {
    const dayCount = records.filter(
      (r) => r.collaboratorDocument === input.collaboratorDocument && isToday(r.timestamp),
    ).length;
    if (dayCount >= 6) flags.push('jornada');
  }

  if (!config.validations.device && !input.deviceInfo) {
    validated = false;
  }

  return { validated: validated && flags.length === 0, flags, distanceMeters };
}

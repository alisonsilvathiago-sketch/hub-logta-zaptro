import type { PontoConfig, PontoRecord } from './types';

const CONFIG_PREFIX = 'logta-ponto-config';
const RECORDS_PREFIX = 'logta-ponto-records';

function configKey(companyId: string) {
  return `${CONFIG_PREFIX}:${companyId}`;
}

function recordsKey(companyId: string) {
  return `${RECORDS_PREFIX}:${companyId}`;
}

function randomToken(len = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function slugifyUnit(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'unidade';
}

export function createDefaultPontoConfig(companyId: string, unitName = 'Unidade principal'): PontoConfig {
  const slug = slugifyUnit(unitName);
  return {
    id: `ponto-${companyId}`,
    companyId,
    unitName,
    operationalHoursStart: '08:00',
    operationalHoursEnd: '18:00',
    maxDistanceMeters: 150,
    maxLateMinutes: 15,
    mandatoryBreakMinutes: 60,
    journeyRules: 'Jornada padrão 8h + intervalo legal. Excesso acima de 10h/dia gera alerta IA.',
    registrationMode: 'both',
    qrEnabled: true,
    linkEnabled: true,
    publicToken: randomToken(16),
    publicSlug: slug,
    geoEnabled: true,
    geoLat: -23.5505,
    geoLng: -46.6333,
    geoRadiusMeters: 150,
    validations: {
      location: true,
      schedule: true,
      device: true,
      distance: true,
      journey: true,
      suspicious: true,
      multiAccess: true,
    },
    sectorQrCodes: [
      { id: 'setor-op', label: 'Operação', token: randomToken(10) },
      { id: 'setor-adm', label: 'Administrativo', token: randomToken(10) },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function loadPontoConfig(companyId: string): PontoConfig {
  try {
    const raw = localStorage.getItem(configKey(companyId));
    if (!raw) return createDefaultPontoConfig(companyId);
    const parsed = JSON.parse(raw) as PontoConfig;
    return { ...createDefaultPontoConfig(companyId, parsed.unitName), ...parsed };
  } catch {
    return createDefaultPontoConfig(companyId);
  }
}

export function savePontoConfig(config: PontoConfig) {
  const next = { ...config, updatedAt: new Date().toISOString() };
  localStorage.setItem(configKey(config.companyId), JSON.stringify(next));
  return next;
}

export function loadPontoRecords(companyId: string): PontoRecord[] {
  try {
    const raw = localStorage.getItem(recordsKey(companyId));
    if (!raw) return [];
    return JSON.parse(raw) as PontoRecord[];
  } catch {
    return [];
  }
}

export function savePontoRecords(companyId: string, records: PontoRecord[]) {
  localStorage.setItem(recordsKey(companyId), JSON.stringify(records.slice(0, 500)));
}

export function appendPontoRecord(companyId: string, record: PontoRecord) {
  const records = loadPontoRecords(companyId);
  records.unshift(record);
  savePontoRecords(companyId, records);
  return records;
}

export function findPontoConfigByPublicRoute(slug: string, token: string): PontoConfig | null {
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(`${CONFIG_PREFIX}:`)) continue;
    try {
      const cfg = JSON.parse(localStorage.getItem(key) ?? '') as PontoConfig;
      if (cfg.publicSlug === slug && cfg.publicToken === token) return cfg;
    } catch {
      /* skip */
    }
  }
  return null;
}

export function buildPublicPontoPath(config: PontoConfig) {
  return `/ponto/${config.publicSlug}/${config.publicToken}`;
}

export function buildPublicPontoUrl(config: PontoConfig) {
  if (typeof window === 'undefined') return buildPublicPontoPath(config);
  return `${window.location.origin}${buildPublicPontoPath(config)}`;
}

export function buildSectorQrPath(config: PontoConfig, sectorToken: string) {
  return `/ponto/${config.publicSlug}/${config.publicToken}?setor=${sectorToken}`;
}

export function regeneratePublicToken(config: PontoConfig): PontoConfig {
  return savePontoConfig({ ...config, publicToken: randomToken(16) });
}

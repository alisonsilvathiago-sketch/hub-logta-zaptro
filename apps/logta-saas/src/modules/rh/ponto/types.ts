export type PontoRegistrationMode = 'qr' | 'link' | 'both';

export type PontoRecordType = 'entrada' | 'saida' | 'pausa_inicio' | 'pausa_fim';

export type PontoValidations = {
  location: boolean;
  schedule: boolean;
  device: boolean;
  distance: boolean;
  journey: boolean;
  suspicious: boolean;
  multiAccess: boolean;
};

export type PontoSectorQr = {
  id: string;
  label: string;
  token: string;
};

export type PontoConfig = {
  id: string;
  companyId: string;
  unitName: string;
  operationalHoursStart: string;
  operationalHoursEnd: string;
  maxDistanceMeters: number;
  maxLateMinutes: number;
  mandatoryBreakMinutes: number;
  journeyRules: string;
  registrationMode: PontoRegistrationMode;
  qrEnabled: boolean;
  linkEnabled: boolean;
  publicToken: string;
  publicSlug: string;
  geoEnabled: boolean;
  geoLat: number;
  geoLng: number;
  geoRadiusMeters: number;
  validations: PontoValidations;
  sectorQrCodes: PontoSectorQr[];
  updatedAt: string;
};

export type PontoRecord = {
  id: string;
  companyId: string;
  configId: string;
  sectorId?: string;
  /** ID estável do colaborador (perfil Supabase ou colab-{documento}). */
  collaboratorId: string;
  collaboratorName: string;
  collaboratorDocument: string;
  type: PontoRecordType;
  timestamp: string;
  lat?: number;
  lng?: number;
  deviceInfo: string;
  distanceMeters?: number;
  validated: boolean;
  flags: string[];
};

export type PontoAlertPriority = 'critical' | 'high' | 'medium' | 'low';

export type PontoAlertCategory =
  | 'atraso'
  | 'ausencia'
  | 'jornada'
  | 'geo'
  | 'pausa'
  | 'suspeita'
  | 'sem_registro'
  | 'ia';

export type PontoAlert = {
  id: string;
  title: string;
  message: string;
  priority: PontoAlertPriority;
  category: PontoAlertCategory;
  timestamp: string;
};

export type PontoInsight = {
  id: string;
  title: string;
  detail: string;
  tone: 'risk' | 'info' | 'success';
};

export type PontoLiveStats = {
  registrosHoje: number;
  onlineAgora: number;
  atrasos: number;
  foraArea: number;
  bancoHorasEst: string;
  alertasAtivos: number;
};

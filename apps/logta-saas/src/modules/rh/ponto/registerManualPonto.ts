import { mergeProfileFromPontoRecord } from './colaboradorRhStorage';
import type { ColaboradorRhProfile } from './colaboradorRhStorage';
import { validatePontoRecord } from './pontoIntelligence';
import {
  appendPontoRecord,
  createDefaultPontoConfig,
  loadPontoConfig,
  loadPontoRecords,
} from './pontoStorage';
import type { PontoConfig, PontoRecord, PontoRecordType } from './types';

export type ManualPontoOrigem = 'rh_manual' | 'rh_offline';

export type ManualPontoInput = {
  type: PontoRecordType;
  /** ISO ou valor de input datetime-local */
  timestamp: string;
  motivo?: string;
  origem: ManualPontoOrigem;
};

export function registerManualPontoForColaborador(
  companyId: string,
  profile: ColaboradorRhProfile,
  input: ManualPontoInput,
  config?: PontoConfig | null,
): PontoRecord {
  const cfg = config ?? loadPontoConfig(companyId) ?? createDefaultPontoConfig(companyId);
  const doc = (profile.document ?? '').replace(/\D/g, '') || profile.id.replace(/^colab-/, '');
  const records = loadPontoRecords(companyId);
  const ts = new Date(input.timestamp);
  if (Number.isNaN(ts.getTime())) {
    throw new Error('Data e hora da batida inválidas.');
  }

  const deviceInfo =
    input.origem === 'rh_offline'
      ? 'RH · batida manual (celular do colaborador offline)'
      : 'RH · batida manual pelo gestor';

  const validation = validatePontoRecord(cfg, records, {
    collaboratorDocument: doc,
    type: input.type,
    deviceInfo,
  });

  const flags = [
    ...validation.flags,
    input.origem === 'rh_offline' ? 'celular_offline' : 'rh_manual',
  ];
  const motivo = input.motivo?.trim();
  if (motivo) flags.push(`motivo_rh:${motivo.slice(0, 48)}`);

  const record: PontoRecord = {
    id: `pr-manual-${Date.now()}`,
    companyId,
    configId: cfg.id,
    collaboratorId: profile.id,
    collaboratorName: profile.fullName,
    collaboratorDocument: doc || profile.document,
    type: input.type,
    timestamp: ts.toISOString(),
    deviceInfo,
    validated: true,
    flags,
  };

  appendPontoRecord(companyId, record);
  mergeProfileFromPontoRecord(companyId, record);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('logta-operational-sync'));
    window.dispatchEvent(new CustomEvent('logta-rh-team-updated'));
  }

  return record;
}

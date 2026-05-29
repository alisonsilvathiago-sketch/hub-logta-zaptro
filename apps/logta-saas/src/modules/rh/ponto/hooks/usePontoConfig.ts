import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveDemoCompanyId } from '../../../../lib/seed';
import {
  appendPontoRecord,
  loadPontoConfig,
  loadPontoRecords,
  savePontoConfig,
} from '../pontoStorage';
import {
  buildPontoAlerts,
  buildPontoInsights,
  computeLiveStats,
} from '../pontoIntelligence';
import type { PontoConfig, PontoRecord } from '../types';

export function usePontoConfig(companyId: string | undefined) {
  const cid = resolveDemoCompanyId(companyId);
  const [config, setConfig] = useState<PontoConfig | null>(null);
  const [records, setRecords] = useState<PontoRecord[]>([]);

  useEffect(() => {
    setConfig(loadPontoConfig(cid));
    setRecords(loadPontoRecords(cid));
  }, [cid]);

  const persistConfig = useCallback(
    (patch: Partial<PontoConfig> | ((prev: PontoConfig) => PontoConfig)) => {
      if (!config) return;
      const next =
        typeof patch === 'function'
          ? savePontoConfig(patch(config))
          : savePontoConfig({ ...config, ...patch });
      setConfig(next);
      return next;
    },
    [config],
  );

  const activateConfig = useCallback(() => {
    if (!config) return;
    const mode = config.registrationMode;
    return persistConfig({
      isActive: true,
      activatedAt: new Date().toISOString(),
      qrEnabled: mode === 'qr' || mode === 'both',
      linkEnabled: mode === 'link' || mode === 'both',
    });
  }, [config, persistConfig]);

  const deactivateConfig = useCallback(() => {
    if (!config) return;
    return persistConfig({ isActive: false });
  }, [config, persistConfig]);

  const refreshRecords = useCallback(() => {
    setRecords(loadPontoRecords(cid));
  }, [cid]);

  const addRecord = useCallback(
    (record: PontoRecord) => {
      const next = appendPontoRecord(cid, record);
      setRecords(next);
    },
    [cid],
  );

  const alerts = useMemo(
    () => (config ? buildPontoAlerts(config, records) : []),
    [config, records],
  );
  const insights = useMemo(
    () => (config ? buildPontoInsights(config, records) : []),
    [config, records],
  );
  const stats = useMemo(() => computeLiveStats(records, alerts), [records, alerts]);

  return {
    config,
    records,
    alerts,
    insights,
    stats,
    persistConfig,
    activateConfig,
    deactivateConfig,
    refreshRecords,
    addRecord,
    setConfig,
    companyId: cid,
  };
}

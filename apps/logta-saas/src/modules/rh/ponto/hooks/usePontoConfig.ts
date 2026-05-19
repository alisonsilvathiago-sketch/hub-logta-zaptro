import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [config, setConfig] = useState<PontoConfig | null>(null);
  const [records, setRecords] = useState<PontoRecord[]>([]);

  useEffect(() => {
    if (!companyId) return;
    setConfig(loadPontoConfig(companyId));
    setRecords(loadPontoRecords(companyId));
  }, [companyId]);

  const persistConfig = useCallback(
    (patch: Partial<PontoConfig> | ((prev: PontoConfig) => PontoConfig)) => {
      if (!companyId || !config) return;
      const next =
        typeof patch === 'function'
          ? savePontoConfig(patch(config))
          : savePontoConfig({ ...config, ...patch });
      setConfig(next);
      return next;
    },
    [companyId, config],
  );

  const refreshRecords = useCallback(() => {
    if (!companyId) return;
    setRecords(loadPontoRecords(companyId));
  }, [companyId]);

  const addRecord = useCallback(
    (record: PontoRecord) => {
      if (!companyId) return;
      const next = appendPontoRecord(companyId, record);
      setRecords(next);
    },
    [companyId],
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
    refreshRecords,
    addRecord,
    setConfig,
  };
}

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  buildFiscalAlerts,
  buildFiscalInsights,
  defaultFiscalStats,
  getFiscalMonitoringStatus,
  sortFiscalAlerts,
} from '../fiscalIntelligence';
import type { FiscalAlert, FiscalDocStats, FiscalIaInsight } from '../types';

const DISMISS_KEY = 'logta-fiscal-dismissed';

type FiscalIntelligenceContextValue = {
  stats: FiscalDocStats;
  alerts: FiscalAlert[];
  activeAlerts: FiscalAlert[];
  insights: FiscalIaInsight[];
  monitoring: ReturnType<typeof getFiscalMonitoringStatus>;
  popupAlert: FiscalAlert | null;
  openPopup: (alert: FiscalAlert) => void;
  closePopup: () => void;
  dismissAlert: (id: string) => void;
  refreshIntelligence: () => void;
};

const FiscalIntelligenceContext = createContext<FiscalIntelligenceContextValue | null>(null);

function loadDismissed() {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

function saveDismissed(set: Set<string>) {
  try {
    sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export function FiscalIntelligenceProvider({
  children,
  stats = defaultFiscalStats,
  autoPopup: _autoPopup = false,
}: {
  children: React.ReactNode;
  stats?: FiscalDocStats;
  /** @deprecated Popups centrais descontinuados — use FiscalAlertsInlinePanel */
  autoPopup?: boolean;
}) {
  const [dismissed, setDismissed] = useState(loadDismissed);
  const [popupAlert, setPopupAlert] = useState<FiscalAlert | null>(null);
  const [tick, setTick] = useState(0);

  const alerts = useMemo(() => sortFiscalAlerts(buildFiscalAlerts(stats)), [stats, tick]);
  const activeAlerts = useMemo(() => alerts.filter((a) => !dismissed.has(a.id)), [alerts, dismissed]);
  const insights = useMemo(() => buildFiscalInsights(stats, alerts), [stats, alerts]);
  const monitoring = useMemo(() => getFiscalMonitoringStatus(activeAlerts), [activeAlerts]);

  const refreshIntelligence = useCallback(() => setTick((n) => n + 1), []);

  const dismissAlert = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
    setPopupAlert(null);
  }, []);

  const value: FiscalIntelligenceContextValue = {
    stats,
    alerts,
    activeAlerts,
    insights,
    monitoring,
    popupAlert,
    openPopup: () => {
      /* Popups centrais descontinuados — use FiscalAlertsInlinePanel */
    },
    closePopup: () => setPopupAlert(null),
    dismissAlert,
    refreshIntelligence,
  };

  return <FiscalIntelligenceContext.Provider value={value}>{children}</FiscalIntelligenceContext.Provider>;
}

export function useFiscalIntelligence() {
  const ctx = useContext(FiscalIntelligenceContext);
  if (!ctx) throw new Error('useFiscalIntelligence must be used within FiscalIntelligenceProvider');
  return ctx;
}

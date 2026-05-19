import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  buildFrotaAlerts,
  buildFrotaInsights,
  getFrotaMonitoringStatus,
  sortFrotaAlerts,
} from '../frotaIntelligence';
import type { FrotaAlert, FrotaIaInsight, FrotaVehicleRow } from '../types';

const DISMISS_KEY = 'logta-frota-dismissed';

type FrotaIntelligenceContextValue = {
  alerts: FrotaAlert[];
  activeAlerts: FrotaAlert[];
  insights: FrotaIaInsight[];
  monitoring: ReturnType<typeof getFrotaMonitoringStatus>;
  popupAlert: FrotaAlert | null;
  openPopup: (alert: FrotaAlert) => void;
  closePopup: () => void;
  dismissAlert: (id: string) => void;
  refreshIntelligence: () => void;
};

const FrotaIntelligenceContext = createContext<FrotaIntelligenceContextValue | null>(null);

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

export function FrotaIntelligenceProvider({
  children,
  vehicles,
  autoPopup = false,
}: {
  children: React.ReactNode;
  vehicles: FrotaVehicleRow[];
  autoPopup?: boolean;
}) {
  const [dismissed, setDismissed] = useState(loadDismissed);
  const [popupAlert, setPopupAlert] = useState<FrotaAlert | null>(null);
  const [tick, setTick] = useState(0);

  const alerts = useMemo(() => sortFrotaAlerts(buildFrotaAlerts(vehicles)), [vehicles, tick]);
  const activeAlerts = useMemo(() => alerts.filter((a) => !dismissed.has(a.id)), [alerts, dismissed]);
  const insights = useMemo(() => buildFrotaInsights(vehicles, alerts), [vehicles, alerts]);
  const monitoring = useMemo(() => getFrotaMonitoringStatus(activeAlerts), [activeAlerts]);

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

  const value: FrotaIntelligenceContextValue = {
    alerts,
    activeAlerts,
    insights,
    monitoring,
    popupAlert,
    openPopup: () => {
      /* Popups centrais descontinuados — use FrotaAlertsInlinePanel */
    },
    closePopup: () => setPopupAlert(null),
    dismissAlert,
    refreshIntelligence,
  };

  return <FrotaIntelligenceContext.Provider value={value}>{children}</FrotaIntelligenceContext.Provider>;
}

export function useFrotaIntelligence() {
  const ctx = useContext(FrotaIntelligenceContext);
  if (!ctx) throw new Error('useFrotaIntelligence must be used within FrotaIntelligenceProvider');
  return ctx;
}

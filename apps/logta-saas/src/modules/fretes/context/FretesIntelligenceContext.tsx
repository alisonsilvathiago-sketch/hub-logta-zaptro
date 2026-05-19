import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildFretesAlerts, buildFretesIaInsights, getFretesMonitoringStatus, sortFretesAlerts } from '../fretesIntelligence';
import { computeFretesAnalytics } from '../fretesAnalytics';
import type { ShipmentNormalized, FretesAlert, FretesIaInsight } from '../types';

const DISMISS_KEY = 'logta-fretes-dismissed';

type FretesIntelligenceContextValue = {
  shipments: ShipmentNormalized[];
  alerts: FretesAlert[];
  activeAlerts: FretesAlert[];
  insights: FretesIaInsight[];
  analytics: ReturnType<typeof computeFretesAnalytics>;
  monitoring: ReturnType<typeof getFretesMonitoringStatus>;
  loading: boolean;
  popupAlert: FretesAlert | null;
  openPopup: (alert: FretesAlert) => void;
  closePopup: () => void;
  dismissAlert: (id: string) => void;
  refreshIntelligence: () => void;
  lastScanAt: Date | null;
};

const FretesIntelligenceContext = createContext<FretesIntelligenceContextValue | null>(null);

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

type ProviderProps = {
  children: React.ReactNode;
  shipments: ShipmentNormalized[];
  motoristas: { id: string; nome?: string; status?: string }[];
  vehicles: { id: string; plate?: string; status?: string }[];
  loading?: boolean;
  autoPopup?: boolean;
};

export function FretesIntelligenceProvider({
  children,
  shipments,
  motoristas,
  vehicles,
  loading = false,
  autoPopup = false,
}: ProviderProps) {
  const [dismissed, setDismissed] = useState(loadDismissed);
  const [popupAlert, setPopupAlert] = useState<FretesAlert | null>(null);
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null);
  const [scanTick, setScanTick] = useState(0);

  const alerts = useMemo(
    () => buildFretesAlerts({ shipments, motoristas, vehicles }),
    [shipments, motoristas, vehicles, scanTick],
  );

  const activeAlerts = useMemo(() => alerts.filter((a) => !dismissed.has(a.id)), [alerts, dismissed]);
  const analytics = useMemo(() => computeFretesAnalytics(shipments), [shipments]);
  const insights = useMemo(() => buildFretesIaInsights(shipments, alerts), [shipments, alerts]);
  const monitoring = useMemo(() => getFretesMonitoringStatus(activeAlerts), [activeAlerts]);

  const refreshIntelligence = useCallback(() => {
    setLastScanAt(new Date());
    setScanTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!loading) setLastScanAt(new Date());
  }, [loading, shipments]);

  useEffect(() => {
    const t = setInterval(refreshIntelligence, 60_000);
    return () => clearInterval(t);
  }, [refreshIntelligence]);

  const dismissAlert = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
    setPopupAlert(null);
  }, []);

  const value: FretesIntelligenceContextValue = {
    shipments,
    alerts,
    activeAlerts,
    insights,
    analytics,
    monitoring,
    loading,
    popupAlert,
    openPopup: () => {
      /* Popups centrais descontinuados — use FretesAlertsInlinePanel */
    },
    closePopup: () => setPopupAlert(null),
    dismissAlert,
    refreshIntelligence,
    lastScanAt,
  };

  return <FretesIntelligenceContext.Provider value={value}>{children}</FretesIntelligenceContext.Provider>;
}

export function useFretesIntelligence() {
  const ctx = useContext(FretesIntelligenceContext);
  if (!ctx) throw new Error('useFretesIntelligence must be used within FretesIntelligenceProvider');
  return ctx;
}

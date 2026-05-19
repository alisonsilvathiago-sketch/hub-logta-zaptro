import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  buildRoteirizacaoAlerts,
  buildRoteirizacaoIaInsights,
  getRoteirizacaoMonitoringStatus,
  sortRoteirizacaoAlerts,
} from '../roteirizacaoIntelligence';
import { buildActiveRoutesFromDeliveries, computeRoteirizacaoAnalytics } from '../roteirizacaoAnalytics';
import type { ActiveRouteNormalized, RouteDeliveryNormalized, RoteirizacaoAlert, RoteirizacaoIaInsight } from '../types';

const DISMISS_KEY = 'logta-roteirizacao-dismissed';

type RoteirizacaoIntelligenceContextValue = {
  deliveries: RouteDeliveryNormalized[];
  motoristas: { id: string; nome?: string; status?: string }[];
  vehicles: { id: string; plate?: string; status?: string; modelo?: string; capacidade?: number }[];
  activeRoutes: ActiveRouteNormalized[];
  alerts: RoteirizacaoAlert[];
  activeAlerts: RoteirizacaoAlert[];
  insights: RoteirizacaoIaInsight[];
  analytics: ReturnType<typeof computeRoteirizacaoAnalytics>;
  monitoring: ReturnType<typeof getRoteirizacaoMonitoringStatus>;
  loading: boolean;
  routeOptimized: boolean;
  setRouteOptimized: (v: boolean) => void;
  popupAlert: RoteirizacaoAlert | null;
  openPopup: (alert: RoteirizacaoAlert) => void;
  closePopup: () => void;
  dismissAlert: (id: string) => void;
  refreshIntelligence: () => void;
  lastScanAt: Date | null;
};

const RoteirizacaoIntelligenceContext = createContext<RoteirizacaoIntelligenceContextValue | null>(null);

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
  deliveries: RouteDeliveryNormalized[];
  motoristas: { id: string; nome?: string; status?: string }[];
  vehicles: { id: string; plate?: string; status?: string; modelo?: string; capacidade?: number }[];
  loading?: boolean;
  autoPopup?: boolean;
};

export function RoteirizacaoIntelligenceProvider({
  children,
  deliveries,
  motoristas,
  vehicles,
  loading = false,
  autoPopup = true,
}: ProviderProps) {
  const [dismissed, setDismissed] = useState(loadDismissed);
  const [popupAlert, setPopupAlert] = useState<RoteirizacaoAlert | null>(null);
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null);
  const [scanTick, setScanTick] = useState(0);
  const [routeOptimized, setRouteOptimized] = useState(false);

  const activeRoutes = useMemo(() => buildActiveRoutesFromDeliveries(deliveries), [deliveries]);

  const alerts = useMemo(
    () => buildRoteirizacaoAlerts({ deliveries, activeRoutes, routeOptimized, motoristas, vehicles }),
    [deliveries, activeRoutes, routeOptimized, motoristas, vehicles, scanTick],
  );

  const activeAlerts = useMemo(() => alerts.filter((a) => !dismissed.has(a.id)), [alerts, dismissed]);
  const analytics = useMemo(
    () => computeRoteirizacaoAnalytics(deliveries, activeRoutes, routeOptimized),
    [deliveries, activeRoutes, routeOptimized],
  );
  const insights = useMemo(
    () => buildRoteirizacaoIaInsights(deliveries, activeRoutes, alerts, routeOptimized),
    [deliveries, activeRoutes, alerts, routeOptimized],
  );
  const monitoring = useMemo(() => getRoteirizacaoMonitoringStatus(activeAlerts), [activeAlerts]);

  const refreshIntelligence = useCallback(() => {
    setLastScanAt(new Date());
    setScanTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!loading) setLastScanAt(new Date());
  }, [loading, deliveries]);

  useEffect(() => {
    const t = setInterval(refreshIntelligence, 60_000);
    return () => clearInterval(t);
  }, [refreshIntelligence]);

  useEffect(() => {
    if (!autoPopup || loading || popupAlert) return;
    const critical = activeAlerts.filter((a) => a.priority === 'critical' || a.priority === 'high');
    if (critical.length > 0) {
      const timer = setTimeout(() => setPopupAlert(critical[0]), 900);
      return () => clearTimeout(timer);
    }
  }, [autoPopup, loading, activeAlerts, popupAlert]);

  const dismissAlert = useCallback(
    (id: string) => {
      setDismissed((prev) => {
        const next = new Set(prev);
        next.add(id);
        saveDismissed(next);
        return next;
      });
      setPopupAlert(null);
      setTimeout(() => {
        const next = sortRoteirizacaoAlerts(alerts.filter((a) => !dismissed.has(a.id) && a.id !== id));
        const n = next.find((a) => a.priority === 'critical' || a.priority === 'high');
        if (n) setPopupAlert(n);
      }, 300);
    },
    [alerts, dismissed],
  );

  const value: RoteirizacaoIntelligenceContextValue = {
    deliveries,
    motoristas,
    vehicles,
    activeRoutes,
    alerts,
    activeAlerts,
    insights,
    analytics,
    monitoring,
    loading,
    routeOptimized,
    setRouteOptimized,
    popupAlert,
    openPopup: setPopupAlert,
    closePopup: () => setPopupAlert(null),
    dismissAlert,
    refreshIntelligence,
    lastScanAt,
  };

  return <RoteirizacaoIntelligenceContext.Provider value={value}>{children}</RoteirizacaoIntelligenceContext.Provider>;
}

export function useRoteirizacaoIntelligence() {
  const ctx = useContext(RoteirizacaoIntelligenceContext);
  if (!ctx) throw new Error('useRoteirizacaoIntelligence must be used within RoteirizacaoIntelligenceProvider');
  return ctx;
}

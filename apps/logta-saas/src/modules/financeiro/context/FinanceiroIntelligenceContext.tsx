import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { TransactionRow } from '../financeiroAnalytics';
import {
  buildFinanceiroAlerts,
  buildFinanceiroIaInsights,
  getMonitoringStatus,
  sortFinanceiroAlerts,
  type FinanceiroAlert,
  type FinanceiroIaInsight,
  type MotoristaRow,
  type ShipmentRow,
} from '../financeiroIntelligence';
import { computeFinanceiroAnalytics } from '../financeiroAnalytics';

const DISMISS_KEY = 'logta-financeiro-dismissed';

type FinanceiroIntelligenceContextValue = {
  alerts: FinanceiroAlert[];
  activeAlerts: FinanceiroAlert[];
  insights: FinanceiroIaInsight[];
  analytics: ReturnType<typeof computeFinanceiroAnalytics>;
  monitoring: ReturnType<typeof getMonitoringStatus>;
  loading: boolean;
  popupAlert: FinanceiroAlert | null;
  openPopup: (alert: FinanceiroAlert) => void;
  closePopup: () => void;
  dismissAlert: (id: string) => void;
  showNextPopup: () => void;
  refreshIntelligence: () => void;
  lastScanAt: Date | null;
};

const FinanceiroIntelligenceContext = createContext<FinanceiroIntelligenceContextValue | null>(null);

function loadDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
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
  transactions: TransactionRow[];
  shipments: ShipmentRow[];
  motoristas: MotoristaRow[];
  loading?: boolean;
  autoPopup?: boolean;
};

export function FinanceiroIntelligenceProvider({
  children,
  transactions,
  shipments,
  motoristas,
  loading = false,
  autoPopup = false,
}: ProviderProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);
  const [popupAlert, setPopupAlert] = useState<FinanceiroAlert | null>(null);
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null);
  const [scanTick, setScanTick] = useState(0);

  const alerts = useMemo(
    () => buildFinanceiroAlerts({ transactions, shipments, motoristas }),
    [transactions, shipments, motoristas, scanTick],
  );

  const activeAlerts = useMemo(
    () => alerts.filter((a) => !dismissed.has(a.id)),
    [alerts, dismissed],
  );

  const analytics = useMemo(() => computeFinanceiroAnalytics(transactions), [transactions]);
  const insights = useMemo(() => buildFinanceiroIaInsights(transactions, alerts), [transactions, alerts]);
  const monitoring = useMemo(() => getMonitoringStatus(activeAlerts), [activeAlerts]);

  const refreshIntelligence = useCallback(() => {
    setLastScanAt(new Date());
    setScanTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!loading && transactions.length >= 0) {
      setLastScanAt(new Date());
    }
  }, [loading, transactions, shipments, motoristas]);

  useEffect(() => {
    const interval = setInterval(() => refreshIntelligence(), 60_000);
    return () => clearInterval(interval);
  }, [refreshIntelligence]);

  const showNextPopup = useCallback(() => {
    document.getElementById('logta-page-alerts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
    setPopupAlert(null);
  }, []);

  const value: FinanceiroIntelligenceContextValue = {
    alerts,
    activeAlerts,
    insights,
    analytics,
    monitoring,
    loading,
    popupAlert,
    openPopup: () => {
      document.getElementById('logta-page-alerts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    closePopup: () => setPopupAlert(null),
    dismissAlert,
    showNextPopup,
    refreshIntelligence,
    lastScanAt,
  };

  return (
    <FinanceiroIntelligenceContext.Provider value={value}>{children}</FinanceiroIntelligenceContext.Provider>
  );
}

export function useFinanceiroIntelligence() {
  const ctx = useContext(FinanceiroIntelligenceContext);
  if (!ctx) {
    throw new Error('useFinanceiroIntelligence must be used within FinanceiroIntelligenceProvider');
  }
  return ctx;
}

import { useEffect, useMemo, useState } from 'react';
import { buildAgendaAlerts, buildAgendaInsights } from '../agendaIntelligence';
import { loadAgendaPrefs, saveAgendaPrefs } from '../agendaStorage';
import type { AgendaEvent } from '../types';

export function useAgendaIntelligence(companyId: string | undefined, events: AgendaEvent[]) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (!companyId) return;
    setDismissed(loadAgendaPrefs(companyId).dismissedAlertIds);
  }, [companyId]);

  const alerts = useMemo(() => buildAgendaAlerts(events), [events]);
  const insights = useMemo(() => buildAgendaInsights(events), [events]);
  const activeAlerts = useMemo(
    () => alerts.filter((a) => !dismissed.includes(a.id)),
    [alerts, dismissed],
  );

  useEffect(() => {
    if (activeAlerts.length > 0) {
      const t = window.setTimeout(() => setPopupOpen(true), 1200);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [activeAlerts.length]);

  const dismissAlert = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    if (companyId) saveAgendaPrefs(companyId, { hiddenCalendars: [], dismissedAlertIds: next });
  };

  return {
    alerts: activeAlerts,
    insights,
    popupOpen,
    setPopupOpen,
    dismissAlert,
  };
}

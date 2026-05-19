import type { AgendaEvent } from './types';

const MANUAL_KEY = 'logta-agenda-manual';
const PREFS_KEY = 'logta-agenda-prefs';

export type AgendaPrefs = {
  hiddenCalendars: string[];
  dismissedAlertIds: string[];
};

export function loadManualAgendaEvents(companyId: string): AgendaEvent[] {
  try {
    const raw = localStorage.getItem(`${MANUAL_KEY}:${companyId}`);
    if (!raw) return [];
    return JSON.parse(raw) as AgendaEvent[];
  } catch {
    return [];
  }
}

export function saveManualAgendaEvents(companyId: string, events: AgendaEvent[]) {
  localStorage.setItem(`${MANUAL_KEY}:${companyId}`, JSON.stringify(events.slice(0, 200)));
}

export function addManualAgendaEvent(companyId: string, event: AgendaEvent) {
  const list = loadManualAgendaEvents(companyId);
  list.unshift(event);
  saveManualAgendaEvents(companyId, list);
}

export function loadAgendaPrefs(companyId: string): AgendaPrefs {
  try {
    const raw = localStorage.getItem(`${PREFS_KEY}:${companyId}`);
    if (!raw) return { hiddenCalendars: [], dismissedAlertIds: [] };
    return JSON.parse(raw) as AgendaPrefs;
  } catch {
    return { hiddenCalendars: [], dismissedAlertIds: [] };
  }
}

export function saveAgendaPrefs(companyId: string, prefs: AgendaPrefs) {
  localStorage.setItem(`${PREFS_KEY}:${companyId}`, JSON.stringify(prefs));
}

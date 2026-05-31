/** Eventos que sincronizam telas com localStorage / filas demo. */
export const LOGSTOKA_SYSTEM_EVENTS = [
  'logstoka:system-pulse',
  'logstoka:picking-session-updated',
  'logstoka:demo-movements-updated',
  'logstoka:activity-recorded',
] as const;

export type SystemPulseResult = {
  release: string;
  timestamp: string;
};

/**
 * Dispara um “choque” global: todas as telas que escutam estes eventos recarregam estado.
 * Opcionalmente força reload completo do browser (útil após deploy ou cache teimoso).
 */
export function pulseLogstokaSystem(opts?: { hardReload?: boolean }): SystemPulseResult {
  const timestamp = new Date().toISOString();
  const release = typeof __APP_RELEASE__ !== 'undefined' ? __APP_RELEASE__ : 'dev';

  for (const name of LOGSTOKA_SYSTEM_EVENTS) {
    window.dispatchEvent(new CustomEvent(name, { detail: { release, timestamp } }));
  }

  if (opts?.hardReload) {
    window.setTimeout(() => window.location.reload(), 120);
  }

  return { release, timestamp };
}

export function formatReleaseLabel(release: string): string {
  if (release.startsWith('local-')) {
    return release.replace('local-', '').replace('T', ' ').slice(0, 16);
  }
  return release.slice(0, 12);
}

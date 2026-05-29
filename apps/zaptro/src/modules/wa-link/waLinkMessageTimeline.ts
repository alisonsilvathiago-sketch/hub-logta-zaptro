import type { WaLinkMessage } from './useWaLinkInbox';

export type WaLinkTimelineItem =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'message'; key: string; message: WaLinkMessage };

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Rótulo de dia no estilo WhatsApp (Hoje, Ontem, sábado, 26/04/2026). */
export function formatWaLinkDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (sameCalendarDay(d, now)) return 'Hoje';
  if (sameCalendarDay(d, yesterday)) return 'Ontem';

  const diffMs = now.getTime() - d.getTime();
  const sixDays = 6 * 24 * 60 * 60 * 1000;
  if (diffMs > 0 && diffMs < sixDays) {
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function buildWaLinkMessageTimeline(messages: WaLinkMessage[]): WaLinkTimelineItem[] {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const items: WaLinkTimelineItem[] = [];
  let lastDay = '';

  for (const m of sorted) {
    const createdAt = typeof m.created_at === 'string' ? m.created_at : '';
    const day = createdAt.length >= 10 ? createdAt.slice(0, 10) : 'unknown';
    if (day !== lastDay) {
      items.push({
        kind: 'date',
        key: `date-${day}-${items.length}`,
        label: createdAt ? formatWaLinkDayLabel(createdAt) : '—',
      });
      lastDay = day;
    }
    items.push({ kind: 'message', key: m.id || `msg-${items.length}`, message: m });
  }

  return items;
}

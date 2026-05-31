export type DateRangePreset =
  | 'today'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'custom';

export type TableDateRange = {
  from: Date | null;
  to: Date | null;
  preset?: DateRangePreset | null;
};

export const DATE_RANGE_PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Hoje',
  this_week: 'Esta semana',
  last_week: 'Semana passada',
  this_month: 'Este mês',
  last_month: 'Mês passado',
  custom: 'Período customizado',
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}

function endOfWeek(d: Date): Date {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 6);
  return endOfDay(x);
}

function startOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

function endOfMonth(d: Date): Date {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function getDateRangeFromPreset(preset: DateRangePreset, ref = new Date()): { from: Date; to: Date } {
  const now = ref;
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'this_week':
      return { from: startOfWeek(now), to: endOfWeek(now) };
    case 'last_week': {
      const last = new Date(now);
      last.setDate(last.getDate() - 7);
      return { from: startOfWeek(last), to: endOfWeek(last) };
    }
    case 'this_month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'last_month': {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: startOfMonth(last), to: endOfMonth(last) };
    }
    default:
      return { from: startOfDay(now), to: endOfDay(now) };
  }
}

export function formatDateRangeLabel(range: TableDateRange): string | null {
  if (!range.from && !range.to) return null;
  if (range.preset && range.preset !== 'custom') {
    return DATE_RANGE_PRESET_LABELS[range.preset];
  }
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  if (range.from && range.to) return `${fmt(range.from)} — ${fmt(range.to)}`;
  if (range.from) return `A partir de ${fmt(range.from)}`;
  if (range.to) return `Até ${fmt(range.to)}`;
  return null;
}

export function matchesDateRange(value: string | Date | null | undefined, range: TableDateRange): boolean {
  if (!range.from && !range.to) return true;
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}

export function emptyDateRange(): TableDateRange {
  return { from: null, to: null, preset: null };
}

export function isDateRangeActive(range: TableDateRange): boolean {
  return Boolean(range.from || range.to);
}

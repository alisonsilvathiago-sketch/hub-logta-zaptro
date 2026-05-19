export type CalcLine = { label: string; value: number };
export type CalcTabId = 'frete' | 'lucro' | 'combustivel' | 'operacional';

export type CalculatorSnapshot = {
  id: string;
  token: string;
  title: string;
  tab: CalcTabId;
  lines: CalcLine[];
  total: number;
  createdAt: string;
  createdBy?: string;
};

const HISTORY_KEY = 'logta-calc-history';
const SHARE_PREFIX = 'logta-calc-share';

function shareKey(token: string) {
  return `${SHARE_PREFIX}:${token}`;
}

export function loadCalculatorHistory(): CalculatorSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as CalculatorSnapshot[];
  } catch {
    return [];
  }
}

export function saveCalculatorHistory(list: CalculatorSnapshot[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 40)));
}

export function appendCalculatorSnapshot(snapshot: Omit<CalculatorSnapshot, 'id' | 'token' | 'createdAt'>) {
  const entry: CalculatorSnapshot = {
    ...snapshot,
    id: `calc-${Date.now()}`,
    token: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const list = [entry, ...loadCalculatorHistory()];
  saveCalculatorHistory(list);
  localStorage.setItem(shareKey(entry.token), JSON.stringify(entry));
  return entry;
}

export function loadSharedCalculator(token: string): CalculatorSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(shareKey(token));
    return raw ? (JSON.parse(raw) as CalculatorSnapshot) : null;
  } catch {
    return null;
  }
}

export function calculatorPublicUrl(token: string) {
  if (typeof window === 'undefined') return `/calc/${token}`;
  return `${window.location.origin}/calc/${token}`;
}

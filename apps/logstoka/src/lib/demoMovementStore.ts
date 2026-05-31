import type { DemoMovementRow } from '@/lib/logstokaDemoSeed';
import { DEMO_MOVEMENTS } from '@/lib/logstokaDemoSeed';

const STORAGE_PREFIX = 'logstoka-demo-movements:';

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}${companyId}`;
}

function readExtra(companyId: string): DemoMovementRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    return raw ? (JSON.parse(raw) as DemoMovementRow[]) : [];
  } catch {
    return [];
  }
}

function writeExtra(companyId: string, rows: DemoMovementRow[]): void {
  try {
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent('logstoka:demo-movements-updated'));
  } catch {
    /* ignore */
  }
}

export function loadMergedDemoMovements(companyId: string | null): DemoMovementRow[] {
  const base = [...DEMO_MOVEMENTS];
  if (!companyId || typeof window === 'undefined') return base;
  const extra = readExtra(companyId);
  return [...extra, ...base].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function appendDemoMovements(companyId: string, rows: DemoMovementRow[]): void {
  writeExtra(companyId, [...rows, ...readExtra(companyId)]);
}

export function updateDemoMovement(companyId: string, id: string, patch: Partial<DemoMovementRow>): void {
  const extra = readExtra(companyId);
  const inExtra = extra.some((m) => m.id === id);
  if (inExtra) {
    writeExtra(
      companyId,
      extra.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
    return;
  }
  const base = DEMO_MOVEMENTS.find((m) => m.id === id);
  if (!base) return;
  writeExtra(companyId, [{ ...base, ...patch, id: `${id}-edit-${Date.now()}` }, ...extra]);
}

export function removeDemoMovement(companyId: string, id: string): void {
  const extra = readExtra(companyId);
  if (extra.some((m) => m.id === id)) {
    writeExtra(
      companyId,
      extra.filter((m) => m.id !== id),
    );
  }
}

export function isSameDay(iso: string, ref = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function findTodayEntryBySku(movements: DemoMovementRow[], sku: string): DemoMovementRow | undefined {
  return movements.find(
    (m) => m.movement_type === 'entry' && m.sku === sku && isSameDay(m.created_at),
  );
}

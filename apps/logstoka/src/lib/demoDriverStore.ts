import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_DRIVERS, type DemoDriver } from '@/lib/logstokaDemoSeed';

const STORAGE_PREFIX = 'logstoka-demo-drivers:';

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}${companyId}`;
}

function readExtra(companyId: string): DemoDriver[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    return raw ? (JSON.parse(raw) as DemoDriver[]) : [];
  } catch {
    return [];
  }
}

function writeExtra(companyId: string, rows: DemoDriver[]): void {
  try {
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent('logstoka:demo-drivers-updated'));
  } catch {
    /* ignore */
  }
}

export function loadMergedDemoDrivers(companyId: string | null): DemoDriver[] {
  const base = companyId && isLogstokaDemoCompany(companyId) ? [...DEMO_DRIVERS] : [];
  if (!companyId || typeof window === 'undefined') return base;
  const extra = readExtra(companyId);
  const byId = new Map<string, DemoDriver>();
  for (const row of base) byId.set(row.id, row);
  for (const row of extra) byId.set(row.id, row);
  return [...byId.values()].sort(
    (a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime(),
  );
}

export function getDemoDriverById(companyId: string | null, driverId: string): DemoDriver | null {
  return loadMergedDemoDrivers(companyId).find((d) => d.id === driverId) ?? null;
}

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Busca empresa-wide — CPF, CNPJ, nome ou transportadora. */
export function searchDemoDrivers(companyId: string | null, query: string, limit = 8): DemoDriver[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const qDigits = normalizeDigits(q);
  return loadMergedDemoDrivers(companyId)
    .filter((driver) => {
      const haystack = [
        driver.full_name,
        driver.company_name,
        driver.cpf,
        driver.company_cnpj,
        driver.phone ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (haystack.includes(q)) return true;
      if (qDigits.length >= 3) {
        const cpf = normalizeDigits(driver.cpf);
        const cnpj = normalizeDigits(driver.company_cnpj);
        return cpf.includes(qDigits) || cnpj.includes(qDigits);
      }
      return false;
    })
    .slice(0, limit);
}

export type UpsertDriverDraft = {
  full_name: string;
  cpf: string;
  company_name: string;
  company_cnpj: string;
  phone?: string | null;
  warehouse_id?: string;
};

export function upsertDemoDriver(companyId: string, draft: UpsertDriverDraft): DemoDriver {
  const cpfDigits = normalizeDigits(draft.cpf);
  const cnpjDigits = normalizeDigits(draft.company_cnpj);
  const now = new Date().toISOString();
  const merged = loadMergedDemoDrivers(companyId);
  const existing = merged.find(
    (d) =>
      (cpfDigits.length >= 11 && normalizeDigits(d.cpf) === cpfDigits) ||
      (d.full_name.toLowerCase() === draft.full_name.trim().toLowerCase() &&
        normalizeDigits(d.company_cnpj) === cnpjDigits &&
        cnpjDigits.length >= 14),
  );

  if (existing) {
    const warehouseIds = new Set(existing.warehouse_ids);
    if (draft.warehouse_id) warehouseIds.add(draft.warehouse_id);
    const updated: DemoDriver = {
      ...existing,
      full_name: draft.full_name.trim() || existing.full_name,
      cpf: draft.cpf.trim() || existing.cpf,
      company_name: draft.company_name.trim() || existing.company_name,
      company_cnpj: draft.company_cnpj.trim() || existing.company_cnpj,
      phone: draft.phone?.trim() || existing.phone,
      last_seen_at: now,
      warehouse_ids: [...warehouseIds],
      total_visits: existing.total_visits + 1,
    };
    const extra = readExtra(companyId).filter((d) => d.id !== existing.id);
    if (DEMO_DRIVERS.some((d) => d.id === existing.id)) {
      writeExtra(companyId, [updated, ...extra.filter((d) => d.id !== existing.id)]);
    } else {
      writeExtra(companyId, [updated, ...extra]);
    }
    return updated;
  }

  const row: DemoDriver = {
    id: `drv-${Date.now()}`,
    full_name: draft.full_name.trim(),
    cpf: draft.cpf.trim(),
    company_name: draft.company_name.trim(),
    company_cnpj: draft.company_cnpj.trim(),
    phone: draft.phone?.trim() || null,
    first_seen_at: now,
    last_seen_at: now,
    warehouse_ids: draft.warehouse_id ? [draft.warehouse_id] : [],
    total_visits: 1,
  };
  writeExtra(companyId, [row, ...readExtra(companyId)]);
  return row;
}

export function formatDriverCpf(cpf: string): string {
  const d = normalizeDigits(cpf);
  if (d.length !== 11) return cpf;
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatDriverCnpj(cnpj: string): string {
  const d = normalizeDigits(cnpj);
  if (d.length !== 14) return cnpj;
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

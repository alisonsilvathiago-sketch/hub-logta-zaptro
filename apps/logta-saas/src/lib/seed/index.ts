import { LOGTA_DEMO_COMPANY_ID, LOGTA_SANDBOX_FLAG, LOGTA_SANDBOX_VERSION } from './constants';
import {
  getSandboxOperationalBundle,
  buildSandboxCteList,
  buildSandboxMdfeList,
  buildSandboxFiscalStats,
  buildSandboxLeads,
  buildSandboxClients,
  getSandboxClientProfile,
  resolveColaboradorIdByOwnerName,
  getColaboradorCrmPortfolio,
  getOwnerNameByColaboradorId,
  SANDBOX_COMPANY,
} from './logtaSandboxData';
import {
  savePontoRecords,
  loadPontoRecords,
  savePontoConfig,
  loadPontoConfig,
  createDefaultPontoConfig,
} from '../../modules/rh/ponto/pontoStorage';
import { saveColaboradorProfile } from '../../modules/rh/ponto/colaboradorRhStorage';

export {
  LOGTA_DEMO_COMPANY_ID,
  LOGTA_SANDBOX_FLAG,
  LOGTA_SANDBOX_VERSION,
  getSandboxOperationalBundle,
  buildSandboxCteList,
  buildSandboxMdfeList,
  buildSandboxFiscalStats,
  buildSandboxLeads,
  buildSandboxClients,
  getSandboxClientProfile,
  resolveColaboradorIdByOwnerName,
  getColaboradorCrmPortfolio,
  getOwnerNameByColaboradorId,
  SANDBOX_COMPANY,
};

/** Demo ativo em dev ou quando explicitamente ligado / sessão mock. */
export function shouldUseLogtaSandbox(): boolean {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.VITE_LOGTA_DEMO === '0') return false;
  if (import.meta.env.VITE_LOGTA_DEMO === '1') return true;
  if (sessionStorage.getItem('logta-session-boot') === '1') return true;
  if (import.meta.env.DEV) return true;
  return false;
}

export function resolveDemoCompanyId(companyId?: string) {
  return companyId || LOGTA_DEMO_COMPANY_ID;
}

function mergeById<T extends { id: string }>(db: T[], sandbox: T[], minCount = 2): T[] {
  if (db.length >= minCount) return db;
  const ids = new Set(db.map((x) => x.id));
  return [...db, ...sandbox.filter((x) => !ids.has(x.id))];
}

export function mergeOperationalWithSandbox<T extends { id: string }>(
  db: T[],
  sandbox: T[],
  minCount = 2,
): T[] {
  if (!shouldUseLogtaSandbox()) return db;
  return mergeById(db, sandbox, minCount);
}

export function seedLocalSandboxModules(companyId: string) {
  if (typeof window === 'undefined') return;
  const flag = `${LOGTA_SANDBOX_FLAG}:${companyId}`;
  if (localStorage.getItem(flag) === '1') return;

  const bundle = getSandboxOperationalBundle(companyId);

  const existingPonto = loadPontoRecords(companyId);
  if (existingPonto.length < 5) {
    savePontoRecords(companyId, bundle.pontoRecords);
  }

  let cfg = loadPontoConfig(companyId);
  if (!cfg || cfg.companyId !== companyId) {
    cfg = createDefaultPontoConfig(companyId, 'Matriz São Paulo — Demo');
    savePontoConfig(cfg);
  }

  bundle.colaboradorProfiles.forEach((p) => saveColaboradorProfile(p));

  localStorage.setItem(flag, '1');
  window.dispatchEvent(new CustomEvent('logta-operational-sync'));
}

export function getSandboxCrmLeads(companyId: string) {
  return getSandboxOperationalBundle(companyId).leads;
}

export function getSandboxCrmClients(companyId: string) {
  return getSandboxOperationalBundle(companyId).clients;
}

export function getSandboxFiscalDocuments(companyId: string) {
  const b = getSandboxOperationalBundle(companyId);
  return { cteList: b.cteList, mdfeList: b.mdfeList, fiscalStats: b.fiscalStats };
}

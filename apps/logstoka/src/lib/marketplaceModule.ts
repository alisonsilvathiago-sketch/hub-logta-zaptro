import { loadOperationalProfile, type OperationalProfileConfig } from '@/lib/operationalProfile';
import { can } from '@/lib/permissions';

export type MarketplaceModuleConfig = {
  active: boolean;
  activatedAt?: string;
};

const STORAGE_PREFIX = 'logstoka-marketplace-module';
export const MARKETPLACE_MODULE_CHANGED_EVENT = 'logstoka:marketplace-module-changed';

function storageKey(companyId: string): string {
  return `${STORAGE_PREFIX}:${companyId}`;
}

export function loadMarketplaceModuleConfig(companyId: string | null): MarketplaceModuleConfig {
  if (!companyId || typeof window === 'undefined') return { active: false };
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    if (!raw) return { active: false };
    const parsed = JSON.parse(raw) as Partial<MarketplaceModuleConfig>;
    return { active: Boolean(parsed.active), activatedAt: parsed.activatedAt };
  } catch {
    return { active: false };
  }
}

export function saveMarketplaceModuleConfig(companyId: string, config: MarketplaceModuleConfig): void {
  try {
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(MARKETPLACE_MODULE_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

/** Módulo ativo quando o tenant está em modo full ou quando foi activado manualmente. */
export function isMarketplaceModuleActive(
  companyId: string | null,
  operationalProfile?: OperationalProfileConfig,
): boolean {
  const profile = operationalProfile ?? loadOperationalProfile(companyId);
  if (profile.mode === 'full') return true;
  return loadMarketplaceModuleConfig(companyId).active;
}

export function activateMarketplaceModule(companyId: string | null): void {
  if (!companyId) return;
  saveMarketplaceModuleConfig(companyId, {
    active: true,
    activatedAt: new Date().toISOString(),
  });
}

export function deactivateMarketplaceModule(companyId: string | null): void {
  if (!companyId) return;
  saveMarketplaceModuleConfig(companyId, { active: false });
}

/** Marketplace visível na navegação — administrador/gestor ou módulo activado em modo estoque. */
export function canViewMarketplaceNav(
  profileRole?: string | null,
  companyId?: string | null,
  operationalProfile?: OperationalProfileConfig,
): boolean {
  if (!can('integrations.read', profileRole)) return false;
  const profile = operationalProfile ?? loadOperationalProfile(companyId ?? null);
  if (profile.mode === 'full') return true;
  return loadMarketplaceModuleConfig(companyId ?? null).active;
}

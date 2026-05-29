/**
 * Contrato Hub Master ↔ LOGTA — planos, trial, IA, LogDrive, bloqueios.
 * Persistido no cliente LOGTA em localStorage; o Hub publica via postMessage (hub-bridge).
 */

export const LOGTA_ENTITLEMENTS_STORAGE_KEY = 'logta-hub-entitlements-v1';
export const LOGTA_ENTITLEMENTS_EVENT = 'logta-entitlements-updated';

export type BillingStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'none';

export type LogtaHubEntitlementsV1 = {
  version: 1;
  /** Chave estável (ex.: e-mail da empresa) para correlacionar com o Hub */
  tenantKey: string;
  billingStatus: BillingStatus;
  trialEndsAt: string | null;
  planId: string | null;
  ai: {
    enabled: boolean;
    creditsBalance: number;
    creditsMonthlyAllowance: number;
    /** consumo acumulado no mês (UI) */
    creditsUsedThisMonth: number;
    dailySoftLimit: number;
  };
  logdock: {
    enabled: boolean;
    usedBytes: number;
    limitBytes: number;
  };
  features: {
    premiumModules: boolean;
    automationPremium: boolean;
    integrations: boolean;
  };
  updatedAt: string;
};

export function defaultTrialEntitlements(tenantKey: string, trialEndsAt: string): LogtaHubEntitlementsV1 {
  const now = new Date().toISOString();
  return {
    version: 1,
    tenantKey,
    billingStatus: 'trial',
    trialEndsAt,
    planId: 'trial',
    ai: {
      enabled: true,
      creditsBalance: 120,
      creditsMonthlyAllowance: 500,
      creditsUsedThisMonth: 0,
      dailySoftLimit: 80,
    },
    logdock: {
      enabled: true,
      usedBytes: 0,
      limitBytes: 512 * 1024 * 1024,
    },
    features: {
      premiumModules: true,
      automationPremium: true,
      integrations: true,
    },
    updatedAt: now,
  };
}

export function expiredEntitlements(base: LogtaHubEntitlementsV1): LogtaHubEntitlementsV1 {
  const now = new Date().toISOString();
  return {
    ...base,
    billingStatus: 'expired',
    trialEndsAt: base.trialEndsAt,
    ai: {
      ...base.ai,
      enabled: false,
      creditsBalance: 0,
    },
    logdock: {
      ...base.logdock,
      enabled: false,
      limitBytes: Math.min(base.logdock.limitBytes, 50 * 1024 * 1024),
    },
    features: {
      premiumModules: false,
      automationPremium: false,
      integrations: false,
    },
    updatedAt: now,
  };
}

export function activePlanEntitlements(
  base: LogtaHubEntitlementsV1,
  planId: string,
): LogtaHubEntitlementsV1 {
  const now = new Date().toISOString();
  return {
    ...base,
    billingStatus: 'active',
    planId,
    ai: {
      enabled: true,
      creditsBalance: 5000,
      creditsMonthlyAllowance: 20000,
      creditsUsedThisMonth: base.ai.creditsUsedThisMonth,
      dailySoftLimit: 2000,
    },
    logdock: {
      enabled: true,
      usedBytes: base.logdock.usedBytes,
      limitBytes: 50 * 1024 * 1024 * 1024,
    },
    features: {
      premiumModules: true,
      automationPremium: true,
      integrations: true,
    },
    updatedAt: now,
  };
}

export function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (86400 * 1000));
}

export function isTrialExpired(e: LogtaHubEntitlementsV1): boolean {
  if (e.billingStatus === 'expired' || e.billingStatus === 'none') return true;
  if (e.billingStatus === 'active') return false;
  const left = trialDaysLeft(e.trialEndsAt);
  return left !== null && left <= 0;
}

export function shouldShowPaywall(e: LogtaHubEntitlementsV1): boolean {
  return isTrialExpired(e) && e.billingStatus !== 'active';
}

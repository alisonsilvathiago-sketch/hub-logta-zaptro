import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  LOGTA_ENTITLEMENTS_EVENT,
  defaultTrialEntitlements,
  expiredEntitlements,
  shouldShowPaywall,
  trialDaysLeft,
  type LogtaHubEntitlementsV1,
} from '@shared/lib/logtaEntitlementsContract';
import {
  loadLogtaEntitlementsFromStorage,
  saveLogtaEntitlementsToStorage,
} from '../lib/logtaEntitlementsClient';
import { loadOnboardingProfile } from '../lib/onboardingStorage';

type HubEntitlementsContextValue = {
  entitlements: LogtaHubEntitlementsV1 | null;
  loading: boolean;
  refresh: () => void;
  /** Trial / paywall helpers */
  trialDaysRemaining: number | null;
  paywallRequired: boolean;
  trialBannerMessage: string | null;
  /** IA */
  consumeAiCredits: (amount: number) => boolean;
  /** Hub publicou nova política (mesma aba) */
  applyRemoteEntitlements: (e: LogtaHubEntitlementsV1) => void;
};

const HubEntitlementsContext = createContext<HubEntitlementsContextValue | null>(null);

function mergeOnboardingFallback(): LogtaHubEntitlementsV1 | null {
  const o = loadOnboardingProfile();
  const email = o?.email?.trim() || 'logta@teste.com';
  const oneYearFromNow = new Date(Date.now() + 365 * 86400 * 1000).toISOString();
  return defaultTrialEntitlements(email.trim().toLowerCase(), oneYearFromNow);
}

function normalizeExpiry(e: LogtaHubEntitlementsV1): LogtaHubEntitlementsV1 {
  if (e.billingStatus === 'active' || e.billingStatus === 'past_due') return e;
  const left = trialDaysLeft(e.trialEndsAt);
  if (left === 0) return expiredEntitlements(e);
  return e;
}

export const HubEntitlementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entitlements, setEntitlements] = useState<LogtaHubEntitlementsV1 | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    let e = loadLogtaEntitlementsFromStorage();
    if (!e || e.billingStatus === 'expired' || e.ai.creditsBalance < 5) {
      e = mergeOnboardingFallback();
    }
    if (e) {
      const next = normalizeExpiry(e);
      if (
        next.billingStatus !== e.billingStatus ||
        next.ai.enabled !== e.ai.enabled ||
        next.logdock.enabled !== e.logdock.enabled
      ) {
        saveLogtaEntitlementsToStorage(next);
      }
      setEntitlements(next);
    } else {
      setEntitlements(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === null || ev.key === 'logta-hub-entitlements-v1') refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener(LOGTA_ENTITLEMENTS_EVENT, onCustom as EventListener);
    const id = window.setInterval(refresh, 45_000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LOGTA_ENTITLEMENTS_EVENT, onCustom as EventListener);
      window.clearInterval(id);
    };
  }, [refresh]);

  const applyRemoteEntitlements = useCallback((e: LogtaHubEntitlementsV1) => {
    saveLogtaEntitlementsToStorage(e);
    setEntitlements(normalizeExpiry(e));
  }, []);

  const consumeAiCredits = useCallback((amount: number) => {
    let ok = false;
    setEntitlements((prev) => {
      if (!prev || !prev.ai.enabled || prev.ai.creditsBalance < amount) return prev;
      ok = true;
      const next: LogtaHubEntitlementsV1 = {
        ...prev,
        ai: {
          ...prev.ai,
          creditsBalance: prev.ai.creditsBalance - amount,
          creditsUsedThisMonth: prev.ai.creditsUsedThisMonth + amount,
        },
        updatedAt: new Date().toISOString(),
      };
      saveLogtaEntitlementsToStorage(next);
      return next;
    });
    return ok;
  }, []);

  const trialDaysRemaining = useMemo(() => {
    if (!entitlements?.trialEndsAt) return null;
    return trialDaysLeft(entitlements.trialEndsAt);
  }, [entitlements]);

  const paywallRequired = useMemo(
    () => (entitlements ? shouldShowPaywall(entitlements) : false),
    [entitlements],
  );

  const trialBannerMessage = useMemo(() => {
    if (!entitlements || entitlements.billingStatus === 'active') return null;
    const d = trialDaysRemaining;
    if (d === null) return null;
    if (d === 0) return 'Seu acesso expirou — escolha um plano para continuar.';
    if (d === 1) return 'Seu teste termina amanhã.';
    return `Faltam ${d} dias de teste grátis.`;
  }, [entitlements, trialDaysRemaining]);

  const value = useMemo(
    () => ({
      entitlements,
      loading,
      refresh,
      trialDaysRemaining,
      paywallRequired,
      trialBannerMessage,
      consumeAiCredits,
      applyRemoteEntitlements,
    }),
    [
      entitlements,
      loading,
      refresh,
      trialDaysRemaining,
      paywallRequired,
      trialBannerMessage,
      consumeAiCredits,
      applyRemoteEntitlements,
    ],
  );

  return (
    <HubEntitlementsContext.Provider value={value}>{children}</HubEntitlementsContext.Provider>
  );
};

export function useHubEntitlements() {
  const ctx = useContext(HubEntitlementsContext);
  if (!ctx) throw new Error('useHubEntitlements must be used within HubEntitlementsProvider');
  return ctx;
}

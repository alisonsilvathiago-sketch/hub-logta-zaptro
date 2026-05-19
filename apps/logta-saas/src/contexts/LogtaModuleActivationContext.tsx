import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { OnboardingModuleId } from '../lib/onboardingStorage';
import {
  LOGTA_MODULE_ACTIVATION_EVENT,
  getEffectiveModuleIds,
  getEffectiveMainChallenge,
  isPathAllowedForUser,
  loadLogtaModuleActivation,
  buildActivationSnapshot,
  sameModuleIdSet,
  type LogtaModuleActivationV1,
  type MainChallengeId,
} from '../lib/logtaModuleActivation';
import { useTenant } from './TenantContext';
import { useLogtaProfile } from './LogtaProfileContext';

type LogtaModuleActivationContextValue = {
  activation: LogtaModuleActivationV1;
  moduleIds: OnboardingModuleId[];
  mainChallenge: MainChallengeId | null;
  refresh: () => void;
  isPathAllowed: (pathname: string) => boolean;
  hasModule: (id: OnboardingModuleId) => boolean;
  isFeatureOn: (featureKey: string) => boolean;
};

const LogtaModuleActivationContext = createContext<LogtaModuleActivationContextValue | null>(null);

export function LogtaModuleActivationProvider({ children }: { children: React.ReactNode }) {
  const { config } = useTenant();
  const { profile } = useLogtaProfile();

  // moduleIds and mainChallenge now come from Tenant config primarily
  const moduleIds = useMemo(() => (config.activeModules as OnboardingModuleId[]) || getEffectiveModuleIds(), [config.activeModules]);
  const mainChallenge = useMemo(() => (config.mainChallenge as MainChallengeId) || getEffectiveMainChallenge(), [config.mainChallenge]);

  const [localActivation, setLocalActivation] = useState<LogtaModuleActivationV1 | null>(null);

  const refresh = useCallback(() => {
    const snap = buildActivationSnapshot(moduleIds, mainChallenge);
    setLocalActivation(snap);
  }, [moduleIds, mainChallenge]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPathAllowed = useCallback(
    (pathname: string) =>
      isPathAllowedForUser(
        pathname,
        moduleIds,
        profile
          ? {
              cargo: profile.role,
              permissoes: profile.permissions,
            }
          : undefined,
      ),
    [moduleIds, profile],
  );

  const activation = useMemo(() => {
    return localActivation || buildActivationSnapshot(moduleIds, mainChallenge);
  }, [localActivation, moduleIds, mainChallenge]);

  const value = useMemo<LogtaModuleActivationContextValue>(() => {
    const set = new Set(moduleIds);
    return {
      activation,
      moduleIds,
      mainChallenge,
      refresh,
      isPathAllowed,
      hasModule: (id: OnboardingModuleId) => set.has(id),
      isFeatureOn: (featureKey: string) => activation.features[featureKey] === true,
    };
  }, [activation, isPathAllowed, mainChallenge, moduleIds, refresh]);

  return (
    <LogtaModuleActivationContext.Provider value={value}>{children}</LogtaModuleActivationContext.Provider>
  );
}

export function useLogtaModuleActivation(): LogtaModuleActivationContextValue {
  const ctx = useContext(LogtaModuleActivationContext);
  if (!ctx) {
    throw new Error('useLogtaModuleActivation must be used within LogtaModuleActivationProvider');
  }
  return ctx;
}

/** Rotas públicas / shell sem provider — não quebra. */
export function useLogtaModuleActivationOptional(): LogtaModuleActivationContextValue | null {
  return useContext(LogtaModuleActivationContext);
}

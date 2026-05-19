import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { loadOnboardingProfile } from '../lib/onboardingStorage';
import { applyModuleActivationFromOnboarding } from '../lib/logtaModuleActivation';
import { LOGTA_DEMO_COMPANY_ID, shouldUseLogtaSandbox } from '../lib/seed';
import type { OnboardingModuleId } from '../lib/onboardingStorage';

type TenantConfig = {
  id?: string;
  companyName: string;
  primaryColor: string;
  logoUrl: string | null;
  removeZaptroBrand: boolean;
  domain?: string;
  activeModules: string[];
  mainChallenge: string | null;
};

type TenantContextType = {
  config: TenantConfig;
  loading: boolean;
  updateConfig: (newConfig: Partial<TenantConfig>) => Promise<void>;
  refreshTenant: () => Promise<void>;
};

const defaultTenant: TenantConfig = {
  companyName: 'LOGTA',
  primaryColor: '#D7FF00',
  logoUrl: null,
  removeZaptroBrand: false,
  activeModules: ['financeiro', 'crm', 'operacoes'],
  mainChallenge: null,
};

const TenantContext = createContext<TenantContextType>({
  config: defaultTenant,
  loading: true,
  updateConfig: async () => {},
  refreshTenant: async () => {},
});

function applyPrimaryColor(color: string) {
  document.documentElement.style.setProperty('--color-primary', color);
}

// Real schema: table is "companies", columns are name, primary_color, logo_url, etc.
// settings JSONB column stores modulos_ativos and desafio_principal
function rowToConfig(data: any): TenantConfig {
  const settings = data.settings || {};
  return {
    id: data.id,
    companyName: data.name || 'LOGTA',
    primaryColor: data.primary_color || '#D7FF00',
    logoUrl: data.logo_url ?? null,
    removeZaptroBrand: false,
    domain: data.subdomain,
    activeModules: Array.isArray(settings.modulos_ativos)
      ? settings.modulos_ativos
      : ['financeiro', 'crm', 'operacoes'],
    mainChallenge: settings.desafio_principal ?? null,
  };
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<TenantConfig>(defaultTenant);
  const [loading, setLoading] = useState(true);

  const loadTenant = useCallback(async () => {
    try {
      // 1. Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      let found: TenantConfig | null = null;
      let companyId: string | null = null;

      if (user) {
        // 2. Look up the user's profile to get company_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.company_id) {
          companyId = profile.company_id;
          const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .maybeSingle();

          if (company) found = rowToConfig(company);
        }

        // 3. Fallback: find company by email_admin
        if (!found) {
          const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('email_admin', user.email)
            .maybeSingle();
          if (company) found = rowToConfig(company);
        }
      }

      if (found) {
        setConfig(found);
        if (found.primaryColor) applyPrimaryColor(found.primaryColor);
        if (found.activeModules?.length) {
          applyModuleActivationFromOnboarding(
            found.activeModules as OnboardingModuleId[],
            found.mainChallenge,
          );
        }
      } else {
        // Local onboarding fallback
        const local = loadOnboardingProfile();
        if (local) {
          setConfig((prev) => ({
            ...prev,
            companyName: local.companyName || prev.companyName,
            primaryColor: local.primaryColor || prev.primaryColor,
            logoUrl: local.logoDataUrl || prev.logoUrl,
            activeModules: (local.modules as string[]) || prev.activeModules,
            mainChallenge: local.mainChallenge || prev.mainChallenge,
          }));
          if (local.primaryColor) applyPrimaryColor(local.primaryColor);
        }
      }
    } catch (err) {
      console.error('Error loading tenant config:', err);
    } finally {
      if (shouldUseLogtaSandbox()) {
        setConfig((prev) => ({
          ...prev,
          id: prev.id || LOGTA_DEMO_COMPANY_ID,
          companyName:
            !prev.id || prev.companyName === 'LOGTA'
              ? 'Logta Transportes Demo'
              : prev.companyName,
        }));
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  const refreshTenant = useCallback(async () => {
    setLoading(true);
    await loadTenant();
  }, [loadTenant]);

  const updateConfig = useCallback(
    async (newConfig: Partial<TenantConfig>) => {
      // Optimistic local update
      setConfig((prev) => ({ ...prev, ...newConfig }));

      if (newConfig.primaryColor) applyPrimaryColor(newConfig.primaryColor);

      // Apply module activation locally for immediate sidebar/menu effect
      const mergedModules = newConfig.activeModules ?? config.activeModules;
      const mergedChallenge =
        newConfig.mainChallenge !== undefined ? newConfig.mainChallenge : config.mainChallenge;
      if (newConfig.activeModules !== undefined || newConfig.mainChallenge !== undefined) {
        applyModuleActivationFromOnboarding(
          mergedModules as OnboardingModuleId[],
          mergedChallenge,
        );
      }

      // Persist to Supabase — table: companies, settings JSONB for modules/challenge
      const tenantId = config.id;
      if (!tenantId) return;

      // Build top-level updates
      const dbUpdate: Record<string, unknown> = {};
      if (newConfig.companyName !== undefined) dbUpdate.name = newConfig.companyName;
      if (newConfig.primaryColor !== undefined) dbUpdate.primary_color = newConfig.primaryColor;
      if (newConfig.logoUrl !== undefined) dbUpdate.logo_url = newConfig.logoUrl;

      // Build settings patch (merge with existing)
      const settingsPatch: Record<string, unknown> = {};
      if (newConfig.activeModules !== undefined) settingsPatch.modulos_ativos = newConfig.activeModules;
      if (newConfig.mainChallenge !== undefined) settingsPatch.desafio_principal = newConfig.mainChallenge;

      if (Object.keys(settingsPatch).length > 0) {
        // Merge into existing settings using Supabase's jsonb update approach
        const { data: current } = await supabase
          .from('companies')
          .select('settings')
          .eq('id', tenantId)
          .maybeSingle();

        const existingSettings = (current?.settings as Record<string, unknown>) || {};
        dbUpdate.settings = { ...existingSettings, ...settingsPatch };
      }

      if (Object.keys(dbUpdate).length > 0) {
        const { error } = await supabase
          .from('companies')
          .update(dbUpdate)
          .eq('id', tenantId);

        if (error) console.error('Error persisting tenant config:', error);
      }
    },
    [config],
  );

  return (
    <TenantContext.Provider value={{ config, loading, updateConfig, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);

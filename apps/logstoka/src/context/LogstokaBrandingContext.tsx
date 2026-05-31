import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import {
  brandCssVariables,
  DEFAULT_BRANDING,
  loadBranding,
  saveBranding,
  type LogstokaBrandingConfig,
} from '@/lib/logstokaBranding';

type LogstokaBrandingContextValue = {
  branding: LogstokaBrandingConfig;
  cssVars: Record<string, string>;
  setPrimaryColor: (color: string) => void;
  setLogoUrl: (logoUrl: string | null) => void;
  setCompanyName: (name: string | null) => void;
  setCompanyAddress: (address: string | null) => void;
  setCompanyContact: (contact: string | null) => void;
  resetBranding: () => void;
};

const LogstokaBrandingContext = createContext<LogstokaBrandingContextValue | null>(null);

export const LogstokaBrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { companyId } = useLogstokaTenant();
  const [branding, setBranding] = useState<LogstokaBrandingConfig>(() => loadBranding(companyId));

  useEffect(() => {
    setBranding(loadBranding(companyId));
  }, [companyId]);

  const persist = useCallback(
    (next: LogstokaBrandingConfig) => {
      setBranding(next);
      saveBranding(companyId, next);
    },
    [companyId],
  );

  const setPrimaryColor = useCallback(
    (primaryColor: string) => persist({ ...branding, primaryColor }),
    [branding, persist],
  );

  const setLogoUrl = useCallback(
    (logoUrl: string | null) => persist({ ...branding, logoUrl }),
    [branding, persist],
  );

  const setCompanyName = useCallback(
    (companyName: string | null) => persist({ ...branding, companyName }),
    [branding, persist],
  );

  const setCompanyAddress = useCallback(
    (companyAddress: string | null) => persist({ ...branding, companyAddress }),
    [branding, persist],
  );

  const setCompanyContact = useCallback(
    (companyContact: string | null) => persist({ ...branding, companyContact }),
    [branding, persist],
  );

  const resetBranding = useCallback(() => persist({ ...DEFAULT_BRANDING }), [persist]);

  const cssVars = useMemo(() => brandCssVariables(branding.primaryColor), [branding.primaryColor]);

  const value = useMemo(
    () => ({
      branding,
      cssVars,
      setPrimaryColor,
      setLogoUrl,
      setCompanyName,
      setCompanyAddress,
      setCompanyContact,
      resetBranding,
    }),
    [branding, cssVars, setPrimaryColor, setLogoUrl, setCompanyName, setCompanyAddress, setCompanyContact, resetBranding],
  );

  return (
    <LogstokaBrandingContext.Provider value={value}>{children}</LogstokaBrandingContext.Provider>
  );
};

export function useLogstokaBranding(): LogstokaBrandingContextValue {
  const ctx = useContext(LogstokaBrandingContext);
  if (!ctx) {
    throw new Error('useLogstokaBranding must be used within LogstokaBrandingProvider');
  }
  return ctx;
}

/** Hook seguro fora do provider (landing, login) */
export function useLogstokaBrandingOptional(): LogstokaBrandingContextValue | null {
  return useContext(LogstokaBrandingContext);
}

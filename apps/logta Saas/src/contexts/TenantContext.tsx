import React, { createContext, useContext, useState } from 'react';

type TenantConfig = {
  companyName: string;
  primaryColor: string;
  logoUrl: string | null;
  removeZaptroBrand: boolean;
};

type TenantContextType = {
  config: TenantConfig;
  updateConfig: (newConfig: Partial<TenantConfig>) => void;
};

const defaultTenant: TenantConfig = {
  companyName: 'LOGTA',
  primaryColor: '#2563EB',
  logoUrl: null,
  removeZaptroBrand: false,
};

const TenantContext = createContext<TenantContextType>({
  config: defaultTenant,
  updateConfig: () => {},
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<TenantConfig>(defaultTenant);

  const updateConfig = (newConfig: Partial<TenantConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
    
    // Dynamically update CSS variables when primary color changes
    if (newConfig.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', newConfig.primaryColor);
    }
  };

  return (
    <TenantContext.Provider value={{ config, updateConfig }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);

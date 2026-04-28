import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface SystemConfigs {
  platformName: string;
  primaryColor: string;
  supportEmail: string;
  logoUrl: string;
  allowRegistration: boolean;
}

interface SystemConfigContextType {
  configs: SystemConfigs;
  isLoading: boolean;
  refreshConfigs: () => Promise<void>;
}

const defaultConfigs: SystemConfigs = {
  platformName: 'Logta SaaS',
  primaryColor: '#38BDF8',
  supportEmail: 'suporte@logta.app',
  logoUrl: '',
  allowRegistration: true
};

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

export const SystemConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = useState<SystemConfigs>(defaultConfigs);
  const [isLoading, setIsLoading] = useState(true);

  const refreshConfigs = async () => {
    try {
      const { data, error } = await supabase.from('system_configs').select('*');
      if (error) throw error;
      
      if (data) {
        const newConfigs = { ...defaultConfigs };
        data.forEach((item: any) => {
          if (item.key === 'PLATFORM_NAME') newConfigs.platformName = item.value;
          if (item.key === 'PRIMARY_COLOR') newConfigs.primaryColor = item.value;
        });
        setConfigs(newConfigs);
      }
    } catch (err) {
      console.warn('Usando configurações padrão (Logta):', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshConfigs();
  }, []);

  return (
    <SystemConfigContext.Provider value={{ configs, isLoading, refreshConfigs }}>
      {children}
    </SystemConfigContext.Provider>
  );
};

export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (context === undefined) throw new Error('useSystemConfig deve ser usado dentro de um SystemConfigProvider');
  return context;
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface SystemConfigs {
  platformName: string;
  supportEmail: string;
  primaryColor: string;
  allowRegistration: boolean;
  systemLockdown: boolean;
  googleServiceAccountKey: any;
  [key: string]: any;
}

interface SystemConfigContextType {
  configs: SystemConfigs | null;
  isLoading: boolean;
  refreshConfigs: () => Promise<void>;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

export const SystemConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = useState<SystemConfigs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('master_settings').select('*');
      if (error) throw error;

      const configMap: any = {
        platformName: 'Logta Hub',
        supportEmail: 'suporte@logta.com.br',
        primaryColor: '#6366F1',
        allowRegistration: true,
        systemLockdown: false,
        googleServiceAccountKey: null
      };

      data?.forEach(item => {
        if (item.key === 'branding') {
          configMap.platformName = item.value.system_name || configMap.platformName;
          configMap.primaryColor = item.value.primary_color || configMap.primaryColor;
        } else if (item.key === 'support_email') {
          configMap.supportEmail = item.value;
        } else if (item.key === 'allow_registration') {
          configMap.allowRegistration = item.value === 'true';
        } else if (item.key === 'system_lockdown') {
          configMap.systemLockdown = item.value === 'true';
        } else if (item.key === 'GOOGLE_SERVICE_ACCOUNT_KEY') {
          configMap.googleServiceAccountKey = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        } else {
          configMap[item.key] = item.value;
        }
      });

      setConfigs(configMap);
    } catch (err) {
      console.error('Failed to load system configs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return (
    <SystemConfigContext.Provider value={{ configs, isLoading, refreshConfigs: fetchConfigs }}>
      {children}
    </SystemConfigContext.Provider>
  );
};

export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
};

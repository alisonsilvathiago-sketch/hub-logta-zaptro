import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Company } from '../types';

interface TenantContextType {
  company: Company | null;
  isLoading: boolean;
  refreshCompany: () => Promise<void>;
  setCompany: (c: Company | null) => void;
  fetchCompanyData: () => Promise<void>;
  profile: any;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCompany = async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }
    const { data } = await supabase.from('companies').select('*').eq('id', profile.company_id).single();
    setCompany(data);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshCompany();
  }, [profile]);

  return (
    <TenantContext.Provider value={{ 
      company, 
      isLoading, 
      refreshCompany, 
      setCompany, 
      fetchCompanyData: refreshCompany,
      profile 
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) throw new Error('useTenant must be used within a TenantProvider');
  return context;
};

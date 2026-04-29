import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import type { Company, TenantContextType } from '../types/index';
import { useAuth } from './AuthContext';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isLoading: authLoading } = useAuth();
  const [company, setCompanyState] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanyData = async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabaseZaptro
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();
        
      if (!error && data) {
        setCompanyState(data as any);
      }
    } catch (err) {
      console.warn('Erro ao buscar company no TenantContext:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchCompanyData();
    }
  }, [profile, authLoading]);

  return (
    <TenantContext.Provider value={{ company, profile, isLoading: isLoading || authLoading, setCompany: setCompanyState, fetchCompanyData }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  return context;
};

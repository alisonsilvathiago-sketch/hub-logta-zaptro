import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Company, TenantContextType } from '../types/index';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isLoading: authLoading } = useAuth();
  const [company, setCompanyState] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setCompany = (c: Company) => {
    setCompanyState(c);
  };

  const fetchCompanyData = async (forceById?: string) => {
    const impersonatedId = localStorage.getItem('hub-impersonate-tenant');
    const idToFetch = forceById || impersonatedId || profile?.company_id;
    
    if (authLoading && !forceById) return;
    if (!idToFetch) {
       setIsLoading(false);
       return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', idToFetch)
        .single();

      if (error) throw error;
      if (data) {
        setCompany(data as Company);
      }
    } catch (err) {
      console.error('TenantContext: Erro ao buscar empresa:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [profile, authLoading]);

  return (
    <TenantContext.Provider value={{ company, profile, isLoading: isLoading || authLoading, setCompany, fetchCompanyData }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  return context;
};

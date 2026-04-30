import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Company, TenantContextType } from '../types/index';
import { supabase } from '../lib/supabase';
import { validateTenantAccess, AccessStatus } from '../lib/accessControl';
import BlockedScreen from '../components/BlockedScreen';

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isLoading: authLoading } = useAuth();
  const [company, setCompanyState] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [access, setAccess] = useState<AccessStatus>({ allowed: true });

  const setCompany = (c: Company) => {
    setCompanyState(c);
  };

  const fetchCompanyData = async (forceById?: string) => {
    // ... (omit cookie logic)
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const impersonatedId = getCookie('hub-impersonate-tenant');
    const idToFetch = forceById || impersonatedId || profile?.company_id;
    
    if (authLoading && !forceById) return;
    if (!idToFetch) {
       setIsLoading(false);
       return;
    }

    try {
      // 1. Validação Master Access
      const status = await validateTenantAccess(idToFetch);
      setAccess(status);

      // Se for master admin, ignora bloqueio para manutenção
      const isMaster = profile?.role === 'MASTER' || profile?.role === 'MASTER_ADMIN' || profile?.role === 'ADMIN';
      if (isMaster) setAccess({ allowed: true });

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

  if (!access.allowed && !isLoading) {
    return <BlockedScreen reason={access.reason || 'Restrição Administrativa'} />;
  }

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

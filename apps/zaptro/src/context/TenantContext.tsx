import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import type { Company, TenantContextType } from '../types/index';
import { useAuth } from './AuthContext';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

import { validateTenantAccess, type AccessStatus } from '../lib/accessControl';
import BlockedScreen from '../components/BlockedScreen';

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { profile, isLoading: authLoading } = useAuth();
  const [company, setCompanyState] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [access, setAccess] = useState<AccessStatus>({ allowed: true });

  /** Shell /app exige login — sem bypass de assinatura na área operacional. */
  const isOpenWaLinkShell = false;

  const fetchCompanyData = async () => {
    // Check for impersonation cookie (shared across subdomains)
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const impersonatedId = getCookie('hub-impersonate-tenant');
    const idToFetch = impersonatedId || profile?.company_id;

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

      const { data, error } = await supabaseZaptro
        .from('companies')
        .select('*')
        .eq('id', idToFetch)
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

  const providerValue: TenantContextType = {
    company,
    profile,
    isLoading: isLoading || authLoading,
    setCompany: setCompanyState,
    fetchCompanyData,
  };

  const blocked = !access.allowed && !isLoading && !isOpenWaLinkShell;

  return (
    <TenantContext.Provider value={providerValue}>
      {blocked ? (
        <BlockedScreen reason={access.reason || 'Restrição Administrativa'} />
      ) : (
        children
      )}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  return context;
};

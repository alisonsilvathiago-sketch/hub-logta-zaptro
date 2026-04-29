import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import type { AuthContextType, Profile } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ZAPTRO_PROFILE_SELECTS = [
  'id,email,full_name,role,company_id,avatar_url,department,permissions,metadata,tem_zaptro,tem_logta,status_zaptro,status_empresa',
  'id,email,full_name,role,company_id,avatar_url,department,permissions,metadata,tem_zaptro,status_zaptro,status_empresa',
  'id,email,full_name,role,company_id,avatar_url,department,permissions,metadata',
  'id,email,full_name,role,company_id,avatar_url,department',
] as const;

const isMasterRole = (role?: string) => {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'MASTER' || r.startsWith('MASTER_');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = supabaseZaptro;
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; code?: string } | null>(null);

  const loadProfile = async (userId: string) => {
    try {
      setAuthError(null);
      for (const selectCols of ZAPTRO_PROFILE_SELECTS) {
        const { data, error } = await db
          .from('profiles')
          .select(selectCols)
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          setProfile(data as Profile);
          return;
        }
      }

      setProfile(null);
      setAuthError({ message: 'Perfil não encontrado para este utilizador.' });
    } catch (err: any) {
      setProfile(null);
      setAuthError({ message: err?.message || 'Erro ao carregar perfil.', code: err?.code });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ⚡ CHECK DEV SESSION (Master Bypass)
    const devSession = localStorage.getItem('hub-dev-session');
    if (devSession) {
      const data = JSON.parse(devSession);
      setUser({ id: 'dev-user', email: data.email });
      setProfile({ 
        id: 'dev-user', 
        email: data.email, 
        full_name: data.full_name, 
        role: data.role || 'MASTER',
        company_id: localStorage.getItem('hub-impersonate-tenant') || 'master'
      } as any);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const clearLoading = () => {
      if (!cancelled) setIsLoading(false);
    };
    /** Evita loader infinito se getSession falhar ou nunca resolver (rede / SDK). */
    const safety = window.setTimeout(clearLoading, 12000);

    db.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        window.clearTimeout(safety);
        setAuthError(null);
        setUser(session?.user ?? null);
        if (session?.user) loadProfile(session.user.id);
        else {
          setProfile(null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        window.clearTimeout(safety);
        setAuthError({ message: 'Falha ao recuperar sessão.' });
        clearLoading();
      });

    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) loadProfile(currentUser.id);
      else {
        setProfile(null);
        setAuthError(null);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setIsLoggingOut(true);
    // Aguarda o tempo das frases de despedida (3 segundos)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await db.auth.signOut();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isLoggingOut,
        isLoggingIn,
        setIsLoggingIn,
        signOut,
        isMaster: isMasterRole(profile?.role),
        refreshProfile: async () => {
          if (!user?.id) return;
          await loadProfile(user.id);
        },
        authError,
        isVerifyingMFA: false,
        verifyMFA: async () => true,
        impersonate: (companyId: string) => {
          localStorage.setItem('hub-impersonate-tenant', companyId);
          window.location.reload();
        },
        stopImpersonating: () => {
          localStorage.removeItem('hub-impersonate-tenant');
          window.location.href = 'http://localhost:5175/master/companies';
        },
        onlineUsers: [],
        mfaUser: null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};

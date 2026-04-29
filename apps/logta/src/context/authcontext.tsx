import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthContextType, Profile } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isMasterRole = (role?: string) => {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'MASTER' || r.startsWith('MASTER_');
};

async function fetchProfileRow(db: SupabaseClient, userId: string) {
  return db.from('profiles').select('*').eq('id', userId).maybeSingle();
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = supabase;
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<{ message: string; code?: string } | null>(null);
  const [isVerifyingMFA] = useState(false);

  useEffect(() => {
    db.auth.startAutoRefresh();
    return () => {
      try {
        db.auth.stopAutoRefresh();
      } catch {
        /* noop */
      }
    };
  }, [db]);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await fetchProfileRow(db, userId);
    if (error) {
      setProfile(null);
      setAuthError({ message: error.message, code: error.code });
      return;
    }
    setAuthError(null);
    setProfile((data as Profile) ?? null);
  }, [db]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    await loadProfile(user.id);
  }, [user?.id, loadProfile]);

  useEffect(() => {
    let active = true;
    const watchdog = window.setTimeout(() => {
      if (active) setIsLoading(false);
    }, 12000);

    const checkSession = async () => {
      try {
        setAuthError(null);
        const { data: { session } } = await db.auth.getSession();
        if (!active) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) await loadProfile(currentUser.id);
        else setProfile(null);
      } catch (err: any) {
        if (!active) return;
        setAuthError({ message: err?.message || 'Erro ao recuperar sessão.', code: err?.code });
      } finally {
        if (!active) return;
        window.clearTimeout(watchdog);
        setIsLoading(false);
      }
    };

    void checkSession();

    const { data: { subscription } } = db.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await loadProfile(currentUser.id);
      else {
        setProfile(null);
        setAuthError(null);
      }
      setIsLoading(false);
    });

    return () => {
      active = false;
      window.clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, [db, loadProfile]);

  const signOut = useCallback(async () => {
    try {
      await db.auth.signOut({ scope: 'global' });
    } catch {
      try {
        await db.auth.signOut();
      } catch {
        /* noop */
      }
    }
    if (typeof window !== 'undefined') {
      window.location.replace(`${window.location.origin}/login`);
    }
  }, [db]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        onlineUsers: [],
        isLoading,
        authError,
        isVerifyingMFA,
        isMaster: isMasterRole(profile?.role),
        mfaUser: null,
        signOut,
        refreshProfile,
        verifyMFA: async () => true,
        impersonate: (companyId: string) => {
          localStorage.setItem('hub-impersonate-tenant', companyId);
          window.location.reload();
        },
        stopImpersonating: () => {
          localStorage.removeItem('hub-impersonate-tenant');
          window.location.reload();
        },
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

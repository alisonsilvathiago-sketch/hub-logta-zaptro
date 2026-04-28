import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthContextType, Profile } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function logProfileError(label: string, err: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[AUTH] profiles ${label}:`, err.message, err.code, err.details, err.hint);
}

/** No Logta SaaS, buscamos o perfil apenas no banco principal. */
async function fetchProfileRow(db: SupabaseClient, userId: string) {
  console.log(`[AUTH] Buscando perfil do Logta SaaS para o UID: ${userId}`);
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
        /* ignore */
      }
    };
  }, [db]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await fetchProfileRow(db, user.id);
    if (error) {
      console.error('[AUTH] refreshProfile:', error.message, error.code, error.details);
      return;
    }
    setProfile((data as Profile) ?? null);
  }, [user?.id, db]);

  useEffect(() => {
    let active = true;
    let getSessionResolved = false;

    const getSessionWatchdog = setTimeout(() => {
      if (active && !getSessionResolved) {
        console.warn('⚠️ [AUTH] Timeout em getSession. Destravando tela branca...');
        setIsLoading(false);
      }
    }, 5000);

    const loadProfileEffect = async (userId: string) => {
      const { data: prof, error } = await fetchProfileRow(db, userId);
      if (!active) return;
      if (prof) {
        setProfile(prof as Profile);
      } else if (error) {
        setAuthError({ message: error.message, code: error.code });
      }
    };

    const checkSession = async () => {
      try {
        setAuthError(null);
        const { data: { session } } = await db.auth.getSession();
        const currentUser = session?.user ?? null;
        getSessionResolved = true;
        clearTimeout(getSessionWatchdog);
        if (!active) return;
        setUser(currentUser);
        if (currentUser) {
          await loadProfileEffect(currentUser.id);
        } else {
          setProfile(null);
        }
      } catch (e: any) {
        console.error('Erro na sessão:', e);
        setAuthError({ message: e.message || 'Erro na sessão' });
        getSessionResolved = true;
      } finally {
        if (active) {
          clearTimeout(getSessionWatchdog);
          setIsLoading(false);
        }
      }
    };

    void checkSession();

    const { data: { subscription } } = db.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      setAuthError(null);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await loadProfileEffect(currentUser.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimeout(getSessionWatchdog);
    };
  }, [db]);

  const signOut = useCallback(async () => {
    try {
      await db.auth.signOut({ scope: 'global' });
    } catch {
      try { await db.auth.signOut(); } catch { /* ignore */ }
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
        isLoading,
        authError,
        isVerifyingMFA,
        signOut,
        refreshProfile,
        isMaster: profile?.role === 'MASTER',
        verifyMFA: async () => true,
        impersonate: () => {},
        stopImpersonating: () => {},
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextType {
  user: any;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isMaster: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  setIsLoggingIn: (val: boolean) => void;
  impersonate: (companyId: string, origin?: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const devSessionRaw =
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? localStorage.getItem('hub-dev-session')
        : null;

    if (devSessionRaw) {
      try {
        const devSession = JSON.parse(devSessionRaw);
        const devId = 'hub-dev-local-user';
        const devEmail = devSession?.email || 'adm@teste.com';
        const devRole: Profile['role'] =
          devSession?.role === 'MASTER_ADMIN' || devSession?.role === 'ADMIN' || devSession?.role === 'USER'
            ? devSession.role
            : 'MASTER';

        setUser({ id: devId, email: devEmail });
        setProfile({
          id: devId,
          email: devEmail,
          full_name: devSession?.full_name || 'Master Developer',
          role: devRole,
          avatar_url: devSession?.avatar_url || undefined,
        });
        setIsLoading(false);
        return;
      } catch {
        localStorage.removeItem('hub-dev-session');
      }
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    setProfile(data);
    setIsLoading(false);
  };

  const signOut = async () => {
    setIsLoggingOut(true);
    localStorage.removeItem('hub-dev-session');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const impersonate = (companyId: string, origin: string = 'logta') => {
    // No monorepo, redirecionamos para a porta do app correspondente ou via subdominio
    localStorage.setItem('hub-impersonate-tenant', companyId);
    
    // Porta 5173 = Logta, Porta 5174 = Zaptro
    const port = origin === 'zaptro' ? '5174' : '5173';
    
    window.open(`http://localhost:${port}/master/connect?tenant=${companyId}&dev=true`, '_blank');
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  const isMaster = profile?.role === 'MASTER' || profile?.role === 'MASTER_ADMIN' || profile?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      isLoading, 
      signOut, 
      isMaster,
      isLoggingIn,
      isLoggingOut,
      setIsLoggingIn,
      impersonate,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

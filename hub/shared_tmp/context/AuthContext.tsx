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

  const loadProfile = async (userId: string) => {
    try {
      // ⚡ Robust Profile Loading (Fallbacks for different schema versions)
      const selects = [
        'id,email,full_name,role,company_id,avatar_url,department,permissions,metadata,tem_zaptro,tem_logta,status_zaptro,status_empresa',
        'id,email,full_name,role,company_id,avatar_url,department,permissions,metadata',
        'id,email,full_name,role,company_id,avatar_url,department',
        '*'
      ];

      let lastError = null;
      for (const selectCols of selects) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select(selectCols)
            .eq('id', userId)
            .maybeSingle();

          if (!error && data) {
            setProfile(data as Profile);
            setIsLoading(false);
            return;
          }
          if (error) lastError = error;
        } catch (e) {
          lastError = e;
        }
      }

      // Se chegou aqui e não carregou nada, mas temos um erro 400 (coluna não existe),
      // ou qualquer outro erro, tentamos um select mínimo garantido
      console.warn('Profile loading failed all attempts, trying absolute minimum fallback:', lastError);
      const { data: fallbackData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .maybeSingle();

      if (fallbackData) {
        setProfile(fallbackData as Profile);
      } else {
        // Fallback total para não quebrar a UI
        setProfile({ id: userId, email: user?.email } as Profile);
      }
    } catch (err) {
      console.error('Critical error loading profile:', err);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 🔍 Support for dev sessions in localhost
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
          company_id: localStorage.getItem('hub-impersonate-tenant') || undefined
        } as Profile);
        setIsLoading(false);
        return;
      } catch {
        localStorage.removeItem('hub-dev-session');
      }
    }

    // 🚀 Standard SSO Flow
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setIsLoggingOut(true);
    localStorage.removeItem('hub-dev-session');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const impersonate = (companyId: string, origin: string = 'logta') => {
    if (typeof window === 'undefined') return;
    const hostname = window.location.hostname;
    
    // Porta Mapping
    const ports: Record<string, string> = { 'zaptro': '5174', 'logta': '5173', 'logdock': '5176' };
    const port = ports[origin] || '5173';
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      window.open(`http://localhost:${port}/master/connect?tenant=${companyId}&dev=true`, '_blank');
    } else {
      const targetDomains: Record<string, string> = {
        'zaptro': 'app.zaptro.com.br',
        'logta': 'app.logta.com.br',
        'logdock': 'app.logdock.com.br'
      };
      const targetDomain = targetDomains[origin] || 'app.logta.com.br';
      window.open(`https://${targetDomain}/master/connect?tenant=${companyId}`, '_blank');
    }
  };

  const refreshProfile = async () => {
    if (user?.id) await loadProfile(user.id);
  };

  const isMaster = profile?.role === 'MASTER' || profile?.role === 'MASTER_ADMIN';

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

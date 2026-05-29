import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@shared/types';
import {
  buildLogstokaDemoSession,
  clearLogstokaMockSession,
  hasLogstokaMockSession,
} from '@/lib/logstokaAuthSession';

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
  onlineUsers: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const LogstokaAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const applyDemoSession = () => {
    const demo = buildLogstokaDemoSession();
    setUser(demo.user);
    setProfile(demo.profile as Profile);
    setIsLoading(false);
  };

  const loadProfile = async (userId: string) => {
    try {
      const selects = [
        'id,email,full_name,role,company_id,avatar_url,department,permissions,metadata,tem_logstoka,status_empresa',
        'id,email,full_name,role,company_id,avatar_url,department,permissions,metadata',
        'id,email,full_name,role,company_id,avatar_url,department',
        '*',
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
            setProfile(data as unknown as Profile);
            setIsLoading(false);
            return;
          }
          if (error) lastError = error;
        } catch (e) {
          lastError = e;
        }
      }

      console.warn('Profile loading failed, using fallback:', lastError);
      const { data: fallbackData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .maybeSingle();

      if (fallbackData) {
        setProfile(fallbackData as Profile);
      } else {
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
    if (hasLogstokaMockSession()) {
      applyDemoSession();
    }

    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get('token');
    const masterBypass = searchParams.get('master_bypass');

    if (urlToken && masterBypass === 'true') {
      supabase.auth.setSession({ access_token: urlToken, refresh_token: '' }).then(({ data, error }) => {
        if (!error && data.session) {
          setUser(data.session.user);
          loadProfile(data.session.user.id);
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        } else if (!hasLogstokaMockSession()) {
          setIsLoading(false);
        }
      });
    } else if (!hasLogstokaMockSession()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (hasLogstokaMockSession() && !session?.user) {
        applyDemoSession();
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setIsLoggingOut(true);
    clearLogstokaMockSession();
    localStorage.removeItem('hub-dev-session');
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const impersonate = (companyId: string, origin: string = 'logstoka') => {
    if (typeof window === 'undefined') return;
    const hostname = window.location.hostname;
    const ports: Record<string, string> = {
      zaptro: '5174',
      logta: '5173',
      logdock: '5176',
      logstoka: '5177',
    };
    const port = ports[origin] || '5177';

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      window.open(`http://localhost:${port}/master/connect?tenant=${companyId}&dev=true`, '_blank');
    } else {
      const targetDomains: Record<string, string> = {
        zaptro: 'app.zaptro.com.br',
        logta: 'app.logta.com.br',
        logdock: 'app.logdock.com.br',
        logstoka: 'app.logstoka.com.br',
      };
      const targetDomain = targetDomains[origin] || 'app.logstoka.com.br';
      window.open(`https://${targetDomain}/master/connect?tenant=${companyId}`, '_blank');
    }
  };

  const refreshProfile = async () => {
    if (hasLogstokaMockSession()) {
      applyDemoSession();
      return;
    }
    if (user?.id) await loadProfile(user.id);
  };

  const isMaster = profile?.role === 'MASTER' || profile?.role === 'MASTER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signOut,
        isMaster,
        isLoggingIn,
        isLoggingOut,
        setIsLoggingIn,
        impersonate,
        refreshProfile,
        onlineUsers: user?.id ? [user.id] : [],
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within LogstokaAuthProvider');
  return context;
};

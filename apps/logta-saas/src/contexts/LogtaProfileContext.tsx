import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { buildLogtaDemoProfile, isLogtaDemoEmail } from '../lib/logtaDemoAuth';
import { getSessionWithTimeout, hasLogtaMockSession } from '../lib/authSession';
import { shouldUseLogtaSandbox } from '../lib/seed';

type UserProfile = {
  id: string;
  full_name: string | null;
  role: string | null;
  company_id: string | null;
  avatar_url: string | null;
  permissions: any;
};

type LogtaProfileContextType = {
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const LogtaProfileContext = createContext<LogtaProfileContextType | null>(null);

export const LogtaProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    hasLogtaMockSession() || shouldUseLogtaSandbox() ? buildLogtaDemoProfile() : null,
  );
  const [loading, setLoading] = useState(() => !hasLogtaMockSession() && !shouldUseLogtaSandbox());

  const fetchProfile = async () => {
    const hasMock = hasLogtaMockSession();

    if (hasMock || (import.meta.env.DEV && shouldUseLogtaSandbox())) {
      setProfile(buildLogtaDemoProfile());
      setLoading(false);
      if (hasMock) return;
    }

    try {
      const { data, mock, timedOut } = await getSessionWithTimeout(1500);
      const user = data.session?.user;
      const demoUser = isLogtaDemoEmail(user?.email) || hasMock;

      if (!user && !hasMock) {
        if (timedOut && shouldUseLogtaSandbox()) {
          setProfile(buildLogtaDemoProfile());
        } else {
          setProfile(null);
        }
        setLoading(false);
        return;
      }

      if (!user && hasMock) {
        setProfile(buildLogtaDemoProfile());
        setLoading(false);
        return;
      }

      if (demoUser && user) {
        setProfile({
          ...buildLogtaDemoProfile(user.id),
          full_name:
            user.user_metadata?.full_name ||
            user.email?.split('@')[0] ||
            'Administrador Logta',
        });
        setLoading(false);
        return;
      }

      if (mock || !user) {
        setProfile(buildLogtaDemoProfile());
        setLoading(false);
        return;
      }

      const { data: row, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, company_id, avatar_url, permissions')
        .eq('id', user.id)
        .maybeSingle();

      if (row && !error && row.company_id) {
        setProfile({
          id: row.id,
          full_name: row.full_name,
          role: row.role,
          company_id: row.company_id,
          avatar_url: row.avatar_url,
          permissions: row.permissions || {},
        });
        setLoading(false);
        return;
      }

      setProfile({
        id: user.id,
        full_name: row?.full_name || user.email?.split('@')[0] || 'Usuário',
        role: row?.role || 'user',
        company_id: row?.company_id ?? (shouldUseLogtaSandbox() ? buildLogtaDemoProfile().company_id : null),
        avatar_url: row?.avatar_url ?? null,
        permissions: row?.permissions || {},
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(buildLogtaDemoProfile());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void fetchProfile();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <LogtaProfileContext.Provider value={{ profile, loading, refreshProfile: fetchProfile }}>
      {children}
    </LogtaProfileContext.Provider>
  );
};

export const useLogtaProfile = () => {
  const context = useContext(LogtaProfileContext);
  if (!context) {
    throw new Error('useLogtaProfile must be used within a LogtaProfileProvider');
  }
  return context;
};

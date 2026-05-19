import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { buildLogtaDemoProfile, isLogtaDemoEmail } from '../lib/logtaDemoAuth';
import { LOGTA_SESSION_BOOT_FLAG } from '../components/SessionBootLoader';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const hasMock =
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem(LOGTA_SESSION_BOOT_FLAG) === '1';
      const user = session?.user;
      const demoUser = isLogtaDemoEmail(user?.email) || hasMock;

      if (!user && !hasMock) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!user && hasMock) {
        setProfile(buildLogtaDemoProfile());
        setLoading(false);
        return;
      }

      if (demoUser) {
        setProfile({
          ...buildLogtaDemoProfile(user!.id),
          full_name:
            user!.user_metadata?.full_name ||
            user!.email?.split('@')[0] ||
            'Administrador Logta',
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, company_id, avatar_url, permissions')
        .eq('id', user!.id)
        .maybeSingle();

      if (data && !error && data.company_id) {
        setProfile({
          id: data.id,
          full_name: data.full_name,
          role: data.role,
          company_id: data.company_id,
          avatar_url: data.avatar_url,
          permissions: data.permissions || {},
        });
        setLoading(false);
        return;
      }

      setProfile({
        id: user!.id,
        full_name: data?.full_name || user!.email?.split('@')[0] || 'Usuário',
        role: data?.role || 'user',
        company_id: data?.company_id ?? null,
        avatar_url: data?.avatar_url ?? null,
        permissions: data?.permissions || {},
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      const { data: { session } } = await supabase.auth.getSession();
      const hasMock =
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem(LOGTA_SESSION_BOOT_FLAG) === '1';
      if (isLogtaDemoEmail(session?.user?.email) || hasMock) {
        setProfile(buildLogtaDemoProfile(session?.user?.id));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
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

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  getStoredProfileAvatarUrl,
  LOGTA_PROFILE_AVATAR_CHANGE_EVENT,
  resolveProfileAvatarUrl,
  setStoredProfileAvatarUrl,
} from '../lib/logtaProfileAvatar';

function oauthAvatarFromUser(user: { user_metadata?: Record<string, unknown> } | null): string | null {
  if (!user?.user_metadata) return null;
  const m = user.user_metadata;
  const avatar = m.avatar_url;
  const picture = m.picture;
  if (typeof avatar === 'string' && avatar.trim()) return avatar.trim();
  if (typeof picture === 'string' && picture.trim()) return picture.trim();
  return null;
}

export function useLogtaProfileAvatar() {
  const [stored, setStoredState] = useState<string | null>(() => getStoredProfileAvatarUrl());
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      const pic = oauthAvatarFromUser(session?.user ?? null);
      if (pic) setOauthUrl(pic);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const pic = oauthAvatarFromUser(session?.user ?? null);
      setOauthUrl(pic);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const sync = () => setStoredState(getStoredProfileAvatarUrl());
    window.addEventListener(LOGTA_PROFILE_AVATAR_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(LOGTA_PROFILE_AVATAR_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const avatarUrl = resolveProfileAvatarUrl(stored, oauthUrl);

  const setAvatarUrl = useCallback((url: string) => {
    setStoredProfileAvatarUrl(url);
    setStoredState(url.trim() || null);
  }, []);

  return { avatarUrl, setAvatarUrl };
}

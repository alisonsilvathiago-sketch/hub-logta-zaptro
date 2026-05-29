import type { Profile } from '@core/types';

/** Avatar padrão do ecossistema Hub (pasta public/assets/avatars). */
export const HUB_MASTER_DEFAULT_AVATAR = '/assets/avatars/avatar1.jpg';

type ProfileLike = Pick<Profile, 'avatar_url' | 'full_name' | 'email'> | null | undefined;

export function resolveHubMasterAvatarUrl(profile: ProfileLike): string {
  const url = profile?.avatar_url?.trim();
  if (url) return url;
  return HUB_MASTER_DEFAULT_AVATAR;
}

export function getHubMasterInitials(profile: ProfileLike): string {
  const name = profile?.full_name?.trim();
  if (name) return name[0]!.toUpperCase();
  const email = profile?.email?.trim();
  if (email) return email[0]!.toUpperCase();
  return 'M';
}

export function isHubDevProfile(profile: Pick<Profile, 'id'> | null | undefined): boolean {
  return profile?.id === 'hub-dev-local-user' || profile?.id === 'dev-user';
}

/** Persiste avatar (e campos opcionais) na sessão dev do Hub. */
export function syncHubDevSessionAvatar(
  avatarUrl: string,
  patch?: Partial<Pick<Profile, 'full_name' | 'email' | 'role'>>,
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('hub-dev-session');
    const session = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    localStorage.setItem(
      'hub-dev-session',
      JSON.stringify({ ...session, avatar_url: avatarUrl, ...patch }),
    );
  } catch {
    /* ignore */
  }
}

/** URL do avatar do membro da equipe; sincroniza com o usuário logado. */
export function resolveStaffMemberAvatarUrl(
  member: { profile_id?: string; profile: { email?: string; avatar_url?: string } },
  sessionProfile: Profile | null | undefined,
): string {
  if (
    sessionProfile &&
    (member.profile_id === sessionProfile.id ||
      (member.profile.email &&
        sessionProfile.email &&
        member.profile.email.toLowerCase() === sessionProfile.email.toLowerCase()))
  ) {
    return resolveHubMasterAvatarUrl(sessionProfile);
  }
  return member.profile.avatar_url?.trim() || HUB_MASTER_DEFAULT_AVATAR;
}

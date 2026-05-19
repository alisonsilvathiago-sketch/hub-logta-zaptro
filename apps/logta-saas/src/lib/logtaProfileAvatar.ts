/** Foto de perfil compartilhada (sidebar, header, página Perfil). */

export const LOGTA_PROFILE_AVATAR_STORAGE_KEY = 'logta-profile-avatar-url';

export const LOGTA_DEFAULT_PROFILE_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

export const LOGTA_PROFILE_AVATAR_CHANGE_EVENT = 'logta-profile-avatar-change';

export function getStoredProfileAvatarUrl(): string | null {
  try {
    const v = localStorage.getItem(LOGTA_PROFILE_AVATAR_STORAGE_KEY);
    if (v?.trim()) return v.trim();
  } catch {
    /* ignore */
  }
  return null;
}

export function setStoredProfileAvatarUrl(url: string): void {
  try {
    localStorage.setItem(LOGTA_PROFILE_AVATAR_STORAGE_KEY, url);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(LOGTA_PROFILE_AVATAR_CHANGE_EVENT));
}

export function resolveProfileAvatarUrl(stored: string | null, oauthUrl: string | null): string {
  if (stored?.trim()) return stored.trim();
  if (oauthUrl?.trim()) return oauthUrl.trim();
  return LOGTA_DEFAULT_PROFILE_AVATAR;
}

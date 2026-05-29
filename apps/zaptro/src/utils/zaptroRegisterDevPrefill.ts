/** Pré-preenchimento do /registre só em localhost + dev (valores em .env.local). */
export function getDevRegisterPrefill(): Partial<{
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}> | null {
  if (!import.meta.env.DEV) return null;
  if (typeof window === 'undefined') return null;
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return null;
  }

  const email = (import.meta.env.VITE_DEV_REGISTER_EMAIL as string | undefined)?.trim();
  const password = (import.meta.env.VITE_DEV_REGISTER_PASSWORD as string | undefined)?.trim();
  if (!email && !password) return null;

  const first =
    (import.meta.env.VITE_DEV_REGISTER_FIRST_NAME as string | undefined)?.trim() ||
    (email?.split('@')[0] ?? 'Teste');
  const last =
    (import.meta.env.VITE_DEV_REGISTER_LAST_NAME as string | undefined)?.trim() || 'Zaptro';

  return {
    email: email || '',
    password: password || '',
    first_name: first,
    last_name: last,
  };
}

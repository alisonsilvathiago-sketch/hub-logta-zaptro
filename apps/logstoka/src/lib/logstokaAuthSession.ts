import { supabase } from '@/lib/supabase';
import {
  buildLogstokaDemoProfile,
  buildLogstokaDemoUser,
  isLogstokaDemoLogin,
} from '@/lib/logstokaDemoAuth';

export const LOGSTOKA_SESSION_BOOT_FLAG = 'logstoka-session-boot';

const DEFAULT_SIGN_IN_TIMEOUT_MS = 6_000;

export function hasLogstokaMockSession(): boolean {
  return (
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem(LOGSTOKA_SESSION_BOOT_FLAG) === '1'
  );
}

export function grantLogstokaMockSession(): void {
  try {
    sessionStorage.setItem(LOGSTOKA_SESSION_BOOT_FLAG, '1');
  } catch {
    /* ignore */
  }
}

export function clearLogstokaMockSession(): void {
  try {
    sessionStorage.removeItem(LOGSTOKA_SESSION_BOOT_FLAG);
  } catch {
    /* ignore */
  }
}

export function buildLogstokaDemoSession() {
  const user = buildLogstokaDemoUser();
  return {
    user,
    profile: buildLogstokaDemoProfile(user.id),
  };
}

export async function signInWithPasswordWithTimeout(
  email: string,
  password: string,
  ms = DEFAULT_SIGN_IN_TIMEOUT_MS,
) {
  const signIn = supabase.auth.signInWithPassword({ email, password });
  const timedOut = new Promise<Awaited<typeof signIn>>((resolve) => {
    window.setTimeout(
      () =>
        resolve({
          data: { user: null, session: null },
          error: {
            name: 'AuthTimeout',
            message: 'Tempo esgotado ao conectar ao servidor de autenticação.',
          } as any,
        }),
      ms,
    );
  });
  return Promise.race([signIn, timedOut]);
}

export async function logstokaSignIn(email: string, password: string) {
  const emailNorm = email.trim().toLowerCase();

  if (isLogstokaDemoLogin(emailNorm, password)) {
    grantLogstokaMockSession();
    return { ok: true as const, demo: true as const };
  }

  const { data, error } = await signInWithPasswordWithTimeout(emailNorm, password);

  if (error) {
    if (isLogstokaDemoLogin(emailNorm, password)) {
      grantLogstokaMockSession();
      return { ok: true as const, demo: true as const };
    }
    return { ok: false as const, error };
  }

  if (data?.session) {
    grantLogstokaMockSession();
    return { ok: true as const, demo: false as const };
  }

  return { ok: false as const, error: new Error('Não foi possível iniciar a sessão.') };
}

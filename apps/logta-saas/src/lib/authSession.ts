import { supabase } from './supabase';
import { LOGTA_SESSION_BOOT_FLAG } from '../components/SessionBootLoader';

const DEFAULT_SIGN_IN_TIMEOUT_MS = 6_000;

/** Evita botão de login preso em loading quando o Supabase não responde. */
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

export function hasLogtaMockSession(): boolean {
  return (
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem(LOGTA_SESSION_BOOT_FLAG) === '1'
  );
}

/** Evita tela infinita quando Supabase demora ou está offline. */
export async function getSessionWithTimeout(ms = 4000) {
  const mock = hasLogtaMockSession();
  if (mock) {
    return { data: { session: null }, mock: true as const };
  }

  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
    ]);
    if (result === null) {
      return { data: { session: null }, timedOut: true as const };
    }
    return { ...result, mock: false as const };
  } catch {
    return { data: { session: null }, error: true as const };
  }
}

export function resolveHasSession(
  sessionUser: { id: string } | null | undefined,
  opts?: { mock?: boolean; allowDevFallback?: boolean },
): boolean {
  if (opts?.mock || hasLogtaMockSession()) return true;
  if (sessionUser) return true;
  if (opts?.allowDevFallback && import.meta.env.DEV) return true;
  return false;
}

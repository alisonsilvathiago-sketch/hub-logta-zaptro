import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { supabaseZaptro } from './supabase-zaptro';

/** Mesmo cliente Supabase (projeto único). */
export function isUnifiedZaptroSupabaseClient(): boolean {
  return supabaseZaptro === supabase;
}

/**
 * O registo (`/registre`) autentica em `supabaseZaptro`.
 * O `AuthContext` lê sessão de `supabase` (cookie `logta-auth-token`).
 * Se forem clientes diferentes, copia a sessão após login.
 */
export async function syncZaptroAuthToAppContext(session: Session | null): Promise<void> {
  if (!session || isUnifiedZaptroSupabaseClient()) return;
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
}

export function loginHintFromAuthError(message: string): string {
  const msg = message || '';
  if (/email not confirmed/i.test(msg)) {
    return 'Confirme o e-mail no link enviado pelo Supabase (ou desactive «Confirm email» no painel Auth → Providers, em dev).';
  }
  if (/invalid login credentials/i.test(msg)) {
    return 'E-mail ou senha não batem com o Supabase Auth. Use a mesma senha do /registre, recupere a senha abaixo, ou crie a conta em /registre.';
  }
  if (/user not found/i.test(msg)) {
    return 'Não existe utilizador com este e-mail. Conclua o cadastro em /registre.';
  }
  return msg || 'Confira e-mail e senha.';
}

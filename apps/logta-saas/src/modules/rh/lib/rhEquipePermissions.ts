import { resolveLogtaRole } from '../../../lib/logtaPermissions';

/** Cadastro e edição da equipe ficam com RH / gestão da transportadora. */
export function canManageRhEquipe(
  profile: { role?: string | null; cargo?: string | null; nivel_acesso?: number | null } | null,
): boolean {
  if (!profile) return false;
  const role = resolveLogtaRole(profile);
  if (role === 'admin' || role === 'gerente') return true;
  const label = `${profile.cargo || ''} ${profile.role || ''}`.toLowerCase();
  return (
    label.includes('rh') ||
    label.includes('recursos humanos') ||
    label.includes('recurso humano') ||
    label.includes('dp') ||
    label.includes('departamento pessoal')
  );
}

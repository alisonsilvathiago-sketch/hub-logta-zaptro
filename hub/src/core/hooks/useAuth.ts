import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  company_id: string | null;
  full_name: string | null;
}

/**
 * Hook de autenticação e proteção de rota.
 * Redireciona para /login se não houver sessão válida.
 * 
 * Uso:
 *   const { user, loading } = useAuth();
 *   const { user, loading } = useAuth(['MASTER', 'SUPER_ADMIN']); // restrito por role
 */
export function useAuth(requiredRoles?: string[]) {
  const navigate   = useNavigate();
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        // Verificar sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/', { replace: true });
          return;
        }

        // Buscar perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, company_id, full_name')
          .eq('id', session.user.id)
          .single();

        if (!profile) {
          await supabase.auth.signOut();
          navigate('/', { replace: true });
          return;
        }

        // Verificar role se restrito
        if (requiredRoles && !requiredRoles.includes(profile.role)) {
          navigate('/master', { replace: true }); // redireciona mas não desloga
          return;
        }

        setUser({
          id:         session.user.id,
          email:      session.user.email ?? '',
          role:       profile.role,
          company_id: profile.company_id,
          full_name:  profile.full_name,
        });
      } catch {
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    check();

    // Escutar mudanças de sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

/**
 * Verifica se o usuário tem acesso a um módulo específico
 */
export function hasAccess(role: string, module: 'zapto' | 'logtan' | 'hub' | 'backup'): boolean {
  const permissions: Record<string, string[]> = {
    MASTER:      ['zapto', 'logtan', 'hub', 'backup'],
    SUPER_ADMIN: ['zapto', 'logtan', 'hub', 'backup'],
    ADMIN:       ['zapto', 'logtan', 'backup'],
    SUPORTE:     ['zapto'],
    OPERADOR:    ['logtan'],
    COLABORADOR: ['backup'],
  };
  return permissions[role]?.includes(module) ?? false;
}

import { useEffect, useState } from 'react';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { type AgendaTeamMember, zaptroCollaboratorColor } from '../lib/zaptroAgendaCollaborators';

export function useZaptroAgendaTeam(companyId: string | null | undefined) {
  const [members, setMembers] = useState<AgendaTeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const { data, error } = await supabaseZaptro
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('company_id', companyId)
          .order('full_name');
        if (cancelled || error) return;
        setMembers(
          (data ?? []).map((row) => ({
            id: String(row.id),
            name: String(row.full_name || row.email || 'Colaborador').trim(),
            email: row.email ? String(row.email) : null,
            role: row.role ? String(row.role) : null,
            color: zaptroCollaboratorColor(String(row.id)),
          })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { members, loading };
}

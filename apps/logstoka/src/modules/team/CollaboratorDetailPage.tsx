import React from 'react';
import { useParams } from 'react-router-dom';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { getDemoCollaboratorById } from '@/lib/logstokaDemoTeam';

const CollaboratorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const person = id && isLogstokaDemoCompany(companyId) ? getDemoCollaboratorById(id) : null;

  if (!person) {
    return (
      <LogstokaDetailPageLayout backTo={LOGSTOKA_ROUTES.SETTINGS_TEAM} title="Colaborador" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-slate-500">Colaborador não encontrado.</div>
      </LogstokaDetailPageLayout>
    );
  }

  return (
    <LogstokaDetailPageLayout
      backTo={LOGSTOKA_ROUTES.SETTINGS_TEAM}
      backLabel="Voltar para equipe"
      title={person.name}
      subtitle={`${person.role} · ${person.department}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['E-mail', person.email],
          ['Telefone', person.phone || '—'],
          ['Status', person.status],
          ['Score operacional', String(person.score)],
          ['Movimentações hoje', String(person.movementsToday)],
          ['Admissão', person.hiredAt ? new Date(person.hiredAt).toLocaleDateString('pt-BR') : '—'],
        ].map(([label, value]) => (
          <div key={String(label)} className="ls-card py-4">
            <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
            <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </LogstokaDetailPageLayout>
  );
};

export default CollaboratorDetailPage;

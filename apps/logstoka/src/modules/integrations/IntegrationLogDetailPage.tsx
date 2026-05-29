import React from 'react';
import { useParams } from 'react-router-dom';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { getDemoIntegrationLogById } from '@/lib/logstokaDemoSeed';

const IntegrationLogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const log = id && isLogstokaDemoCompany(companyId) ? getDemoIntegrationLogById(id) : null;

  if (!log) {
    return (
      <LogstokaDetailPageLayout backTo={LOGSTOKA_ROUTES.SETTINGS_API} title="Log de integração" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-slate-500">Log não encontrado.</div>
      </LogstokaDetailPageLayout>
    );
  }

  return (
    <LogstokaDetailPageLayout
      backTo={LOGSTOKA_ROUTES.SETTINGS_API}
      backLabel="Voltar para API e Webhooks"
      title={log.endpoint ?? 'Integração'}
      subtitle={`${log.direction} · ${log.status}`}
    >
      <div className="ls-card space-y-3 text-sm">
        <p>
          <span className="text-slate-500">Direção:</span> <strong>{log.direction}</strong>
        </p>
        <p>
          <span className="text-slate-500">Endpoint:</span> <strong>{log.endpoint}</strong>
        </p>
        <p>
          <span className="text-slate-500">Status:</span> <strong>{log.status}</strong>
        </p>
        <p>
          <span className="text-slate-500">Data:</span> {new Date(log.created_at).toLocaleString('pt-BR')}
        </p>
      </div>
    </LogstokaDetailPageLayout>
  );
};

export default IntegrationLogDetailPage;

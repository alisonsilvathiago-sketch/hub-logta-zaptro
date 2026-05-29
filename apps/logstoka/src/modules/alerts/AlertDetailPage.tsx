import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { getDemoAlertById } from '@/lib/logstokaDemoSeed';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

type Props = { embedded?: boolean };

const AlertDetailPage: React.FC<Props> = ({ embedded }) => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const alert = id && isLogstokaDemoCompany(companyId) ? getDemoAlertById(id) : null;
  const backTo = `${LOGSTOKA_ROUTES.SETTINGS_NOTIFICATIONS}?tab=alertas`;

  if (!alert) {
    if (embedded) {
      return (
        <div className="space-y-4">
          <Link to={backTo} className="text-sm font-bold text-orange-700">← Voltar para alertas</Link>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-slate-500">Alerta não encontrado.</div>
        </div>
      );
    }
    return (
      <LogstokaDetailPageLayout backTo={backTo} title="Alerta" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-slate-500">Alerta não encontrado.</div>
      </LogstokaDetailPageLayout>
    );
  }

  const content = (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">{alert.message}</p>
      <div className="flex flex-wrap gap-2">
        <span className="ls-badge bg-orange-50 text-orange-700">{alert.severity}</span>
        <span className="ls-badge bg-slate-100">{alert.is_read ? 'Lido' : 'Não lido'}</span>
      </div>
      <p className="text-xs text-slate-400">{new Date(alert.created_at).toLocaleString('pt-BR')}</p>
    </div>
  );

  if (embedded) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-100 pb-6">
          <Link to={backTo} className="text-sm font-bold text-orange-700">← Voltar para alertas</Link>
          <h2 className="mt-3 text-xl font-black text-gray-900">{alert.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{alert.alert_type}</p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <LogstokaDetailPageLayout
      backTo={backTo}
      backLabel="Voltar para alertas"
      title={alert.title}
      subtitle={alert.alert_type}
    >
      <div className="ls-card">{content}</div>
    </LogstokaDetailPageLayout>
  );
};

export default AlertDetailPage;

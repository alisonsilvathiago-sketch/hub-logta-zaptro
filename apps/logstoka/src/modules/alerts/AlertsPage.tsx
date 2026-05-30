import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAlerts } from '@/hooks/useLogstokaData';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import type { LsAlert } from '@/types';

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { companyId } = useLogstokaTenant();
  const { alerts: initialAlerts } = useAlerts();
  const [alerts, setAlerts] = useState<LsAlert[]>(initialAlerts);

  useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);

  const markRead = async (id: string) => {
    if (isLogstokaDemoCompany(companyId)) {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
      toast.success('[Demo] Alerta marcado como lido');
      return;
    }
    await supabase.from('ls_alerts').update({ is_read: true }).eq('id', id);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={LOGSTOKA_PAGE_TITLE_CLASS}>Alertas & Notificações</h2>
        <p className="text-sm text-slate-500">Ruptura, mínimo, divergências e pendências</p>
      </div>
      <div className="space-y-3">
        {alerts.length === 0 && <div className="ls-card text-sm text-slate-500">Nenhum alerta ativo.</div>}
        {alerts.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => navigate(`/app/alerts/${a.id}`)}
            className={`ls-card flex w-full cursor-pointer items-start justify-between gap-4 text-left transition hover:border-orange-200 ${!a.is_read ? 'border-orange-200 bg-orange-50/30' : ''}`}
          >
            <div>
              <p className="font-black text-slate-900">{a.title}</p>
              <p className="text-sm text-slate-500">{a.message}</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(a.created_at).toLocaleString('pt-BR')}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`ls-badge ${a.severity === 'critical' ? 'bg-rose-50 text-rose-700' : a.severity === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-orange-50 text-orange-700'}`}>
                {a.severity}
              </span>
              {!a.is_read && (
                <button
                  type="button"
                  className="text-xs font-bold text-orange-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    void markRead(a.id);
                  }}
                >
                  Marcar lido
                </button>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AlertsPage;

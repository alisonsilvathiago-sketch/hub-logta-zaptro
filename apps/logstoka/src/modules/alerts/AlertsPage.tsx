import React from 'react';
import { supabase } from '@/lib/supabase';
import { useAlerts } from '@/hooks/useLogstokaData';

const AlertsPage: React.FC = () => {
  const { alerts } = useAlerts();

  const markRead = async (id: string) => {
    await supabase.from('ls_alerts').update({ is_read: true }).eq('id', id);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">Alertas & Notificações</h2>
        <p className="text-sm text-slate-500">Ruptura, mínimo, divergências e pendências</p>
      </div>
      <div className="space-y-3">
        {alerts.length === 0 && <div className="ls-card text-sm text-slate-500">Nenhum alerta ativo.</div>}
        {alerts.map((a) => (
          <div key={a.id} className={`ls-card flex items-start justify-between gap-4 ${!a.is_read ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
            <div>
              <p className="font-black text-slate-900">{a.title}</p>
              <p className="text-sm text-slate-500">{a.message}</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(a.created_at).toLocaleString('pt-BR')}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`ls-badge ${a.severity === 'critical' ? 'bg-rose-50 text-rose-700' : a.severity === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                {a.severity}
              </span>
              {!a.is_read && (
                <button type="button" className="text-xs font-bold text-emerald-700" onClick={() => void markRead(a.id)}>
                  Marcar lido
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsPage;

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAlerts } from '@/hooks/useLogstokaData';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { SETTINGS_BASE } from '@/modules/settings/settingsNav';
import type { LsAlert } from '@/types';

type Tab = 'preferencias' | 'alertas';

const SettingsNotificationsPanel: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'alertas' ? 'alertas' : 'preferencias';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyWebhook, setNotifyWebhook] = useState(false);

  const { companyId } = useLogstokaTenant();
  const { alerts: initialAlerts } = useAlerts();
  const [alerts, setAlerts] = useState<LsAlert[]>(initialAlerts);

  useEffect(() => {
    if (searchParams.get('tab') === 'alertas') setTab('alertas');
  }, [searchParams]);

  useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);

  const save = () => toast.success('[Demo] Preferências de notificação salvas');

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
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-black text-gray-900">Notificações</h2>
        <p className="mt-1 text-sm text-gray-500">Preferências de aviso e alertas operacionais do WMS.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('preferencias')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'preferencias' ? 'bg-orange-600 text-white' : 'bg-gray-50 ring-1 ring-slate-200'}`}
        >
          Preferências
        </button>
        <button
          type="button"
          onClick={() => setTab('alertas')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'alertas' ? 'bg-orange-600 text-white' : 'bg-gray-50 ring-1 ring-slate-200'}`}
        >
          Alertas
          {alerts.filter((a) => !a.is_read).length > 0 && (
            <span className="ml-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-xs font-black">
              {alerts.filter((a) => !a.is_read).length}
            </span>
          )}
        </button>
      </div>

      {tab === 'preferencias' && (
        <div className="space-y-6">
          {[
            { label: 'E-mail operacional', desc: 'Ruptura, mínimo e divergências de inventário', checked: notifyEmail, onChange: setNotifyEmail },
            { label: 'Push no app', desc: 'Pedidos pagos, webhooks e transferências', checked: notifyPush, onChange: setNotifyPush },
            { label: 'Falhas de webhook', desc: 'Aviso imediato quando integração falhar', checked: notifyWebhook, onChange: setNotifyWebhook },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div>
                <p className="font-black text-gray-900">{row.label}</p>
                <p className="text-sm text-gray-500">{row.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={row.checked}
                onClick={() => row.onChange(!row.checked)}
                className={`h-8 w-14 rounded-full transition ${row.checked ? 'bg-orange-600' : 'bg-gray-300'}`}
              >
                <span
                  className={`block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition ${row.checked ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>
          ))}

          <div className="flex justify-end">
            <button type="button" className="ls-btn-primary" onClick={save}>Salvar preferências</button>
          </div>
        </div>
      )}

      {tab === 'alertas' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Ruptura, mínimo, divergências e pendências operacionais.</p>
          {alerts.length === 0 && <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-slate-500">Nenhum alerta ativo.</div>}
          {alerts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate(`${SETTINGS_BASE}/notificacoes/${a.id}`)}
              className={`flex w-full cursor-pointer items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left transition hover:border-orange-200 ${!a.is_read ? 'border-orange-200 bg-orange-50/30' : ''}`}
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
      )}
    </div>
  );
};

export default SettingsNotificationsPanel;

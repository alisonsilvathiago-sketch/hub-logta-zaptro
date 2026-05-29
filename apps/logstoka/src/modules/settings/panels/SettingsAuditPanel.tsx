import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEMO_INTERACTIONS } from '@/lib/logstokaDemoTeam';

type Tab = 'auditoria' | 'interacoes';

const statusClass: Record<string, string> = {
  success: 'bg-orange-50 text-orange-700',
  warning: 'bg-amber-50 text-amber-700',
  pending: 'bg-gray-100 text-gray-600',
};

const DEMO_AUDIT = [
  { id: '1', action: 'Ajuste de estoque', user: 'Ana Silva', at: '29/05/2026 14:32', detail: 'SKU-8841 · +12 un · Inventário #INV-042' },
  { id: '2', action: 'Permissão alterada', user: 'Admin', at: '29/05/2026 11:05', detail: 'Carlos → Operador WMS' },
  { id: '3', action: 'Webhook configurado', user: 'TI', at: '28/05/2026 18:40', detail: 'stock.changed → ERP Logta' },
];

const SettingsAuditPanel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'interacoes' ? 'interacoes' : 'auditoria';
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    if (searchParams.get('tab') === 'interacoes') setTab('interacoes');
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-black text-gray-900">Auditoria e Logs</h2>
        <p className="mt-1 text-sm text-gray-500">Trilha administrativa e timeline de interações com APIs e marketplaces.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('auditoria')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'auditoria' ? 'bg-orange-600 text-white' : 'bg-gray-50 ring-1 ring-slate-200'}`}
        >
          Auditoria
        </button>
        <button
          type="button"
          onClick={() => setTab('interacoes')}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'interacoes' ? 'bg-orange-600 text-white' : 'bg-gray-50 ring-1 ring-slate-200'}`}
        >
          Interações
        </button>
      </div>

      {tab === 'auditoria' && (
        <div className="space-y-3">
          {DEMO_AUDIT.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-gray-900">{item.action}</p>
                  <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.user} · {item.at}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'interacoes' && (
        <div className="space-y-3">
          {DEMO_INTERACTIONS.map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`ls-badge uppercase ${statusClass[item.status]}`}>{item.type}</span>
                    <span className="text-[10px] font-bold text-gray-400">{item.at}</span>
                  </div>
                  <p className="text-sm font-black text-gray-900">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
                </div>
                <span className={`ls-badge ${statusClass[item.status]}`}>
                  {item.status === 'success' ? 'OK' : item.status === 'warning' ? 'Atenção' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SettingsAuditPanel;

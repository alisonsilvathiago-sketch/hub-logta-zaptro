import React from 'react';
import { LogstokaStandardPageLayout } from '@/components/layout/LogstokaStandardPageLayout';
import { DEMO_INTERACTIONS } from '@/lib/logstokaDemoTeam';

const statusClass: Record<string, string> = {
  success: 'bg-orange-50 text-orange-700',
  warning: 'bg-amber-50 text-amber-700',
  pending: 'bg-gray-100 text-gray-600',
};

const InteractionsPage: React.FC = () => (
  <LogstokaStandardPageLayout
    title="Interações"
    subtitle="APIs, webhooks, workflows e eventos entre LogStoka e marketplaces"
    kpis={[
      { label: 'Webhooks hoje', value: '28' },
      { label: 'APIs ativas', value: '5' },
      { label: 'Workflows', value: '12' },
      { label: 'Falhas', value: '1' },
    ]}
    mainContentTitle="Timeline de eventos"
  >
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
  </LogstokaStandardPageLayout>
);

export default InteractionsPage;

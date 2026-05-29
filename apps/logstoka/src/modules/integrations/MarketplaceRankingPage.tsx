import React from 'react';
import { Link } from 'react-router-dom';
import { LogstokaStandardPageLayout } from '@/components/layout/LogstokaStandardPageLayout';
import { DEMO_MARKETPLACE_RANKING } from '@/lib/logstokaDemoTeam';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

type Props = { embedded?: boolean };

const rankingContent = (
  <div className="space-y-3">
    {DEMO_MARKETPLACE_RANKING.map((m) => (
      <div key={m.key} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600 text-lg font-black text-white">
              #{m.rank}
            </span>
            <div>
              <p className="text-base font-black text-gray-900">{m.label}</p>
              <p className="text-xs text-gray-500">{m.orders} pedidos · sync {m.sync}%</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-orange-600">
              {m.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-[10px] font-bold uppercase text-gray-400">GMV estimado</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-orange-500" style={{ width: `${m.sync}%` }} />
        </div>
      </div>
    ))}
  </div>
);

const MarketplaceRankingPage: React.FC<Props> = ({ embedded }) => {
  if (embedded) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900">Ranking por marketplace</h2>
            <p className="mt-1 text-sm text-gray-500">Volume e GMV por canal de venda.</p>
          </div>
          <Link to={LOGSTOKA_ROUTES.SETTINGS_INTEGRATIONS} className="ls-btn-secondary">
            Voltar para integrações
          </Link>
        </div>
        {rankingContent}
      </div>
    );
  }

  return (
    <LogstokaStandardPageLayout
      title="Marketplaces"
      subtitle="Ranking de canais e-commerce configurados na empresa"
      headerAction={
        <Link to={LOGSTOKA_ROUTES.SETTINGS_API} className="ls-btn-secondary">
          API e Webhooks
        </Link>
      }
      mainContentTitle="Ranking por volume"
    >
      {rankingContent}
    </LogstokaStandardPageLayout>
  );
};

export default MarketplaceRankingPage;

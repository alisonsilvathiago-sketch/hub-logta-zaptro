import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { LogstokaStandardPageLayout } from '@/components/layout/LogstokaStandardPageLayout';
import { DEMO_COLLABORATORS } from '@/lib/logstokaDemoTeam';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

const ranked = [...DEMO_COLLABORATORS].sort((a, b) => b.score - a.score);

type Props = { embedded?: boolean };

const rankingList = (
  <div className="space-y-3">
    {ranked.map((c, index) => (
      <div
        key={c.id}
        className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black ${
            index === 0
              ? 'bg-orange-600 text-white'
              : index === 1
                ? 'bg-gray-900 text-white'
                : 'bg-orange-50 text-orange-700'
          }`}
        >
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-gray-900">{c.name}</p>
          <p className="text-xs text-gray-500">
            {c.role} · {c.department}
          </p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-xl font-black text-orange-600">
            {index === 0 ? <Trophy size={18} /> : null}
            {c.score}
          </p>
          <p className="text-[10px] font-bold uppercase text-gray-400">{c.movementsToday} mov. hoje</p>
        </div>
      </div>
    ))}
  </div>
);

const TeamRankingPage: React.FC<Props> = ({ embedded }) => {
  if (embedded) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900">Ranking operacional</h2>
            <p className="mt-1 text-sm text-gray-500">Desempenho da equipe WMS.</p>
          </div>
          <Link to={LOGSTOKA_ROUTES.SETTINGS_TEAM} className="ls-btn-secondary">
            Voltar para equipe
          </Link>
        </div>
        {rankingList}
      </div>
    );
  }

  return (
    <LogstokaStandardPageLayout
      title="Ranking operacional"
      subtitle="Desempenho da equipe WMS — movimentações, acurácia e produtividade"
      mainContentTitle="Top colaboradores"
    >
      {rankingList}
    </LogstokaStandardPageLayout>
  );
};

export default TeamRankingPage;

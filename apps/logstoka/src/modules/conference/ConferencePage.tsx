import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Scale } from 'lucide-react';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_CONFERENCE } from '@/lib/logstokaDemoSeed';
import { marketplaceStorePath } from '@/lib/marketplaceStores';
import { MARKETPLACE_LABELS } from '@/types';
import type { Marketplace } from '@/types';
import { supabase } from '@/lib/supabase';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';

const ConferencePage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [stats, setStats] = useState<Record<string, { sold: number; exit: number; returned: number; damaged: number }>>({});

  useEffect(() => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      setStats(DEMO_CONFERENCE);
      return;
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    void supabase
      .from('ls_stock_movements')
      .select('movement_type, marketplace, total_quantity')
      .eq('company_id', companyId)
      .gte('created_at', start.toISOString())
      .then((res) => {
        const map: typeof stats = {};
        for (const row of res.data ?? []) {
          const mp = (row.marketplace as Marketplace) || 'shopee';
          if (!map[mp]) map[mp] = { sold: 0, exit: 0, returned: 0, damaged: 0 };
          const q = Number(row.total_quantity ?? 0);
          if (row.movement_type === 'exit') {
            map[mp].sold += q;
            map[mp].exit += q;
          }
          if (row.movement_type === 'return') map[mp].returned += q;
          if (row.movement_type === 'damage') map[mp].damaged += q;
        }
        setStats(map);
      });
  }, [companyId]);

  const marketplaces = Object.keys(MARKETPLACE_LABELS) as Marketplace[];

  const totals = useMemo(() => {
    let sold = 0;
    let returned = 0;
    let divergences = 0;
    let active = 0;
    for (const mp of marketplaces) {
      const s = stats[mp] ?? { sold: 0, exit: 0, returned: 0, damaged: 0 };
      sold += s.sold;
      returned += s.returned;
      const divergence = s.sold - s.exit - s.returned - s.damaged;
      if (divergence !== 0) divergences += 1;
      if (s.sold > 0 || s.exit > 0 || s.returned > 0 || s.damaged > 0) active += 1;
    }
    return { sold, returned, divergences, active };
  }, [marketplaces, stats]);

  return (
    <div className="space-y-6">
      <div className="ls-movement-scan__page-header !border-0 !px-0 !pb-0">
        <h2 className="ls-movement-scan__page-title">
          <span className="ls-movement-scan__page-title-icon">
            <Scale size={20} strokeWidth={2.25} aria-hidden />
          </span>
          Centro de Conferência
        </h2>
      </div>

      <LogstokaKpiStrip
        items={[
          { label: 'Vendido hoje', value: totals.sold.toLocaleString('pt-BR') },
          { label: 'Devolvido hoje', value: totals.returned.toLocaleString('pt-BR') },
          { label: 'Canais ativos', value: totals.active },
          { label: 'Divergências', value: totals.divergences },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {marketplaces.map((mp) => {
          const s = stats[mp] ?? { sold: 0, exit: 0, returned: 0, damaged: 0 };
          const divergence = s.sold - s.exit - s.returned - s.damaged;
          const hasActivity = s.sold > 0 || s.exit > 0 || s.returned > 0 || s.damaged > 0;
          const hasDivergence = divergence !== 0;

          return (
            <Link
              key={mp}
              to={marketplaceStorePath(mp)}
              className={`ls-card group block transition-all hover:border-orange-200 hover:shadow-md ${
                hasDivergence
                  ? 'border-rose-200 ring-1 ring-rose-100'
                  : hasActivity
                    ? 'border-orange-100 ring-1 ring-orange-50'
                    : 'opacity-90 hover:opacity-100'
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex min-w-0 items-center gap-2.5 font-black text-[#383838]">
                  <MarketplaceLogo marketplace={mp} size={32} />
                  <span className="truncate">{MARKETPLACE_LABELS[mp]}</span>
                </h3>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                    hasDivergence
                      ? 'bg-rose-50 text-rose-700'
                      : hasActivity
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {hasDivergence ? 'Divergência' : hasActivity ? 'Ativo' : 'Sem movimento'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Vendido', s.sold],
                  ['Expedido', s.exit],
                  ['Devolvido', s.returned],
                  ['Avariado', s.damaged],
                  ['Divergência', divergence],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className={`rounded-xl p-3 ${label === 'Divergência' && Number(value) !== 0 ? 'bg-rose-50' : 'bg-slate-50'}`}
                  >
                    <p className="text-xs font-bold text-[#828282]">{label}</p>
                    <p className={`text-lg font-black ${label === 'Divergência' && Number(value) !== 0 ? 'text-rose-600' : 'text-[#383838]'}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-4 flex items-center gap-1 text-xs font-bold text-orange-700 opacity-0 transition-opacity group-hover:opacity-100">
                Abrir hub
                <ChevronRight size={14} strokeWidth={2.5} aria-hidden />
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ConferencePage;

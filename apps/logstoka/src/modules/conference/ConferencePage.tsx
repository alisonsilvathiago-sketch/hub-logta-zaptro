import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { MARKETPLACE_LABELS } from '@/types';
import type { Marketplace } from '@/types';

const ConferencePage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [stats, setStats] = useState<Record<string, { sold: number; exit: number; returned: number; damaged: number }>>({});

  useEffect(() => {
    if (!companyId) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    void supabase
      .from('ls_stock_movements')
      .select('movement_type, marketplace, total_quantity')
      .eq('company_id', companyId)
      .gte('created_at', start.toISOString())
      .then(({ data }) => {
        const map: typeof stats = {};
        for (const row of data ?? []) {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">Centro de Conferência</h2>
        <p className="text-sm text-slate-500">Conferência diária com divergências automáticas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {marketplaces.map((mp) => {
          const s = stats[mp] ?? { sold: 0, exit: 0, returned: 0, damaged: 0 };
          const divergence = s.sold - s.exit - s.returned - s.damaged;
          return (
            <div key={mp} className="ls-card">
              <h3 className="mb-3 font-black">{MARKETPLACE_LABELS[mp]}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['Vendido', s.sold],
                  ['Expedido', s.exit],
                  ['Devolvido', s.returned],
                  ['Avariado', s.damaged],
                  ['Divergência', divergence],
                ].map(([label, value]) => (
                  <div key={String(label)} className={`rounded-xl p-3 ${label === 'Divergência' && Number(value) !== 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                    <p className="text-xs font-bold text-slate-500">{label}</p>
                    <p className={`text-lg font-black ${label === 'Divergência' && Number(value) !== 0 ? 'text-rose-600' : ''}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConferencePage;

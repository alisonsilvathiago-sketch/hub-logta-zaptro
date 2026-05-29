import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { MARKETPLACE_LABELS } from '@/types';

const ReportsPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [period, setPeriod] = useState(30);
  const [exitsByMp, setExitsByMp] = useState<Record<string, number>>({});
  const [entries, setEntries] = useState(0);
  const [topProducts, setTopProducts] = useState<Array<{ sku: string; name: string; qty: number }>>([]);

  useEffect(() => {
    if (!companyId) return;
    const since = new Date();
    since.setDate(since.getDate() - period);

    void supabase
      .from('ls_stock_movements')
      .select('movement_type, marketplace, total_quantity')
      .eq('company_id', companyId)
      .gte('created_at', since.toISOString())
      .then(({ data }) => {
        const mp: Record<string, number> = {};
        let ent = 0;
        for (const row of data ?? []) {
          if (row.movement_type === 'entry') ent += Number(row.total_quantity ?? 0);
          if (row.movement_type === 'exit' && row.marketplace) {
            mp[row.marketplace] = (mp[row.marketplace] ?? 0) + Number(row.total_quantity ?? 0);
          }
        }
        setEntries(ent);
        setExitsByMp(mp);
      });

    void supabase
      .from('ls_stock_movement_items')
      .select('sku, quantity, ls_products(name), ls_stock_movements!inner(company_id, movement_type, created_at)')
      .eq('ls_stock_movements.company_id', companyId)
      .eq('ls_stock_movements.movement_type', 'exit')
      .gte('ls_stock_movements.created_at', since.toISOString())
      .then(({ data }) => {
        const map = new Map<string, { sku: string; name: string; qty: number }>();
        for (const row of data ?? []) {
          const sku = row.sku as string;
          const name = (row as { ls_products?: { name: string } }).ls_products?.name ?? sku;
          const prev = map.get(sku) ?? { sku, name, qty: 0 };
          prev.qty += Number(row.quantity ?? 0);
          map.set(sku, prev);
        }
        setTopProducts([...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 10));
      });
  }, [companyId, period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Relatórios</h2>
          <p className="text-sm text-slate-500">Saídas por canal, entradas e curva ABC simplificada</p>
        </div>
        <select className="ls-input w-auto" value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
          <option value={7}>7 dias</option>
          <option value={30}>30 dias</option>
          <option value={90}>90 dias</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="ls-stat">
          <p className="text-xs font-bold uppercase text-slate-500">Entradas (un.)</p>
          <p className="text-3xl font-black">{entries}</p>
        </div>
        {Object.entries(exitsByMp).map(([mp, qty]) => (
          <div key={mp} className="ls-stat">
            <p className="text-xs font-bold uppercase text-slate-500">Saídas {MARKETPLACE_LABELS[mp as keyof typeof MARKETPLACE_LABELS] ?? mp}</p>
            <p className="text-3xl font-black">{qty}</p>
          </div>
        ))}
      </div>

      <div className="ls-card">
        <h3 className="mb-4 font-black">Top produtos vendidos (Curva ABC)</h3>
        <div className="ls-table-wrap border-0">
          <table className="ls-table">
            <thead><tr><th>#</th><th>SKU</th><th>Produto</th><th>Quantidade</th></tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.sku}>
                  <td>{i + 1}</td>
                  <td className="font-bold">{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { getDemoReports } from '@/lib/logstokaDemoSeed';
import { MARKETPLACE_LABELS } from '@/types';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useTablePagination } from '@/hooks/useTablePagination';

const ReportsPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [period, setPeriod] = useState(30);
  const [exitsByMp, setExitsByMp] = useState<Record<string, number>>({});
  const [entries, setEntries] = useState(0);
  const [topProducts, setTopProducts] = useState<Array<{ sku: string; name: string; qty: number }>>([]);
  const { paginatedItems, footerProps } = useTablePagination(topProducts, 10, period);

  useEffect(() => {
    if (!companyId) return;

    if (isLogstokaDemoCompany(companyId)) {
      const demo = getDemoReports(period);
      setEntries(demo.entries);
      setExitsByMp(demo.exitsByMp);
      setTopProducts(demo.topProducts);
      return;
    }

    const since = new Date();
    since.setDate(since.getDate() - period);

    void supabase
      .from('ls_stock_movements')
      .select('movement_type, marketplace, total_quantity')
      .eq('company_id', companyId)
      .gte('created_at', since.toISOString())
      .then((res) => {
        const mp: Record<string, number> = {};
        let ent = 0;
        for (const row of res.data ?? []) {
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
      .then((res) => {
        const map = new Map<string, { sku: string; name: string; qty: number }>();
        for (const row of res.data ?? []) {
          const sku = row.sku as string;
          const name =
            (row as { ls_products?: { name?: string } | { name?: string }[] | null }).ls_products &&
            !Array.isArray((row as { ls_products?: unknown }).ls_products)
              ? ((row as { ls_products?: { name?: string } }).ls_products?.name ?? sku)
              : sku;
          const prev = map.get(sku) ?? { sku, name, qty: 0 };
          prev.qty += Number(row.quantity ?? 0);
          map.set(sku, prev);
        }
        setTopProducts([...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 10));
      });
  }, [companyId, period]);

  const totalExits = useMemo(() => Object.values(exitsByMp).reduce((sum, qty) => sum + qty, 0), [exitsByMp]);
  const activeChannels = Object.keys(exitsByMp).length;
  const topChannel = useMemo(() => {
    const entries = Object.entries(exitsByMp);
    if (!entries.length) return '—';
    const [mp] = entries.sort((a, b) => b[1] - a[1])[0]!;
    return MARKETPLACE_LABELS[mp as keyof typeof MARKETPLACE_LABELS] ?? mp;
  }, [exitsByMp]);

  return (
    <div className="space-y-6">
      <LogstokaPageHeader
        eyebrow="Análises"
        icon={<BarChart3 size={20} strokeWidth={2.25} />}
        title="Relatórios"
        subtitle="Entradas, saídas por canal e curva ABC de produtos no período selecionado."
        actions={
          <select className="ls-input w-auto min-w-[140px]" value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
          </select>
        }
      />

      <LogstokaKpiStrip
        items={[
          { label: 'Entradas (un.)', value: entries.toLocaleString('pt-BR'), icon: <TrendingUp size={56} /> },
          { label: 'Saídas (un.)', value: totalExits.toLocaleString('pt-BR'), icon: <BarChart3 size={56} /> },
          { label: 'Canais ativos', value: activeChannels, icon: <BarChart3 size={56} /> },
          { label: 'Top canal', value: topChannel, hint: `Período ${period} dias` },
        ]}
      />

      <section className="ls-page-table">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h3 className="text-[15px] font-black uppercase tracking-widest text-[#828282]">Curva ABC — top produtos</h3>
            <p className="mt-1 text-sm text-[#a3a3a3]">Saídas por canal, entradas e ranking simplificado</p>
          </div>
        </div>

        {Object.keys(exitsByMp).length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-3 px-1">
            {Object.entries(exitsByMp).map(([mp, qty]) => (
              <div key={mp} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#828282]">
                  Saídas {MARKETPLACE_LABELS[mp as keyof typeof MARKETPLACE_LABELS] ?? mp}
                </p>
                <p className="mt-1 text-xl font-black text-[#383838]">{Number(qty).toLocaleString('pt-BR')}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="ls-table-wrap">
          <table className="ls-table">
            <thead>
              <tr>
                <th>#</th>
                <th>SKU</th>
                <th>Produto</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((p, i) => (
                <tr key={p.sku}>
                  <td>{(footerProps.page - 1) * footerProps.pageSize + i + 1}</td>
                  <td className="font-bold">{p.sku}</td>
                  <td>{p.name}</td>
                  <td className="font-black text-orange-700">{p.qty.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LogstokaTableFooter {...footerProps} hidden={topProducts.length === 0} itemLabel="produtos" />
      </section>
    </div>
  );
};

export default ReportsPage;

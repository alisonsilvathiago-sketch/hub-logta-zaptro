import React, { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  RefreshCw,
  TrendingDown,
  Undo2,
} from 'lucide-react';
import { useDashboardSummary, useAlerts } from '@/hooks/useLogstokaData';
import { logstokaApi } from '@/lib/logstokaApi';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: 'emerald' | 'blue' | 'amber' | 'rose';
}> = ({ label, value, icon, tone = 'emerald' }) => {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className="ls-stat">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
        <div className={`rounded-xl p-2 ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const { summary, loading, reload } = useDashboardSummary();
  const { alerts } = useAlerts();
  const [replenishment, setReplenishment] = useState<Array<{ sku: string; name: string; suggested_purchase: number }>>([]);
  const [stale, setStale] = useState({ days30: 0, days60: 0, days90: 0 });

  useEffect(() => {
    void logstokaApi.getReplenishment().then((r) => setReplenishment((r.data ?? []) as typeof replenishment)).catch(() => undefined);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const checkStale = async (days: number) => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data: products } = await supabase.from('ls_products').select('id').eq('company_id', companyId).eq('status', 'active');
      if (!products?.length) return 0;
      const { data: moved } = await supabase
        .from('ls_stock_movement_items')
        .select('product_id, ls_stock_movements!inner(created_at, company_id)')
        .eq('ls_stock_movements.company_id', companyId)
        .gte('ls_stock_movements.created_at', since.toISOString());
      const movedIds = new Set((moved ?? []).map((m) => m.product_id));
      return products.filter((p) => !movedIds.has(p.id)).length;
    };
    void Promise.all([checkStale(30), checkStale(60), checkStale(90)]).then(([d30, d60, d90]) =>
      setStale({ days30: d30, days60: d60, days90: d90 }),
    );
  }, [companyId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Dashboard Operacional</h2>
          <p className="text-sm text-slate-500">Visão em tempo real da operação multicanal</p>
        </div>
        <button type="button" className="ls-btn-secondary" onClick={() => void reload()}>
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-500">Hoje</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Entradas" value={loading ? '…' : summary.today.entries} icon={<ArrowDownToLine size={18} />} tone="emerald" />
          <StatCard label="Saídas" value={loading ? '…' : summary.today.exits} icon={<ArrowUpFromLine size={18} />} tone="blue" />
          <StatCard label="Transferências" value={loading ? '…' : summary.today.transfers} icon={<Package size={18} />} tone="amber" />
          <StatCard label="Devoluções" value={loading ? '…' : summary.today.returns} icon={<Undo2 size={18} />} tone="rose" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="ls-card lg:col-span-2">
          <h3 className="mb-4 text-lg font-black">Estoque atual</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Quantidade total</p>
              <p className="mt-1 text-3xl font-black">{loading ? '…' : summary.stock.totalQuantity.toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Valor estocado</p>
              <p className="mt-1 text-3xl font-black">
                {loading ? '…' : summary.stock.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
        <div className="ls-card">
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown size={18} className="text-amber-600" />
            <h3 className="text-lg font-black">Abaixo do mínimo</h3>
          </div>
          <p className="text-4xl font-black text-amber-600">{loading ? '…' : summary.lowStockCount}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="ls-card">
          <h3 className="mb-3 text-lg font-black">Centro de reposição</h3>
          <div className="space-y-2">
            {replenishment.length === 0 && <p className="text-sm text-slate-500">Nenhuma reposição sugerida.</p>}
            {replenishment.slice(0, 5).map((r) => (
              <div key={r.sku} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span><strong>{r.sku}</strong> — {r.name}</span>
                <span className="font-bold text-emerald-700">+{r.suggested_purchase}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ls-card">
          <h3 className="mb-3 text-lg font-black">Produtos sem movimentação</h3>
          <div className="grid grid-cols-3 gap-3">
            {[30, 60, 90].map((days) => (
              <div key={days} className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xs font-bold text-slate-500">{days} dias</p>
                <p className="text-xl font-black">{stale[`days${days}` as keyof typeof stale]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ls-card">
        <h3 className="mb-3 text-lg font-black">Alertas recentes</h3>
        <div className="space-y-2">
          {alerts.length === 0 && <p className="text-sm text-slate-500">Nenhum alerta no momento.</p>}
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="rounded-xl border border-slate-100 px-3 py-2">
              <p className="text-sm font-bold">{alert.title}</p>
              <p className="text-xs text-slate-500">{alert.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;

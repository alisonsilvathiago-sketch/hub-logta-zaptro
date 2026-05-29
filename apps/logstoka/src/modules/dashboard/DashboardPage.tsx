import React, { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  RefreshCw,
  TrendingDown,
  Undo2,
} from 'lucide-react';
import { LogstokaStandardPageLayout } from '@/components/layout/LogstokaStandardPageLayout';
import { useDashboardSummary, useAlerts } from '@/hooks/useLogstokaData';
import { logstokaApi } from '@/lib/logstokaApi';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_AI_BRIEFING, DEMO_DASHBOARD, DEMO_REPLENISHMENT } from '@/lib/logstokaDemoSeed';

const DashboardPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const { summary, loading, reload } = useDashboardSummary();
  const { alerts } = useAlerts();
  const [replenishment, setReplenishment] = useState<Array<{ sku: string; name: string; suggested_purchase: number }>>([]);
  const [stale, setStale] = useState({ days30: 0, days60: 0, days90: 0 });
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);

  useEffect(() => {
    if (isLogstokaDemoCompany(companyId)) {
      setReplenishment(DEMO_REPLENISHMENT);
      return;
    }
    void logstokaApi.getReplenishment().then((r) => setReplenishment((r.data ?? []) as typeof replenishment)).catch(() => undefined);
  }, [companyId]);

  useEffect(() => {
    if (isLogstokaDemoCompany(companyId)) {
      setAiBriefing(DEMO_AI_BRIEFING);
      return;
    }
    void logstokaApi.aiDailyBriefing()
      .then((r) => setAiBriefing(r.briefing))
      .catch(() => setAiBriefing(null));
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      setStale(DEMO_DASHBOARD.staleProducts);
      return;
    }
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
    <LogstokaStandardPageLayout
      title="Dashboard Operacional"
      subtitle="Visão em tempo real da operação multicanal"
      headerAction={
        <button type="button" className="ls-btn-secondary" onClick={() => void reload()}>
          <RefreshCw size={16} />
          Atualizar
        </button>
      }
      kpis={[
        { label: 'Entradas hoje', value: loading ? '…' : summary.today.entries, icon: <ArrowDownToLine size={56} /> },
        { label: 'Saídas hoje', value: loading ? '…' : summary.today.exits, icon: <ArrowUpFromLine size={56} /> },
        { label: 'Transferências', value: loading ? '…' : summary.today.transfers, icon: <Package size={56} /> },
        { label: 'Devoluções', value: loading ? '…' : summary.today.returns, icon: <Undo2 size={56} /> },
      ]}
      mainContentTitle="Estoque e alertas"
      sidePanel={
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown size={18} className="text-amber-600" />
              <h3 className="text-[15px] font-black uppercase tracking-widest text-gray-500">Abaixo do mínimo</h3>
            </div>
            <p className="text-4xl font-black text-amber-600">{loading ? '…' : summary.lowStockCount}</p>
          </div>

          {aiBriefing ? (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-orange-700">Resumo IA</p>
              <p className="text-sm leading-relaxed text-gray-700">{aiBriefing}</p>
            </div>
          ) : null}

          <div>
            <h3 className="mb-3 text-[15px] font-black uppercase tracking-widest text-gray-500">Sem movimentação</h3>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 90].map((days) => (
                <div key={days} className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400">{days}d</p>
                  <p className="text-xl font-black text-gray-900">{stale[`days${days}` as keyof typeof stale]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-xs font-bold uppercase text-gray-500">Quantidade total</p>
          <p className="mt-1 text-3xl font-black text-gray-900">
            {loading ? '…' : summary.stock.totalQuantity.toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-xs font-bold uppercase text-gray-500">Valor estocado</p>
          <p className="mt-1 text-3xl font-black text-gray-900">
            {loading ? '…' : summary.stock.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-black text-gray-900">Centro de reposição</h4>
        {replenishment.length === 0 && <p className="text-sm text-gray-500">Nenhuma reposição sugerida.</p>}
        {replenishment.slice(0, 5).map((r) => (
          <div key={r.sku} className="flex justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
            <span>
              <strong>{r.sku}</strong> — {r.name}
            </span>
            <span className="font-bold text-orange-700">+{r.suggested_purchase}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-black text-gray-900">Alertas recentes</h4>
        {alerts.length === 0 && <p className="text-sm text-gray-500">Nenhum alerta no momento.</p>}
        {alerts.slice(0, 5).map((alert) => (
          <div key={alert.id} className="rounded-xl border border-gray-100 px-3 py-2">
            <p className="text-sm font-bold text-gray-900">{alert.title}</p>
            <p className="text-xs text-gray-500">{alert.message}</p>
          </div>
        ))}
      </div>
    </LogstokaStandardPageLayout>
  );
};

export default DashboardPage;

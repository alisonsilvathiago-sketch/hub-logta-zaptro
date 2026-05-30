import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Package,
  Undo2,
  Wallet,
} from 'lucide-react';
import LogstokaMovementShortcuts from '@/components/layout/LogstokaMovementShortcuts';
import { LogstokaStandardPageLayout } from '@/components/layout/LogstokaStandardPageLayout';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useDashboardSummary, useAlerts } from '@/hooks/useLogstokaData';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_DASHBOARD } from '@/lib/logstokaDemoSeed';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import DashboardAlertCarousel from './DashboardAlertCarousel';
import DashboardActivityTable from './DashboardActivityTable';
import DashboardHealthCharts from './DashboardHealthCharts';
import DashboardMarketplaceSales from './DashboardMarketplaceSales';
import DashboardStockPanel from './DashboardStockPanel';

const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const { summary, loading, reload } = useDashboardSummary();
  const { alerts } = useAlerts();
  const [stale, setStale] = useState({ days30: 0, days60: 0, days90: 0 });

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
      const movedIds = new Set(
        (moved ?? []).map((m: { product_id: string }) => m.product_id),
      );
      return products.filter((p: { id: string }) => !movedIds.has(p.id)).length;
    };
    void Promise.all([checkStale(30), checkStale(60), checkStale(90)]).then(([d30, d60, d90]) =>
      setStale({ days30: d30, days60: d60, days90: d90 }),
    );
  }, [companyId]);

  const firstName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Operador';

  return (
    <LogstokaStandardPageLayout
      title={
        <>
          Olá, {firstName}{' '}
          <span className="inline-block translate-y-px" aria-hidden>
            👋
          </span>
        </>
      }
      titleClassName="ls-dashboard-greeting-title text-[34px] leading-tight"
      headerClassName="py-5"
      headerBelow={<DashboardAlertCarousel alerts={alerts} />}
      headerAction={
        <LogstokaMovementShortcuts onRefresh={() => void reload()} refreshing={loading} />
      }
      kpis={[
        { label: 'Entradas hoje', value: loading ? '…' : summary.today.entries, icon: <ArrowDownToLine size={56} /> },
        { label: 'Saídas hoje', value: loading ? '…' : summary.today.exits, icon: <ArrowUpFromLine size={56} /> },
        { label: 'Transferências', value: loading ? '…' : summary.today.transfers, icon: <Package size={56} /> },
        { label: 'Devoluções', value: loading ? '…' : summary.today.returns, icon: <Undo2 size={56} /> },
      ]}
      mainContentTitle="Estoque"
      belowGrid={
        <>
          <DashboardMarketplaceSales />
          <DashboardHealthCharts summary={summary} loading={loading} stale={stale} />
          <DashboardActivityTable companyId={companyId} />
        </>
      }
      sidePanel={<DashboardStockPanel summary={summary} loading={loading} />}
    >

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to={LOGSTOKA_ROUTES.PRODUCTS}
          className="group relative block overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700/80">Quantidade total</p>
              <p className="ls-dashboard-stat-value">
                {loading ? '…' : summary.stock.totalQuantity.toLocaleString('pt-BR')}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-800/70">unidades em todos os depósitos</p>
            </div>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-200">
              <Boxes size={22} strokeWidth={2.2} />
            </span>
          </div>
        </Link>
        <Link
          to="/app/reports"
          className="group relative block overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-orange-700/80">Valor estocado</p>
              <p className="ls-dashboard-stat-value">
                {loading
                  ? '…'
                  : summary.stock.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="mt-1 text-xs font-medium text-orange-800/70">custo médio × saldo atual</p>
            </div>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 transition-colors group-hover:bg-orange-200">
              <Wallet size={22} strokeWidth={2.2} />
            </span>
          </div>
        </Link>
      </div>
    </LogstokaStandardPageLayout>
  );
};

export default DashboardPage;

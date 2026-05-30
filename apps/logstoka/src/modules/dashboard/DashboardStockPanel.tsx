import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Boxes, Layers, TrendingDown } from 'lucide-react';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_STOCK, DEMO_WAREHOUSES } from '@/lib/logstokaDemoSeed';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import type { DashboardSummary } from '@/types';

type Props = {
  summary: DashboardSummary;
  loading: boolean;
};

type WarehouseSlice = {
  name: string;
  units: number;
  pct: number;
};

function stockHealth(summary: DashboardSummary): { score: number; label: string; tone: string } {
  const alertWeight = summary.lowStockCount * 12;
  const score = Math.max(38, Math.min(100, 100 - alertWeight));
  if (score >= 85) return { score, label: 'Saudável', tone: '#10b981' };
  if (score >= 70) return { score, label: 'Atenção', tone: '#f59e0b' };
  return { score, label: 'Crítico', tone: '#ef4444' };
}

function demoWarehouseSlices(totalQuantity: number): WarehouseSlice[] {
  const totals = new Map<string, number>();
  for (const row of DEMO_STOCK) {
    const name = row.ls_warehouses?.name ?? 'Depósito';
    totals.set(name, (totals.get(name) ?? 0) + row.quantity);
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, units]) => ({
      name,
      units,
      pct: totalQuantity > 0 ? Math.round((units / totalQuantity) * 100) : 0,
    }));
}

const DashboardStockPanel: React.FC<Props> = ({ summary, loading }) => {
  const { companyId } = useLogstokaTenant();
  const health = useMemo(() => stockHealth(summary), [summary]);

  const reservedUnits = useMemo(() => {
    if (!isLogstokaDemoCompany(companyId)) return 0;
    return DEMO_STOCK.reduce((sum, row) => sum + (row.reserved_quantity ?? 0), 0);
  }, [companyId]);

  const warehouses = useMemo(() => {
    if (!isLogstokaDemoCompany(companyId)) {
      return DEMO_WAREHOUSES.slice(0, 3).map((w, i) => ({
        name: w.name,
        units: 0,
        pct: [62, 24, 14][i] ?? 10,
      }));
    }
    return demoWarehouseSlices(summary.stock.totalQuantity);
  }, [companyId, summary.stock.totalQuantity]);

  const warehouseCount = isLogstokaDemoCompany(companyId) ? DEMO_WAREHOUSES.length : warehouses.length;

  return (
    <div className="ls-dashboard-stock-panel">
      <div className="ls-dashboard-stock-panel__head">
        <div className="flex items-center gap-2">
          <Boxes size={16} className="text-orange-600" />
          <h3 className="text-[13px] font-black uppercase tracking-widest text-gray-500">Painel de estoque</h3>
        </div>
        <Link
          to={LOGSTOKA_ROUTES.PRODUCTS}
          className="text-[10px] font-bold uppercase tracking-wide text-orange-600 hover:underline"
        >
          Ver estoque
        </Link>
      </div>

      <div className="ls-dashboard-stock-panel__health">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-gray-500">Cobertura operacional</span>
          <span className="text-[11px] font-black" style={{ color: health.tone }}>
            {loading ? '…' : `${health.score}% · ${health.label}`}
          </span>
        </div>
        <div className="ls-dashboard-stock-panel__bar" aria-hidden>
          <span
            className="ls-dashboard-stock-panel__bar-fill"
            style={{
              width: loading ? '0%' : `${health.score}%`,
              backgroundColor: health.tone,
            }}
          />
        </div>
      </div>

      <div className="ls-dashboard-stock-panel__metrics">
        <div className="ls-dashboard-stock-panel__metric ls-dashboard-stock-panel__metric--warn">
          <TrendingDown size={14} />
          <div>
            <p className="ls-dashboard-stock-panel__metric-value">{loading ? '…' : summary.lowStockCount}</p>
            <p className="ls-dashboard-stock-panel__metric-label">Abaixo mín.</p>
          </div>
        </div>
        <div className="ls-dashboard-stock-panel__metric">
          <Layers size={14} />
          <div>
            <p className="ls-dashboard-stock-panel__metric-value">{loading ? '…' : reservedUnits.toLocaleString('pt-BR')}</p>
            <p className="ls-dashboard-stock-panel__metric-label">Reservado</p>
          </div>
        </div>
        <div className="ls-dashboard-stock-panel__metric">
          <AlertTriangle size={14} />
          <div>
            <p className="ls-dashboard-stock-panel__metric-value">{loading ? '…' : warehouseCount}</p>
            <p className="ls-dashboard-stock-panel__metric-label">Depósitos</p>
          </div>
        </div>
      </div>

      <div className="ls-dashboard-stock-panel__warehouses">
        {warehouses.map((wh) => (
          <div key={wh.name} className="ls-dashboard-stock-panel__warehouse">
            <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-gray-500">
              <span className="truncate">{wh.name}</span>
              <span className="shrink-0 tabular-nums">{loading ? '…' : `${wh.pct}%`}</span>
            </div>
            <div className="ls-dashboard-stock-panel__bar ls-dashboard-stock-panel__bar--thin" aria-hidden>
              <span
                className="ls-dashboard-stock-panel__bar-fill ls-dashboard-stock-panel__bar-fill--soft"
                style={{ width: loading ? '0%' : `${wh.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardStockPanel;

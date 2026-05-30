import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import type { DashboardSummary } from '@/types';

type Props = {
  summary: DashboardSummary;
  loading: boolean;
  stale: { days30: number; days60: number; days90: number };
};

const WEEKLY_FLOW = [
  { day: 'Seg', entradas: 14, saidas: 38 },
  { day: 'Ter', entradas: 22, saidas: 41 },
  { day: 'Qua', entradas: 18, saidas: 35 },
  { day: 'Qui', entradas: 25, saidas: 48 },
  { day: 'Sex', entradas: 20, saidas: 44 },
  { day: 'Sáb', entradas: 12, saidas: 28 },
  { day: 'Dom', entradas: 18, saidas: 42 },
];

function healthScore(summary: DashboardSummary, stale: Props['stale']): number {
  let score = 100;
  score -= summary.lowStockCount * 8;
  score -= Math.min(stale.days90, 40) * 0.35;
  if (summary.today.exits > summary.today.entries * 2.5) score -= 6;
  return Math.max(42, Math.min(100, Math.round(score)));
}

function healthLabel(score: number): string {
  if (score >= 85) return 'Saudável';
  if (score >= 70) return 'Atenção';
  return 'Crítico';
}

function healthTone(score: number): string {
  if (score >= 85) return '#10b981';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
}

const DashboardHealthCharts: React.FC<Props> = ({ summary, loading, stale }) => {
  const score = useMemo(() => healthScore(summary, stale), [summary, stale]);

  const stockPie = useMemo(() => {
    const alert = summary.lowStockCount;
    const ok = Math.max(summary.stock.totalQuantity > 0 ? 120 - alert : 0, 1);
    return [
      { name: 'OK', value: ok, color: '#10b981' },
      { name: 'Abaixo mín.', value: Math.max(alert, 1), color: '#f59e0b' },
    ];
  }, [summary]);

  const channelBars = useMemo(
    () => [
      { canal: 'Shopee', volume: 38 },
      { canal: 'ML', volume: 32 },
      { canal: 'Amazon', volume: 18 },
      { canal: 'Direct', volume: 12 },
    ],
    [],
  );

  const healthTrend = useMemo(
    () => [
      { label: 'D-6', value: score - 9 },
      { label: 'D-4', value: score - 5 },
      { label: 'D-2', value: score - 2 },
      { label: 'Hoje', value: score },
    ],
    [score],
  );

  return (
    <section className="ls-dashboard-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-black uppercase tracking-widest text-gray-500">Saúde do sistema</h3>
          <p className="mt-0.5 text-xs text-gray-400">Visão rápida da operação multicanal</p>
        </div>
        {!loading ? (
          <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: healthTone(score) }} />
            <span className="text-xs font-bold text-gray-700">
              {score}% · {healthLabel(score)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="ls-dashboard-mini-chart">
          <p className="ls-dashboard-mini-chart__label">Índice geral</p>
          <div className="mt-2 h-[88px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={healthTone(score)} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={healthTone(score)} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="value" stroke={healthTone(score)} strokeWidth={2} fill="url(#healthFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ls-dashboard-mini-chart">
          <p className="ls-dashboard-mini-chart__label">Fluxo semanal</p>
          <div className="mt-2 h-[88px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_FLOW} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={2}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10 }} />
                <Bar dataKey="entradas" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={10} />
                <Bar dataKey="saidas" fill="#ea580c" radius={[3, 3, 0, 0]} maxBarSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ls-dashboard-mini-chart">
          <p className="ls-dashboard-mini-chart__label">Estoque vs mínimo</p>
          <div className="mt-1 h-[88px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockPie} dataKey="value" innerRadius={26} outerRadius={40} paddingAngle={3} stroke="none">
                  {stockPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ls-dashboard-mini-chart">
          <p className="ls-dashboard-mini-chart__label">Saídas por canal</p>
          <div className="mt-2 h-[88px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelBars} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <Bar dataKey="volume" fill="#fb923c" radius={[0, 4, 4, 0]} barSize={8} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardHealthCharts;

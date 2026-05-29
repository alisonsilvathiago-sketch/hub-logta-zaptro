import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type LogtaKpiStripItem = {
  label: string;
  value: string | number;
  icon?: any;
  /** Texto auxiliar abaixo do valor (ex.: “Entrada ou pausa hoje”). */
  hint?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
};

export type LogtaKpiStripProps = {
  items: LogtaKpiStripItem[];
  className?: string;
};

/** Faixa de KPIs padrão Logta (Financeiro / RH) — `logta-stat-card` + valor azul grande. */
export function LogtaKpiStrip({ items, className = '' }: LogtaKpiStripProps) {
  return (
    <div className={`logta-kpi-strip grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`.trim()}>
      {items.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className="logta-stat-card group relative">
            <p className="logta-stat-card__label logta-stat-card__label--spaced">{kpi.label}</p>
            <div className="logta-kpi-strip__value-row flex items-end justify-between gap-2">
              <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--lg logta-dashboard-stat-card__value--primary">
                {kpi.value}
              </p>
              {kpi.trend && kpi.trend !== 'neutral' && kpi.trendValue ? (
                <span
                  className={`mb-1 shrink-0 text-xs font-bold ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {kpi.trendValue}
                </span>
              ) : null}
            </div>
            {kpi.hint ? (
              <p className="mt-1 text-[10px] font-semibold text-gray-400">{kpi.hint}</p>
            ) : null}
            {Icon ? (
              React.isValidElement(Icon) ? (
                React.cloneElement(Icon as React.ReactElement<any>, {
                  size: 56,
                  className: "pointer-events-none absolute bottom-8 right-7 text-gray-900 opacity-[0.02] transition-all group-hover:opacity-[0.05]"
                })
              ) : (
                <Icon
                  size={56}
                  className="pointer-events-none absolute bottom-8 right-7 text-gray-900 opacity-[0.02] transition-all group-hover:opacity-[0.05]"
                />
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

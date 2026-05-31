import React from 'react';

export const LOGSTOKA_PAGE_TITLE_CLASS = 'text-[31px] font-bold leading-snug tracking-normal text-[#383838]';
export const LOGSTOKA_ROW_TITLE_CLASS = 'truncate text-[14px] font-bold text-gray-900';

export type LogstokaKpiStripItem = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  hint?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
};

export function LogstokaKpiStrip({ items, className = '' }: { items: LogstokaKpiStripItem[]; className?: string }) {
  return (
    <div className={`ls-kpi-strip ${className}`.trim()}>
      {items.map((kpi) => {
        const body = (
          <>
            <p className="ls-stat-card__label ls-stat-card__label--spaced">{kpi.label}</p>
            <div className="flex items-end justify-between gap-2">
              <p className="ls-stat-card__value ls-stat-card__value--primary">{kpi.value}</p>
              {kpi.trend && kpi.trend !== 'neutral' && kpi.trendValue ? (
                <span
                  className={`mb-1 shrink-0 text-xs font-bold ${
                    kpi.trend === 'up' ? 'text-orange-600' : 'text-red-500'
                  }`}
                >
                  {kpi.trendValue}
                </span>
              ) : null}
            </div>
            {kpi.hint ? <p className="mt-1 text-[10px] font-semibold text-gray-400">{kpi.hint}</p> : null}
            {kpi.icon ? (
              <div className="pointer-events-none absolute bottom-8 right-7 text-gray-900 opacity-[0.03] transition-all group-hover:opacity-[0.06]">
                {kpi.icon}
              </div>
            ) : null}
          </>
        );

        if (kpi.onClick) {
          return (
            <button
              key={kpi.label}
              type="button"
              className="ls-stat-card ls-stat-card--clickable group relative text-left"
              onClick={kpi.onClick}
              aria-label={`${kpi.label}: ${kpi.value}`}
            >
              {body}
            </button>
          );
        }

        return (
          <div key={kpi.label} className="ls-stat-card group relative">
            {body}
          </div>
        );
      })}
    </div>
  );
}

export type LogstokaStandardPageLayoutProps = {
  title?: React.ReactNode;
  subtitle?: string;
  kpis?: LogstokaKpiStripItem[];
  mainContentTitle?: string;
  mainContentAction?: React.ReactNode;
  headerAction?: React.ReactNode;
  headerClassName?: string;
  titleClassName?: string;
  headerBelow?: React.ReactNode;
  belowGrid?: React.ReactNode;
  mainGridClassName?: string;
  children: React.ReactNode;
  sidePanel?: React.ReactNode;
};

export function LogstokaStandardPageLayout({
  title,
  subtitle,
  kpis = [],
  mainContentTitle,
  mainContentAction,
  headerAction,
  headerClassName = '',
  titleClassName = '',
  headerBelow,
  belowGrid,
  mainGridClassName = '',
  children,
  sidePanel,
}: LogstokaStandardPageLayoutProps) {
  return (
    <div className="space-y-6">
      {(title || headerAction || headerBelow) && (
        <div className="space-y-2">
          {(title || headerAction) && (
            <div className={`mb-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center ${headerClassName}`.trim()}>
              <div>
                {title ? <h2 className={`${LOGSTOKA_PAGE_TITLE_CLASS} ${titleClassName}`.trim()}>{title}</h2> : null}
                {subtitle ? <p className="mt-1 text-sm font-medium text-gray-500">{subtitle}</p> : null}
              </div>
              {headerAction ? <div className="flex w-full justify-end">{headerAction}</div> : null}
            </div>
          )}
          {headerBelow}
        </div>
      )}

      {kpis.length > 0 ? <LogstokaKpiStrip items={kpis} /> : null}

      <div className={`ls-page-main-grid grid grid-cols-1 ${sidePanel ? 'lg:grid-cols-3' : ''} gap-8 ${mainGridClassName}`.trim()}>
        <div
          className={`rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8 ${sidePanel ? 'lg:col-span-2' : ''}`}
        >
          {(mainContentTitle || mainContentAction) && (
            <div className="mb-8 flex items-center justify-between border-b border-gray-50 pb-4">
              <h3 className="!text-[15px] font-black uppercase tracking-widest text-gray-500">
                {mainContentTitle || 'Registros'}
              </h3>
              {mainContentAction ? <div>{mainContentAction}</div> : null}
            </div>
          )}
          <div className="space-y-4">{children}</div>
        </div>

        {sidePanel ? (
          <div className="ls-dashboard-side-panel rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            {sidePanel}
          </div>
        ) : null}
      </div>

      {belowGrid ? <div className="ls-dashboard-below-grid space-y-6">{belowGrid}</div> : null}
    </div>
  );
}

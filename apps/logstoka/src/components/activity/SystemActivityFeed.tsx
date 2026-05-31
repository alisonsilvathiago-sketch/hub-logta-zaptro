import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { LOGSTOKA_ROW_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { useTablePagination } from '@/hooks/useTablePagination';
import {
  ACTIVITY_FILTER_OPTIONS,
  formatActivityTime,
  loadSystemActivities,
  type ActivityFilter,
  type SystemActivityRow,
} from '@/lib/systemActivityFeed';
import './systemActivityFeed.css';

type Props = {
  companyId: string | null;
  variant?: 'table' | 'timeline';
  showFilters?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  previewLimit?: number;
  panel?: boolean;
  inset?: boolean;
  title?: string;
  subtitle?: React.ReactNode;
  className?: string;
};

const SystemActivityFeed: React.FC<Props> = ({
  companyId,
  variant = 'table',
  showFilters = true,
  showPagination = true,
  pageSize = 12,
  previewLimit,
  panel = true,
  inset = false,
  title = 'O que está acontecendo',
  subtitle = 'Operação, vendas, integrações e alertas',
  className = '',
}) => {
  const [rows, setRows] = useState<SystemActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>('all');

  useEffect(() => {
    if (!companyId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    void loadSystemActivities(companyId)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [companyId]);

  const filteredRows = useMemo(() => {
    const base = filter === 'all' ? rows : rows.filter((row) => row.category === filter);
    if (previewLimit != null) return base.slice(0, previewLimit);
    return base;
  }, [filter, previewLimit, rows]);

  const paginationEnabled = showPagination && previewLimit == null;
  const { paginatedItems, footerProps } = useTablePagination(
    filteredRows,
    pageSize,
    paginationEnabled ? `${companyId ?? 'none'}-${filter}-${variant}` : 'preview',
  );

  const displayRows = paginationEnabled ? paginatedItems : filteredRows;
  const empty = !loading && filteredRows.length === 0;

  const shellClass = [
    panel ? 'ls-activity-feed--panel' : '',
    inset ? 'ls-activity-feed--inset' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={shellClass || undefined}>
      {(title || showFilters) && (
        <div className="ls-activity-feed__head">
          <div>
            {title ? <h3 className="ls-activity-feed__title">{title}</h3> : null}
            {subtitle ? <p className="ls-activity-feed__subtitle">{subtitle}</p> : null}
          </div>
          {showFilters ? (
            <div className="ls-activity-feed__filters" role="tablist" aria-label="Filtrar atividades">
              {ACTIVITY_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === option.id}
                  className={`ls-activity-feed__filter${filter === option.id ? ' ls-activity-feed__filter--active' : ''}`}
                  onClick={() => setFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {loading ? <div className="ls-activity-feed__empty">Carregando atividades…</div> : null}
      {empty && !loading ? <div className="ls-activity-feed__empty">Nenhuma atividade neste filtro.</div> : null}

      {!loading && !empty && variant === 'timeline' ? (
        <ul className="ls-activity-timeline">
          {displayRows.map((row) => (
            <li key={row.id} className="ls-activity-timeline__item">
              <time className="ls-activity-timeline__time" dateTime={row.time}>
                {formatActivityTime(row.time)}
              </time>
              <div className="ls-activity-timeline__body">
                <div className="ls-activity-timeline__meta">
                  <span className={row.tone}>{row.type}</span>
                  <span className="ls-activity-timeline__ref">{row.reference}</span>
                </div>
                {row.href ? (
                  <Link to={row.href} className="ls-activity-timeline__desc">
                    {row.description}
                  </Link>
                ) : (
                  <span className="ls-activity-timeline__desc">{row.description}</span>
                )}
              </div>
              <span className="ls-activity-timeline__status">{row.status}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && !empty && variant === 'table' ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-4 py-3">Quando</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Referência</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {formatActivityTime(row.time)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={row.tone}>{row.type}</span>
                    </td>
                    <td className="max-w-md px-4 py-3">
                      {row.href ? (
                        <Link to={row.href} className={`${LOGSTOKA_ROW_TITLE_CLASS} hover:text-orange-600`}>
                          {row.description}
                        </Link>
                      ) : (
                        <span className={LOGSTOKA_ROW_TITLE_CLASS}>{row.description}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-500">{row.reference}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-600">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginationEnabled ? <LogstokaTableFooter {...footerProps} loading={loading} hidden={empty} /> : null}
        </>
      ) : null}
    </section>
  );
};

export default SystemActivityFeed;

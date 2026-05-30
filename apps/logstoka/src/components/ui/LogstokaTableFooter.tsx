import React from 'react';

export const LOGSTOKA_TABLE_PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;

export type LogstokaTableFooterProps = {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
  hidden?: boolean;
  itemLabel?: string;
};

export function LogstokaTableFooter({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
  hidden = false,
  itemLabel = 'registros',
}: LogstokaTableFooterProps) {
  if (hidden || (total === 0 && !loading)) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, total);

  return (
    <div className="ls-dashboard-table-footer">
      <span className="ls-dashboard-table-footer__range">
        {loading ? '…' : `${rangeStart}–${rangeEnd} de ${total} ${itemLabel}`}
      </span>

      <div className="ls-dashboard-table-footer__controls">
        <label className="ls-dashboard-table-footer__limit">
          <span>Exibir</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Registros por página"
            disabled={loading}
          >
            {LOGSTOKA_TABLE_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>por página</span>
        </label>

        <div className="ls-dashboard-table-footer__pages">
          <button
            type="button"
            className="ls-dashboard-table-footer__nav"
            disabled={loading || safePage <= 1}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
          >
            Anterior
          </button>
          <span className="ls-dashboard-table-footer__count">
            {loading ? '…' : `${safePage}/${totalPages}`}
          </span>
          <button
            type="button"
            className="ls-dashboard-table-footer__nav"
            disabled={loading || safePage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogstokaTableFooter;

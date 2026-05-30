import { useEffect, useMemo, useState } from 'react';
import type { LogstokaTableFooterProps } from '@/components/ui/LogstokaTableFooter';

export function useTablePagination<T>(items: T[], initialPageSize = 10, resetKey?: string | number | null) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, resetKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const footerProps: LogstokaTableFooterProps = {
    total,
    page: safePage,
    pageSize,
    onPageChange: setPage,
    onPageSizeChange: (size) => {
      setPageSize(size);
      setPage(1);
    },
  };

  return { paginatedItems, footerProps, page: safePage, pageSize, setPage, setPageSize };
}

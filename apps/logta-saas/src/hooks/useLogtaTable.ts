import React from 'react';

export type LogtaTableSortDir = 'asc' | 'desc';

export type UseLogtaTableOptions<TRow> = {
  data: TRow[];
  pageSize?: number;
  searchKeys?: (keyof TRow)[];
  initialSearch?: string;
  filterFn?: (row: TRow) => boolean;
  sortFn?: (a: TRow, b: TRow, dir: LogtaTableSortDir) => number;
};

export function useLogtaTable<TRow>({
  data,
  pageSize = 10,
  searchKeys = [],
  initialSearch = '',
  filterFn,
  sortFn,
}: UseLogtaTableOptions<TRow>) {
  const [search, setSearch] = React.useState(initialSearch);
  const [page, setPage] = React.useState(1);
  const [sortDir, setSortDir] = React.useState<LogtaTableSortDir>('asc');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const filtered = React.useMemo(() => {
    let rows = [...data];
    const q = search.trim().toLowerCase();
    if (q && searchKeys.length > 0) {
      rows = rows.filter((row) =>
        searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)),
      );
    }
    if (filterFn) rows = rows.filter(filterFn);
    if (sortFn) rows.sort((a, b) => sortFn(a, b, sortDir));
    return rows;
  }, [data, search, searchKeys, filterFn, sortFn, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const toggleSort = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = (ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  return {
    search,
    setSearch,
    page,
    setPage,
    sortDir,
    toggleSort,
    filtered,
    paginated,
    totalPages,
    pageSize,
    selectedIds,
    toggleRow,
    toggleAllOnPage,
    clearSelection,
    selectedCount: selectedIds.size,
  };
}

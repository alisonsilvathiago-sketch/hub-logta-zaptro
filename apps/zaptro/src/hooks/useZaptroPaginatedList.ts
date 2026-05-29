import { useEffect, useMemo, useState } from 'react';

/** Presets rápidos (mínimo 5). */
export const ZAPTRO_LIST_PAGE_SIZE_PRESETS = [5, 10, 15, 20, 30, 40] as const;

/** Valores maiores — use «próxima página» para ver o restante. */
export const ZAPTRO_LIST_PAGE_SIZE_EXTENDED = [50, 100, 200, 300] as const;

export const ZAPTRO_LIST_PAGE_SIZE_MIN = 5;
export const ZAPTRO_LIST_PAGE_SIZE_MAX = 300;

export type ZaptroListPageSize = number;

export function clampZaptroPageSize(value: number): number {
  if (!Number.isFinite(value)) return 10;
  return Math.min(ZAPTRO_LIST_PAGE_SIZE_MAX, Math.max(ZAPTRO_LIST_PAGE_SIZE_MIN, Math.round(value)));
}

export function isZaptroListPageSizePreset(value: number): boolean {
  const n = clampZaptroPageSize(value);
  return (
    (ZAPTRO_LIST_PAGE_SIZE_PRESETS as readonly number[]).includes(n) ||
    (ZAPTRO_LIST_PAGE_SIZE_EXTENDED as readonly number[]).includes(n)
  );
}

/** @deprecated use ZAPTRO_LIST_PAGE_SIZE_PRESETS */
export const ZAPTRO_LIST_PAGE_SIZES = ZAPTRO_LIST_PAGE_SIZE_PRESETS;

export function useZaptroPaginatedList<T>(
  items: T[],
  defaultPageSize: number = 10,
  resetKey?: string | number,
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(() => clampZaptroPageSize(defaultPageSize));

  const setItemsPerPage = (size: number) => {
    setItemsPerPageState(clampZaptroPageSize(size));
  };

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  return {
    pageItems,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    totalPages,
  };
}

/** Números de página visíveis (1, 2, 3 …) com janela em torno da página actual. */
export function zaptroVisiblePageNumbers(current: number, total: number): number[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);

  const set = new Set<number>([1, total, current]);
  for (let d = -2; d <= 2; d += 1) {
    const p = current + d;
    if (p >= 1 && p <= total) set.add(p);
  }
  return [...set].sort((a, b) => a - b);
}

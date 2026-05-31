import { useCallback, useMemo, useState } from 'react';

export function useRowSelection<T>(items: T[], getKey: (item: T) => string) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const itemKeys = useMemo(() => items.map(getKey), [items, getKey]);

  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedKeys((prev) => {
      if (prev.size === itemKeys.length && itemKeys.every((k) => prev.has(k))) {
        return new Set();
      }
      return new Set(itemKeys);
    });
  }, [itemKeys]);

  const clearSelection = useCallback(() => setSelectedKeys(new Set()), []);

  const isAllSelected = itemKeys.length > 0 && itemKeys.every((k) => selectedKeys.has(k));

  return {
    selectedKeys,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
    selectedCount: selectedKeys.size,
  };
}

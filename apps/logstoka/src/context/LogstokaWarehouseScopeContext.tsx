import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { hasGlobalWarehouseView } from '@/lib/permissions';
import { useWarehouses } from '@/hooks/useCatalog';
import type { LsWarehouse } from '@/types';

type WarehouseScopeContextValue = {
  warehouses: LsWarehouse[];
  visibleWarehouses: LsWarehouse[];
  isGlobalView: boolean;
  assignedWarehouseId: string | null;
  tableWarehouseFilter: string | 'all';
  setTableWarehouseFilter: (value: string | 'all') => void;
  canAccessWarehouse: (warehouseId: string) => boolean;
  reload: () => Promise<void>;
};

const LogstokaWarehouseScopeContext = createContext<WarehouseScopeContextValue | null>(null);

export const LogstokaWarehouseScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const { warehouses, reload } = useWarehouses();
  const [tableWarehouseFilter, setTableWarehouseFilter] = useState<string | 'all'>('all');

  const isGlobalView = hasGlobalWarehouseView(profile);
  const assignedWarehouseId = isGlobalView ? null : profile?.warehouse_id ?? null;

  useEffect(() => {
    if (!isGlobalView && assignedWarehouseId) {
      setTableWarehouseFilter(assignedWarehouseId);
    }
  }, [isGlobalView, assignedWarehouseId]);

  const visibleWarehouses = useMemo(() => {
    if (isGlobalView) return warehouses;
    if (!assignedWarehouseId) return [];
    return warehouses.filter((warehouse) => warehouse.id === assignedWarehouseId);
  }, [warehouses, isGlobalView, assignedWarehouseId]);

  const canAccessWarehouse = useCallback(
    (warehouseId: string) => {
      if (isGlobalView) return true;
      if (!assignedWarehouseId) return true;
      return assignedWarehouseId === warehouseId;
    },
    [isGlobalView, assignedWarehouseId],
  );

  const value = useMemo(
    () => ({
      warehouses,
      visibleWarehouses,
      isGlobalView,
      assignedWarehouseId,
      tableWarehouseFilter,
      setTableWarehouseFilter,
      canAccessWarehouse,
      reload,
    }),
    [
      warehouses,
      visibleWarehouses,
      isGlobalView,
      assignedWarehouseId,
      tableWarehouseFilter,
      canAccessWarehouse,
      reload,
    ],
  );

  return (
    <LogstokaWarehouseScopeContext.Provider value={value}>{children}</LogstokaWarehouseScopeContext.Provider>
  );
};

export function useLogstokaWarehouseScope(): WarehouseScopeContextValue {
  const ctx = useContext(LogstokaWarehouseScopeContext);
  if (!ctx) {
    throw new Error('useLogstokaWarehouseScope must be used within LogstokaWarehouseScopeProvider');
  }
  return ctx;
}

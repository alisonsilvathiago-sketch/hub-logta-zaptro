import { useCallback, useEffect, useState } from 'react';
import { logstokaApi } from '@/lib/logstokaApi';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  DEMO_ALERTS,
  DEMO_DASHBOARD,
  DEMO_PRODUCTS,
  DEMO_REPLENISHMENT,
  DEMO_STOCK,
  filterDemoProducts,
} from '@/lib/logstokaDemoSeed';
import type { DashboardSummary, LsAlert, LsProduct, LsStockRow } from '@/types';

export function useDashboardSummary() {
  const { companyId } = useLogstokaTenant();
  const [summary, setSummary] = useState<DashboardSummary>(DEMO_DASHBOARD);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    if (isLogstokaDemoCompany(companyId)) {
      setSummary(DEMO_DASHBOARD);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const [movementsRes, stockRes, productsRes] = await Promise.all([
        supabase
          .from('ls_stock_movements')
          .select('movement_type')
          .eq('company_id', companyId)
          .gte('created_at', start.toISOString()),
        supabase
          .from('ls_stock')
          .select('quantity, ls_products(cost)')
          .eq('company_id', companyId),
        supabase
          .from('ls_products')
          .select('id, min_stock, status')
          .eq('company_id', companyId)
          .eq('status', 'active'),
      ]);

      const counts = { entries: 0, exits: 0, transfers: 0, returns: 0 };
      for (const row of movementsRes.data ?? []) {
        if (row.movement_type === 'entry') counts.entries += 1;
        if (row.movement_type === 'exit') counts.exits += 1;
        if (row.movement_type === 'transfer') counts.transfers += 1;
        if (row.movement_type === 'return') counts.returns += 1;
      }

      let totalQuantity = 0;
      let totalValue = 0;
      for (const row of stockRes.data ?? []) {
        const qty = Number(row.quantity ?? 0);
        const cost = Number((row as { ls_products?: { cost?: number } }).ls_products?.cost ?? 0);
        totalQuantity += qty;
        totalValue += qty * cost;
      }

      const stockByProduct = new Map<string, number>();
      for (const row of stockRes.data ?? []) {
        const pid = (row as { product_id?: string }).product_id;
        if (!pid) continue;
        stockByProduct.set(pid, (stockByProduct.get(pid) ?? 0) + Number(row.quantity ?? 0));
      }

      let lowStockCount = 0;
      for (const product of (productsRes.data ?? []) as Array<{ id: string; min_stock: number }>) {
        const qty = stockByProduct.get(product.id) ?? 0;
        if (qty <= Number(product.min_stock ?? 0)) lowStockCount += 1;
      }

      setSummary({
        today: counts,
        stock: { totalQuantity, totalValue },
        lowStockCount,
        staleProducts: { days30: 0, days60: 0, days90: 0 },
      });
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { summary, loading, reload: load };
}

export function useProducts(page = 1, search = '', customLimit?: number) {
  const { companyId } = useLogstokaTenant();
  const [products, setProducts] = useState<LsProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const limit = customLimit ?? 25;

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);

    if (isLogstokaDemoCompany(companyId)) {
      const { products: list, total: t } = filterDemoProducts(search, page, limit);
      setProducts(list);
      setTotal(t);
      setLoading(false);
      return;
    }

    const from = (page - 1) * limit;
    let query = supabase
      .from('ls_products')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (search.trim()) {
      query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    void query.then((res) => {
      if (!res.error) {
        setProducts((res.data ?? []) as LsProduct[]);
        setTotal(res.count ?? 0);
      }
      setLoading(false);
    });
  }, [companyId, page, search, reloadKey, limit]);

  const reload = () => setReloadKey((k) => k + 1);

  return { products, total, loading, limit, reload };
}

export function useStock() {
  const { companyId } = useLogstokaTenant();
  const [rows, setRows] = useState<LsStockRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      setRows(DEMO_STOCK);
      setLoading(false);
      return;
    }
    void supabase
      .from('ls_stock')
      .select('*, ls_products(sku, name), ls_warehouses(name, code)')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })
      .limit(200)
      .then((res) => {
        if (!res.error) setRows((res.data ?? []) as LsStockRow[]);
        setLoading(false);
      });
  }, [companyId]);

  return { rows, loading };
}

export function useAlerts() {
  const { companyId } = useLogstokaTenant();
  const [alerts, setAlerts] = useState<LsAlert[]>([]);

  useEffect(() => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      setAlerts(DEMO_ALERTS);
      return;
    }
    void supabase
      .from('ls_alerts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then((res) => setAlerts((res.data ?? []) as LsAlert[]));
  }, [companyId]);

  return { alerts };
}

export type ReplenishmentItem = { sku: string; name: string; suggested_purchase: number };

export function useReplenishment() {
  const { companyId } = useLogstokaTenant();
  const [items, setItems] = useState<ReplenishmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    if (isLogstokaDemoCompany(companyId)) {
      setItems(DEMO_REPLENISHMENT);
      setLoading(false);
      return;
    }
    setLoading(true);
    void logstokaApi
      .getReplenishment()
      .then((r) => setItems((r.data ?? []) as ReplenishmentItem[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  return { items, loading };
}

import { useCallback, useEffect, useState } from 'react';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { logstokaApi } from '@/lib/logstokaApi';
import { getDemoSalesDashboard, type SalesDashboardData } from '@/lib/salesDashboard';

export function useSalesDashboard(days = 30) {
  const { companyId } = useLogstokaTenant();
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (isLogstokaDemoCompany(companyId)) {
      setData(getDemoSalesDashboard(days));
      setLoading(false);
      return;
    }

    try {
      const response = await logstokaApi.getSalesDashboard(days);
      setData(response as SalesDashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas');
      setData(getDemoSalesDashboard(days));
    } finally {
      setLoading(false);
    }
  }, [companyId, days]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

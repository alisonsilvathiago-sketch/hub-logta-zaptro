import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOperationalData } from '../../../contexts/OperationalDataContext';
import { resolveFinanceiroTransactionRoute } from '../financeiroTransactionLinks';
import type { TransactionRow } from '../financeiroAnalytics';

export function useFinanceiroTransactionNavigation() {
  const navigate = useNavigate();
  const { shipments } = useOperationalData();

  const getRoute = useCallback(
    (transaction: TransactionRow) => resolveFinanceiroTransactionRoute(transaction, { shipments }),
    [shipments],
  );

  const goToTransaction = useCallback(
    (transaction: TransactionRow) => {
      const path = getRoute(transaction);
      if (path) navigate(path);
    },
    [getRoute, navigate],
  );

  return { getRoute, goToTransaction };
}

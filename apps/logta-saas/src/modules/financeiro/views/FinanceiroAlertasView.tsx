import { Navigate } from 'react-router-dom';

/** Mantém compatibilidade com /financeiro/alertas */
export function FinanceiroAlertasView() {
  return <Navigate to="/financeiro/central" replace />;
}

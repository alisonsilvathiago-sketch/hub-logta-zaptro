import type { FinanceiroAlert } from '../financeiroIntelligence';

type FinanceiroAlertPopupProps = {
  alert: FinanceiroAlert;
  onClose: () => void;
  onDismiss: () => void;
  queueCount?: number;
};

/** @deprecated Use FinanceiroAlertsInlinePanel (carrossel no topo da página). */
export function FinanceiroAlertPopup(_props: FinanceiroAlertPopupProps) {
  return null;
}

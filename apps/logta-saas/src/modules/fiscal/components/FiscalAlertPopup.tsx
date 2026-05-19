import type { FiscalAlert } from '../types';

type Props = {
  alert: FiscalAlert;
  onClose: () => void;
  onDismiss: () => void;
};

/** @deprecated Use FiscalAlertsInlinePanel (carrossel no topo da página). */
export function FiscalAlertPopup(_props: Props) {
  return null;
}

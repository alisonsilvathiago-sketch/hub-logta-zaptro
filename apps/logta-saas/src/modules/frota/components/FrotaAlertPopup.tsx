import type { FrotaAlert } from '../types';

type Props = {
  alert: FrotaAlert;
  onClose: () => void;
  onDismiss: () => void;
};

/** @deprecated Use FrotaAlertsInlinePanel (carrossel no topo da página). */
export function FrotaAlertPopup(_props: Props) {
  return null;
}

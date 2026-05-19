import type { FretesAlert } from '../types';

type Props = {
  alert: FretesAlert;
  onClose: () => void;
  onDismiss: () => void;
  queueCount?: number;
};

/** @deprecated Use FretesAlertsInlinePanel (carrossel no topo da página). */
export function FretesAlertPopup(_props: Props) {
  return null;
}

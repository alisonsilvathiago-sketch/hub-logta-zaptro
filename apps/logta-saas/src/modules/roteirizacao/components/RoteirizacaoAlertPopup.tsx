import type { RoteirizacaoAlert } from '../types';

type Props = {
  alert: RoteirizacaoAlert;
  onClose: () => void;
  onDismiss: () => void;
  queueCount?: number;
};

/** @deprecated Use RoteirizacaoAlertsInlinePanel (carrossel no topo da página). */
export function RoteirizacaoAlertPopup(_props: Props) {
  return null;
}

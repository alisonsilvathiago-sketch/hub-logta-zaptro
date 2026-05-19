import { AlertTriangle, MapPin, Sparkles, Truck } from 'lucide-react';
import { LogtaAlertsInlinePanel } from '../../../components/LogtaAlertsInlinePanel';
import { useFretesIntelligence } from '../context/FretesIntelligenceContext';
import type { FretesAlert } from '../types';

function iconFor(alert: FretesAlert) {
  if (alert.category === 'rota' || alert.category === 'atraso' || alert.category === 'entrega') return MapPin;
  if (alert.category === 'motorista') return Truck;
  if (alert.category === 'ia') return Sparkles;
  return AlertTriangle;
}

/** Alertas logísticos no topo da página — sem popup centralizado. */
export function FretesAlertsInlinePanel({ className = '' }: { className?: string }) {
  const { activeAlerts, dismissAlert, monitoring } = useFretesIntelligence();

  return (
    <LogtaAlertsInlinePanel
      className={className}
      alerts={activeAlerts}
      onDismiss={dismissAlert}
      monitoringLabel={monitoring.label}
      iaLabel="IA Logística"
      getIcon={(inline) => {
        const full = activeAlerts.find((x) => x.id === inline.id);
        return full ? iconFor(full) : AlertTriangle;
      }}
    />
  );
}

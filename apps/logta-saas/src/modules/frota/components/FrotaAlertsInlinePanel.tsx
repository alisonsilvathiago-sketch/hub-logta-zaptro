import { AlertTriangle, FileText, Fuel, Sparkles, Truck, Wrench } from 'lucide-react';
import { LogtaAlertsInlinePanel } from '../../../components/LogtaAlertsInlinePanel';
import { useFrotaIntelligence } from '../context/FrotaIntelligenceContext';
import type { FrotaAlert } from '../types';

function iconFor(alert: FrotaAlert) {
  if (alert.category === 'combustivel') return Fuel;
  if (alert.category === 'manutencao') return Wrench;
  if (alert.category === 'ia') return Sparkles;
  if (alert.category === 'documento' || alert.category === 'ipva' || alert.category === 'licenciamento') {
    return FileText;
  }
  return Truck;
}

/** Alertas da frota dentro da página — sem popup centralizado. */
export function FrotaAlertsInlinePanel({ className = '' }: { className?: string }) {
  const { activeAlerts, dismissAlert, monitoring } = useFrotaIntelligence();

  return (
    <LogtaAlertsInlinePanel
      className={className}
      alerts={activeAlerts}
      onDismiss={dismissAlert}
      monitoringLabel={monitoring.label}
      iaLabel="IA Frota"
      getIcon={(inline) => iconFor(activeAlerts.find((x) => x.id === inline.id)!)}
    />
  );
}

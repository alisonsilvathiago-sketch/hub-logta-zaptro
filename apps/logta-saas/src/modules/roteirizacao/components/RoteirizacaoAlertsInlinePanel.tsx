import { MapPin, Navigation, Sparkles, Truck } from 'lucide-react';
import { LogtaAlertsInlinePanel } from '../../../components/LogtaAlertsInlinePanel';
import { useRoteirizacaoIntelligence } from '../context/RoteirizacaoIntelligenceContext';
import type { RoteirizacaoAlert } from '../types';

function iconFor(alert: RoteirizacaoAlert) {
  if (alert.category === 'rota' || alert.category === 'entrega' || alert.category === 'transito') return MapPin;
  if (alert.category === 'motorista') return Truck;
  if (alert.category === 'ia') return Sparkles;
  return Navigation;
}

export function RoteirizacaoAlertsInlinePanel({ className = '' }: { className?: string }) {
  const { activeAlerts, dismissAlert, monitoring } = useRoteirizacaoIntelligence();

  return (
    <LogtaAlertsInlinePanel
      className={className}
      alerts={activeAlerts.map((a) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        priority: a.priority,
        actionPath: a.actionPath,
        actionLabel: a.actionLabel,
        impacto: a.impacto ?? a.impactoFinanceiro,
        recomendacao: a.recomendacao,
      }))}
      onDismiss={dismissAlert}
      monitoringLabel={monitoring.label}
      iaLabel="IA de Rotas"
      getIcon={(alert) => iconFor(activeAlerts.find((x) => x.id === alert.id)!)}
    />
  );
}

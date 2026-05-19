import { LogtaAlertsInlinePanel } from '../../../components/LogtaAlertsInlinePanel';
import { useFinanceiroIntelligence } from '../context/FinanceiroIntelligenceContext';

export function FinanceiroAlertsInlinePanel({ className = '' }: { className?: string }) {
  const { activeAlerts, dismissAlert, monitoring } = useFinanceiroIntelligence();

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
        impacto: a.impacto,
        recomendacao: a.recomendacao,
      }))}
      onDismiss={dismissAlert}
      monitoringLabel={monitoring.label}
      iaLabel="IA Financeira"
    />
  );
}

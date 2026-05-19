import { FileText, Sparkles } from 'lucide-react';
import { LogtaAlertsInlinePanel } from '../../../components/LogtaAlertsInlinePanel';
import { useFiscalIntelligence } from '../context/FiscalIntelligenceContext';
import type { FiscalAlert } from '../types';

function iconFor(alert: FiscalAlert) {
  if (alert.category === 'ia') return Sparkles;
  return FileText;
}

export function FiscalAlertsInlinePanel({ className = '' }: { className?: string }) {
  const { activeAlerts, dismissAlert, monitoring } = useFiscalIntelligence();

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
        impacto: [a.impacto, a.impactoFinanceiro].filter(Boolean).join(' · ') || undefined,
        recomendacao: a.prazo ? `Prazo: ${a.prazo}` : undefined,
      }))}
      onDismiss={dismissAlert}
      monitoringLabel={monitoring.label}
      iaLabel="IA Fiscal"
      getIcon={(alert) => iconFor(activeAlerts.find((x) => x.id === alert.id)!)}
    />
  );
}

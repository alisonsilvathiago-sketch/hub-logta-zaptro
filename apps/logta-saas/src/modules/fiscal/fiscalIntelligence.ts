import type { FiscalAlert, FiscalDocStats, FiscalIaInsight } from './types';

export function buildFiscalAlerts(stats: FiscalDocStats): FiscalAlert[] {
  const now = Date.now();
  const alerts: FiscalAlert[] = [
    {
      id: 'cert-7d',
      title: 'Certificado digital vence em 7 dias',
      message: 'Renove o certificado A1 para evitar interrupção na emissão SEFAZ.',
      priority: 'critical',
      category: 'certificado',
      actionPath: '/documentos/dashboard',
      actionLabel: 'Central fiscal',
      impacto: 'Emissão de CT-e e MDF-e bloqueada após o vencimento.',
      impactoFinanceiro: 'Risco de parada operacional e multas por documentos em atraso.',
      prazo: '7 dias',
      createdAt: now,
    },
    {
      id: 'mdfe-48h',
      title: 'MDF-e aberto há mais de 48h',
      message: 'Placa BRA-2L22 possui manifesto em aberto há 48 horas.',
      priority: 'high',
      category: 'mdfe',
      actionPath: '/documentos/mdfe',
      actionLabel: 'Ver MDF-e',
      impacto: 'Obrigação de encerramento pendente perante a SEFAZ.',
      prazo: 'Imediato',
      createdAt: now,
    },
    {
      id: 'cte-rej',
      title: 'CT-e rejeitado pela SEFAZ',
      message: 'Existe CT-e com rejeição fiscal aguardando correção.',
      priority: 'critical',
      category: 'cte',
      actionPath: '/documentos/rejeitados',
      actionLabel: 'Ver rejeições',
      impacto: 'Frete sem documento válido — risco fiscal e operacional.',
      createdAt: now,
    },
    {
      id: 'sefaz-fail',
      title: 'Falha de comunicação SEFAZ',
      message: 'Fila de envio com instabilidade detectada na última sincronização.',
      priority: 'high',
      category: 'sefaz',
      actionPath: '/documentos/dashboard',
      actionLabel: 'Monitor SEFAZ',
      impacto: 'Documentos em fila de processamento.',
      createdAt: now,
    },
    {
      id: 'doc-sem-vinc',
      title: 'Documento sem vínculo operacional',
      message: 'CT-e emitido sem frete, motorista ou rota vinculados.',
      priority: 'medium',
      category: 'operacional',
      actionPath: '/documentos/cte',
      actionLabel: 'Vincular frete',
      createdAt: now,
    },
    {
      id: 'manifesto-pend',
      title: 'Manifesto pendente de encerramento',
      message: 'Encerre MDF-e autorizados ao finalizar o percurso.',
      priority: 'high',
      category: 'manifesto',
      actionPath: '/documentos/mdfe',
      actionLabel: 'Encerrar manifesto',
      createdAt: now,
    },
  ];

  if (stats.rejeitados > 0) {
    alerts.push({
      id: 'imposto-div',
      title: 'Imposto divergente detectado',
      message: `${stats.rejeitados} documento(s) com inconsistência tributária.`,
      priority: 'high',
      category: 'imposto',
      actionPath: '/documentos/rejeitados',
      actionLabel: 'Auditar rejeições',
      impactoFinanceiro: 'Revisão de base de cálculo ICMS recomendada.',
      createdAt: now,
    });
  }

  return alerts;
}

export function buildFiscalInsights(stats: FiscalDocStats, alerts: FiscalAlert[]): FiscalIaInsight[] {
  return [
    {
      id: 'ia-1',
      title: 'Previsão de rejeição',
      description: 'IA monitora campos obrigatórios antes do envio SEFAZ.',
      type: stats.pendentesSefaz > 0 ? 'warning' : 'info',
    },
    {
      id: 'ia-2',
      title: 'Cruzamento fiscal ↔ logística',
      description: 'Vincule fretes, motoristas e rotas aos documentos emitidos.',
      type: 'opportunity',
    },
    {
      id: 'ia-3',
      title: 'Risco fiscal operacional',
      description: `${alerts.filter((a) => a.priority === 'critical').length} alerta(s) crítico(s) em tempo real.`,
      type: alerts.some((a) => a.priority === 'critical') ? 'risk' : 'info',
    },
  ];
}

export function getFiscalMonitoringStatus(alerts: FiscalAlert[]) {
  const critical = alerts.filter((a) => a.priority === 'critical').length;
  return {
    label: critical > 0 ? 'Atenção imediata' : 'Monitoramento estável',
    total: alerts.length,
    critical,
  };
}

export function sortFiscalAlerts(alerts: FiscalAlert[]): FiscalAlert[] {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...alerts].sort((a, b) => order[a.priority] - order[b.priority]);
}

export const defaultFiscalStats: FiscalDocStats = {
  cteEmitidos: 0,
  mdfeAtivos: 0,
  pendentesSefaz: 0,
  rejeitados: 0,
};

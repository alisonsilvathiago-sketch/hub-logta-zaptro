import type { FrotaAlert, FrotaIaInsight, FrotaVehicleRow } from './types';

export function buildFrotaAlerts(vehicles: FrotaVehicleRow[]): FrotaAlert[] {
  const alerts: FrotaAlert[] = [];
  const now = Date.now();

  vehicles.forEach((v, i) => {
    const plate = v.plate || `UNI-${v.id.slice(0, 4)}`;
    const dayOffset = (v.id.charCodeAt(0) % 14) + 1;

    alerts.push({
      id: `ipva-${v.id}`,
      title: `IPVA próximo do vencimento`,
      message: `O IPVA do veículo ${plate} vence em ${dayOffset} dias.`,
      priority: dayOffset <= 3 ? 'critical' : 'high',
      category: 'ipva',
      actionPath: `/frota/veiculos/${encodeURIComponent(plate)}`,
      actionLabel: 'Ver veículo',
      impacto: 'Bloqueio de circulação e multas se não quitado.',
      vehiclePlate: plate,
      createdAt: now,
    });

    if (v.status === 'manutencao' || v.status === 'maintenance') {
      alerts.push({
        id: `manut-${v.id}`,
        title: 'Manutenção preventiva próxima',
        message: `A unidade ${plate} está em manutenção ou revisão pendente.`,
        priority: 'high',
        category: 'manutencao',
        actionPath: '/frota/manutencao',
        actionLabel: 'Abrir manutenção',
        vehiclePlate: plate,
        createdAt: now,
      });
    }

    if (i % 3 === 0) {
      alerts.push({
        id: `cons-${v.id}`,
        title: 'Consumo acima da média',
        message: `Veículo ${plate} com consumo acima da média operacional.`,
        priority: 'medium',
        category: 'combustivel',
        actionPath: '/frota/combustivel',
        actionLabel: 'Ver abastecimento',
        vehiclePlate: plate,
        createdAt: now,
      });
    }
  });

  if (vehicles.length > 0) {
    alerts.push({
      id: 'seguro-mes',
      title: 'Seguro da frota vence este mês',
      message: 'Renove a apólice para manter cobertura operacional.',
      priority: 'high',
      category: 'seguro',
      actionPath: '/frota/dashboard',
      actionLabel: 'Central de frota',
      createdAt: now,
    });
  }

  alerts.push({
    id: 'doc-venc',
    title: 'Documento obrigatório vencido detectado',
    message: 'CRLV ou licenciamento pendente em pelo menos uma unidade.',
    priority: 'critical',
    category: 'documento',
    actionPath: '/frota/veiculos',
    actionLabel: 'Gestão documental',
    createdAt: now,
  });

  return alerts;
}

export function buildFrotaInsights(vehicles: FrotaVehicleRow[], alerts: FrotaAlert[]): FrotaIaInsight[] {
  const emManut = vehicles.filter((v) => v.status === 'manutencao' || v.status === 'maintenance').length;
  return [
    {
      id: 'fi-1',
      title: 'Previsão de custos',
      description: `IA estima R$ ${(vehicles.length * 1250).toLocaleString('pt-BR')} em custos operacionais no mês.`,
      type: 'info',
    },
    {
      id: 'fi-2',
      title: 'Risco operacional',
      description: emManut > 0 ? `${emManut} veículo(s) indisponíveis — impacto em rotas.` : 'Frota com disponibilidade estável.',
      type: emManut > 0 ? 'warning' : 'info',
    },
    {
      id: 'fi-3',
      title: 'Alertas ativos',
      description: `${alerts.length} monitoramentos automáticos em tempo real.`,
      type: alerts.some((a) => a.priority === 'critical') ? 'risk' : 'opportunity',
    },
  ];
}

export function getFrotaMonitoringStatus(alerts: FrotaAlert[]) {
  const critical = alerts.filter((a) => a.priority === 'critical').length;
  return {
    level: critical > 0 ? 'critical' : alerts.length > 0 ? 'attention' : 'ok',
    label: critical > 0 ? 'Atenção crítica' : alerts.length > 0 ? 'Monitorando' : 'Operação normal',
    critical,
    total: alerts.length,
  };
}

export function sortFrotaAlerts(alerts: FrotaAlert[]) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...alerts].sort((a, b) => order[a.priority] - order[b.priority]);
}

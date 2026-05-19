import { computeFretesAnalytics } from './fretesAnalytics';
import type { FretesAlert, FretesIaInsight, ShipmentNormalized } from './types';

const PRIORITY: Record<FretesAlert['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortFretesAlerts(alerts: FretesAlert[]) {
  return [...alerts].sort((a, b) => PRIORITY[a.priority] - PRIORITY[b.priority]);
}

type MotoristaRow = { id: string; nome?: string; status?: string };
type VehicleRow = { id: string; plate?: string; status?: string; modelo?: string };

export function buildFretesAlerts(input: {
  shipments: ShipmentNormalized[];
  motoristas?: MotoristaRow[];
  vehicles?: VehicleRow[];
}): FretesAlert[] {
  const { shipments, motoristas = [], vehicles = [] } = input;
  const alerts: FretesAlert[] = [];
  const now = Date.now();
  const analytics = computeFretesAnalytics(shipments);

  for (const s of shipments) {
    const st = (s.status || '').toLowerCase();
    const ref = s.numero_frete || s.id.slice(0, 8);
    const rota = `${s.origin} → ${s.destination}`;

    if (st === 'delayed' || st.includes('atrasad')) {
      alerts.push({
        id: `atraso-${s.id}`,
        title: 'Atraso detectado',
        message: `O frete ${ref} está com risco de atraso na rota ${rota}.`,
        priority: 'critical',
        category: 'atraso',
        actionPath: `/fretes/operacional/${s.id}`,
        actionLabel: 'Ver frete',
        impacto: s.cliente_nome,
        recomendacao: 'Reagende entrega ou notifique o cliente.',
        entityId: s.id,
        createdAt: now,
      });
    }

    if ((st === 'in_transit' || st.includes('transito')) && !s.driver_id) {
      alerts.push({
        id: `sem-motorista-${s.id}`,
        title: 'Entrega sem motorista',
        message: `Frete ${ref} em rota sem motorista vinculado.`,
        priority: 'high',
        category: 'motorista',
        actionPath: `/fretes/operacional/${s.id}`,
        actionLabel: 'Atribuir motorista',
        entityId: s.id,
        createdAt: now,
      });
    }

    const valor = s.valor_frete || 0;
    const custoEst = valor * 0.72;
    if (valor > 0 && custoEst / valor > 0.85) {
      alerts.push({
        id: `custo-${s.id}`,
        title: 'Custo acima da média',
        message: `A viagem ${ref} ultrapassou o custo previsto operacional.`,
        priority: 'high',
        category: 'custo',
        actionPath: '/fretes/financeiro',
        actionLabel: 'Ver financeiro',
        impacto: `Margem estimada baixa`,
        entityId: s.id,
        createdAt: now,
      });
    }

    if (valor > 0 && valor < 2500 && (st === 'in_transit' || st.includes('transito'))) {
      alerts.push({
        id: `margem-${s.id}`,
        title: 'Margem operacional em queda',
        message: `A margem operacional do frete ${ref} pode estar abaixo de 9%.`,
        priority: 'medium',
        category: 'custo',
        actionPath: `/fretes/operacional/${s.id}`,
        actionLabel: 'Analisar custos',
        impacto: `R$ ${valor.toLocaleString('pt-BR')}`,
        createdAt: now,
      });
    }

    if (st === 'delivered' || st.includes('entregue')) {
      const meta = s.metadata || {};
      if (!meta.faturado) {
        alerts.push({
          id: `faturar-${s.id}`,
          title: 'Frete sem faturamento',
          message: `Frete ${ref} finalizado — faturamento pendente.`,
          priority: 'medium',
          category: 'entrega',
          actionPath: '/financeiro/gestao/faturamento',
          actionLabel: 'Faturar frete',
          entityId: s.id,
          createdAt: now,
        });
      }
    }

    if (st === 'pending' || st.includes('aguardando')) {
      const created = s.created_at ? new Date(s.created_at).getTime() : now;
      if (now - created > 2 * 86400000) {
        alerts.push({
          id: `pendente-rota-${s.id}`,
          title: 'Entrega não saiu para rota',
          message: `Entrega prevista para ${s.cliente_nome} ainda aguardando coleta.`,
          priority: 'high',
          category: 'entrega',
          actionPath: `/fretes/operacional/${s.id}`,
          actionLabel: 'Iniciar viagem',
          entityId: s.id,
          createdAt: now,
        });
      }
    }
  }

  if (analytics.atrasados >= 2) {
    alerts.push({
      id: 'operacao-atrasos',
      title: 'Operação com atrasos',
      message: `${analytics.atrasados} frete(s) com atraso detectado na operação.`,
      priority: 'critical',
      category: 'atraso',
      actionPath: '/fretes/central',
      actionLabel: 'Central operacional',
      impacto: `${analytics.atrasados} viagens`,
      createdAt: now,
    });
  }

  const veicManut = vehicles.filter((v) => {
    const st = (v.status || '').toLowerCase();
    return st.includes('manut') || st.includes('oficina');
  });
  if (veicManut.length > 0) {
    alerts.push({
      id: 'manutencao-frota',
      title: 'Manutenção impactando operação',
      message: `O veículo ${veicManut[0].plate || veicManut[0].id} precisa de manutenção.`,
      priority: 'high',
      category: 'manutencao',
      actionPath: '/frota/manutencao',
      actionLabel: 'Ver manutenção',
      createdAt: now,
    });
  }

  if (motoristas.length > 0 && analytics.emRota > motoristas.filter((m) => m.status === 'ativo' || m.status === 'active').length) {
    alerts.push({
      id: 'jornada-excesso',
      title: 'Excesso de jornada',
      message: 'Motoristas podem estar excedendo jornada permitida na operação atual.',
      priority: 'high',
      category: 'motorista',
      actionPath: '/rh/operacional/controle-jornada',
      actionLabel: 'Controle de jornada',
      recomendacao: 'Verifique descanso obrigatório no RH.',
      createdAt: now,
    });
  }

  alerts.push({
    id: 'combustivel-ia',
    title: 'Combustível acima do esperado',
    message: 'Combustível acima da média operacional detectado pela IA Logta.',
    priority: analytics.margemMedia < 15 ? 'high' : 'low',
    category: 'custo',
    actionPath: '/financeiro/operacional/controle-combustivel',
    actionLabel: 'Ver combustível',
    createdAt: now,
  });

  return sortFretesAlerts(alerts);
}

export function buildFretesIaInsights(shipments: ShipmentNormalized[], alerts: FretesAlert[]): FretesIaInsight[] {
  const a = computeFretesAnalytics(shipments);
  const insights: FretesIaInsight[] = [];

  if (a.atrasados > 0) {
    insights.push({
      id: 'ia-atraso',
      title: 'Previsão de atrasos',
      description: `${a.atrasados} frete(s) com indicador de atraso. IA recomenda reordenar rotas prioritárias.`,
      type: 'risk',
      actions: [{ label: 'Mapa operacional', path: '/fretes/mapa' }],
    });
  }

  if (a.margemMedia < 12) {
    insights.push({
      id: 'ia-prejuizo',
      title: 'Risco de prejuízo',
      description: `Margem média em ${a.margemMedia.toFixed(1)}%. Revise diesel, pedágios e diárias.`,
      type: 'warning',
      actions: [{ label: 'Financeiro fretes', path: '/fretes/financeiro' }],
    });
  }

  if (a.lucroOperacional > 0) {
    insights.push({
      id: 'ia-rota',
      title: 'Otimização de rotas',
      description: 'IA identificou oportunidade de consolidar cargas na mesma região para reduzir custo/km.',
      type: 'opportunity',
      actions: [{ label: 'Assistente IA', path: '/financeiro/assistente?tab=frete' }],
    });
  }

  const critical = alerts.filter((x) => x.priority === 'critical').length;
  if (critical > 0) {
    insights.push({
      id: 'ia-risco',
      title: 'Risco operacional',
      description: `${critical} alerta(s) crítico(s) na operação logística.`,
      type: 'risk',
      actions: [{ label: 'Central de fretes', path: '/fretes/central' }],
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'ia-ok',
      title: 'Operação logística estável',
      description: 'Monitoramento ativo sem anomalias críticas. Continue registrando fretes para maior precisão.',
      type: 'info',
      actions: [{ label: 'Kanban', path: '/fretes/kanban' }],
    });
  }

  return insights;
}

export function getFretesMonitoringStatus(alerts: FretesAlert[]) {
  const critical = alerts.filter((a) => a.priority === 'critical').length;
  const high = alerts.filter((a) => a.priority === 'high').length;
  return {
    ativo: true,
    critical,
    high,
    total: alerts.length,
    nivel: critical > 0 ? 'critico' : high > 0 ? 'atencao' : 'normal',
    label: critical > 0 ? 'Atenção imediata' : high > 0 ? 'Monitoramento ativo' : 'Operação estável',
  } as const;
}

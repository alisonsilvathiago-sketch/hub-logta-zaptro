import { computeRoteirizacaoAnalytics } from './roteirizacaoAnalytics';
import type { ActiveRouteNormalized, RouteDeliveryNormalized, RoteirizacaoAlert, RoteirizacaoIaInsight } from './types';

const PRIORITY: Record<RoteirizacaoAlert['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortRoteirizacaoAlerts(alerts: RoteirizacaoAlert[]) {
  return [...alerts].sort((a, b) => PRIORITY[a.priority] - PRIORITY[b.priority]);
}

type MotoristaRow = { id: string; nome?: string; status?: string };
type VehicleRow = { id: string; plate?: string; status?: string; modelo?: string; capacidade?: number };

export function buildRoteirizacaoAlerts(input: {
  deliveries: RouteDeliveryNormalized[];
  activeRoutes: ActiveRouteNormalized[];
  routeOptimized: boolean;
  motoristas?: MotoristaRow[];
  vehicles?: VehicleRow[];
}): RoteirizacaoAlert[] {
  const { deliveries, activeRoutes, routeOptimized, motoristas = [], vehicles = [] } = input;
  const alerts: RoteirizacaoAlert[] = [];
  const now = Date.now();
  const analytics = computeRoteirizacaoAnalytics(deliveries, activeRoutes, routeOptimized);

  if (!routeOptimized && deliveries.length >= 3) {
    alerts.push({
      id: 'rota-alternativa',
      title: 'Rota alternativa disponível',
      message: 'Existe uma rota alternativa até 18% mais rápida com menor consumo de combustível.',
      priority: 'high',
      category: 'rota',
      actionPath: '/roteirizacao/planejamento',
      actionLabel: 'Gerar rota inteligente',
      impacto: 'Redução estimada de tempo operacional',
      impactoFinanceiro: 'Economia potencial em diesel e pedágios',
      recomendacao: 'Execute "Gerar Rota Inteligente" no planejamento.',
      createdAt: now,
    });
  }

  if (analytics.entregasUrgentes >= 2) {
    alerts.push({
      id: 'entregas-urgentes',
      title: 'Entregas prioritárias na rota',
      message: `${analytics.entregasUrgentes} entrega(s) com prioridade alta ou urgente aguardando sequenciamento.`,
      priority: 'high',
      category: 'entrega',
      actionPath: '/roteirizacao/planejamento',
      actionLabel: 'Reordenar entregas',
      impacto: 'SLA operacional em risco',
      createdAt: now,
    });
  }

  for (const d of deliveries) {
    const st = (d.status || '').toLowerCase();
    if (st === 'delayed' || st.includes('atrasad')) {
      alerts.push({
        id: `atraso-${d.shipmentId || d.id}`,
        title: 'Entrega com risco de atraso',
        message: `A entrega ${d.id} para ${d.dest} pode atrasar o cumprimento do SLA.`,
        priority: 'critical',
        category: 'entrega',
        actionPath: '/roteirizacao/rotas',
        actionLabel: 'Ver rotas ativas',
        impacto: d.priority,
        recomendacao: 'Reagende ou redistribua para motorista mais próximo.',
        entityId: d.shipmentId,
        createdAt: now,
      });
    }

    if ((st === 'in_transit' || st.includes('rota')) && !d.driver_id) {
      alerts.push({
        id: `sem-driver-${d.shipmentId || d.id}`,
        title: 'Rota sem motorista alocado',
        message: `Entrega ${d.id} em rota sem motorista vinculado.`,
        priority: 'high',
        category: 'motorista',
        actionPath: '/roteirizacao/planejamento',
        actionLabel: 'Alocar motorista',
        entityId: d.shipmentId,
        createdAt: now,
      });
    }
  }

  const pesoTotal = deliveries.reduce((acc, d) => {
    const n = parseFloat(String(d.weight).replace(/\D/g, '') || '0');
    return acc + n;
  }, 0);
  const capVeiculo = vehicles[0]?.capacidade || 1500;
  if (pesoTotal > capVeiculo * 0.95 && deliveries.length > 0) {
    alerts.push({
      id: 'carga-capacidade',
      title: 'Carga acima da capacidade',
      message: `Carga estimada (${pesoTotal}kg) próxima ou acima da capacidade do veículo (${capVeiculo}kg).`,
      priority: 'critical',
      category: 'carga',
      actionPath: '/roteirizacao/planejamento',
      actionLabel: 'Redistribuir carga',
      impactoFinanceiro: 'Risco de multa e retrabalho operacional',
      recomendacao: 'Divida entregas em duas rotas ou troque o veículo.',
      createdAt: now,
    });
  }

  if (deliveries.length > 8) {
    alerts.push({
      id: 'excesso-entregas',
      title: 'Excesso de entregas na rota',
      message: `${deliveries.length} paradas na rota atual — IA recomenda clusterização regional.`,
      priority: 'medium',
      category: 'rota',
      actionPath: '/roteirizacao/otimizacao',
      actionLabel: 'Motor de IA',
      createdAt: now,
    });
  }

  if (motoristas.length > 0) {
    const ativos = motoristas.filter((m) => {
      const st = (m.status || '').toLowerCase();
      return st === 'ativo' || st === 'active' || st.includes('dispon');
    });
    if (analytics.motoristasAtivos > ativos.length && ativos.length > 0) {
      alerts.push({
        id: 'jornada-motorista',
        title: 'Motorista próximo do limite de jornada',
        message: 'Um ou mais motoristas podem exceder a jornada permitida nesta rota.',
        priority: 'high',
        category: 'motorista',
        actionPath: '/rh/operacional/controle-jornada',
        actionLabel: 'Controle de jornada',
        recomendacao: 'Troque motorista ou redistribua paradas.',
        createdAt: now,
      });
    }
  }

  alerts.push({
    id: 'transito-rota',
    title: 'Trânsito elevado na rota',
    message: 'A rota atual possui trânsito elevado em trechos urbanos — IA sugere desvio.',
    priority: routeOptimized ? 'low' : 'medium',
    category: 'transito',
    actionPath: '/roteirizacao/otimizacao',
    actionLabel: 'Ver alternativas',
    impacto: '+12 min estimados',
    createdAt: now,
  });

  if (analytics.margemOperacional < 18) {
    alerts.push({
      id: 'custo-rota',
      title: 'Custo acima da média operacional',
      message: `Margem operacional da rota em ${analytics.margemOperacional.toFixed(0)}% — abaixo do ideal.`,
      priority: 'medium',
      category: 'custo',
      actionPath: '/roteirizacao/eficiencia',
      actionLabel: 'Ver performance',
      impactoFinanceiro: `Custo R$ ${analytics.custoOperacional.toFixed(0)}`,
      createdAt: now,
    });
  }

  const veicManut = vehicles.filter((v) => {
    const st = (v.status || '').toLowerCase();
    return st.includes('manut') || st.includes('oficina');
  });
  if (veicManut.length > 0) {
    alerts.push({
      id: 'consumo-veiculo',
      title: 'Veículo acima do consumo médio',
      message: `Veículo ${veicManut[0].plate || ''} com indicador de consumo elevado ou em manutenção.`,
      priority: 'high',
      category: 'veiculo',
      actionPath: '/frota',
      actionLabel: 'Ver frota',
      createdAt: now,
    });
  }

  alerts.push({
    id: 'motorista-parado',
    title: 'Motorista parado',
    message: 'Motorista parado há 45 minutos sem movimentação detectada na rota.',
    priority: 'medium',
    category: 'motorista',
    actionPath: '/roteirizacao/rotas',
    actionLabel: 'Monitorar rota',
    impacto: 'Possível atraso em cascata',
    createdAt: now,
  });

  if (analytics.rotasCriticas >= 2) {
    alerts.push({
      id: 'risco-operacional',
      title: 'Risco operacional detectado',
      message: `${analytics.rotasCriticas} rota(s) crítica(s) na operação logística atual.`,
      priority: 'critical',
      category: 'ia',
      actionPath: '/roteirizacao/eficiencia',
      actionLabel: 'Dashboard executivo',
      impacto: `${analytics.entregasEmRota} em rota`,
      createdAt: now,
    });
  }

  return sortRoteirizacaoAlerts(alerts);
}

export function buildRoteirizacaoIaInsights(
  deliveries: RouteDeliveryNormalized[],
  activeRoutes: ActiveRouteNormalized[],
  alerts: RoteirizacaoAlert[],
  routeOptimized: boolean,
): RoteirizacaoIaInsight[] {
  const a = computeRoteirizacaoAnalytics(deliveries, activeRoutes, routeOptimized);
  const insights: RoteirizacaoIaInsight[] = [];

  if (!routeOptimized) {
    insights.push({
      id: 'ia-melhor-rota',
      title: 'Melhor rota calculada',
      description: 'IA pode reduzir até 18% do tempo e 17% do KM evitando trânsito e pedágios desnecessários.',
      type: 'opportunity',
      actions: [{ label: 'Otimizar agora', path: '/roteirizacao/planejamento' }],
    });
  }

  if (a.economiaKm > 0) {
    insights.push({
      id: 'ia-economia',
      title: 'Economia operacional',
      description: `Rota otimizada economizou ${a.economiaKm.toFixed(1)} km e melhorou a margem para ${a.margemOperacional.toFixed(0)}%.`,
      type: 'info',
      actions: [{ label: 'Performance', path: '/roteirizacao/eficiencia' }],
    });
  }

  if (a.entregasUrgentes > 0) {
    insights.push({
      id: 'ia-urgente',
      title: 'Sequência prioritária',
      description: `${a.entregasUrgentes} entrega(s) urgente(s) — IA sugere iniciar por região com menor desvio total.`,
      type: 'warning',
      actions: [{ label: 'Planejamento', path: '/roteirizacao/planejamento' }],
    });
  }

  if (a.margemOperacional < 20) {
    insights.push({
      id: 'ia-custo',
      title: 'Análise financeira da rota',
      description: `Custo por KM R$ ${a.custoPorKm.toFixed(2)} · Custo por entrega R$ ${a.custoPorEntrega.toFixed(0)}. Revise pedágios e diesel.`,
      type: 'warning',
      actions: [{ label: 'Financeiro', path: '/financeiro' }],
    });
  }

  const critical = alerts.filter((x) => x.priority === 'critical').length;
  if (critical > 0) {
    insights.push({
      id: 'ia-risco',
      title: 'Gargalo operacional',
      description: `${critical} alerta(s) crítico(s) — redistribua entregas ou recalcule a rota em tempo real.`,
      type: 'risk',
      actions: [{ label: 'Rotas ativas', path: '/roteirizacao/rotas' }],
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'ia-ok',
      title: 'Rotas operacionais estáveis',
      description: 'Monitoramento ativo sem anomalias críticas. Continue otimizando clusters regionais.',
      type: 'info',
      actions: [{ label: 'Motor de IA', path: '/roteirizacao/otimizacao' }],
    });
  }

  return insights;
}

export function getRoteirizacaoMonitoringStatus(alerts: RoteirizacaoAlert[]) {
  const critical = alerts.filter((a) => a.priority === 'critical').length;
  const high = alerts.filter((a) => a.priority === 'high').length;
  return {
    ativo: true,
    critical,
    high,
    total: alerts.length,
    nivel: critical > 0 ? 'critico' : high > 0 ? 'atencao' : 'normal',
  } as const;
}

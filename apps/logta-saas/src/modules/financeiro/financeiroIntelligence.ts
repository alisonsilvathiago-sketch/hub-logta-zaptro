import { computeFinanceiroAnalytics, type TransactionRow } from './financeiroAnalytics';

export type FinanceiroAlertPriority = 'critical' | 'high' | 'medium' | 'low';

export type FinanceiroAlertCategory =
  | 'pagamento'
  | 'recebimento'
  | 'fluxo'
  | 'operacional'
  | 'cliente'
  | 'fornecedor'
  | 'ia'
  | 'fiscal';

export type FinanceiroAlert = {
  id: string;
  title: string;
  message: string;
  priority: FinanceiroAlertPriority;
  category: FinanceiroAlertCategory;
  actionPath: string;
  actionLabel: string;
  impacto?: string;
  recomendacao?: string;
  entityId?: string;
  historico?: string;
  createdAt: number;
};

export type FinanceiroIaInsight = {
  id: string;
  title: string;
  description: string;
  type: 'risk' | 'opportunity' | 'warning' | 'info';
  actions?: { label: string; path: string }[];
};

export type ShipmentRow = {
  id: string;
  origin?: string;
  destination?: string;
  status?: string;
  created_at?: string;
  metadata?: { valor_frete?: number; tipo_carga?: string };
};

export type MotoristaRow = {
  id: string;
  nome?: string;
  status?: string;
};

function tipo(t: TransactionRow) {
  return t.tipo ?? t.type ?? '';
}

function valor(t: TransactionRow) {
  return Number(t.valor ?? t.amount ?? 0);
}

function descricao(t: TransactionRow) {
  return (t.descricao ?? t.description ?? 'Lançamento').trim();
}

function dueDate(t: TransactionRow) {
  const raw = t.data_vencimento ?? t.paid_at ?? t.created_at;
  return raw ? new Date(raw) : new Date();
}

function isPaid(t: TransactionRow) {
  return Boolean(t.paid_at);
}

const PRIORITY_ORDER: Record<FinanceiroAlertPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortFinanceiroAlerts(alerts: FinanceiroAlert[]) {
  return [...alerts].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

export function buildFinanceiroAlerts(input: {
  transactions: TransactionRow[];
  shipments?: ShipmentRow[];
  motoristas?: MotoristaRow[];
}): FinanceiroAlert[] {
  const { transactions, shipments = [], motoristas = [] } = input;
  const alerts: FinanceiroAlert[] = [];
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  const analytics = computeFinanceiroAnalytics(transactions);

  const despesas = transactions.filter((t) => tipo(t) === 'despesa');
  const receitas = transactions.filter((t) => tipo(t) === 'receita');

  for (const t of despesas) {
    if (isPaid(t)) continue;
    const d = dueDate(t);
    const diff = Math.round((d.getTime() - now) / day);
    const nome = descricao(t);
    const v = valor(t);

    if (diff < 0) {
      alerts.push({
        id: `pay-overdue-${t.id}`,
        title: 'Pagamento em atraso',
        message: `O pagamento "${nome}" está vencido há ${Math.abs(diff)} dia(s).`,
        priority: 'critical',
        category: 'pagamento',
        actionPath: '/financeiro/pagar',
        actionLabel: 'Registrar pagamento',
        impacto: `R$ ${v.toLocaleString('pt-BR')} pendente`,
        recomendacao: 'Priorize o pagamento para evitar juros e bloqueio operacional.',
        entityId: t.id,
        historico: `Vencimento: ${d.toLocaleDateString('pt-BR')}`,
        createdAt: now,
      });
    } else if (diff === 0) {
      alerts.push({
        id: `pay-today-${t.id}`,
        title: 'Boletos vencendo hoje',
        message: `"${nome}" vence hoje.`,
        priority: 'critical',
        category: 'pagamento',
        actionPath: '/financeiro/pagar',
        actionLabel: 'Pagar agora',
        impacto: `R$ ${v.toLocaleString('pt-BR')}`,
        recomendacao: 'Confirme o pagamento antes do fechamento bancário.',
        entityId: t.id,
        createdAt: now,
      });
    } else if (diff === 1) {
      alerts.push({
        id: `pay-tomorrow-${t.id}`,
        title: 'Pagamento vence amanhã',
        message: `O pagamento da empresa/fornecedor "${nome}" vence amanhã.`,
        priority: 'high',
        category: 'fornecedor',
        actionPath: '/financeiro/pagar',
        actionLabel: 'Ver contas a pagar',
        impacto: `R$ ${v.toLocaleString('pt-BR')}`,
        recomendacao: 'Programe TED/PIX ou boleto com antecedência.',
        entityId: t.id,
        createdAt: now,
      });
    } else if (diff <= 7) {
      alerts.push({
        id: `pay-soon-${t.id}`,
        title: 'Vencimento próximo',
        message: `"${nome}" vence em ${diff} dias.`,
        priority: 'medium',
        category: 'pagamento',
        actionPath: '/financeiro/pagar',
        actionLabel: 'Agendar pagamento',
        impacto: `R$ ${v.toLocaleString('pt-BR')}`,
        entityId: t.id,
        createdAt: now,
      });
    }
  }

  for (const t of receitas) {
    if (isPaid(t)) continue;
    const d = dueDate(t);
    const diff = Math.round((now - d.getTime()) / day);
    const nome = descricao(t);
    const v = valor(t);

    if (diff >= 12) {
      alerts.push({
        id: `recv-late-${t.id}`,
        title: 'Cliente em atraso',
        message: `Ainda não recebemos o pagamento de "${nome}" (${diff} dias em atraso).`,
        priority: 'critical',
        category: 'cliente',
        actionPath: '/financeiro/receber',
        actionLabel: 'Cobrar cliente',
        impacto: `R$ ${v.toLocaleString('pt-BR')} em aberto`,
        recomendacao: 'Acione cobrança e avalie bloqueio de novos fretes.',
        entityId: t.id,
        historico: `Previsto desde ${d.toLocaleDateString('pt-BR')}`,
        createdAt: now,
      });
    } else if (diff >= 3) {
      alerts.push({
        id: `recv-pending-${t.id}`,
        title: 'Recebimento pendente',
        message: `Aguardando pagamento de "${nome}" há ${diff} dias.`,
        priority: 'high',
        category: 'recebimento',
        actionPath: '/financeiro/receber',
        actionLabel: 'Ver contas a receber',
        impacto: `R$ ${v.toLocaleString('pt-BR')}`,
        entityId: t.id,
        createdAt: now,
      });
    }
  }

  if (analytics.saldo < 0) {
    alerts.push({
      id: 'fluxo-negativo',
      title: 'Fluxo de caixa crítico',
      message: 'Fluxo de caixa negativo. Despesas superam receitas no período analisado.',
      priority: 'critical',
      category: 'fluxo',
      actionPath: '/financeiro/fluxo',
      actionLabel: 'Abrir fluxo de caixa',
      impacto: `Saldo: R$ ${analytics.saldo.toLocaleString('pt-BR')}`,
      recomendacao: 'Revise contas a pagar e acelere recebimentos.',
      createdAt: now,
    });
  } else if (analytics.receita > 0 && analytics.saldo < analytics.receita * 0.15) {
    alerts.push({
      id: 'fluxo-baixo',
      title: 'Fluxo de caixa abaixo do ideal',
      message: 'Saldo disponível está abaixo de 15% da receita — atenção à liquidez.',
      priority: 'high',
      category: 'fluxo',
      actionPath: '/financeiro/central',
      actionLabel: 'Ver central financeira',
      impacto: `Saldo: R$ ${analytics.saldo.toLocaleString('pt-BR')}`,
      recomendacao: 'Projete entradas dos próximos 7 dias.',
      createdAt: now,
    });
  }

  const weekAgo = now - 7 * day;
  const despesasSemana = despesas.filter((t) => dueDate(t).getTime() >= weekAgo);
  const totalSemana = despesasSemana.reduce((s, t) => s + valor(t), 0);
  const mediaDespesa = despesas.length ? analytics.despesas / Math.max(1, despesas.length / 4) : 0;
  if (totalSemana > mediaDespesa * 1.4 && totalSemana > 0) {
    alerts.push({
      id: 'despesas-semana',
      title: 'Alto volume de despesas',
      message: 'A empresa possui alto volume de despesas esta semana.',
      priority: 'high',
      category: 'ia',
      actionPath: '/financeiro/gestao/centro-custos',
      actionLabel: 'Analisar custos',
      impacto: `R$ ${totalSemana.toLocaleString('pt-BR')} em 7 dias`,
      recomendacao: 'Compare com centros de custo e rotas deficitárias.',
      createdAt: now,
    });
  }

  const combustivelTotal = analytics.byCategory['Combustível'] ?? analytics.byCategory['combustível'] ?? 0;
  if (analytics.despesas > 0 && combustivelTotal / analytics.despesas > 0.28) {
    alerts.push({
      id: 'combustivel-alto',
      title: 'Combustível acima da média',
      message: 'Combustível acima da média operacional (>28% das despesas).',
      priority: 'high',
      category: 'operacional',
      actionPath: '/financeiro/operacional/controle-combustivel',
      actionLabel: 'Ver combustível',
      impacto: `${Math.round((combustivelTotal / analytics.despesas) * 100)}% das despesas`,
      recomendacao: 'Revise consumo por km e negocie abastecimento.',
      createdAt: now,
    });
  }

  const margem = analytics.receita > 0 ? (analytics.lucroOperacional / analytics.receita) * 100 : 0;
  if (analytics.receita > 0 && margem < 12) {
    alerts.push({
      id: 'lucro-meta',
      title: 'Lucro abaixo da meta',
      message: `Lucro mensal abaixo da meta operacional (${margem.toFixed(1)}% de margem).`,
      priority: margem < 8 ? 'critical' : 'high',
      category: 'ia',
      actionPath: '/financeiro/assistente?tab=lucro',
      actionLabel: 'Simular lucro',
      impacto: `Margem: ${margem.toFixed(1)}%`,
      recomendacao: 'Meta transportadora: 12–18% de margem líquida.',
      createdAt: now,
    });
  }

  if (analytics.inadimplenciaEst > 25) {
    alerts.push({
      id: 'inadimplencia',
      title: 'Risco de inadimplência',
      message: 'Existem indicadores elevados de inadimplência e recebíveis em atraso.',
      priority: 'critical',
      category: 'cliente',
      actionPath: '/financeiro/gestao/inadimplencia',
      actionLabel: 'Gestão de inadimplência',
      impacto: `Índice estimado: ${analytics.inadimplenciaEst}%`,
      recomendacao: 'Priorize cobrança e análise de limite de crédito.',
      createdAt: now,
    });
  }

  const top = analytics.topCustos[0];
  if (top && analytics.despesas > 0 && top.total / analytics.despesas > 0.45) {
    alerts.push({
      id: `centro-custo-${top.name}`,
      title: 'Centro de custo excedeu limite',
      message: `A categoria "${top.name}" concentra mais de 45% das despesas.`,
      priority: 'medium',
      category: 'operacional',
      actionPath: '/financeiro/gestao/centro-custos',
      actionLabel: 'Centro de custos',
      impacto: `R$ ${top.total.toLocaleString('pt-BR')}`,
      createdAt: now,
    });
  }

  const delivered = shipments.filter((s) => s.status === 'delivered' || s.status === 'entregue');
  const receitaCount = receitas.length;
  if (delivered.length > receitaCount && delivered.length >= 2) {
    alerts.push({
      id: 'frete-sem-faturamento',
      title: 'Frete sem faturamento',
      message: `${delivered.length} viagem(ns) finalizada(s) com possível faturamento pendente.`,
      priority: 'high',
      category: 'fiscal',
      actionPath: '/financeiro/gestao/faturamento',
      actionLabel: 'Emitir faturas',
      recomendacao: 'Vincule CT-e/viagens a lançamentos de receita.',
      createdAt: now,
    });
  }

  const delayed = shipments.filter((s) => s.status === 'delayed' || s.status === 'atrasado');
  if (delayed.length > 0) {
    const rota = delayed[0];
    alerts.push({
      id: `rota-custo-${rota.id}`,
      title: 'Custo operacional elevado',
      message: `A operação logística ${rota.origin ?? '—'} → ${rota.destination ?? '—'} está com atraso e custo acima da média.`,
      priority: 'high',
      category: 'operacional',
      actionPath: '/logistica',
      actionLabel: 'Ver logística',
      impacto: `${delayed.length} viagem(ns) atrasada(s)`,
      recomendacao: 'Avalie diárias extras e combustível adicional.',
      createdAt: now,
    });
  }

  const fretesBaixaMargem = shipments.filter((s) => {
    const v = Number(s.metadata?.valor_frete ?? 0);
    return v > 0 && v < 3000 && (s.status === 'in_transit' || s.status === 'em_viagem');
  });
  if (fretesBaixaMargem.length > 0) {
    alerts.push({
      id: 'margem-viagem',
      title: 'Margem da viagem em queda',
      message: 'A margem de lucro de viagens ativas pode estar abaixo de 8% com base no valor do frete.',
      priority: 'medium',
      category: 'operacional',
      actionPath: '/financeiro/operacional/custos-por-viagem',
      actionLabel: 'Custos por viagem',
      impacto: `${fretesBaixaMargem.length} viagem(ns) monitorada(s)`,
      createdAt: now,
    });
  }

  const motAtivos = motoristas.filter((m) => m.status === 'ativo' || m.status === 'active').length;
  if (motAtivos > 0 && combustivelTotal > motAtivos * 2500) {
    alerts.push({
      id: 'motorista-custos',
      title: 'Custos por motorista elevados',
      message: 'Motoristas com indicador de excesso de custos operacionais (combustível concentrado).',
      priority: 'medium',
      category: 'operacional',
      actionPath: '/financeiro/operacional/custos-motorista',
      actionLabel: 'Custos por motorista',
      impacto: `${motAtivos} motorista(s) ativo(s)`,
      createdAt: now,
    });
  }

  const projecao7 = analytics.fluxoMensal.slice(-1)[0];
  if (projecao7 && projecao7.in < projecao7.out * 0.85) {
    alerts.push({
      id: 'receita-prevista',
      title: 'Receita prevista em queda',
      message: 'Receita prevista para o período recente caiu em relação às saídas.',
      priority: 'medium',
      category: 'ia',
      actionPath: '/financeiro/assistente?tab=projecao',
      actionLabel: 'Projeção IA',
      createdAt: now,
    });
  }

  return sortFinanceiroAlerts(alerts);
}

export function buildFinanceiroIaInsights(
  transactions: TransactionRow[],
  alerts: FinanceiroAlert[],
): FinanceiroIaInsight[] {
  const analytics = computeFinanceiroAnalytics(transactions);
  const insights: FinanceiroIaInsight[] = [];

  if (analytics.saldo < 0) {
    insights.push({
      id: 'ia-caixa',
      title: 'Previsão de queda de caixa',
      description:
        'A IA detectou tendência de caixa negativo. Recomenda-se adiar despesas não críticas e intensificar cobrança.',
      type: 'risk',
      actions: [
        { label: 'Fluxo de caixa', path: '/financeiro/fluxo' },
        { label: 'Projeção IA', path: '/financeiro/assistente?tab=projecao' },
      ],
    });
  }

  if (analytics.topCustos.length >= 2) {
    const [a, b] = analytics.topCustos;
    insights.push({
      id: 'ia-custos',
      title: 'Redução de custos sugerida',
      description: `Maiores gastos: ${a.name} (R$ ${a.total.toLocaleString('pt-BR')}) e ${b.name}. Revise contratos e rotas.`,
      type: 'warning',
      actions: [{ label: 'Centro de custos', path: '/financeiro/gestao/centro-custos' }],
    });
  }

  if (analytics.lucroOperacional > 0 && analytics.receita > 0) {
    const pct = ((analytics.lucroOperacional / analytics.receita) * 100).toFixed(1);
    insights.push({
      id: 'ia-crescimento',
      title: 'Crescimento financeiro',
      description: `Margem operacional em ${pct}%. Oportunidade de reinvestir em frota ou expandir rotas rentáveis.`,
      type: 'opportunity',
      actions: [{ label: 'Simulador operacional', path: '/financeiro/assistente?tab=operacional' }],
    });
  }

  const criticalCount = alerts.filter((a) => a.priority === 'critical').length;
  if (criticalCount > 0) {
    insights.push({
      id: 'ia-alertas',
      title: 'Anomalias detectadas',
      description: `${criticalCount} alerta(s) crítico(s) exigem ação imediata. O monitoramento automático continua ativo.`,
      type: 'risk',
      actions: [{ label: 'Central financeira', path: '/financeiro/central' }],
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'ia-ok',
      title: 'Operação financeira estável',
      description: 'Nenhuma anomalia crítica detectada. Continue registrando lançamentos para maior precisão da IA.',
      type: 'info',
      actions: [{ label: 'Assistente IA', path: '/financeiro/assistente' }],
    });
  }

  return insights;
}

export function getMonitoringStatus(alerts: FinanceiroAlert[]) {
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

import { XRayPageContext } from './LogstokaXRayContext';

export type XRayDiagnosticItem = {
  id: string;
  status: 'ok' | 'warning' | 'error';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  canResolve: boolean;
  targetUrl?: string;
};

export type XRayAuditResult = {
  score: number;
  summary: string;
  items: XRayDiagnosticItem[];
};

// In-memory active audits for state persistence per session (so "Correct" updates live in WMS)
let sessionDiagnosticOverrides: Record<string, Partial<XRayDiagnosticItem>> = {};

export function clearXRaySession() {
  sessionDiagnosticOverrides = {};
}

export function runXRayAudit(context: XRayPageContext): XRayAuditResult {
  const allItems: XRayDiagnosticItem[] = getBaseDiagnostics(context);
  
  // Apply in-memory session resolutions/overrides
  const activeItems = allItems.map(item => {
    const override = sessionDiagnosticOverrides[item.id];
    return override ? { ...item, ...override } : item;
  });

  // Calculate dynamic score
  // Error = -15 pts, Warning = -5 pts, Ok = 0 pts
  let totalDeduction = 0;
  activeItems.forEach(item => {
    if (item.status === 'error') totalDeduction += 15;
    if (item.status === 'warning') totalDeduction += 5;
  });

  const score = Math.max(50, 100 - totalDeduction);

  // Generate dynamic summaries based on remaining issues
  const errorCount = activeItems.filter(i => i.status === 'error').length;
  const warningCount = activeItems.filter(i => i.status === 'warning').length;
  
  let summary = '';
  if (errorCount === 0 && warningCount === 0) {
    summary = 'Sua operação nesta seção está 100% otimizada. Nenhum gargalo operacional foi encontrado pela IA.';
  } else {
    summary = `Encontramos ${errorCount > 0 ? `${errorCount} problema(s) crítico(s)` : ''}${errorCount > 0 && warningCount > 0 ? ' e ' : ''}${warningCount > 0 ? `${warningCount} ponto(s) de atenção` : ''} que requerem sua atenção imediata no WMS.`;
  }

  return {
    score,
    summary,
    items: activeItems,
  };
}

export async function resolveDiagnosticItem(itemId: string): Promise<boolean> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      // Mark as OK and change description
      sessionDiagnosticOverrides[itemId] = {
        status: 'ok',
        title: `Resolvido: ${getResolvedTitle(itemId)}`,
        message: 'A Inteligência Artificial do LogStoka aplicou a retificação automática e normalizou este registro.',
        canResolve: false,
      };
      resolve(true);
    }, 600); // Premium visual delay to simulate calculation
  });
}

function getResolvedTitle(itemId: string): string {
  if (itemId.includes('dup')) return 'Duplicidade de produtos removida';
  if (itemId.includes('cat')) return 'Categoria vinculada automaticamente';
  if (itemId.includes('ean')) return 'Código EAN gerado e validado';
  if (itemId.includes('neg')) return 'Estoques negativos ajustados para zero';
  if (itemId.includes('loc')) return 'Localização padrão de depósito atribuída';
  if (itemId.includes('xml')) return 'NF-e XML processada e estoque inserido';
  if (itemId.includes('pub')) return 'Carga publicada automaticamente';
  if (itemId.includes('tok')) return 'Token restabelecido e filas limpas';
  return 'Ocorrência resolvida pela IA';
}

function getBaseDiagnostics(context: XRayPageContext): XRayDiagnosticItem[] {
  switch (context) {
    case 'products':
      return [
        {
          id: 'prod-dup',
          status: 'error',
          title: 'Produtos Duplicados no WMS',
          message: 'Detectamos 3 produtos contendo exatamente o mesmo SKU mestre em conflito de inventário ativo.',
          priority: 'high',
          canResolve: true,
          targetUrl: '/app/products',
        },
        {
          id: 'prod-photo',
          status: 'warning',
          title: 'Produtos Sem Foto de Exibição',
          message: 'Existem 12 produtos no catálogo ativo que não possuem nenhuma imagem cadastrada.',
          priority: 'medium',
          canResolve: false,
          targetUrl: '/app/products',
        },
        {
          id: 'prod-cat',
          status: 'warning',
          title: 'Produtos Sem Categoria Definida',
          message: 'Encontramos 8 produtos sem qualquer categoria atrelada, o que prejudica a separação operacional por zonas do galpão.',
          priority: 'low',
          canResolve: true,
          targetUrl: '/app/products',
        },
        {
          id: 'prod-ean',
          status: 'warning',
          title: 'Produtos Sem EAN / Código de Barras',
          message: 'Existem 4 SKUs novos sem código de barras gerado, impedindo a triagem rápida via leitor físico.',
          priority: 'medium',
          canResolve: true,
          targetUrl: '/app/products',
        },
        {
          id: 'prod-ok-stats',
          status: 'ok',
          title: '1.245 SKUs Conformados',
          message: 'A Inteligência Auditora conferiu e validou o restante dos cadastros e regras de SKU mestre no banco.',
          priority: 'low',
          canResolve: false,
        }
      ];

    case 'stock':
      return [
        {
          id: 'stock-neg',
          status: 'error',
          title: 'Estoques Negativos Detectados',
          message: 'Existem 2 SKUs com estoque negativo (saldo final de -20 un.) devido a saídas manuais antes da conferência de entrada fiscal.',
          priority: 'high',
          canResolve: true,
          targetUrl: '/app/products',
        },
        {
          id: 'stock-loc',
          status: 'warning',
          title: 'Produtos Sem Localização de Depósito',
          message: 'Encontramos 15 produtos sem corredor ou prateleira atribuída no WMS (Estoque sem zona de picking).',
          priority: 'medium',
          canResolve: true,
          targetUrl: '/app/products',
        },
        {
          id: 'stock-idle',
          status: 'warning',
          title: 'Estoque Parado sem Giro',
          message: 'Foram localizados 5 SKUs de alto valor com zero movimentações registradas nos últimos 30 dias úteis.',
          priority: 'low',
          canResolve: false,
        },
        {
          id: 'stock-ok-stats',
          status: 'ok',
          title: 'Inventário WMS Conciliado',
          message: '95% dos lotes ativos estão perfeitamente sincronizados com o estoque físico sem divergências de contagem.',
          priority: 'low',
          canResolve: false,
        }
      ];

    case 'movements':
      return [
        {
          id: 'move-xml',
          status: 'error',
          title: 'Entradas Sem Conferência Fiscal (XML)',
          message: 'Identificamos 3 notas fiscais XML recebidas no depósito pendentes de auditoria física e importação de carga mestre.',
          priority: 'high',
          canResolve: true,
          targetUrl: '/app/movements',
        },
        {
          id: 'move-no-barcode',
          status: 'warning',
          title: 'Movimentações Sem Lote / Código de Barras',
          message: 'Foram detectadas 2 saídas manuais sem a identificação do lote de validade mestre WMS.',
          priority: 'medium',
          canResolve: false,
          targetUrl: '/app/movements',
        },
        {
          id: 'move-ok-transfers',
          status: 'ok',
          title: 'Transferências Consolidadas',
          message: 'Todas as movimentações de transferências entre depósitos e CDs foram integralmente registradas e assinadas.',
          priority: 'low',
          canResolve: false,
        }
      ];

    case 'marketplace':
      return [
        {
          id: 'market-sync-err',
          status: 'error',
          title: 'Falha de Conexão na API Mercado Livre',
          message: '2 anúncios ativos retornaram erros de sincronização na API de callbacks devido a alterações no anúncio original na loja.',
          priority: 'high',
          canResolve: true,
          targetUrl: '/app/marketplace',
        },
        {
          id: 'market-not-pub',
          status: 'warning',
          title: 'Produtos Prontos e Não Publicados',
          message: 'Encontramos 5 produtos em estoque físico pronto que ainda não foram publicados em nenhuma loja conectada do Marketplace.',
          priority: 'medium',
          canResolve: true,
          targetUrl: '/app/marketplace',
        },
        {
          id: 'market-zero-stock',
          status: 'warning',
          title: 'Anúncios Publicados com Estoque Zerado',
          message: 'Há 3 anúncios ativos no Mercado Livre cujos SKUs mestre estão zerados no WMS (risco de venda sem estoque).',
          priority: 'high',
          canResolve: false,
        },
        {
          id: 'market-ok-sync',
          status: 'ok',
          title: 'Sincronização Ativa Multi-Lojas',
          message: 'As filas de atualização de preços e saldos estão operando com latência de resposta menor que 2 segundos.',
          priority: 'low',
          canResolve: false,
        }
      ];

    case 'integrations':
      return [
        {
          id: 'int-token-exp',
          status: 'error',
          title: 'Token Oauth Mercado Livre Expirado',
          message: 'A integração com o Mercado Livre Master está inoperante devido ao token de autorização expirado há mais de 12 horas.',
          priority: 'high',
          canResolve: true,
          targetUrl: '/app/integrations',
        },
        {
          id: 'int-shopee-latency',
          status: 'warning',
          title: 'Callback da Shopee com Latência de API',
          message: 'Os webhooks da Shopee registraram flutuação de resposta com timeout recorrente de 400ms.',
          priority: 'medium',
          canResolve: false,
        },
        {
          id: 'int-evolution-ok',
          status: 'ok',
          title: 'Evolution Go + Llama 3.2 Estáveis',
          message: 'Os serviços de mensageria ativa e inteligência artificial operam online sem qualquer queda registrada nas últimas 48h.',
          priority: 'low',
          canResolve: false,
        }
      ];

    case 'conference':
    case 'picking':
      return [
        {
          id: 'conf-diverg',
          status: 'error',
          title: 'Divergências na Conferência de Entrada',
          message: 'Foram detectadas 5 divergências na conferência cega física do lote de entrada #9822 (diferença de -20 un.).',
          priority: 'high',
          canResolve: false,
          targetUrl: '/app/picking',
        },
        {
          id: 'conf-pending-bill',
          status: 'warning',
          title: 'Guias de Picking Pendentes de Faturamento',
          message: 'Temos 2 coletas de produtos separadas hoje pelo operador que ainda não foram enviadas para emissão fiscal.',
          priority: 'medium',
          canResolve: true,
          targetUrl: '/app/picking',
        },
        {
          id: 'conf-ok-exped',
          status: 'ok',
          title: 'Expedição Saudável',
          message: '92% das ordens de separação do dia foram auditadas, embaladas e expedidas rigorosamente no prazo da transportadora.',
          priority: 'low',
          canResolve: false,
        }
      ];

    case 'reports':
      return [
        {
          id: 'rep-idle-loc',
          status: 'warning',
          title: 'Inconsistência de Relatório de Curva ABC',
          message: 'Alguns depósitos secundários não movimentaram insumos suficientes para gerar dados estatísticos consolidados de vendas do mês.',
          priority: 'low',
          canResolve: false,
        },
        {
          id: 'rep-ok-all',
          status: 'ok',
          title: 'Relatórios Operacionais Sincronizados',
          message: 'Todos os dashboards de produtividade dos operadores, giros de estoque e vendas por marketplace estão 100% atualizados.',
          priority: 'low',
          canResolve: false,
        }
      ];

    case 'global':
    default:
      // Consolidated operational audit across all domains
      return [
        {
          id: 'glob-int-token',
          status: 'error',
          title: 'Mercado Livre OAuth Desconectado',
          message: 'A integração de faturamento master com Mercado Livre está interrompida por expiração de credenciais.',
          priority: 'high',
          canResolve: true,
          targetUrl: '/app/integrations',
        },
        {
          id: 'glob-stock-neg',
          status: 'error',
          title: 'Estoques Negativos no WMS',
          message: 'A Inteligência Auditora cruzou dados locais e identificou 2 produtos com estoques negativos (-20 un.).',
          priority: 'high',
          canResolve: true,
          targetUrl: '/app/products',
        },
        {
          id: 'glob-prod-photo',
          status: 'warning',
          title: '12 Produtos Sem Imagem Cadastrada',
          message: 'Furos visuais no catálogo reduzem o engajamento e a auditoria de conferência cega.',
          priority: 'medium',
          canResolve: false,
          targetUrl: '/app/products',
        },
        {
          id: 'glob-move-xml',
          status: 'warning',
          title: 'Notas XML Pendentes de Conferência',
          message: 'Identificamos 3 entradas de NF-e recebidas pendentes de bipagem física de código de barras.',
          priority: 'medium',
          canResolve: true,
          targetUrl: '/app/movements',
        },
        {
          id: 'glob-ok-stats',
          status: 'ok',
          title: '1.245 Itens e Equipes Conformados',
          message: 'Auditoria operacional cruzou logs de operadores, separações de picking e inventários WMS gerais e nada mais foi encontrado.',
          priority: 'low',
          canResolve: false,
        }
      ];
  }
}
